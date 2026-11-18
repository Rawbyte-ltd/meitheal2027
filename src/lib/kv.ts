import "server-only";
import { one, q } from "./db.ts";

export const kvGet = async (k: string) => (await one<{ v: string }>("SELECT v FROM kv WHERE k = $1", [k]))?.v ?? null;
export const kvSet = (k: string, v: string) => q("INSERT INTO kv (k, v) VALUES ($1, $2) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, updated_at = now()", [k, v]);
/** Sets k to v only if it is not already v. Returns true for the caller that made the change, so two servers cannot both act. */
export const kvClaim = async (k: string, v: string) =>
  (await q("INSERT INTO kv (k, v) VALUES ($1, $2) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, updated_at = now() WHERE kv.v <> EXCLUDED.v RETURNING k", [k, v])).length > 0;
