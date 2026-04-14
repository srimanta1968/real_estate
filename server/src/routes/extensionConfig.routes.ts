import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// @governance-tracked — API definitions added: GET /extension-config/scrape-config
const router: Router = Router();

// Serves the remote scrape-config to the DealEval Pro (Phase 2) extension.
// The extension fetches this at startup and periodically; edits to the
// JSON file take effect on the next fetch — no extension resubmission.
router.get('/scrape-config', (_req: Request, res: Response) => {
  try {
    const configPath = path.resolve(__dirname, '../../config/scrape-config.json');
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'config_read_failed' });
  }
});

export default router;
