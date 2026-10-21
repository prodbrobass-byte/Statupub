// StatuPub — Traqueur de clics
// URL : https://<projet>.supabase.co/functions/v1/go/<CODE>
// 1) identifie le visiteur (empreinte IP + navigateur, hachée)  2) enregistre le clic
// 3) redirige vers le site de l'annonceur. Les règles anti-fraude sont dans record_click().
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);
const SALT = Deno.env.get("CLICK_SALT") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.slice(-24);

// Robots d'aperçu de liens (WhatsApp, Facebook…) : on redirige sans rien compter
const PREVIEW = /whatsapp|facebookexternalhit|facebot|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|googlebot|bingbot/i;
// Autres robots / scripts : clic enregistré comme invalide
const BOT = /bot|crawl|spider|curl|wget|python|httpclient|okhttp|axios|node-fetch|go-http|java\/|libwww|headless|phantom|selenium|puppeteer|playwright|scrapy|postman/i;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function page(title: string, msg: string, status = 404) {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1a14;color:#eef3ee;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center}h1{font-size:22px}p{opacity:.75}</style></head>
<body><div><h1>${title}</h1><p>${msg}</p></div></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const code = (url.searchParams.get("c") ?? parts[parts.length - 1] ?? "").trim();
  if (!/^[A-Za-z0-9]{5,12}$/.test(code)) return page("Lien invalide", "Ce lien publicitaire n'existe pas.");

  const ua = req.headers.get("user-agent") ?? "";
  const ip = (req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ?? "0.0.0.0").trim();
  const country = req.headers.get("cf-ipcountry") ?? req.headers.get("x-country") ?? "";
  const lang = req.headers.get("accept-language") ?? "";

  // Aperçu de lien : on renvoie vers la cible sans compter
  if (PREVIEW.test(ua)) {
    const { data } = await supabase.from("links").select("campaigns(target_url)").eq("code", code).maybeSingle();
    // deno-lint-ignore no-explicit-any
    const target = (data as any)?.campaigns?.target_url;
    return target ? Response.redirect(target, 302) : page("Lien invalide", "Ce lien publicitaire n'existe pas.");
  }

  const isBot = ua.length < 20 || BOT.test(ua) || req.method !== "GET";
  const visitor = await sha256(`${SALT}|v|${ip}|${ua}|${lang}`);
  const ipHash = await sha256(`${SALT}|ip|${ip}`);

  const { data: target, error } = await supabase.rpc("record_click", {
    p_code: code, p_visitor: visitor, p_ip: ipHash, p_country: country, p_is_bot: isBot,
  });
  if (error) {
    console.error("record_click", error.message);
    return page("Erreur temporaire", "Réessayez dans un instant.", 503);
  }
  if (!target) return page("Lien invalide", "Ce lien publicitaire n'existe pas.");

  return new Response(null, {
    status: 302,
    headers: { location: target as string, "cache-control": "no-store", "referrer-policy": "no-referrer" },
  });
});
