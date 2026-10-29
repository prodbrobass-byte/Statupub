// StatuPub — pont avec l'API Marketing de Meta.
// Actions (POST, admin connecté) : health, launch {order_id}, sync, stop {order_id}
// Le cron appelle {action:"sync"} avec l'en-tête x-push-hook.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const G = "https://graph.facebook.com/v23.0";
const AD = "act_1431680522500834", PAGE = "1358181967385102";
const XOF_PER_EUR = 655.957;
const PIXEL = "1081784291417409";
// Indique à Meta de compter les conversions du pixel StatuPub (inscriptions, achats, contacts) pour chaque pub
const TRACK = [{ "action.type": ["offsite_conversion"], "fb_pixel": [PIXEL] }];
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
  const medias: string[] = (o.media_urls?.length ? o.media_urls : [o.media_url]).filter(Boolean).slice(0, 3);
  if (!medias.length) throw new Error("Pas de visuel");


  const eurCents = Math.floor((o.ad_budget / XOF_PER_EUR) * 100);
  if (eurCents < o.days * 100) throw new Error(`Budget trop faible pour Meta : au moins 1 € (≈ 656 F) par jour de diffusion. Ici ${(eurCents / 100).toFixed(2)} € pour ${o.days} jours.`);

  // 1. Visuels : images → hash ; vidéos → envoi chez Meta + attente du traitement + miniature
  const prev = (o.meta_ids || {}) as Record<string, string>;
  const assets: { kind: "image" | "video"; hash?: string; video?: string; thumb?: string }[] = [];
  for (const [i, u] of medias.entries()) {
    if (/\.(mp4|mov|webm|m4v)($|\?)/i.test(u)) {
      let vid = prev[`video${i}`];
      if (!vid) {
        vid = (await g(`${AD}/advideos`, { file_url: u, name: `SP · ${o.title} · V${i + 1}` }, "POST")).id;
        await sb.from("meta_orders").update({ meta_ids: { ...prev, [`video${i}`]: vid } }).eq("id", id);
        prev[`video${i}`] = vid;
      }
      let ready = false;
      for (let t = 0; t < 18 && !ready; t++) {
        const st = await g(vid, { fields: "status" }).catch(() => null);
        const vs = st?.status?.video_status;
        if (vs === "ready") ready = true;
        else if (vs === "error") throw new Error("Meta n'a pas pu traiter la vidéo (format ou fichier abîmé). Demande une autre vidéo MP4.");
        else await new Promise((r) => setTimeout(r, 5000));
      }
      if (!ready) throw new Error("La vidéo est encore en traitement chez Meta. Réessaie « Lancer automatiquement » dans 2 minutes (elle ne sera pas renvoyée).");
      const th = await g(`${vid}/thumbnails`, {}).catch(() => null);
      const thumb = (th?.data || []).find((x: any) => x.is_preferred)?.uri || th?.data?.[0]?.uri || "https://statupub.com/logo/statupub-icone-1024.png";
      assets.push({ kind: "video", video: vid, thumb });
    } else {
      const img = await fetch(u);
      if (!img.ok) throw new Error("Visuel introuvable");
      const buf = new Uint8Array(await img.arrayBuffer());
      let bin = ""; for (let k = 0; k < buf.length; k += 0x8000) bin += String.fromCharCode(...buf.subarray(k, k + 0x8000));
      const up = await g(`${AD}/adimages`, { bytes: btoa(bin) }, "POST");
      const h = (Object.values(up.images || {})[0] as any)?.hash;
      if (!h) throw new Error("Envoi du visuel à Meta impossible");
      assets.push({ kind: "image", hash: h });
    }
  }

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
      billing_event: "IMPRESSIONS", optimization_goal: "LANDING_PAGE_VIEWS", bid_strategy: "LOWEST_COST_WITHOUT_CAP", destination_type: "WEBSITE", targeting, status: "PAUSED" }, "POST");
    ids.adset = adset.id;
    // 4-5. Un visuel = une pub (même budget partagé : Meta privilégie la meilleure)
    const cta = o.objective === "site" ? "SHOP_NOW" : "LEARN_MORE";
    for (const [i, as] of assets.entries()) {
      const label = assets.length > 1 ? `${name} · V${i + 1}` : name;
      const spec = as.kind === "video"
        ? { page_id: PAGE, video_data: { video_id: as.video, image_url: as.thumb, message: o.message, title: o.title, call_to_action: { type: cta, value: { link: o.target_url } } } }
        : { page_id: PAGE, link_data: { image_hash: as.hash, link: o.target_url, message: o.message, name: o.title, call_to_action: { type: cta, value: { link: o.target_url } } } };
      const creative = await g(`${AD}/adcreatives`, { name: label, object_story_spec: spec }, "POST");
      const ad = await g(`${AD}/ads`, { name: label, adset_id: adset.id, creative: { creative_id: creative.id }, status: "ACTIVE", tracking_specs: TRACK }, "POST");
      if (i === 0) { ids.creative = creative.id; ids.ad = ad.id; }
      ids[`ad${i + 1}`] = ad.id;
    }
    await g(adset.id, { status: "ACTIVE" }, "POST");
    await g(camp.id, { status: "ACTIVE" }, "POST");
    await sb.from("meta_orders").update({ status: "en_cours", started_at: new Date().toISOString(), ends_at: end.toISOString(), meta_campaign_id: camp.id, meta_ids: { ...prev, ...ids }, last_error: null }).eq("id", id);
    await notify(o.annonceur_id, "📘 Ta Facebook Ads est lancée", `${o.title} : elle passe en vérification chez Meta puis démarre (en général sous quelques heures).`);
    return { ok: true, ids };
  } catch (e) {
    if (ids.campaign) await g(ids.campaign, {}, "DELETE").catch(() => {});
    await sb.from("meta_orders").update({ last_error: (e as Error).message }).eq("id", id);
    throw e;
  }
}

async function insights(campaignId: string) {
  const r = await g(`${campaignId}/insights`, { fields: "reach,impressions,inline_link_clicks,spend,actions", date_preset: "maximum" });
  const d = r.data?.[0] || {};
  // Conversions du pixel (même événement sous plusieurs noms : on garde le plus grand, sans additionner)
  const act = (types: string[]) => (d.actions || []).filter((a: any) => types.includes(a.action_type)).reduce((x: number, a: any) => Math.max(x, +a.value || 0), 0);
  return { reach: +d.reach || 0, impressions: +d.impressions || 0, clicks: +d.inline_link_clicks || 0, spend: Math.round((+d.spend || 0) * XOF_PER_EUR),
    signups: act(["offsite_conversion.fb_pixel_complete_registration", "complete_registration", "omni_complete_registration"]),
    purchases: act(["offsite_conversion.fb_pixel_purchase", "purchase", "omni_purchase"]),
    // Meta range parfois l'événement Contact de la page WhatsApp en « conversion personnalisée »
    messages: act(["offsite_conversion.fb_pixel_contact", "contact", "contact_total", "omni_contact", "offsite_conversion.fb_pixel_custom"]),
    visits: act(["landing_page_view", "omni_landing_page_view"]) };
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
      const issue = await adIssues(o.meta_campaign_id).catch(() => null);
      await sb.from("meta_orders").update({ results: res, last_error: issue }).eq("id", o.id);
      // Première diffusion constatée → message + notification à l'annonceur (une seule fois)
      if (!o.live_notified_at && res.impressions > 0) await sb.rpc("meta_order_live", { p_id: o.id });
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

// Diagnostic (protégé par x-push-hook) : vérifie qu'une vidéo passe chez Meta, sans rien diffuser.
async function dryrunVideo(url: string) {
  const steps: string[] = []; let campId = "";
  try {
    const vid = (await g(`${AD}/advideos`, { file_url: url, name: "TEST video" }, "POST")).id; steps.push("video envoyée " + vid);
    let ready = false;
    for (let t = 0; t < 20 && !ready; t++) { const st = await g(vid, { fields: "status" }).catch(() => null); const vs = st?.status?.video_status; steps.push("statut " + vs); if (vs === "ready") ready = true; else if (vs === "error") break; else await new Promise((r) => setTimeout(r, 5000)); }
    const th = await g(`${vid}/thumbnails`, {}).catch(() => null);
    const thumb = (th?.data || []).find((x: any) => x.is_preferred)?.uri || th?.data?.[0]?.uri || "https://statupub.com/logo/statupub-icone-1024.png";
    steps.push("miniature " + (th?.data?.length ? "ok" : "défaut"));
    const camp = await g(`${AD}/campaigns`, { name: "TEST video (à supprimer)", objective: "OUTCOME_TRAFFIC", status: "PAUSED", special_ad_categories: [], is_adset_budget_sharing_enabled: false }, "POST"); campId = camp.id;
    const start = new Date(Date.now() + 864e5), end = new Date(start.getTime() + 3 * 864e5);
    const adset = await g(`${AD}/adsets`, { name: "TEST", campaign_id: camp.id, lifetime_budget: 500, start_time: start.toISOString(), end_time: end.toISOString(), billing_event: "IMPRESSIONS", optimization_goal: "LINK_CLICKS", bid_strategy: "LOWEST_COST_WITHOUT_CAP", destination_type: "WEBSITE", targeting: { age_min: 18, age_max: 45, targeting_automation: { advantage_audience: 0 }, geo_locations: { countries: ["SN"] } }, status: "PAUSED" }, "POST");
    const cr = await g(`${AD}/adcreatives`, { name: "TEST v", object_story_spec: { page_id: PAGE, video_data: { video_id: vid, image_url: thumb, message: "Test", title: "Test", call_to_action: { type: "LEARN_MORE", value: { link: "https://statupub.com" } } } } }, "POST");
    steps.push("visuel vidéo ok");
    await g(`${AD}/ads`, { name: "TEST v", adset_id: adset.id, creative: { creative_id: cr.id }, status: "PAUSED" }, "POST");
    steps.push("pub vidéo ok");
  } catch (e) { steps.push("ERREUR: " + (e as Error).message); }
  if (campId) await g(campId, {}, "DELETE").then(() => steps.push("campagne supprimée")).catch(() => {});
  return { steps };
}

// Diagnostic (protégé par x-push-hook) : état réel chez Meta d'une campagne et de ses pubs
async function inspect(campaignId: string) {
  const f = "name,status,effective_status,configured_status,issues_info,ad_review_feedback,recommendations";
  const [camp, adsets, ads] = await Promise.all([
    g(campaignId, { fields: "name,status,effective_status,issues_info" }).catch((e) => ({ err: e.message })),
    g(`${campaignId}/adsets`, { fields: "name,status,effective_status,issues_info,lifetime_budget,start_time,end_time" }).catch((e) => ({ err: e.message })),
    g(`${campaignId}/ads`, { fields: f }).catch((e) => ({ err: e.message })),
  ]);
  const acc = await g(AD, { fields: "account_status,disable_reason,funding_source_details,spend_cap,amount_spent,balance" }).catch((e) => ({ err: e.message }));
  return { acc, camp, adsets, ads };
}

// Problèmes signalés par Meta sur les pubs (refus, blocage du compte…) → affichés dans l'admin
async function adIssues(campaignId: string) {
  const r = await g(`${campaignId}/ads`, { fields: "name,effective_status,issues_info,ad_review_feedback" });
  const out: string[] = [];
  for (const a of r.data || []) {
    if (!["WITH_ISSUES", "DISAPPROVED"].includes(a.effective_status)) continue;
    const fb = a.ad_review_feedback?.global ? Object.values(a.ad_review_feedback.global)[0] : null;
    out.push(`${String(a.name).split(" · ").pop()} : ${a.issues_info?.[0]?.error_summary || fb || a.effective_status}`);
  }
  return out.length ? "Meta : " + out.join(" | ") : null;
}

// Réactive chez Meta les pubs d'une commande en cours (après un blocage réglé)
async function resume(id: string) {
  const { data: o } = await sb.from("meta_orders").select("*").eq("id", id).single();
  if (!o || o.status !== "en_cours" || !o.meta_campaign_id) throw new Error("La pub n'est pas en cours");
  const ids = (o.meta_ids || {}) as Record<string, string>;
  const ads = Object.entries(ids).filter(([k]) => /^ad\d$/.test(k)).map(([, v]) => v);
  const errs: string[] = [];
  for (const ad of ads) await g(ad, { status: "ACTIVE" }, "POST").catch((e) => errs.push(e.message));
  if (ids.adset) await g(ids.adset, { status: "ACTIVE" }, "POST").catch((e) => errs.push(e.message));
  await g(o.meta_campaign_id, { status: "ACTIVE" }, "POST").catch((e) => errs.push(e.message));
  await new Promise((r) => setTimeout(r, 4000));
  const issue = await adIssues(o.meta_campaign_id).catch(() => null);
  await sb.from("meta_orders").update({ last_error: errs.length ? errs.join(" | ") : issue }).eq("id", id);
  return { ok: !errs.length && !issue, errors: errs, issue, state: await inspect(o.meta_campaign_id) };
}

// Ajoute le suivi du pixel aux pubs déjà lancées
async function trackAll() {
  const { data } = await sb.from("meta_orders").select("id, title, meta_ids").eq("status", "en_cours");
  const out: string[] = [];
  for (const o of data || []) for (const [k, v] of Object.entries((o.meta_ids || {}) as Record<string, string>)) {
    if (!/^ad\d$/.test(k)) continue;
    await g(v, { tracking_specs: TRACK }, "POST").then(() => out.push(`${o.title} ${k} ok`)).catch((e) => out.push(`${o.title} ${k} : ${e.message}`));
  }
  return { done: out };
}

// Diagnostic pixel : événements reçus par Meta + actions remontées par les pubs
async function pixelCheck() {
  const since = Math.floor(Date.now() / 1000) - 3 * 86400;
  const [info, stats, linked] = await Promise.all([
    g(PIXEL, { fields: "name,last_fired_time,is_unavailable,data_use_setting,owner_business" }).catch((e) => ({ err: e.message })),
    g(`${PIXEL}/stats`, { aggregation: "event", start_time: since }).catch((e) => ({ err: e.message })),
    g(`${AD}/adspixels`, { fields: "id,name" }).catch((e) => ({ err: e.message })),
  ]);
  const { data } = await sb.from("meta_orders").select("title, meta_campaign_id").eq("status", "en_cours");
  const actions: Record<string, unknown> = {};
  for (const o of data || []) {
    const r = await g(`${o.meta_campaign_id}/insights`, { fields: "actions", date_preset: "maximum" }).catch((e) => ({ err: e.message }));
    actions[o.title] = (r as any).err || ((r as any).data?.[0]?.actions || []).map((a: any) => `${a.action_type}=${a.value}`);
  }
  const ev: Record<string, number> = {};
  for (const b of (stats as any).data || []) for (const x of b.data || []) ev[x.value] = (ev[x.value] || 0) + (+x.count || 0);
  return { info, events_3_jours: Object.keys(ev).length ? ev : stats, linked, actions };
}

// Recrée les pubs d'une commande en cours dans le même ensemble (quand Meta a archivé la publication d'origine)
async function recreate(id: string) {
  const { data: o } = await sb.from("meta_orders").select("*").eq("id", id).single();
  if (!o || o.status !== "en_cours") throw new Error("La pub n'est pas en cours");
  const ids = (o.meta_ids || {}) as Record<string, string>;
  if (!ids.adset) throw new Error("Ensemble de pubs introuvable");
  const medias: string[] = (o.media_urls?.length ? o.media_urls : [o.media_url]).filter(Boolean).slice(0, 3);
  const name = `SP · ${o.title}`.slice(0, 100);
  const cta = o.objective === "site" ? "SHOP_NOW" : "LEARN_MORE";
  const out: Record<string, string> = {};
  for (const [i, u] of medias.entries()) {
    let spec: any;
    if (/\.(mp4|mov|webm|m4v)($|\?)/i.test(u)) {
      const vid = ids[`video${i}`] || (await g(`${AD}/advideos`, { file_url: u, name: `${name} · V${i + 1}` }, "POST")).id;
      for (let t = 0; t < 18; t++) { const st = await g(vid, { fields: "status" }).catch(() => null); if (st?.status?.video_status === "ready") break; await new Promise((r) => setTimeout(r, 5000)); }
      const th = await g(`${vid}/thumbnails`, {}).catch(() => null);
      const thumb = (th?.data || []).find((x: any) => x.is_preferred)?.uri || th?.data?.[0]?.uri || "https://statupub.com/logo/statupub-icone-1024.png";
      spec = { page_id: PAGE, video_data: { video_id: vid, image_url: thumb, message: o.message, title: o.title, call_to_action: { type: cta, value: { link: o.target_url } } } };
    } else {
      const img = await fetch(u); if (!img.ok) throw new Error("Visuel introuvable");
      const buf = new Uint8Array(await img.arrayBuffer());
      let bin = ""; for (let k = 0; k < buf.length; k += 0x8000) bin += String.fromCharCode(...buf.subarray(k, k + 0x8000));
      const up = await g(`${AD}/adimages`, { bytes: btoa(bin) }, "POST");
      const h = (Object.values(up.images || {})[0] as any)?.hash;
      spec = { page_id: PAGE, link_data: { image_hash: h, link: o.target_url, message: o.message, name: o.title, call_to_action: { type: cta, value: { link: o.target_url } } } };
    }
    const label = `${name} · R${i + 1}`;
    const creative = await g(`${AD}/adcreatives`, { name: label, object_story_spec: spec }, "POST");
    const ad = await g(`${AD}/ads`, { name: label, adset_id: ids.adset, creative: { creative_id: creative.id }, status: "ACTIVE", tracking_specs: TRACK }, "POST");
    out[`ad${i + 1}`] = ad.id;
  }
  // les anciennes pubs (archivées) sont gardées pour l'historique
  const old: Record<string, string> = {};
  for (const [k, v] of Object.entries(ids)) if (/^ad\d$/.test(k)) old[`old_${k}_${Date.now() % 100000}`] = v;
  await g(ids.adset, { status: "ACTIVE" }, "POST").catch(() => {});
  await g(o.meta_campaign_id, { status: "ACTIVE" }, "POST").catch(() => {});
  const next = { ...Object.fromEntries(Object.entries(ids).filter(([k]) => !/^ad\d$/.test(k))), ...old, ...out, ad: out.ad1 };
  await sb.from("meta_orders").update({ meta_ids: next, last_error: null }).eq("id", id);
  return { ok: true, ads: out };
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
      if (body.action === "inspect") return json(await inspect(body.campaign_id));
      if (body.action === "track") return json(await trackAll());
      if (body.action === "pixel") return json(await pixelCheck());
      if (body.action === "resume") return json(await resume(body.order_id));
      if (body.action === "recreate") return json(await recreate(body.order_id));
      if (body.action === "ad_status") return json(await g(body.ad_id, { status: body.status }, "POST"));
      if (body.action === "dryrun_video") return json(await dryrunVideo(body.url || "https://statupub.com/media/statupub-presentation.mp4"));
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
    if (body.action === "resume") return json(await resume(body.order_id));
    if (body.action === "recreate") return json(await recreate(body.order_id));
    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, e instanceof MetaErr ? 422 : 500);
  }
});
