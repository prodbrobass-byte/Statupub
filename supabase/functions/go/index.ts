// StatuPub — Traqueur de clics
// URL : https://<projet>.supabase.co/functions/v1/go/<CODE>  (lien court : https://statupub.com/<CODE>)
// 1) identifie le visiteur (cookie + empreinte IP/navigateur, hachées)  2) enregistre le clic
// 3) redirige vers le site de l'annonceur. Les règles anti-fraude sont dans record_click().
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);
const SALT = Deno.env.get("CLICK_SALT") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.slice(-24);
const SITE = "https://statupub.com";

const PREVIEW = /whatsapp|facebookexternalhit|facebot|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|googlebot|bingbot/i;
const BOT = /bot|crawl|spider|curl|wget|python|httpclient|okhttp|axios|node-fetch|go-http|java\/|libwww|headless|phantom|selenium|puppeteer|playwright|scrapy|postman/i;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Supabase sert le HTML en texte brut : on renvoie vers une page du site
const back = (kind: "invalide" | "erreur") => Response.redirect(`${SITE}/?lien=${kind}`, 302);

function getCookie(req: Request, name: string) {
  const c = req.headers.get("cookie") ?? "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + name + "=([A-Za-z0-9-]{20,40})"));
  return m ? m[1] : null;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const code = (url.searchParams.get("c") ?? parts[parts.length - 1] ?? "").trim();
  if (!/^[A-Za-z0-9]{5,12}$/.test(code)) return back("invalide");

  const ua = req.headers.get("user-agent") ?? "";
  const ip = (req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ?? "0.0.0.0").trim();
  const country = req.headers.get("cf-ipcountry") ?? req.headers.get("x-country") ?? "";
  const lang = req.headers.get("accept-language") ?? "";

  if (PREVIEW.test(ua)) {
    const { data } = await supabase.from("links").select("campaigns(target_url)").eq("code", code).maybeSingle();
    // deno-lint-ignore no-explicit-any
    const target = (data as any)?.campaigns?.target_url;
    return target ? Response.redirect(target, 302) : back("invalide");
  }

  let vid = getCookie(req, "spv");
  const newCookie = !vid;
  if (!vid) vid = crypto.randomUUID();

  const isBot = ua.length < 20 || BOT.test(ua) || req.method !== "GET";
  const visitor = await sha256(`${SALT}|v|${ip}|${ua}|${lang}`);
  const ipHash = await sha256(`${SALT}|ip|${ip}`);
  const cookieHash = await sha256(`${SALT}|c|${vid}`);
  const uaHash = await sha256(`${SALT}|ua|${ua}|${lang}`);

  const { data: target, error } = await supabase.rpc("record_click", {
    p_code: code, p_visitor: visitor, p_ip: ipHash, p_country: country, p_is_bot: isBot,
    p_cookie: cookieHash, p_ua: uaHash,
  });
  if (error) { console.error("record_click", error.message); return back("erreur"); }
  if (!target) return back("invalide");

  const headers = new Headers({ location: target as string, "cache-control": "no-store", "referrer-policy": "no-referrer" });
  if (newCookie) headers.append("set-cookie", `spv=${vid}; Max-Age=31536000; Path=/functions/v1/go; HttpOnly; Secure; SameSite=Lax`);
  return new Response(null, { status: 302, headers });
});
