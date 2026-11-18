import "server-only";
import pg from "pg";

const url = process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5433/meitheal";
const g = globalThis as unknown as { __pool?: pg.Pool };
export const pool = g.__pool ?? new pg.Pool({ connectionString: url, max: 8, ssl: /localhost|127\.0\.0\.1|\.railway\.internal/.test(url) ? false : { rejectUnauthorized: false } });
g.__pool = pool;

export async function q<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await pool.query(sql, params)).rows as T[];
}
export async function one<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(sql, params))[0] ?? null;
}
