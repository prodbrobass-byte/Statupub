// StatuPub — e-mails groupés envoyés par l'admin (Resend) + lien de désinscription.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const FN_URL = "https://zqqtqopcrlxvsxvqmfjo.supabase.co/functions/v1/mail";
const FROM = "StatuPub <contact@statupub.com>";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

let secret = "";
async function sig(uid: string) {
  if (!secret) { const { data } = await sb.rpc("push_config"); secret = data.hook; }
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode("unsub:" + uid)));
  return [...s.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
function bodyHtml(text: string) {
  return esc(text).split(/\n{2,}/).map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3E4A46">${
    p.replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#C98A24">$1</a>')}</p>`).join("");
}
function page(subject: string, text: string, cta: { label: string; url: string } | null, unsub: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#F6F4EE;font-family:Arial,Helvetica,sans-serif;color:#17201E">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4EE;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2DED2">
<tr><td style="background:#0E3B36;padding:22px 28px"><img src="https://statupub.com/logo/statupub-icone-transparent.png" width="36" height="36" alt="" style="vertical-align:middle;border:0"><span style="vertical-align:middle;font-size:22px;font-weight:bold;color:#F3F1EA;margin-left:8px">Statu<span style="color:#E8A33D">Pub</span></span></td></tr>
<tr><td style="padding:32px 28px 8px"><h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#17201E">${esc(subject)}</h1>${bodyHtml(text)}
${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px"><tr><td style="border-radius:999px;background:#E8A33D"><a href="${esc(cta.url)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:#231705;text-decoration:none;border-radius:999px">${esc(cta.label)}</a></td></tr></table>` : ""}
</td></tr>
<tr><td style="padding:24px 28px 28px"><hr style="border:none;border-top:1px solid #E2DED2;margin:0 0 16px"><p style="margin:0;font-size:12px;line-height:1.6;color:#8A938F">StatuPub · Ton statut WhatsApp te rapporte à chaque clic · <a href="https://statupub.com" style="color:#C98A24">statupub.com</a><br>Tu reçois cet e-mail car tu as un compte StatuPub. <a href="${unsub}" style="color:#8A938F">Ne plus recevoir ces e-mails</a></p></td></tr>
</table></td></tr></table></body></html>`;
}
const plain = (subject: string, text: string, cta: any, unsub: string) => `${subject}\n\n${text}\n\n${cta ? `${cta.label} : ${cta.url}\n\n` : ""}—\nStatuPub · statupub.com\nNe plus recevoir ces e-mails : ${unsub}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);

  // Désinscription (lien dans chaque e-mail)
  if (req.method === "GET") {
    const u = url.searchParams.get("u") || "", t = url.searchParams.get("t") || "";
    let ok = false;
    if (/^[0-9a-f-]{36}$/.test(u) && t === await sig(u)) { await sb.from("profiles").update({ email_optout: true }).eq("id", u); ok = true; }
    return Response.redirect(`https://statupub.com/?desabonne=${ok ? "1" : "0"}`, 302);
  }

  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(token);
    if (!u?.user) return json({ error: "Connexion requise" }, 401);
    const { data: me } = await sb.from("profiles").select("role").eq("id", u.user.id).single();
    if (me?.role !== "admin") return json({ error: "Réservé à l'admin" }, 403);

    const { action, audience, subject, text, cta_label, cta_url, push } = await req.json();
    const aud = ["tous", "annonceur", "diffuseur", "ambassadeur"].includes(audience) ? audience : "tous";
    if (action === "count") {
      const { data, error } = await sb.rpc("mail_recipients", { p_audience: aud });
      if (error) throw error;
      return json({ count: data.length });
    }

    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) return json({ error: "La clé Resend n'est pas encore configurée dans Supabase (RESEND_API_KEY)." }, 400);
    const subj = String(subject || "").trim(), body = String(text || "").trim();
    if (subj.length < 3 || subj.length > 120) return json({ error: "Objet : entre 3 et 120 caractères" }, 400);
    if (body.length < 10 || body.length > 5000) return json({ error: "Message : entre 10 et 5 000 caractères" }, 400);
    const cta = cta_label && /^https:\/\//.test(cta_url || "") ? { label: String(cta_label).slice(0, 40), url: String(cta_url) } : null;

    const build = async (r: { id: string; email: string; full_name: string | null }) => {
      const unsub = `${FN_URL}?u=${r.id}&t=${await sig(r.id)}`;
      const first = (r.full_name || "").trim().split(/\s+/)[0] || "";
      const t = body.replace(/\{prenom\}/gi, first).replace(/\s+,/g, ",");
      const s = subj.replace(/\{prenom\}/gi, first).replace(/\s+,/g, ",");
      return { from: FROM, to: [r.email], subject: s, html: page(s, t, cta, unsub), text: plain(s, t, cta, unsub),
        headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } };
    };

    let list: { id: string; email: string; full_name: string | null }[];
    if (action === "test") {
      const { data: p } = await sb.from("profiles").select("full_name").eq("id", u.user.id).single();
      list = [{ id: u.user.id, email: u.user.email!, full_name: p?.full_name || "" }];
    } else if (action === "send") {
      const { data, error } = await sb.rpc("mail_recipients", { p_audience: aud });
      if (error) throw error;
      list = data;
    } else return json({ error: "Action inconnue" }, 400);
    if (!list.length) return json({ error: "Aucun destinataire" }, 400);

    let sent = 0, failed = 0, lastErr = "";
    for (let i = 0; i < list.length; i += 100) {
      const batch = await Promise.all(list.slice(i, i + 100).map(build));
      const r = await fetch("https://api.resend.com/emails/batch", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(batch) });
      if (r.ok) sent += batch.length; else { failed += batch.length; lastErr = (await r.json().catch(() => ({})))?.message || `Resend ${r.status}`; }
      if (i + 100 < list.length) await new Promise((ok) => setTimeout(ok, 600));
    }
    if (action === "send") await sb.from("email_blasts").insert({ subject: subj, audience: aud, sent_count: sent, failed_count: failed });
    let pushed = false;
    if (action === "send" && push && sent) {
      const first = body.replace(/\{prenom\}\s*,?/gi, "").replace(/^(bonjour|salut|hello)[^\n]*\n+/i, "").trim();
      const { error: pe } = await sb.rpc("push_notify", { p_users: list.map((r) => r.id), p_role: null, p_title: subj.replace(/\{prenom\}\s*,?\s*/gi, ""), p_body: first.slice(0, 160), p_url: cta && cta.url.startsWith("https://statupub.com") ? cta.url.replace("https://statupub.com", "") || "/" : "/" });
      pushed = !pe;
    }
    if (!sent) return json({ error: "Envoi refusé par Resend : " + lastErr }, 502);
    return json({ sent, failed, pushed, error: failed ? lastErr : undefined });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
