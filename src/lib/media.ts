import "server-only";
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { one, q } from "./db.ts";

/**
 * Recordings and photographs. With R2 configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)
 * the bytes go to Cloudflare R2, which is free to 10 GB and charges nothing for egress; otherwise they sit in Postgres.
 * Either way the bucket is private and everything is served through /api/media/{id}, which checks the story's status.
 */
const cfg = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET
  ? { bucket: process.env.R2_BUCKET, client: new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.${process.env.R2_JURISDICTION ? process.env.R2_JURISDICTION + "." : ""}r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } }) }
  : null;
export const mediaBackend = cfg ? "r2" : "postgres";

export type Media = { id: number; story_id: string; kind: "audio" | "photo"; mime: string; bytes: number; caption: string | null; scan: string | null; scan_note: string | null; transcript: string | null; transcript_en: string | null };

export async function saveMedia(storyId: string, kind: "audio" | "photo", mime: string, buf: Buffer, caption?: string): Promise<number> {
  if (cfg) {
    const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : mime.includes("wav") ? "wav" : mime.includes("webm") ? "webm" : mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const key = `${storyId}/${kind}-${Date.now()}.${ext}`;
    await cfg.client.send(new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: buf, ContentType: mime }));
    const r = await one<{ id: number }>("INSERT INTO media (story_id, kind, mime, bytes, caption, r2_key) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", [storyId, kind, mime, buf.length, caption ?? null, key]);
    return r!.id;
  }
  const r = await one<{ id: number }>("INSERT INTO media (story_id, kind, mime, bytes, caption, blob) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", [storyId, kind, mime, buf.length, caption ?? null, buf]);
  return r!.id;
}

export async function readMedia(id: number): Promise<{ meta: Media & { status: string; secret_hash: string }; body: Uint8Array<ArrayBuffer> } | null> {
  const m = await one<Media & { r2_key: string | null; blob: Buffer | null; status: string; secret_hash: string }>("SELECT m.id, m.story_id, m.kind, m.mime, m.bytes, m.caption, m.scan, m.scan_note, m.transcript, m.transcript_en, m.r2_key, m.blob, s.status, s.secret_hash FROM media m JOIN stories s ON s.id = m.story_id WHERE m.id = $1", [id]);
  if (!m) return null;
  let body: Uint8Array<ArrayBuffer> | null = null;
  if (m.r2_key && cfg) { const r = await cfg.client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: m.r2_key })); body = new Uint8Array(await r.Body!.transformToByteArray()); }
  else if (m.blob) body = new Uint8Array(m.blob);
  if (!body) return null;
  const { r2_key: _k, blob: _b, ...meta } = m; void _k; void _b;
  return { meta, body };
}

/**
 * Delete a story's recordings and photographs. A row goes only once its file is gone from storage, so a failed delete
 * never leaves a file with nothing pointing at it; if any failed, this throws and the caller tries again.
 */
export async function deleteStoryMedia(storyId: string): Promise<void> {
  const rows = await q<{ id: number; r2_key: string | null }>("SELECT id, r2_key FROM media WHERE story_id = $1", [storyId]);
  let failed = 0;
  for (const r of rows) {
    if (r.r2_key) {
      if (!cfg) { failed++; console.error("media delete: R2 is not configured, cannot delete", r.r2_key); continue; }
      try { await cfg.client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: r.r2_key })); } catch (e) { failed++; console.error("media delete: r2", r.r2_key, e); continue; }
    }
    await q("DELETE FROM media WHERE id = $1", [r.id]);
  }
  if (failed) throw new Error(`media delete: ${failed} file(s) could not be deleted from storage for story ${storyId}`);
}

export const listMedia = (storyId: string) => q<Media>("SELECT id, story_id, kind, mime, bytes, caption, scan, scan_note, transcript, transcript_en FROM media WHERE story_id = $1 ORDER BY kind, id", [storyId]);
