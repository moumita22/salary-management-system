import pg from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import type {
  DbPool,
  PoolClient,
  PoolConfig,
  QueryParam,
  QueryResult,
  QueryRow,
} from '../types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Re-export types for callers who import from db
export type { DbPool, PoolClient, PoolConfig, QueryParam, QueryResult, QueryRow };

/**
 * Environment-Aware Pool Configuration
 * Supports full DATABASE_URL connection string or granular options.
 */
const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_MAX || 20),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5440', 10),
      database: process.env.DB_NAME || 'sms_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgrespassword',
      max: Number(process.env.DB_POOL_MAX || 20),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

/**
 * Instantiated Connection Pool with Explicit DbPool Type Binding
 */
const PoolConstructor = (pg.Pool || (pg as unknown as { default: { Pool: unknown } }).default?.Pool) as new (
  config?: PoolConfig
) => DbPool;

export const pool: DbPool = new PoolConstructor(poolConfig);

pool.on('error', (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[PostgreSQL] Unexpected error on idle client:', message);
});

/**
 * Execute a Parameterized SQL Query with Performance Telemetry
 */
export async function query<R = QueryRow>(
  text: string,
  params?: QueryParam[]
): Promise<QueryResult<R>> {
  const start = Date.now();
  const res = (await pool.query<R>(text, params)) as QueryResult<R>;
  const duration = Date.now() - start;

  // Telemetry: Log slow queries exceeding 150ms
  if (duration > 150) {
    const sanitized = text.replace(/\s+/g, ' ').trim().slice(0, 100);
    console.warn(`[Slow Query] (${duration}ms): ${sanitized}`);
  }

  return res;
}

/**
 * Execute an Atomic Unit of Work Inside an ACID Database Transaction
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Non-Blocking Schema Initialization
 */
export async function initDatabase(): Promise<void> {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('[PostgreSQL] Database tables and indexes initialized successfully.');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[PostgreSQL] Failed to initialize database schema:', message);
    throw err;
  }
}

/**
 * Graceful Teardown of the PostgreSQL Connection Pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
