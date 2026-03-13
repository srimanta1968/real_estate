import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config/env';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean | { rejectUnauthorized: boolean };
  min: number;
  max: number;
}

const dbConfig: DatabaseConfig = {
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  min: config.db.poolMin,
  max: config.db.poolMax,
};

const pool = new Pool(dbConfig);

pool.on('error', (err: Error) => {
  console.error('Unexpected database pool error:', err);
});

/**
 * DataService - centralized database access layer.
 * All database operations MUST go through this service.
 * This IS the DataService/ORM layer for the application.
 */
export const DataService = {
  /**
   * Execute a parameterized query
   */
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    try {
      return await pool.query<T>(text, params);
    } catch (error) {
      console.error('DataService query error:', { text, error });
      throw error;
    }
  },

  /**
   * Get a single row or null
   */
  async findOne<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | null> {
    try {
      const result = await pool.query<T>(text, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('DataService findOne error:', { text, error });
      throw error;
    }
  },

  /**
   * Get multiple rows
   */
  async findMany<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
    try {
      const result = await pool.query<T>(text, params);
      return result.rows;
    } catch (error) {
      console.error('DataService findMany error:', { text, error });
      throw error;
    }
  },

  /**
   * Insert a row and return the inserted record
   */
  async insertOne<T extends QueryResultRow = any>(table: string, data: Record<string, any>): Promise<T> {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');

      const result = await pool.query<T>(
        `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error('DataService insertOne error:', { table, error });
      throw error;
    }
  },

  /**
   * Update rows matching a condition
   */
  async update<T extends QueryResultRow = any>(
    table: string,
    data: Record<string, any>,
    whereClause: string,
    whereParams: any[]
  ): Promise<T[]> {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const offset = keys.length;
      const adjustedWhereParams = whereParams.map((_, i) => `$${offset + i + 1}`);
      const adjustedWhere = whereClause.replace(/\$(\d+)/g, (_, num) => adjustedWhereParams[parseInt(num) - 1]);

      const result = await pool.query<T>(
        `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${adjustedWhere} RETURNING *`,
        [...values, ...whereParams]
      );
      return result.rows;
    } catch (error) {
      console.error('DataService update error:', { table, error });
      throw error;
    }
  },

  /**
   * Delete rows matching a condition
   */
  async delete(table: string, whereClause: string, whereParams: any[]): Promise<number> {
    try {
      const result = await pool.query(
        `DELETE FROM ${table} WHERE ${whereClause}`,
        whereParams
      );
      return result.rowCount || 0;
    } catch (error) {
      console.error('DataService delete error:', { table, error });
      throw error;
    }
  },

  /**
   * Get the connection pool (for transactions)
   */
  getPool(): Pool {
    return pool;
  },
};

export default DataService;
