import "server-only";
import nodemailer from "nodemailer";

/**
 * Outgoing mail, as MAIL_FROM (default meitheal@rawbyte.ie, an alias on the Zoho mailbox, so replies land there too).
 * Zoho SMTP when MAIL_SMTP_HOST/PORT/USER/PASS are set (a Zoho app password shared with other Rawbyte services); else
 * Resend's HTTP API when RESEND_API_KEY is set; else nothing is sent and the message is written to the server log,
 * so the brief can still be read in Railway's logs.
 */
const smtp = process.env.MAIL_SMTP_HOST && process.env.MAIL_SMTP_USER && process.env.MAIL_SMTP_PASS
  ? nodemailer.createTransport({ host: process.env.MAIL_SMTP_HOST, port: Number(process.env.MAIL_SMTP_PORT || 465), secure: Number(process.env.MAIL_SMTP_PORT || 465) === 465, auth: { user: process.env.MAIL_SMTP_USER, pass: process.env.MAIL_SMTP_PASS }, connectionTimeout: 15000 })
  : null;
export const mailOn = !!smtp || !!process.env.RESEND_API_KEY;
const FROM = process.env.MAIL_FROM || "Meitheal 2027 <meitheal@rawbyte.ie>";

export async function sendMail(m: { to: string; subject: string; text: string; html?: string }): Promise<{ sent: boolean; why?: string }> {
  if (smtp) {
    try { await smtp.sendMail({ from: FROM, to: m.to, subject: m.subject, text: m.text, html: m.html }); return { sent: true }; }
    catch (e) { console.error("mail: smtp", e instanceof Error ? e.message : e); return { sent: false, why: "smtp" }; }
  }
  if (!process.env.RESEND_API_KEY) { console.log(`mail (not sent, no mail settings) to ${m.to}\nSubject: ${m.subject}\n\n${m.text}`); return { sent: false, why: "no_mail_settings" }; }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [m.to], subject: m.subject, text: m.text, html: m.html }), signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) { console.error("mail: resend", r.status, await r.text().catch(() => "")); return { sent: false, why: `http_${r.status}` }; }
    return { sent: true };
  } catch (e) { console.error("mail: send", e); return { sent: false, why: "fetch" }; }
}

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
