// StatuPub — pont avec l'API Marketing de Meta.
// Actions (POST, admin connecté) : health, launch {order_id}, sync, stop {order_id}
// Le cron appelle {action:"sync"} avec l'en-tête x-push-hook.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const G = "https://graph.facebook.com/v23.0";
const AD = "act_1431680522500834", PAGE = "1358181967385102";
const XOF_PER_EUR = 655.957;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-push-hook", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const TOKEN = () => Deno.env.get("META_ACCESS_TOKEN") || "";

class MetaErr extends Error {}
async function g(path: string, params: Record<string, unknown> = {}, method = "GET") {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) body.set(k, typeof v === "string" ? v : JSON.stringify(v));
  body.set("access_token", TOKEN());
  const r = method === "GET" ? await fetch(`${G}/${path}?${body}`) : await fetch(`${G}/${path}`, { method, body });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) {
    const e = d.error || {};
    throw new MetaErr(e.error_user_msg || e.error_user_title || e.message || `Erreur Meta ${r.status}`);
  }
  return d;
}

async function cityKeys(cities: string | null, countries: string[]) {
  if (!cities) return [];
  const out: any[] = [];
  for (const name of cities.split(/[,;]+/).map((x) => x.trim()).filter(Boolean).slice(0, 10)) {
    for (const cc of countries) {
      const r = await g("search", { type: "adgeolocation", location_types: ["city"], q: name, country_code: cc, limit: 1 }).catch(() => null);
      const k = r?.data?.[0]?.key;
      if (k) { out.push({ key: k, radius: 25, distance_unit: "kilometer" }); break; }
    }
  }
  return out;
}

async function notify(uid: string, title: string, body: string) {
  await sb.rpc("push_notify", { p_users: [uid], p_role: null, p_title: title, p_body: body, p_url: "/#/annonceur" });
}

async function launch(id: string) {
  const { data: o } = await sb.from("meta_orders").select("*").eq("id", id).single();
  if (!o) throw new Error("Commande introuvable");
  if (o.status !== "en_attente") throw new Error("Cette pub n'est plus en attente");
  if (!o.media_url) throw new Error("Pas de visuel");
  if (/\.(mp4|mov|webm)($|\?)/i.test(o.media_url)) throw new Error("Vidéo : le lancement automatique gère seulement les images pour l'instant. Lance celle-ci à la main dans le Gestionnaire de publicités.");

  const eurCents = Math.floor((o.ad_budget / XOF_PER_EUR) * 100);
  if (eurCents < o.days * 100) throw new Error(`Budget trop faible pour Meta : au moins 1 € (≈ 656 F) par jour de diffusion. Ici ${(eurCents / 100).toFixed(2)} € pour ${o.days} jours.`);

  // 1. Visuel
  const img = await fetch(o.media_url);
  if (!img.ok) throw new Error("Visuel introuvable");
  const buf = new Uint8Array(await img.arrayBuffer());
  let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  const up = await g(`${AD}/adimages`, { bytes: btoa(bin) }, "POST");
  const hash = (Object.values(up.images || {})[0] as any)?.hash;
  if (!hash) throw new Error("Envoi du visuel à Meta impossible");

  const ids: Record<string, string> = {};
  const name = `SP · ${o.title}`.slice(0, 100);
  try {
    // 2. Campagne
    const camp = await g(`${AD}/campaigns`, { name, objective: "OUTCOME_TRAFFIC", status: "PAUSED", special_ad_categories: [], is_adset_budget_sharing_enabled: false }, "POST");
    ids.campaign = camp.id;
    // 3. Ensemble de pubs (ciblage + budget)
    const start = new Date(Date.now() + 5 * 60000), end = new Date(start.getTime() + o.days * 864e5);
    const cities = await cityKeys(o.cities, o.countries);
    const targeting: any = { age_min: o.age_min, age_max: o.age_max, targeting_automation: { advantage_audience: 0 },
      geo_locations: cities.length ? { cities } : { countries: o.countries } };
    if (o.gender === "hommes") targeting.genders = [1];
    if (o.gender === "femmes") targeting.genders = [2];
    const adset = await g(`${AD}/adsets`, { name, campaign_id: camp.id, lifetime_budget: eurCents, start_time: start.toISOString(), end_time: end.toISOString(),
      billing_event: "IMPRESSIONS", optimization_goal: "LINK_CLICKS", bid_strategy: "LOWEST_COST_WITHOUT_CAP", destination_type: "WEBSITE", targeting, status: "PAUSED" }, "POST");
    ids.adset = adset.id;
    // 4. Visuel + texte
    const cta = o.objective === "site" ? "SHOP_NOW" : "LEARN_MORE";
    const creative = await g(`${AD}/adcreatives`, { name, object_story_spec: { page_id: PAGE, link_data: { image_hash: hash, link: o.target_url, message: o.message, name: o.title, call_to_action: { type: cta, value: { link: o.target_url } } } } }, "POST");
    ids.creative = creative.id;
    // 5. Pub
    const ad = await g(`${AD}/ads`, { name, adset_id: adset.id, creative: { creative_id: creative.id }, status: "ACTIVE" }, "POST");
    ids.ad = ad.id;
    await g(adset.id, { status: "ACTIVE" }, "POST");
    await g(camp.id, { status: "ACTIVE" }, "POST");
    await sb.from("meta_orders").update({ status: "en_cours", started_at: new Date().toISOString(), ends_at: end.toISOString(), meta_campaign_id: camp.id, meta_ids: ids, last_error: null }).eq("id", id);
    await notify(o.annonceur_id, "📘 Ta Facebook Ads est lancée", `${o.title} : elle passe en vérification chez Meta puis démarre (en général sous quelques heures).`);
    return { ok: true, ids };
  } catch (e) {
    if (ids.campaign) await g(ids.campaign, {}, "DELETE").catch(() => {});
    await sb.from("meta_orders").update({ last_error: (e as Error).message }).eq("id", id);
    throw e;
  }
}

async function insights(campaignId: string) {
  const r = await g(`${campaignId}/insights`, { fields: "reach,impressions,inline_link_clicks,spend", date_preset: "maximum" });
  const d = r.data?.[0] || {};
  return { reach: +d.reach || 0, impressions: +d.impressions || 0, clicks: +d.inline_link_clicks || 0, spend: Math.round((+d.spend || 0) * XOF_PER_EUR) };
}

async function finish(o: any, res: any) {
  const spend = Math.min(o.ad_budget, res.spend || 0);
  const refund = Math.max(0, o.ad_budget - spend);
  await sb.from("meta_orders").update({ status: "terminee", ended_at: new Date().toISOString(), refunded: refund, results: { ...res, spend } }).eq("id", o.id).eq("status", "en_cours");
  await notify(o.annonceur_id, "🏁 Facebook Ads terminée", `${o.title} : ${res.reach || 0} personnes touchées, ${res.clicks || 0} clics.${refund ? ` ${refund} F non dépensés rendus sur ton solde.` : ""}`);
}

async function sync() {
  const { data } = await sb.from("meta_orders").select("*").eq("status", "en_cours").not("meta_campaign_id", "is", null);
  let n = 0;
  for (const o of data || []) {
    try {
      const res = await insights(o.meta_campaign_id);
      await sb.from("meta_orders").update({ results: res, last_error: null }).eq("id", o.id);
      // Sécurité : budget du client atteint → on coupe chez Meta tout de suite
      if (res.spend >= o.ad_budget * 0.97) { await g(o.meta_campaign_id, { status: "PAUSED" }, "POST").catch(() => {}); await finish(o, res); }
      else if (o.ends_at && new Date(o.ends_at).getTime() + 3 * 36e5 < Date.now()) await finish(o, res);
      n++;
    } catch (e) { await sb.from("meta_orders").update({ last_error: (e as Error).message }).eq("id", o.id); }
  }
  return { synced: n };
}

async function stop(id: string) {
  const { data: o } = await sb.from("meta_orders").select("*").eq("id", id).single();
  if (!o || o.status !== "en_cours") throw new Error("La pub n'est pas en cours");
  if (o.meta_campaign_id) await g(o.meta_campaign_id, { status: "PAUSED" }, "POST").catch(() => {});
  const res = o.meta_campaign_id ? await insights(o.meta_campaign_id).catch(() => o.results || {}) : (o.results || {});
  await finish(o, res);
  return { ok: true, results: res };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST uniquement" }, 405);
  try {
    if (!TOKEN()) return json({ error: "Jeton Meta absent (META_ACCESS_TOKEN)" }, 500);
    const body = await req.json().catch(() => ({}));
    const hook = req.headers.get("x-push-hook");
    if (hook) {
      const { data: cfg } = await sb.rpc("push_config");
      if (hook !== cfg?.hook) return json({ error: "forbidden" }, 403);
      return json(await sync());
    }
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(token);
    if (!u?.user) return json({ error: "Connexion requise" }, 401);
    const { data: me } = await sb.from("profiles").select("role").eq("id", u.user.id).single();
    if (me?.role !== "admin") return json({ error: "Réservé à l'admin" }, 403);

    if (body.action === "health") {
      const [ad, page] = await Promise.all([g(AD, { fields: "name,currency,account_status,amount_spent" }), g(PAGE, { fields: "name" })]);
      return json({ ok: true, ad, page });
    }
    if (body.action === "launch") return json(await launch(body.order_id));
    if (body.action === "sync") return json(await sync());
    if (body.action === "stop") return json(await stop(body.order_id));
    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, e instanceof MetaErr ? 422 : 500);
  }
});
