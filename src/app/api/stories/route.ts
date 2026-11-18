import { after } from "next/server";
import { q } from "@/lib/db";
import { provenance } from "@/lib/collections";
import { saveMedia } from "@/lib/media";
import { cleanPhoto } from "@/lib/photo";
import { MAX_AUDIO, MAX_PHOTO, MAX_PHOTOS, MAX_REQUEST } from "@/lib/limits";
import { scanMedia, scanText } from "@/lib/scan";
import { dict, isLang } from "@/lib/i18n";
import { clean, listStories, PHONE } from "@/lib/stories";
import { ipHash, keeperSecret, sha256, storyId } from "@/lib/token";
import { topicBySlug } from "@/lib/topics";
import { townlands } from "@/lib/townlands";
export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();


export async function GET(req: Request) {
  const u = new URL(req.url), g = (k: string) => u.searchParams.get(k) ?? undefined;
  const rows = await listStories({ county: g("county"), townland: g("townland"), topic: g("topic"), collection: g("collection"), school: g("school"), teller: g("teller"), q: g("q"), letter: g("letter"), featured: g("featured") === "1", limit: Number(g("limit") ?? 50), offset: Number(g("offset") ?? 0) });
  return Response.json(rows, { headers: { "Cache-Control": "public, max-age=60" } });
}

/** Create a story. Multipart form: see SubmitForm. Returns the id and the keeper secret (shown once). */
export async function POST(req: Request) {
  const ip = ipHash(req), now = Date.now(), hits = (recent.get(ip) ?? []).filter(t => now - t < 3600e3);
  // Errors come back in the language the form or the app was in (ui_lang); the rate limit fires before the form is read.
  if (hits.length >= 20) return Response.json({ error: dict("en").api.many }, { status: 429 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_REQUEST) return Response.json({ error: dict("en").api.form }, { status: 413 });
  let fd: FormData; try { fd = await req.formData(); } catch { return Response.json({ error: dict("en").api.form }, { status: 400 }); }
  const ul = fd.get("ui_lang"), msg = dict(isLang(ul) ? ul : "en").api;
  const s = (k: string, max = 200) => clean(fd.get(k), max);
  const mode = ["write", "record", "photo"].includes(s("mode")) ? s("mode") : "write";
  let topicSlug = s("topic"), topicCustom: string | null = null;
  if (topicSlug === "custom") { topicCustom = s("topic_custom", 60); if (topicCustom.length < 3) return Response.json({ error: msg.ownHeading }, { status: 400 }); }
  else if (!topicBySlug(topicSlug)) return Response.json({ error: msg.heading }, { status: 400 });
  const t = townlands().find(s("county"), s("townland")); if (!t) return Response.json({ error: msg.townland }, { status: 400 });
  const title = s("title", 120), body = s("body", 20000), teller = s("teller_name", 40), collector = s("collector_name", 40), consentName = s("consent_name", 60);
  const minBody = mode === "write" ? 80 : 20;
  if (title.length < 2 || body.length < minBody || !teller || !collector || !consentName) return Response.json({ error: mode === "write" ? msg.missingWrite : msg.missingOther }, { status: 400 });
  if (fd.get("consent") !== "on") return Response.json({ error: msg.consent }, { status: 400 });
  if (PHONE.test(body)) return Response.json({ error: msg.phone }, { status: 400 });
  const lang = ["en", "ga", "both", "other"].includes(s("lang")) ? s("lang") : "en";
  const langOther = lang === "other" ? s("lang_other", 40) : ""; if (lang === "other" && langOther.length < 2) return Response.json({ error: msg.langOther }, { status: 400 });
  // A story from outside Ireland (migrations/010): the place is optional, the country is not once either is given.
  const fromPlace = s("from_place", 80) || null, fromCountry = s("from_country", 60) || null; if (fromPlace && !fromCountry) return Response.json({ error: msg.farCountry }, { status: 400 });
  const audioF = fd.get("audio"), photoFs = fd.getAll("photo").filter(f => f instanceof File && f.size > 0) as File[];
  const audio = audioF instanceof File && audioF.size > 0 ? audioF : null;
  if (audio) { if (audio.size > MAX_AUDIO) return Response.json({ error: msg.audioBig }, { status: 413 }); if (!/^audio\/|^video\/(webm|mp4)/.test(audio.type)) return Response.json({ error: msg.notAudio }, { status: 415 }); }
  for (const f of photoFs) { if (f.size > MAX_PHOTO) return Response.json({ error: msg.photoBig }, { status: 413 }); if (!/^image\/(jpeg|png|webp)/.test(f.type)) return Response.json({ error: msg.photoType }, { status: 415 }); }
  if (photoFs.length > MAX_PHOTOS) return Response.json({ error: msg.photoMany }, { status: 400 });
  // Re-encode every photo before anything is stored: drops GPS and the rest of the metadata (src/lib/photo.ts).
  const photos: { buf: Buffer; mime: string }[] = [];
  for (const f of photoFs) { const p = await cleanPhoto(Buffer.from(await f.arrayBuffer())).catch(() => null); if (!p) return Response.json({ error: msg.photoType }, { status: 415 }); photos.push(p); }
  if (mode === "record" && !audio) return Response.json({ error: msg.needAudio }, { status: 400 });
  if (mode === "photo" && !photoFs.length) return Response.json({ error: msg.needPhoto }, { status: 400 });
  const collectorAge = s("collector_age", 12) || null, school = s("school", 80) || null;
  const col = { slug: provenance(collectorAge, school) };

  // Which consent wording the adult saw, and in which language (migrations/012). Older app builds send none: NULL.
  const cv = s("consent_version", 40), consentVersion = /^(web|app)-\d{4}-\d{2}-\d{2}$/.test(cv) ? `${cv}:${isLang(ul) ? ul : "en"}` : null;
  const id = storyId(), secret = keeperSecret();
  await q(`INSERT INTO stories (id, collection, title, body, lang, topic, topic_custom, county, townland_slug, townland_en, townland_ga, lat, lng, teller_name, teller_born, teller_relation, collector_name, collector_age, school, class_name, contact_email, consent_name, consent, words, secret_hash, ip_hash, lang_other, from_place, from_country, consent_version)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,true,$23,$24,$25,$26,$27,$28,$29)`,
    [id, col.slug, title, body, lang, topicSlug, topicCustom, t.co, t.slug, t.en, t.ga || null, t.lat, t.lng, teller, s("teller_born", 10) || null, s("teller_relation", 30) || null, collector, collectorAge, school, s("class_name", 40) || null, s("contact_email", 120).toLowerCase() || null, consentName, body.split(/\s+/).length, sha256(secret), ip, langOther || null, fromPlace, fromCountry, consentVersion]);
  const saved: { id: number; kind: "audio" | "photo"; buf: Buffer }[] = [];
  try {
    if (audio) { const buf = Buffer.from(await audio.arrayBuffer()); saved.push({ id: await saveMedia(id, "audio", audio.type, buf), kind: "audio", buf }); }
    const captions = fd.getAll("photo_caption").map(c => clean(c, 200));
    for (let i = 0; i < photos.length; i++) { const { buf, mime } = photos[i]; saved.push({ id: await saveMedia(id, "photo", mime, buf, captions[i] || undefined), kind: "photo", buf }); }
  } catch (e) { console.error("media", e); await q("DELETE FROM stories WHERE id = $1", [id]); return Response.json({ error: msg.stored }, { status: 500 }); }
  const captionList = fd.getAll("photo_caption").map(c => clean(c, 200)).filter(Boolean);
  const details = [`Told by: ${teller}`, `Collected by: ${collector}${collectorAge ? ` (${collectorAge})` : ""}${school ? `, ${school}` : ""}`, ...captionList.map(c => `Photo caption: ${c}`)].join("\n");
  after(() => scanText(id, title, body, lang, details));
  if (saved.length) after(() => scanMedia(saved, lang));
  hits.push(now); recent.set(ip, hits);
  return Response.json({ id, keeper: secret }, { status: 201 });
}
