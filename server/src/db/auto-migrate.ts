import fs from 'fs';
import path from 'path';
import { DataService } from '../services/data.service';

/**
 * Auto-migration system that runs on server startup.
 * Reads all SQL files from init-scripts/ in alphabetical order and applies them idempotently.
 *
 * All SQL must use idempotent patterns:
 *   - CREATE TABLE IF NOT EXISTS
 *   - ALTER TABLE ... ADD COLUMN IF NOT EXISTS
 *   - CREATE INDEX IF NOT EXISTS
 *   - INSERT ... ON CONFLICT DO NOTHING
 *
 * Tracks which migration files have been applied in _migrations table.
 * Only runs files that haven't been applied yet (by filename + content hash).
 */

function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

async function ensureMigrationsTable(): Promise<void> {
  await DataService.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      content_hash VARCHAR(64) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      status VARCHAR(20) DEFAULT 'success',
      error_message TEXT,
      UNIQUE(filename, content_hash)
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await DataService.query<{ key: string }>(
    `SELECT filename || ':' || content_hash AS key FROM _migrations WHERE status = 'success'`
  );
  return new Set(result.rows.map(r => r.key));
}

async function applySqlFile(filePath: string, filename: string): Promise<{ applied: boolean; error?: string }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const contentHash = hashContent(content);
  const key = `${filename}:${contentHash}`;

  // Check if already applied
  const applied = await getAppliedMigrations();
  if (applied.has(key)) {
    return { applied: false };
  }

  console.log(`[auto-migrate] Applying: ${filename}`);

  try {
    // Split on semicolons but handle multi-line statements
    // Execute the entire file as a single transaction
    await DataService.query('BEGIN');

    // Split by statements, handling dollar-quoted strings
    const statements = splitStatements(content);

    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;
      try {
        await DataService.query(trimmed);
      } catch (err: any) {
        // Skip "already exists" type errors for idempotent operations
        const msg = err.message || '';
        if (
          msg.includes('already exists') ||
          msg.includes('duplicate key') ||
          msg.includes('relation') && msg.includes('already exists')
        ) {
          console.log(`[auto-migrate]   Skipped (already exists): ${trimmed.substring(0, 80)}...`);
        } else {
          throw err;
        }
      }
    }

    await DataService.query('COMMIT');

    // Record successful migration
    await DataService.query(
      `INSERT INTO _migrations (filename, content_hash, status) VALUES ($1, $2, 'success') ON CONFLICT (filename, content_hash) DO NOTHING`,
      [filename, contentHash]
    );

    console.log(`[auto-migrate] Applied: ${filename}`);
    return { applied: true };
  } catch (err: any) {
    await DataService.query('ROLLBACK').catch(() => {});

    // Record failed migration
    await DataService.query(
      `INSERT INTO _migrations (filename, content_hash, status, error_message) VALUES ($1, $2, 'failed', $3) ON CONFLICT (filename, content_hash) DO UPDATE SET status = 'failed', error_message = $3`,
      [filename, contentHash, err.message]
    ).catch(() => {});

    console.error(`[auto-migrate] FAILED: ${filename} — ${err.message}`);
    return { applied: false, error: err.message };
  }
}

function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip pure comment lines
    if (trimmed.startsWith('--') && !inDollarQuote) continue;

    // Track dollar-quoted strings (for functions/triggers)
    if (trimmed.includes('$$')) {
      const count = (trimmed.match(/\$\$/g) || []).length;
      if (count % 2 !== 0) inDollarQuote = !inDollarQuote;
    }

    current += line + '\n';

    // Statement ends at semicolon (not inside dollar quotes)
    if (trimmed.endsWith(';') && !inDollarQuote) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

export async function runAutoMigrations(): Promise<void> {
  // Find init-scripts directory (relative to project root)
  const possiblePaths = [
    path.resolve(process.cwd(), 'init-scripts'),
    path.resolve(process.cwd(), '..', 'init-scripts'),
    path.resolve(__dirname, '..', '..', '..', 'init-scripts'),
  ];

  let scriptsDir = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      scriptsDir = p;
      break;
    }
  }

  if (!scriptsDir) {
    console.log('[auto-migrate] No init-scripts directory found, skipping migrations');
    return;
  }

  console.log(`[auto-migrate] Scanning ${scriptsDir} for migrations...`);

  await ensureMigrationsTable();

  // Get all .sql files sorted alphabetically
  const files = fs.readdirSync(scriptsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let applied = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const result = await applySqlFile(path.join(scriptsDir, file), file);
    if (result.applied) applied++;
    else if (result.error) failed++;
    else skipped++;
  }

  if (applied > 0) {
    console.log(`[auto-migrate] Done: ${applied} applied, ${skipped} skipped (already up-to-date), ${failed} failed`);
  } else {
    console.log(`[auto-migrate] Schema up-to-date (${skipped} files, all previously applied)`);
  }
}
