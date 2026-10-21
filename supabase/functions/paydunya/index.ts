// StatuPub — Paiements PayDunya
//   POST /paydunya/checkout           (annonceur connecté)  -> crée une facture PayDunya, renvoie l'URL de paiement
//   GET  /paydunya/return?token=...   (retour du client)    -> confirme le paiement puis renvoie vers le site
//   POST /paydunya/ipn                (PayDunya)            -> notification de paiement
//   POST /paydunya/payout             (admin)               -> paie un retrait de diffuseur (déboursement)
//   POST /paydunya/disburse-callback  (PayDunya)            -> résultat d'un déboursement
//   POST /paydunya/sync               (admin)               -> revérifie les retraits « en cours »
// Toute confirmation est revérifiée auprès de l'API PayDunya : on ne fait jamais confiance au seul message reçu.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SITE = Deno.env.get("SITE_URL") ?? "https://statupub.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const FN = `${SUPABASE_URL}/functions/v1/paydunya`;
const MASTER = Deno.env.get("PAYDUNYA_MASTER_KEY") ?? "";
const PRIVATE = Deno.env.get("PAYDUNYA_PRIVATE_KEY") ?? "";
const TOKEN = Deno.env.get("PAYDUNYA_TOKEN") ?? "";
const LIVE = (Deno.env.get("PAYDUNYA_MODE") ?? "test") === "live";
const CHECKOUT_API = LIVE ? "https://app.paydunya.com/api/v1" : "https://app.paydunya.com/sandbox-api/v1";
const DISBURSE_API = "https://app.paydunya.com/api/v2/disburse";

const db = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });
const pdHeaders = () => ({
  "Content-Type": "application/json",
  "PAYDUNYA-MASTER-KEY": MASTER, "PAYDUNYA-PRIVATE-KEY": PRIVATE, "PAYDUNYA-TOKEN": TOKEN,
});

async function sha512(s: string) {
  const b = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
let masterHash = "";
async function validHash(h: unknown) {
  if (!masterHash) masterHash = await sha512(MASTER);
  return typeof h === "string" && h.toLowerCase() === masterHash;
}

// deno-lint-ignore no-explicit-any
async function caller(req: Request): Promise<{ id: string; role: string; is_blocked: boolean } | null> {
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data } = await db.auth.getUser(jwt);
  if (!data?.user) return null;
  const { data: p } = await db.from("profiles").select("id, role, is_blocked").eq("id", data.user.id).maybeSingle();
  return p;
}

/* ---------- Encaissement (recharges annonceurs) ---------- */
async function confirmRecharge(token: string) {
  const r = await fetch(`${CHECKOUT_API}/checkout-invoice/confirm/${encodeURIComponent(token)}`, { headers: pdHeaders() });
  const d = await r.json().catch(() => ({}));
  const { data: rc } = await db.from("recharges").select("*").eq("paydunya_token", token).maybeSingle();
  if (!rc) return { ok: false, reason: "recharge inconnue" };
  if (rc.status !== "en_attente") return { ok: rc.status === "validee", reason: rc.status };
  const status = String(d?.status ?? "").toLowerCase();
  const amount = Number(d?.invoice?.total_amount ?? 0);
  if (status === "completed" && amount === rc.amount && String(d?.custom_data?.recharge_id ?? rc.id) === rc.id) {
    await db.from("recharges").update({
      status: "validee", processed_at: new Date().toISOString(),
      admin_note: `Payé via PayDunya${d?.customer?.payment_method ? " (" + d.customer.payment_method + ")" : ""}`,
      paid_with: d?.customer?.payment_method ?? null,
    }).eq("id", rc.id).eq("status", "en_attente");
    return { ok: true };
  }
  if (status === "cancelled" || status === "failed") {
    await db.from("recharges").update({ status: "rejetee", processed_at: new Date().toISOString(), admin_note: `PayDunya : ${status === "cancelled" ? "paiement annulé" : "paiement échoué"}` })
      .eq("id", rc.id).eq("status", "en_attente");
    return { ok: false, reason: status };
  }
  return { ok: false, reason: status || "en attente" };
}

async function checkout(req: Request) {
  const me = await caller(req);
  if (!me || me.role !== "annonceur" || me.is_blocked) return json({ error: "Réservé aux annonceurs connectés" }, 401);
  if (!MASTER || !PRIVATE || !TOKEN) return json({ error: "Le paiement PayDunya n'est pas encore configuré" }, 503);
  const body = await req.json().catch(() => ({}));
  const amount = Math.round(Number(body.amount));
  if (!(amount >= 1000 && amount <= 5000000)) return json({ error: "Montant entre 1 000 et 5 000 000 FCFA" }, 400);
  const { count } = await db.from("recharges").select("id", { count: "exact", head: true })
    .eq("annonceur_id", me.id).eq("status", "en_attente").gte("created_at", new Date(Date.now() - 3600e3).toISOString());
  if ((count ?? 0) >= 5) return json({ error: "Trop de paiements en cours. Réessayez dans une heure." }, 429);

  const { data: rc, error } = await db.from("recharges").insert({
    annonceur_id: me.id, amount, method: "paydunya", reference: "PayDunya (paiement en cours)",
  }).select().single();
  if (error) return json({ error: error.message }, 400);

  const r = await fetch(`${CHECKOUT_API}/checkout-invoice/create`, {
    method: "POST", headers: pdHeaders(),
    body: JSON.stringify({
      invoice: { total_amount: amount, description: `Recharge du compte annonceur StatuPub (${amount} FCFA)` },
      store: { name: "StatuPub", tagline: "Pub sur les statuts WhatsApp", website_url: SITE, logo_url: `${SITE}/logo/statupub-icone-1024.png` },
      actions: { cancel_url: `${FN}/return?cancel=1`, return_url: `${FN}/return`, callback_url: `${FN}/ipn` },
      custom_data: { recharge_id: rc.id },
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (d?.response_code !== "00" || !d?.token) {
    await db.from("recharges").update({ status: "rejetee", admin_note: `PayDunya : ${d?.response_text ?? "erreur"}`, processed_at: new Date().toISOString() }).eq("id", rc.id);
    return json({ error: `PayDunya : ${d?.response_text ?? "impossible de créer le paiement"}` }, 502);
  }
  await db.from("recharges").update({ paydunya_token: d.token, reference: `PayDunya ${d.token}` }).eq("id", rc.id);
  return json({ url: d.response_text, token: d.token });
}

async function onReturn(url: URL) {
  const token = url.searchParams.get("token") ?? "";
  let state = url.searchParams.get("cancel") ? "annule" : "attente";
  if (/^[A-Za-z0-9_-]{6,80}$/.test(token)) {
    const res = await confirmRecharge(token);
    if (res.ok) state = "ok"; else if (res.reason === "cancelled" || res.reason === "rejetee") state = "annule";
  }
  return Response.redirect(`${SITE}/#/annonceur?paiement=${state}`, 302);
}

async function onIpn(req: Request) {
  const raw = await req.text();
  let token = "", hash = "";
  try {
    const j = JSON.parse(raw); token = j?.data?.invoice?.token ?? j?.invoice?.token ?? ""; hash = j?.data?.hash ?? j?.hash ?? "";
  } catch {
    const f = new URLSearchParams(raw); token = f.get("data[invoice][token]") ?? ""; hash = f.get("data[hash]") ?? "";
  }
  if (!(await validHash(hash))) return new Response("hash invalide", { status: 401 });
  if (token) await confirmRecharge(token);
  return new Response("ok");
}

/* ---------- Déboursement (retraits diffuseurs) ---------- */
const LEGACY: Record<string, string> = { wave: "wave-senegal", orange_money: "orange-money-senegal", free_money: "free-money-senegal" };
const PREFIX: Record<string, string> = { senegal: "221", benin: "229", ci: "225", togo: "228", mali: "223", burkina: "226", "burkina-faso": "226", cameroun: "237" };
function alias(phone: string, mode: string) {
  let p = phone.replace(/\D/g, "").replace(/^00/, "");
  const country = Object.keys(PREFIX).find((k) => mode.endsWith(k));
  const cc = country ? PREFIX[country] : "";
  if (cc && p.startsWith(cc) && p.length > cc.length + 7) p = p.slice(cc.length);
  return p;
}

async function applyDisburseStatus(w: { id: string }, st: string, extra: Record<string, unknown> = {}) {
  if (st === "success") {
    await db.from("withdrawals").update({ status: "validee", processed_at: new Date().toISOString(), admin_note: "Payé via PayDunya", ...extra }).eq("id", w.id).eq("status", "en_cours");
  } else if (st === "failed") {
    await db.from("withdrawals").update({ status: "en_attente", admin_note: "Échec du paiement PayDunya : à relancer ou payer à la main", paydunya_token: null, ...extra }).eq("id", w.id).eq("status", "en_cours");
  } else if (Object.keys(extra).length) {
    await db.from("withdrawals").update({ ...extra }).eq("id", w.id);
  }
}

async function checkDisburse(w: { id: string; paydunya_token: string | null }) {
  if (!w.paydunya_token) return "inconnu";
  const r = await fetch(`${DISBURSE_API}/check-status`, { method: "POST", headers: pdHeaders(), body: JSON.stringify({ disburse_invoice: w.paydunya_token }) });
  const d = await r.json().catch(() => ({}));
  const st = String(d?.status ?? "").toLowerCase();
  if (st === "created") {
    const s = await fetch(`${DISBURSE_API}/submit-invoice`, { method: "POST", headers: pdHeaders(), body: JSON.stringify({ disburse_invoice: w.paydunya_token, disburse_id: w.id }) });
    const sd = await s.json().catch(() => ({}));
    const sst = String(sd?.status ?? (sd?.response_code === "00" ? "success" : "pending")).toLowerCase();
    await applyDisburseStatus(w, sst, sd?.transaction_id ? { transaction_id: sd.transaction_id } : {});
    return sst;
  }
  await applyDisburseStatus(w, st, d?.transaction_id ? { transaction_id: d.transaction_id } : {});
  return st || "inconnu";
}

async function payout(req: Request) {
  const me = await caller(req);
  if (!me || me.role !== "admin") return json({ error: "Accès refusé" }, 403);
  if (!MASTER || !PRIVATE || !TOKEN) return json({ error: "PayDunya n'est pas encore configuré" }, 503);
  const { withdrawal_id } = await req.json().catch(() => ({}));
  // On « réserve » le retrait pour éviter tout double paiement
  const { data: w } = await db.from("withdrawals").update({ status: "en_cours", admin_note: "Paiement PayDunya en cours" })
    .eq("id", withdrawal_id).eq("status", "en_attente").select().maybeSingle();
  if (!w) return json({ error: "Retrait introuvable ou déjà traité" }, 409);
  const mode = LEGACY[w.method] ?? w.method;

  const gi = await fetch(`${DISBURSE_API}/get-invoice`, {
    method: "POST", headers: pdHeaders(),
    body: JSON.stringify({ account_alias: alias(w.phone, mode), amount: w.amount, withdraw_mode: mode, callback_url: `${FN}/disburse-callback` }),
  });
  const gd = await gi.json().catch(() => ({}));
  if (gd?.response_code !== "00" || !gd?.disburse_token) {
    const msg = gd?.response_text ?? gd?.description ?? JSON.stringify(gd?.response_code ?? "erreur");
    await db.from("withdrawals").update({ status: "en_attente", admin_note: `PayDunya refuse : ${msg}` }).eq("id", w.id);
    return json({ error: `PayDunya : ${msg}` }, 502);
  }
  await db.from("withdrawals").update({ paydunya_token: gd.disburse_token }).eq("id", w.id);

  const s = await fetch(`${DISBURSE_API}/submit-invoice`, {
    method: "POST", headers: pdHeaders(), body: JSON.stringify({ disburse_invoice: gd.disburse_token, disburse_id: w.id }),
  });
  const sd = await s.json().catch(() => null);
  if (!sd) { // réponse incertaine : on revérifie
    const st = await checkDisburse({ id: w.id, paydunya_token: gd.disburse_token });
    return json({ status: st });
  }
  if (sd.response_code === "00") {
    const st = String(sd.status ?? "success").toLowerCase();
    await applyDisburseStatus(w, st === "pending" ? "pending" : "success", sd.transaction_id ? { transaction_id: sd.transaction_id } : {});
    return json({ status: st === "pending" ? "pending" : "success" });
  }
  const st = await checkDisburse({ id: w.id, paydunya_token: gd.disburse_token });
  return json({ status: st, message: sd.response_text ?? sd.description });
}

async function onDisburseCallback(req: Request) {
  const d = await req.json().catch(() => ({}));
  if (!(await validHash(d?.hash))) return new Response("hash invalide", { status: 401 });
  const { data: w } = await db.from("withdrawals").select("id, paydunya_token").eq("paydunya_token", d?.token ?? "").maybeSingle();
  if (w) await checkDisburse(w);
  return new Response("ok");
}

async function sync(req: Request) {
  const me = await caller(req);
  if (!me || me.role !== "admin") return json({ error: "Accès refusé" }, 403);
  const { data } = await db.from("withdrawals").select("id, paydunya_token").eq("status", "en_cours").limit(50);
  const out: Record<string, string> = {};
  for (const w of data ?? []) out[w.id] = await checkDisburse(w);
  return json({ checked: out });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const url = new URL(req.url);
  const route = url.pathname.split("/").filter(Boolean).pop();
  try {
    if (route === "checkout" && req.method === "POST") return await checkout(req);
    if (route === "return") return await onReturn(url);
    if (route === "ipn" && req.method === "POST") return await onIpn(req);
    if (route === "payout" && req.method === "POST") return await payout(req);
    if (route === "disburse-callback" && req.method === "POST") return await onDisburseCallback(req);
    if (route === "sync" && req.method === "POST") return await sync(req);
    if (route === "status") return json({ configured: !!(MASTER && PRIVATE && TOKEN), mode: LIVE ? "live" : "test" });
    return json({ error: "Route inconnue" }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: "Erreur interne" }, 500);
  }
});
