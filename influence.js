/* ==================== Espace Pub Influenceur ====================
   Chargé après le script principal : utilise $, app, state, sb, rpc, esc, fcfa, money,
   dateTimeFr, toast, errMsg, busy, openModal, closeModal, copy, rechargeModal. */
/* global $, app, state, sb, rpc, esc, fcfa, money, dateTimeFr, toast, errMsg, busy, openModal, closeModal, copy, rechargeModal, countryOptions, COUNTRIES */

const INF_NETS = { tiktok: "TikTok", instagram: "Instagram", snapchat: "Snapchat", youtube: "YouTube", facebook: "Facebook" };
const INF_ICONS = {
  tiktok: '<path fill="currentColor" d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2-2.8V9.1a6.2 6.2 0 1 0 5.3 6.1V8.6a7.6 7.6 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.4Z"/>',
  instagram: '<path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 2c-2.7 0-3 0-4.1.1-4 .2-5.6 1.8-5.8 5.8C2 9 2 9.3 2 12s0 3 .1 4.1c.2 4 1.8 5.6 5.8 5.8 1.1.1 1.4.1 4.1.1s3 0 4.1-.1c4-.2 5.6-1.8 5.8-5.8.1-1.1.1-1.4.1-4.1s0-3-.1-4.1c-.2-4-1.8-5.6-5.8-5.8C15 2 14.7 2 12 2Zm0 1.8c2.7 0 3 0 4 .1 3 .1 4 1.2 4.1 4.1.1 1 .1 1.3.1 4s0 3-.1 4c-.1 2.9-1.1 4-4.1 4.1-1 .1-1.3.1-4 .1s-3 0-4-.1c-3-.1-4-1.2-4.1-4.1-.1-1-.1-1.3-.1-4s0-3 .1-4C4 5 5 4 8 3.9c1-.1 1.3-.1 4-.1Z"/>',
  snapchat: '<path fill="currentColor" d="M12 2.2c2.9 0 5 2.2 5 5.2v2.3c.5.2 1.2-.2 1.6 0 .6.3.5 1-.1 1.3-.6.3-1.6.5-1.6 1.1.3 1.6 2 3.3 3.8 3.8.5.1.6.7.1 1-1 .5-2.2.4-2.5.9-.2.4-.1 1.1-.6 1.2-.8.2-1.8-.4-3 0-1 .4-1.6 1.6-2.7 1.6s-1.7-1.2-2.7-1.6c-1.2-.4-2.2.2-3 0-.5-.1-.4-.8-.6-1.2-.3-.5-1.5-.4-2.5-.9-.5-.3-.4-.9.1-1 1.8-.5 3.5-2.2 3.8-3.8 0-.6-1-.8-1.6-1.1-.6-.3-.7-1-.1-1.3.4-.2 1.1.2 1.6 0V7.4c0-3 2.1-5.2 5-5.2Z"/>',
  youtube: '<path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.1V8.9l5.2 3.1Z"/>',
  facebook: '<path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"/>',
};
const INF_BG = { tiktok: "#111", instagram: "linear-gradient(45deg,#F58529,#DD2A7B 55%,#8134AF)", snapchat: "#FFFC00", youtube: "#FF0000", facebook: "#1877F2" };
/* Lien du compte : celui saisi par le créateur, sinon construit depuis le nom du compte */
function netUrl(n) {
  if (n.url && /^https?:\/\//i.test(n.url)) return n.url;
  const h = String(n.handle || "").trim().replace(/^@/, ""); if (!h) return "";
  const e = encodeURIComponent(h);
  return { tiktok: `https://www.tiktok.com/@${e}`, instagram: `https://www.instagram.com/${e}`, snapchat: `https://www.snapchat.com/add/${e}`, youtube: `https://www.youtube.com/@${e}`, facebook: `https://www.facebook.com/${e}` }[n.network] || "";
}
const netIcon = (k, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${INF_ICONS[k] || ""}</svg>`;
const socBtn = (n) => { const u = netUrl(n); const st = `background:${INF_BG[n.network]};color:${n.network === "snapchat" ? "#111" : "#fff"}`;
  return u ? `<a class="inf-soc" href="${esc(u)}" target="_blank" rel="noopener" style="${st}" aria-label="${INF_NETS[n.network]} de ce créateur" title="Voir sur ${INF_NETS[n.network]}">${netIcon(n.network)}</a>`
    : `<span class="inf-soc" style="${st};opacity:.5" title="${INF_NETS[n.network]}">${netIcon(n.network)}</span>`; };
const INF_CATS = ["Cinéma", "Acteur / Actrice", "Séries TV", "Humour", "Musique", "Danse", "Mode", "Beauté", "Mannequin", "Animateur / Présentateur", "Lifestyle", "Famille", "Food", "Santé & Bien-être", "Sport", "Football", "Lutte", "Tech", "Gaming", "Business", "Immobilier", "Automobile", "Voyage", "Photo & Vidéo", "Art & Culture", "Événementiel", "Religion", "Éducation"];
const INF_PALETTE = [["Rouge", "#B3261E"], ["Bordeaux", "#7A1F3D"], ["Orange", "#C2541A"], ["Or", "#9A6B12"], ["Vert", "#2E6B3A"], ["Émeraude", "#1F5C52"],
  ["Bleu", "#1E5AA8"], ["Bleu nuit", "#1C2A5A"], ["Violet", "#5B3A8C"], ["Rose", "#A83A6E"], ["Marron", "#6B4227"], ["Noir", "#1A1A1A"]];
const INF_ST = {
  awaiting_creator: ["En attente du créateur", "#F1F1EE", "#4A4A44"], accepted: ["Acceptée · en création", "#E7F1EE", "#0E3B36"],
  refused: ["Refusée", "#F6E1DD", "#8A3B2E"], expired: ["Expirée · remboursée", "#F1F1EE", "#4A4A44"],
  content_submitted: ["Vidéo à valider", "#FFF1DB", "#7A4E0C"], changes_requested: ["Retouche demandée", "#FFF1DB", "#7A4E0C"],
  content_approved: ["Validée · à publier", "#E8EEF8", "#1E4A8A"], published: ["Publiée · vérification", "#E8EEF8", "#1E4A8A"],
  verified: ["Terminée", "#E3F3EA", "#145049"], paid_out: ["Terminée · créateur payé", "#E3F3EA", "#145049"],
  cancelled: ["Annulée", "#F1F1EE", "#4A4A44"], disputed: ["Litige en cours", "#F6E1DD", "#8A3B2E"],
};
const infSt = (s) => { const [t, bg, fg] = INF_ST[s] || [s, "#F1F1EE", "#4A4A44"]; return `<span class="inf-status" style="background:${bg};color:${fg}">${t}</span>`; };
const kfmt = (n) => { n = Number(n) || 0; if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(".", ",") + " M"; if (n >= 1e3) return Math.round(n / 1e3) + " K"; return String(n); };
const infIni = (name) => esc(String(name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase());
const infAva = (img, name, cls = "") => `<span class="inf-ava ${cls}">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : infIni(name)}</span>`;
const infCoverStyle = (color, banner) => banner ? `background-image:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.45)),url('${esc(banner)}');background-color:${esc(color)}`
  : `background:linear-gradient(135deg,${esc(color || "#0E3B36")},${esc(color || "#0E3B36")}cc 60%,#10201D)`;
const stars = (r) => { const n = Math.round(Number(r) || 0); return `<span style="color:#C8841F" aria-label="${r ? Number(r).toFixed(1) : 0} sur 5">${"★".repeat(n)}<span style="color:var(--line)">${"★".repeat(5 - n)}</span></span>`; };
const infBadge = (cert) => cert ? `<span class="inf-badge">✓ Certifié StatuPub</span>` : `<span class="inf-badge v">✓ Vérifié</span>`;
const pkNets = (x) => { const n = (x.networks && x.networks.length ? x.networks : x.network && x.network !== "multi" ? [x.network] : []);
  return n.length === 5 ? `<span class="inf-net">Tous les réseaux</span>` : n.map((k) => `<span class="inf-net">${INF_NETS[k] || k}</span>`).join(" "); };
/* Rangée de puces à choix multiple, avec une puce « Tous » qui vide la sélection */
const chipRow = (id, items, sel, allLabel) => `<div class="inf-chips" id="${id}" role="group">${allLabel ? `<button type="button" class="inf-chip" data-all="1" aria-pressed="${!sel.length}">${allLabel}</button>` : ""}${items.map(([k, l]) => `<button type="button" class="inf-chip" data-v="${esc(k)}" aria-pressed="${sel.includes(k)}">${esc(l)}</button>`).join("")}</div>`;
function bindChips(el, sel, onChange, max = 99) {
  el.onclick = (e) => { const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.all) sel.splice(0); else { const v = b.dataset.v, i = sel.indexOf(v); if (i >= 0) sel.splice(i, 1); else if (sel.length < max) sel.push(v); else return toast(max + " maximum", true); }
    el.querySelectorAll("[data-v]").forEach((x) => x.setAttribute("aria-pressed", String(sel.includes(x.dataset.v)))); el.querySelector("[data-all]")?.setAttribute("aria-pressed", String(!sel.length));
    onChange?.(); };
}
const isBrandUser = () => state.profile?.role === "annonceur";
const fees = () => ({ c: Number(state.settings?.inf_creator_fee ?? 0.10), b: Number(state.settings?.inf_brand_fee ?? 0.05) });
const signedContent = async (u) => {
  if (!u) return null;
  if (!u.startsWith("sb:")) return u;
  const { data } = await sb.storage.from("influence-content").createSignedUrl(u.slice(3), 3600);
  return data?.signedUrl || null;
};
const isVideo = (u) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(u || "");
const extOf = (f) => (f.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
async function infUpload(bucket, path, file) {
  const { error } = await sb.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return bucket === "influence" ? sb.storage.from(bucket).getPublicUrl(path).data.publicUrl : "sb:" + path;
}

const infBk = new Map();
document.addEventListener("click", (e) => { const b = e.target.closest("[data-ct]"); if (b && infBk.has(b.dataset.ct)) { e.preventDefault(); infContract(infBk.get(b.dataset.ct)); } });
const bkLinks = (x) => `<div class="row" style="gap:6px;flex-wrap:wrap"><a class="btn btn-ghost btn-sm" href="#/messages/${x.id}">💬 Messages${x.unread ? ` (${x.unread})` : ""}</a>${["refused", "expired", "cancelled", "awaiting_creator"].includes(x.status) ? "" : `<button type="button" class="btn btn-ghost btn-sm" data-ct="${x.id}">📄 Contrat</button>`}</div>`;

/* ---------- Ruban « Nos influenceurs » (accueil) ---------- */
async function loadInfRibbon() {
  const box = $("#home-inf"); if (!box) return;
  let list = [];
  try { list = await rpc("inf_ribbon"); } catch { return; }
  if (!list?.length || !document.body.contains(box)) return;
  const pills = list.length < 6 ? [...list, ...list, ...list] : list;
  const pill = (x, hid) => `<a class="inf-tile" href="#/influence/${esc(x.slug)}" ${hid ? 'aria-hidden="true" tabindex="-1"' : ""}>
    <span class="inf-tile-img" style="background:${esc(x.color || "#0E3B36")}">${x.avatar ? `<img src="${esc(x.avatar)}" alt="" loading="lazy">` : `<span class="ini">${infIni(x.name)}</span>`}${x.certified ? `<span class="inf-badge">✓ Certifié</span>` : ""}</span>
    <span class="inf-tile-txt"><b>${esc(x.name)}</b><small>${esc(x.cat || "Créateur")}</small></span></a>`;
  box.innerHTML = `<section class="inf-ribbon" aria-labelledby="inf-rb-h"><div class="wrap row between" style="margin-bottom:18px;flex-wrap:wrap;gap:12px">
      <div><p class="eyebrow" style="color:var(--saffron)">Espace Pub Influenceur</p><h2 id="inf-rb-h" style="margin:4px 0 0">Nos influenceurs</h2></div>
      <a class="btn btn-primary btn-sm" href="#/influence">Voir tous les créateurs</a></div>
    <div class="reviews" style="--rv-dur:${Math.max(25, pills.length * 5)}s" tabindex="0" aria-label="Nos influenceurs, défilement automatique"><div class="reviews-track">${pills.map((x) => pill(x)).join("")}${pills.map((x) => pill(x, true)).join("")}</div></div></section>`;
}

/* ---------- Annuaire public ---------- */
async function viewInfluence() {
  app.innerHTML = `<div class="spinner"></div>`;
  const list = await rpc("inf_directory");
  const see = list.some((x) => x.min_price != null) || isBrandUser() || state.profile?.role === "admin";
  const f = { nets: [], cats: [], q: "", max: "" };
  const cats = [...new Set([...INF_CATS, ...list.flatMap((x) => x.categories || [])])];
  app.innerHTML = `<div class="inf-pro">
  <section class="inf-hero"><div class="wrap stack" style="gap:18px">
    <span class="inf-kicker">Espace Pub Influenceur · StatuPub</span>
    <h1>Réservez les plus grands créateurs d'Afrique, en toute confiance.</h1>
    <p>Des créateurs vérifiés de plus de 200 000 abonnés. Prix clairs, paiement sécurisé : le créateur n'est payé qu'après la publication.</p>
  </div></section>
  <main class="wrap stack" style="gap:28px;padding-bottom:48px">
    <form class="inf-search" id="inf-f" role="search" aria-label="Filtrer les créateurs">
      <div class="stack" style="gap:6px;flex:1 1 100%"><b class="small muted">Réseaux (un, plusieurs ou tous)</b>${chipRow("if-net", Object.entries(INF_NETS), f.nets, "Tous les réseaux")}</div>
      <div class="stack" style="gap:6px;flex:1 1 100%"><b class="small muted">Catégories</b>${chipRow("if-cat", cats.map((c) => [c, c]), f.cats, "Toutes")}</div>
      <label>Nom ou ville<input id="if-q" type="search" placeholder="Ex. : Dakar"></label>
      ${see ? `<label>Budget max (F)<input id="if-max" type="number" min="0" step="5000" placeholder="Ex. : 300000"></label>` : ""}
    </form>
    ${!see ? `<div class="notice info"><div><b>Les prix sont réservés aux marques inscrites.</b><p class="small muted">Créez votre compte entreprise gratuitement pour voir les tarifs et réserver, ou demandez un prix sur le profil d'un créateur.</p></div><a class="btn btn-ink btn-sm" href="#/inscription?role=annonceur">Créer mon compte marque</a></div>` : ""}
    <div class="row between"><h2 style="margin:0" id="inf-count"></h2>${isBrandUser() ? `<a class="btn btn-ghost btn-sm" href="#/marque">Mes réservations</a>` : ""}</div>
    <div class="inf-grid" id="inf-grid"></div>
    <section class="stack" aria-labelledby="inf-how"><h2 id="inf-how">Comment ça marche</h2><div class="inf-steps">
      ${[["Choisissez", "Filtrez par réseau, catégorie et budget. Chaque chiffre est vérifié par StatuPub."], ["Réservez", "Choisissez une formule ou faites une offre. Votre argent est bloqué, pas encore versé."], ["Validez", "Le créateur vous envoie la vidéo avant publication. Vous la validez ou demandez une retouche."], ["Payez après", "Le créateur est payé seulement quand la publication est en ligne et vérifiée."]]
        .map(([t, d], i) => `<div class="inf-step"><b class="n">${i + 1}</b><b>${t}</b><p class="small muted" style="margin:0">${d}</p></div>`).join("")}
    </div></section>
    <section class="card row between" style="flex-wrap:wrap;gap:14px"><div><h2 style="margin:0">Tu es créateur ?</h2><p class="muted" style="margin:4px 0 0">Plus de 200 000 abonnés ? Envoie ta candidature pour rejoindre l'Espace Pub Influenceur.</p></div>
      <div class="row"><a class="btn btn-ghost" href="#/conditions-influence">Les conditions</a><a class="btn btn-primary" href="#/devenir-createur">Devenir créateur StatuPub</a></div></section>
    <section class="inf-fees"><div class="stack" style="gap:8px;max-width:560px"><h2 style="margin:0">Une commission simple et visible</h2><p style="margin:0;color:#CFE0DB">Pas de frais cachés. La marque paie le prix du créateur plus ${Math.round(fees().b * 100)} % de frais de service. Le créateur garde ${Math.round((1 - fees().c) * 100)} % de son prix.</p></div>
      <div class="row" style="gap:28px"><div><div class="big">${Math.round(fees().b * 100)} %</div><div class="small">frais de service marque</div></div><div><div class="big">${Math.round((1 - fees().c) * 100)} %</div><div class="small">gardés par le créateur</div></div></div></section>
  </main></div>`;
  const card = (x) => `<a class="inf-card" href="#/influence/${esc(x.slug)}">
    <div class="inf-cover" style="${infCoverStyle(x.color, x.banner)}">${x.certified ? infBadge(true) : ""}${infAva(x.avatar, x.name)}</div>
    <div class="inf-body"><h3>${esc(x.name)}</h3>
      <div class="small muted">${esc([x.city, (x.categories || []).slice(0, 2).join(" · ")].filter(Boolean).join(" · "))}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap">${(x.networks || []).slice(0, 5).map((n) => `<span class="inf-net" style="display:inline-flex;align-items:center;gap:4px" title="${INF_NETS[n.network] || n.network}">${netIcon(n.network, 14)} ${kfmt(n.followers)}</span>`).join("")}</div>
      <div class="small">${x.reviews ? `${stars(x.rating)} <b>${Number(x.rating).toFixed(1)}</b> <span class="muted">(${x.reviews} avis)</span>` : `<span class="muted">Nouveau sur StatuPub</span>`}</div>
      <div class="inf-foot">${x.min_price != null ? `<span><span class="small muted">dès</span> <span class="inf-price">${fcfa(x.min_price)} F</span></span>` : `<span class="small" style="font-weight:600">Demander le prix</span>`}
        <span class="small muted">${x.accepting ? "Disponible" : "Complet"}</span></div></div></a>`;
  const draw = () => {
    const q = f.q.toLowerCase(), max = Number(f.max) || 0;
    const rows = list.filter((x) => (!f.nets.length || (x.networks || []).some((n) => f.nets.includes(n.network))) && (!f.cats.length || (x.categories || []).some((c) => f.cats.includes(c)))
      && (!q || (x.name + " " + (x.city || "")).toLowerCase().includes(q)) && (!max || (x.min_price != null && x.min_price <= max)));
    $("#inf-count").textContent = rows.length + " créateur" + (rows.length > 1 ? "s" : "");
    $("#inf-grid").innerHTML = rows.length ? rows.map(card).join("") : `<div class="empty">Aucun créateur ne correspond. Essayez un autre filtre.</div>`;
  };
  bindChips($("#if-net"), f.nets, draw);
  bindChips($("#if-cat"), f.cats, draw);
  $("#if-q").oninput = (e) => { f.q = e.target.value; draw(); };
  if ($("#if-max")) $("#if-max").oninput = (e) => { f.max = e.target.value; draw(); };
  $("#inf-f").onsubmit = (e) => e.preventDefault();
  draw();
}

/* ---------- Demande de prix (visiteur) ---------- */
function infPriceModal(p, pkg) {
  openModal(`<h2 style="margin:0">Demander le prix</h2>
    <p class="muted small" style="margin:0">${esc(p.name)}${pkg ? " · " + esc(pkg.title) : ""}. L'équipe StatuPub vous rappelle avec le tarif, généralement le jour même.</p>
    <form id="pr-f" class="stack">
      <label>Entreprise<input id="pr-co" required maxlength="100"></label>
      <label>Votre nom<input id="pr-nm" maxlength="80"></label>
      <div class="grid g2"><label>Téléphone / WhatsApp<input id="pr-ph" type="tel" required></label><label>E-mail<input id="pr-em" type="email"></label></div>
      <label>Votre besoin (facultatif)<textarea id="pr-ms" rows="3" maxlength="600" placeholder="Produit, période, budget…"></textarea></label>
      <div class="row"><button class="btn btn-primary" type="submit">Envoyer ma demande</button><button class="btn btn-ghost" type="button" data-close>Annuler</button></div>
      <p class="small muted" style="margin:0">Vous avez une entreprise ? <a href="#/inscription?role=annonceur">Créez votre compte marque</a> pour voir tous les prix.</p>
    </form>`, (m) => {
    $("#pr-f", m).onsubmit = async (e) => {
      e.preventDefault(); const b = e.submitter; busy(b, true);
      try {
        await rpc("inf_request_price", { p_influencer: p.id, p_package: pkg?.id || null, p_company: $("#pr-co", m).value, p_name: $("#pr-nm", m).value,
          p_phone: $("#pr-ph", m).value, p_email: $("#pr-em", m).value, p_message: $("#pr-ms", m).value });
        closeModal(); toast("Demande envoyée. Nous vous rappelons très vite.");
      } catch (err) { toast(errMsg(err), true); busy(b, false); }
    };
  });
}

/* ---------- Profil public d'un créateur ---------- */
async function viewInfProfile(slug) {
  app.innerHTML = `<div class="spinner"></div>`;
  const p = await rpc("inf_profile", { p_slug: slug });
  if (!p) { app.innerHTML = `<main class="wrap"><div class="empty">Ce créateur n'existe pas ou n'est plus visible. <a href="#/influence">Voir tous les créateurs</a></div></main>`; return; }
  const brand = isBrandUser() ? await sb.from("brands").select("id, company, verified_at, terms_accepted_at").eq("id", state.session.user.id).maybeSingle().then((r) => r.data) : null;
  const wallet = brand ? await rpc("annonceur_wallet").then((r) => r[0]).catch(() => null) : null;
  const pk = (p.packages || []);
  const busySet = new Set(p.busy || []);
  const days = []; for (let i = 0; i < 21; i++) { const d = new Date(); d.setDate(d.getDate() + i); days.push(d); }
  const aud = (a) => { if (!a || typeof a !== "object") return ""; const t = Object.entries(a).filter(([, v]) => v !== "" && v != null); return t.length ? `<div class="small muted">${t.map(([k, v]) => `${esc(k)} : ${esc(v)}`).join(" · ")}</div>` : ""; };
  const reach = (p.networks || []).reduce((s, n) => s + (Number(n.followers) || 0), 0);
  app.innerHTML = `<div class="inf-pro" style="--c:${esc(p.color)}">
    <div class="inf-banner" style="${infCoverStyle(p.color, p.banner)}"></div>
    <main class="wrap" style="padding-bottom:48px"><div class="inf-layout">
      <div class="inf-main">
        <section class="card stack" style="gap:14px">
          <div class="row" style="gap:18px;align-items:flex-end;flex-wrap:wrap">${infAva(p.avatar, p.name, "lg")}
            <div class="stack" style="gap:6px;flex:1;min-width:220px"><div class="row" style="gap:10px;flex-wrap:wrap"><h1 style="margin:0;font-size:2rem">${esc(p.name)}</h1>${p.status === "verified" || p.status === "certified" ? infBadge(p.certified) : `<span class="inf-status" style="background:#FFF1DB;color:#7A4E0C">Aperçu · profil non publié</span>`}</div>
              <div class="muted">${esc([p.city, COUNTRIES?.[p.country]?.name || p.country].filter(Boolean).join(", "))}${(p.languages || []).length ? " · " + esc(p.languages.join(", ")) : ""}</div>
              <div class="row" style="gap:6px;flex-wrap:wrap">${(p.categories || []).map((c) => `<span class="inf-net">${esc(c)}</span>`).join("")}</div>
              ${(p.networks || []).length ? `<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:4px">${p.networks.map(socBtn).join("")}</div>` : ""}</div></div>
          <div class="grid g4">
            <div class="kpi"><span class="eyebrow">Audience totale</span><span class="num">${kfmt(reach)}</span></div>
            <div class="kpi"><span class="eyebrow">Note</span><span class="num">${p.reviews_count ? Number(p.rating).toFixed(1) + " ★" : "—"}</span><span class="small muted">${p.reviews_count} avis</span></div>
            <div class="kpi"><span class="eyebrow">Campagnes</span><span class="num">${p.jobs || 0}</span><span class="small muted">réalisées</span></div>
            <div class="kpi"><span class="eyebrow">Statut</span><span class="num" style="font-size:1.1rem">${p.accepting ? "Disponible" : "Complet"}</span></div>
          </div>
          ${p.bio ? `<p style="margin:0;line-height:1.6">${esc(p.bio)}</p>` : ""}
        </section>
        <section class="card stack"><h2 style="margin:0">Réseaux et statistiques</h2>
          ${(p.networks || []).length ? (p.networks || []).map((n) => `<div class="inf-req">${socBtn(n)}
            <div style="flex:1;min-width:180px"><b>${INF_NETS[n.network] || n.network}</b> · ${netUrl(n) ? `<a href="${esc(netUrl(n))}" target="_blank" rel="noopener">${esc(n.handle || "Voir le compte")}</a>` : esc(n.handle || "")}${aud(n.audience)}</div>
            <div class="row" style="gap:20px"><div><b>${kfmt(n.followers)}</b><div class="small muted">abonnés</div></div>${n.avg_views ? `<div><b>${kfmt(n.avg_views)}</b><div class="small muted">vues moy.</div></div>` : ""}${n.engagement != null ? `<div><b>${String(n.engagement).replace(".", ",")} %</b><div class="small muted">engagement</div></div>` : ""}</div>
            ${n.verified ? `<span class="inf-badge v">✓ Chiffres vérifiés</span>` : `<span class="small muted">Vérification en cours</span>`}</div>`).join("") : `<p class="muted">Statistiques bientôt disponibles.</p>`}
        </section>
        <section class="card stack"><h2 style="margin:0">Formules</h2>
          ${pk.length ? pk.map((x) => `<div class="inf-req"><div style="flex:1;min-width:200px"><b>${esc(x.title)}</b> ${pkNets(x)}${x.description ? `<p class="small muted" style="margin:4px 0 0">${esc(x.description)}</p>` : ""}</div>
            ${x.on_request ? `<span class="small" style="font-weight:600">Prix sur demande</span>` : x.price != null ? `<span class="inf-price">${fcfa(x.price)} F</span>` : `<button class="btn btn-ghost btn-sm" data-ask="${esc(x.id)}">Demander le prix</button>`}</div>`).join("") : `<p class="muted">Ce créateur n'a pas encore publié de formules. Faites-lui une offre.</p>`}
          ${!p.can_see_prices ? `<p class="small muted" style="margin:0">Les prix sont visibles par les marques inscrites. <a href="#/inscription?role=annonceur">Créer mon compte marque</a></p>` : ""}
        </section>
        <section class="card stack"><h2 style="margin:0">Avis des marques</h2>
          ${(p.reviews || []).length ? p.reviews.map((r) => `<div style="border-top:1px solid var(--line);padding-top:12px"><div class="row between"><b>${esc(r.company || "Marque")}</b>${stars(r.rating)}</div>${r.body ? `<p style="margin:6px 0 0">« ${esc(r.body)} »</p>` : ""}${r.reply ? `<p class="small muted" style="margin:6px 0 0">Réponse du créateur : ${esc(r.reply)}</p>` : ""}</div>`).join("") : `<p class="muted">Pas encore d'avis. Seules les marques qui ont réservé peuvent noter.</p>`}
        </section>
      </div>
      <aside class="inf-aside"><div class="card stack" id="inf-book" style="gap:14px"></div></aside>
    </div></main></div>`;
  app.querySelectorAll("[data-ask]").forEach((b) => b.onclick = () => infPriceModal(p, pk.find((x) => x.id === b.dataset.ask)));
  const box = $("#inf-book");
  const dayStrip = `<div class="stack" style="gap:6px"><b class="small">Disponibilités (3 semaines)</b><div class="inf-days">${days.map((d) => { const k = d.toISOString().slice(0, 10); return `<span class="${busySet.has(k) ? "busy" : ""}" title="${busySet.has(k) ? "Déjà réservé" : "Libre"}">${d.getDate()}</span>`; }).join("")}</div></div>`;
  if (state.profile?.role === "createur" || state.profile?.role === "diffuseur") {
    box.innerHTML = `<h2 style="margin:0">Réserver ${esc(p.name)}</h2>${dayStrip}<p class="small muted" style="margin:0">Les réservations sont réservées aux comptes marque.</p>`; return;
  }
  if (!isBrandUser()) {
    box.innerHTML = `<h2 style="margin:0">Travailler avec ${esc(p.name)}</h2>${dayStrip}
      <a class="btn btn-primary" href="#/inscription?role=annonceur">Créer mon compte marque</a>
      <a class="btn btn-ghost" href="#/connexion">J'ai déjà un compte</a>
      <button class="btn btn-ghost" id="ib-ask">Demander le prix</button>
      <p class="small muted" style="margin:0">Paiement sécurisé : le créateur est payé après la publication.</p>`;
    $("#ib-ask").onclick = () => infPriceModal(p, null);
    if (!state.profile) { try { sessionStorage.setItem("sp_after", location.hash); } catch {} }
    return;
  }
  if (!brand) {
    box.innerHTML = `<h2 style="margin:0">Une dernière étape</h2><p class="muted small" style="margin:0">Complétez votre fiche entreprise (nom, NINEA) pour réserver des créateurs.</p>
      <a class="btn btn-primary" href="#/marque">Compléter ma fiche entreprise</a>${dayStrip}`;
    try { sessionStorage.setItem("sp_inf_back", location.hash); } catch {}
    return;
  }
  const bookable = pk.filter((x) => !x.on_request && x.price > 0);
  const min = new Date(); min.setDate(min.getDate() + 2); const minS = min.toISOString().slice(0, 10);
  box.innerHTML = `<h2 style="margin:0">Réserver ${esc(p.name)}</h2>
    ${!p.accepting ? `<div class="notice warn small"><span>Ce créateur ne prend pas de nouvelles campagnes pour le moment.</span></div>` : ""}
    <div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="${bookable.length ? "true" : "false"}" data-k="booking" ${bookable.length ? "" : "disabled"}>Réserver</button><button class="tab" role="tab" aria-selected="${bookable.length ? "false" : "true"}" data-k="offer">Faire une offre</button></div>
    <form id="ib-f" class="stack" style="gap:12px">
      <label id="ib-pk-l">Formule<select id="ib-pk">${bookable.map((x) => `<option value="${esc(x.id)}" data-price="${x.price}">${esc(x.title)} · ${fcfa(x.price)} F</option>`).join("")}${pk.filter((x) => x.on_request).map((x) => `<option value="${esc(x.id)}" data-price="0" data-req="1">${esc(x.title)} · sur demande</option>`).join("")}</select></label>
      <label id="ib-of-l" hidden>Votre offre (F)<input id="ib-of" type="number" min="1000" step="1000" placeholder="Ex. : 150000"></label>
      <label>Produit ou marque à promouvoir<input id="ib-prod" maxlength="120" required></label>
      <label>Brief pour le créateur<textarea id="ib-brief" rows="4" minlength="20" maxlength="3000" required placeholder="Ce que vous voulez montrer, le message clé, ce qu'il faut éviter…"></textarea></label>
      <label>Lien à mettre (facultatif)<input id="ib-link" type="url" placeholder="https://"></label>
      <label>Date de publication souhaitée<input id="ib-date" type="date" min="${minS}"></label>
      <label class="row" style="gap:8px;font-weight:500"><input type="checkbox" id="ib-val" checked style="width:auto"> Je veux valider la vidéo avant publication</label>
      ${!brand.terms_accepted_at ? `<label class="row small" style="gap:8px;font-weight:500"><input type="checkbox" id="ib-terms" required style="width:auto"> J'accepte les <a href="#/conditions-influence" target="_blank">conditions de l'Espace Pub Influenceur</a></label>` : ""}
      <div class="stack small" style="gap:4px;border-top:1px solid var(--line);padding-top:10px" id="ib-sum"></div>
      <button class="btn btn-primary" type="submit" ${p.accepting ? "" : "disabled"}>Envoyer la demande</button>
      <p class="small muted" style="margin:0">Le créateur a ${state.settings?.inf_accept_hours || 48} h pour accepter. Sinon, vous êtes remboursé automatiquement.</p>
    </form>${dayStrip}`;
  let kind = bookable.length ? "booking" : "offer";
  const price = () => kind === "offer" ? Number($("#ib-of").value) || 0 : Number($("#ib-pk").selectedOptions[0]?.dataset.price) || 0;
  const sum = () => {
    const pr = price(), bf = Math.round(pr * fees().b), tot = pr + bf, av = Number(wallet?.available) || 0;
    $("#ib-sum").innerHTML = `<div class="row between"><span>Prix du créateur</span><b>${fcfa(pr)} F</b></div><div class="row between"><span>Frais de service (${Math.round(fees().b * 100)} %)</span><b>${fcfa(bf)} F</b></div>
      <div class="row between" style="font-size:1rem"><span>Total</span><b>${fcfa(tot)} F</b></div><div class="row between muted"><span>Votre solde</span><span>${fcfa(av)} F</span></div>
      ${tot > av ? `<div class="notice warn small"><span>Solde insuffisant. <button type="button" class="btn btn-ink btn-sm" id="ib-rc">Recharger</button></span></div>` : ""}`;
    $("#ib-rc")?.addEventListener("click", rechargeModal);
  };
  const setKind = (k) => {
    kind = k; box.querySelectorAll("[data-k]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.k === k)));
    $("#ib-of-l").hidden = k !== "offer";
    const sel = $("#ib-pk"); sel.required = k === "booking";
    if (k === "offer" && !sel.querySelector('option[value=""]')) sel.insertAdjacentHTML("afterbegin", `<option value="">Offre libre (sans formule)</option>`);
    if (k === "booking") { sel.querySelector('option[value=""]')?.remove(); sel.querySelectorAll("[data-req]").forEach((o) => o.disabled = true); if (sel.selectedOptions[0]?.dataset.req) sel.value = bookable[0]?.id || ""; }
    else sel.querySelectorAll("[data-req]").forEach((o) => o.disabled = false);
    $("#ib-pk-l").hidden = !pk.length;
    sum();
  };
  box.querySelectorAll("[data-k]").forEach((b) => b.onclick = () => setKind(b.dataset.k));
  $("#ib-pk").onchange = sum; $("#ib-of").oninput = sum;
  setKind(kind);
  $("#ib-f").onsubmit = async (e) => {
    e.preventDefault(); const b = e.submitter; busy(b, true);
    try {
      if ($("#ib-terms")?.checked) await rpc("inf_accept_terms");
      await rpc("inf_book", { p_influencer: p.id, p_package: $("#ib-pk").value || null, p_kind: kind, p_offer: kind === "offer" ? price() : null,
        p_product: $("#ib-prod").value, p_brief: $("#ib-brief").value, p_link: $("#ib-link").value.trim(), p_date: $("#ib-date").value || null, p_validation: $("#ib-val").checked });
      toast("Demande envoyée à " + p.name + " !"); location.hash = "#/marque";
    } catch (err) { toast(errMsg(err), true); busy(b, false); }
  };
}

/* ---------- Invitation créateur ---------- */
const infCode = () => { try { return localStorage.getItem("sp_inv") || ""; } catch { return ""; } };
const infCodeClear = () => { try { localStorage.removeItem("sp_inv"); } catch {} };
/* Appelé par route() : relie le compte au profil créateur si un code est en attente. Renvoie true si la route est prise en charge. */
async function infTryClaim() {
  const code = infCode(); const role = state.profile?.role;
  if (!code || !state.profile || role === "createur") { if (role === "createur") infCodeClear(); return false; }
  if (role === "admin" || role === "annonceur") { infCodeClear(); toast(role === "annonceur" ? "Ce compte est un compte annonceur. Crée ton compte créateur avec une autre adresse e-mail." : "Code d'invitation ignoré pour le compte admin.", true); return false; }
  try { await rpc("inf_claim", { p_code: code }); infCodeClear(); const { data } = await sb.from("profiles").select("*").eq("id", state.session.user.id).maybeSingle(); state.profile = data;
    toast("Bienvenue dans l'Espace Pub Influenceur !"); location.hash = "#/createur?t=profil"; return true; }
  catch (e) { infCodeClear(); toast(errMsg(e), true); return false; }
}
function viewInfInvite(code) {
  code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code) { try { localStorage.setItem("sp_inv", code); } catch {} }
  if (state.profile) { infTryClaim().then((ok) => { if (!ok) location.hash = "#/" + state.profile.role; }); return; }
  app.innerHTML = `<div class="inf-pro"><section class="inf-hero"><div class="wrap stack" style="gap:16px">
    <span class="inf-kicker">Invitation · Espace Pub Influenceur</span>
    <h1>Bienvenue parmi les créateurs StatuPub.</h1>
    <p>Crée ton compte créateur : ton profil, tes formules et tes prix. Les marques te réservent, tu es payé après chaque publication vérifiée. Tu gardes ${Math.round((1 - fees().c) * 100)} % de ton prix.</p>
  </div></section>
  <main class="wrap" style="max-width:520px;margin-top:-56px;padding-bottom:48px"><div class="card stack">
    <div class="tabs" role="tablist"><button class="tab" role="tab" aria-selected="true" data-m="up">Créer mon compte</button><button class="tab" role="tab" aria-selected="false" data-m="in">J'ai déjà un compte</button></div>
    <form id="iv-f" class="stack">
      <div id="iv-up" class="stack">
        <label>Nom de créateur<input id="iv-name" required minlength="2" maxlength="60"></label>
        <label>Téléphone / WhatsApp<input id="iv-phone" type="tel" required></label>
        <label>Pays<select id="iv-country">${countryOptions("SN")}</select></label>
      </div>
      <label>E-mail<input id="iv-email" type="email" required autocomplete="email"></label>
      <label>Mot de passe<input id="iv-pw" type="password" required minlength="6" autocomplete="new-password"></label>
      <p class="small muted" style="margin:0">Code d'invitation : <b>${esc(code || "—")}</b></p>
      <button class="btn btn-primary" type="submit">Continuer</button>
    </form></div></main></div>`;
  let mode = "up";
  app.querySelectorAll("[data-m]").forEach((b) => b.onclick = () => { mode = b.dataset.m; app.querySelectorAll("[data-m]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    $("#iv-up").hidden = mode !== "up"; $("#iv-up").querySelectorAll("input").forEach((i) => i.required = mode === "up"); $("#iv-pw").autocomplete = mode === "up" ? "new-password" : "current-password"; });
  $("#iv-f").onsubmit = async (e) => {
    e.preventDefault(); const b = e.submitter; busy(b, true);
    const email = $("#iv-email").value.trim(), password = $("#iv-pw").value;
    try {
      if (mode === "in") { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; return; }
      const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname,
        data: { role: "diffuseur", full_name: $("#iv-name").value.trim(), phone: $("#iv-phone").value.trim(), country: $("#iv-country").value } } });
      if (error) throw error;
      if (!data.session) { app.innerHTML = `<main class="wrap" style="max-width:560px"><div class="card stack"><h1 style="font-size:1.6rem;margin:0">Vérifie ta boîte e-mail</h1><p>Nous avons envoyé un lien à <b>${esc(email)}</b>. Clique dessus pour activer ton compte créateur. Ton invitation est gardée sur cet appareil.</p></div></main>`; }
    } catch (err) { toast(errMsg(err), true); busy(b, false); }
  };
}

/* ---------- Espace créateur (ou profil géré par l'admin quand CR.inf est défini) ---------- */
const CR = { inf: null };
const crA = (o = {}) => CR.inf ? { ...o, p_inf: CR.inf } : o;
const crHash = (t) => (CR.inf ? `#/admin/createur/${CR.inf}?t=` : "#/createur?t=") + t;
const crGo = (t) => { const h = crHash(t); if (location.hash === h) viewCreateur(t, CR.inf); else location.hash = h; };
async function viewCreateur(tab = "demandes", infId = null) {
  CR.inf = infId || null;
  app.innerHTML = `<div class="spinner"></div>`;
  const [me, bk, w] = await Promise.all([CR.inf ? sb.from("influencers").select("*").eq("id", CR.inf).maybeSingle().then((r) => r.data) : rpc("inf_mine"), rpc("inf_my_bookings", crA()), rpc("inf_creator_wallet", crA())]);
  if (!me?.id) { app.innerHTML = `<main class="wrap"><div class="empty">Profil créateur introuvable. Contacte StatuPub.</div></main>`; return; }
  bk.forEach((x) => infBk.set(x.id, x));
  const req = bk.filter((x) => x.status === "awaiting_creator");
  const unread = bk.reduce((s, x) => s + Number(x.unread || 0), 0);
  const live = bk.filter((x) => ["accepted", "changes_requested", "content_submitted", "content_approved", "published"].includes(x.status));
  const tabs = [["demandes", "Demandes", req.length], ["campagnes", "Campagnes", live.filter((x) => ["accepted", "changes_requested", "content_approved"].includes(x.status)).length], ["profil", "Mon profil"], ["reseaux", "Réseaux"], ["formules", "Formules"], ["gains", "Gains"]];
  const visible = me.status === "verified" || me.status === "certified";
  app.innerHTML = `<main class="wrap">
    ${CR.inf ? `<div class="notice info" style="margin-bottom:16px;flex-wrap:wrap"><div style="flex:1;min-width:240px"><b>Profil géré par StatuPub</b><p class="small muted">Tu remplis et gères ce profil à la place du créateur : profil, réseaux, formules, réponses aux marques, envoi des vidéos. ${me.user_id ? "Le créateur a aussi accès à son compte." : "Le créateur n'a pas encore de compte."}</p></div>
      <div class="row" style="gap:6px;flex-wrap:wrap"><a class="btn btn-ghost btn-sm" href="#/admin?t=influence&s=createurs">← Tous les créateurs</a>
        ${me.status !== "verified" ? `<button class="btn btn-ink btn-sm" data-adst="verified">Publier (vérifié)</button>` : ""}${me.status !== "certified" ? `<button class="btn btn-primary btn-sm" data-adst="certified">Publier (certifié)</button>` : ""}${["verified", "certified"].includes(me.status) ? `<button class="btn btn-ghost btn-sm" data-adst="hidden">Masquer</button>` : ""}
        ${!me.user_id ? `<button class="btn btn-ok btn-sm" id="ad-acc">Donner l'accès au créateur</button>` : ""}</div></div>` : ""}
    <div class="page-head"><div class="row" style="gap:14px">${infAva(me.avatar_url, me.display_name)}<div><p class="eyebrow">${CR.inf ? "Profil géré · statut : " + esc(me.status) : "Espace créateur"}</p><h1 style="font-size:2rem;margin:0">${esc(me.display_name)}</h1></div></div>
      <div class="row"><a class="btn btn-ghost btn-sm" href="#/messages">💬 Messages${unread ? ` (${unread})` : ""}</a><a class="btn btn-ghost btn-sm" href="#/influence/${esc(me.slug)}">${CR.inf ? "Voir le profil public" : "Voir mon profil public"}</a></div></div>
    ${!me.terms_accepted_at ? `<div class="notice warn" style="margin-bottom:16px"><div><b>${CR.inf ? "Charte créateur non acceptée" : "Accepte la charte créateur"}</b><p class="small muted">${CR.inf ? "Confirme que le créateur a donné son accord (à l'oral ou sur WhatsApp) avant d'accepter une campagne pour lui." : "Obligatoire avant d'accepter ta première campagne."}</p></div><button class="btn btn-ink btn-sm" id="cr-terms">${CR.inf ? "Le créateur est d'accord" : "Lire et accepter"}</button></div>` : ""}
    ${!visible && !CR.inf ? `<div class="notice ${me.status === "rejected" ? "warn" : "info"}" style="margin-bottom:16px"><div><b>${me.status === "pending" ? "Profil en vérification" : me.status === "hidden" ? "Profil masqué" : "Profil refusé"}</b><p class="small muted">${me.status === "pending" ? "Complète ton profil, tes réseaux (avec captures de statistiques) et au moins une formule. StatuPub vérifie et publie ton profil." : "Contacte StatuPub pour en savoir plus."}</p></div></div>` : ""}
    <div class="grid g4" style="margin-bottom:20px">
      <div class="card kpi"><span class="eyebrow">En cours</span><div>${money(w.pending)}</div><span class="small muted">campagnes acceptées</span></div>
      <div class="card kpi"><span class="eyebrow">À recevoir</span><div>${money(w.payable)}</div><span class="small muted">versé ${state.settings?.inf_payout_hours || 72} h après vérification</span></div>
      <div class="card kpi"><span class="eyebrow">Reçu ce mois</span><div>${money(w.paid_month)}</div></div>
      <div class="card kpi"><span class="eyebrow">Total reçu</span><div>${money(w.paid)}</div></div>
    </div>
    <div class="tabs" role="tablist">${tabs.map(([k, l, n]) => `<button class="tab" role="tab" aria-selected="${k === tab}" data-t="${k}">${l}${n ? `<span class="count">${n}</span>` : ""}</button>`).join("")}</div>
    <div id="cr-body" class="stack" style="margin-top:20px"></div></main>`;
  app.querySelectorAll("[data-t]").forEach((b) => b.onclick = () => location.hash = crHash(b.dataset.t));
  $("#cr-terms")?.addEventListener("click", () => CR.inf ? infTermsModal("creator", () => viewCreateur(tab, CR.inf)) : infTermsModal("creator", () => viewCreateur(tab)));
  app.querySelectorAll("[data-adst]").forEach((b) => b.onclick = async () => { busy(b, true); try { await rpc("inf_admin_set_status", { p_id: me.id, p_status: b.dataset.adst }); toast("Statut mis à jour"); viewCreateur(tab, CR.inf); } catch (e) { toast(errMsg(e), true); busy(b, false); } });
  $("#ad-acc")?.addEventListener("click", async () => { try { const c = await rpc("inf_admin_new_code", { p_id: me.id }); inviteLink(c, me.display_name); } catch (e) { toast(errMsg(e), true); } });
  const body = $("#cr-body"); const reload = () => viewCreateur(tab, CR.inf);
  const fn = { demandes: crRequests, campagnes: crCampaigns, profil: crProfile, reseaux: crNetworks, formules: crPackages, gains: crGains }[tab] || crRequests;
  try { await fn(body, { me, bk, req, live, reload, admin: !!CR.inf }); } catch (e) { body.innerHTML = `<div class="notice warn">${esc(errMsg(e))}</div>`; }
}
const bkInfo = (x, side) => `<div style="flex:1;min-width:240px" class="stack small">
  <div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-size:1rem">${esc(side === "brand" ? x.influencer_name : x.brand_company || "Marque")}</b>${infSt(x.status)}${x.kind === "offer" ? `<span class="inf-net">Offre</span>` : ""}</div>
  <div><b>${esc(x.package_title || "")}</b>${x.product ? " · " + esc(x.product) : ""}${x.publish_date ? " · publication le " + new Date(x.publish_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : ""}</div>
  ${x.brief ? `<details><summary>Brief</summary><p style="white-space:pre-wrap;margin:6px 0 0">${esc(x.brief)}</p></details>` : ""}
  ${x.link ? `<div>Lien : <a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.link)}</a></div>` : ""}
  ${x.brand_comment ? `<div class="notice warn small"><span>Commentaire de la marque : ${esc(x.brand_comment)}</span></div>` : ""}
  ${x.post_url ? `<div>Publication : <a href="${esc(x.post_url)}" target="_blank" rel="noopener">voir</a></div>` : ""}${bkLinks(x)}</div>`;
async function crRequests(body, { req, me }) {
  body.innerHTML = req.length ? req.map((x) => `<div class="card inf-req">${bkInfo(x, "creator")}
    <div class="stack" style="gap:8px;align-items:flex-end"><div><span class="small muted">Pour toi</span> <span class="inf-price">${fcfa(x.net)} F</span></div>
      <span class="small muted">Réponds avant le ${dateTimeFr(x.expires_at)}</span>
      <div class="row"><button class="btn btn-ghost btn-sm" data-no="${x.id}">Refuser</button><button class="btn btn-ok btn-sm" data-yes="${x.id}">Accepter</button></div></div></div>`).join("")
    : `<div class="empty">Aucune demande en attente. Les nouvelles réservations arrivent ici (et en notification).</div>`;
  body.querySelectorAll("[data-yes]").forEach((b) => b.onclick = async () => {
    if (!me.terms_accepted_at) { if (CR.inf) return toast("Clique d'abord « Le créateur est d'accord » en haut de la page", true); return infTermsModal("creator", () => viewCreateur("demandes")); }
    busy(b, true);
    try { await rpc("inf_respond", crA({ p_id: b.dataset.yes, p_accept: true })); toast("Campagne acceptée. Au travail !"); crGo("campagnes"); } catch (e) { toast(errMsg(e), true); busy(b, false); } });
  body.querySelectorAll("[data-no]").forEach((b) => b.onclick = () => openModal(`<h2 style="margin:0">Refuser la demande</h2><p class="small muted" style="margin:0">La marque est remboursée intégralement.</p>
    <label>Raison (facultatif)<textarea id="rf-r" rows="3" maxlength="300" placeholder="Ex. : pas disponible à cette date"></textarea></label>
    <div class="row"><button class="btn btn-bad" id="rf-go">Refuser</button><button class="btn btn-ghost" data-close>Annuler</button></div>`, (m) => {
    $("#rf-go", m).onclick = async (e) => { busy(e.target, true); try { await rpc("inf_respond", crA({ p_id: b.dataset.no, p_accept: false, p_reason: $("#rf-r", m).value })); closeModal(); toast("Demande refusée."); crGo("demandes"); } catch (err) { toast(errMsg(err), true); busy(e.target, false); } };
  }));
}
async function crCampaigns(body, { live, bk }) {
  const done = bk.filter((x) => ["verified", "paid_out", "disputed"].includes(x.status));
  const act = (x) => {
    if (x.status === "accepted" || x.status === "changes_requested") return `<button class="btn btn-primary btn-sm" data-send="${x.id}">Envoyer la vidéo</button>`;
    if (x.status === "content_submitted") return `<span class="small muted">En attente de validation par la marque (auto-validée après ${state.settings?.inf_validate_hours || 48} h)</span>`;
    if (x.status === "content_approved") return `<button class="btn btn-ok btn-sm" data-pub="${x.id}">J'ai publié : ajouter le lien</button>`;
    if (x.status === "published") return `<span class="small muted">StatuPub vérifie la publication. Garde-la en ligne au moins 30 jours.</span>`;
    return "";
  };
  body.innerHTML = `${live.length ? live.map((x) => `<div class="card inf-req">${bkInfo(x, "creator")}<div class="stack" style="gap:8px;align-items:flex-end"><span class="inf-price">${fcfa(x.net)} F</span>${act(x)}</div></div>`).join("") : `<div class="empty">Aucune campagne en cours.</div>`}
    <div class="notice info small"><span>Rappel : mention <b>#pub</b> ou « partenariat rémunéré » obligatoire. La publication doit rester en ligne au moins 30 jours.</span></div>
    ${done.length ? `<h2>Terminées</h2>${done.map((x) => `<div class="card inf-req">${bkInfo(x, "creator")}<span class="inf-price">${fcfa(x.net)} F</span></div>`).join("")}` : ""}`;
  body.querySelectorAll("[data-send]").forEach((b) => b.onclick = () => openModal(`<h2 style="margin:0">Envoyer la vidéo</h2>
    <p class="small muted" style="margin:0">Envoie le fichier (200 Mo max) ou un lien (Google Drive, WeTransfer…). La marque la regarde avant publication.</p>
    <label>Fichier vidéo ou image<input id="sv-file" type="file" accept="video/*,image/*"></label>
    <label>Ou lien<input id="sv-link" type="url" placeholder="https://"></label>
    <label>Note pour la marque (facultatif)<textarea id="sv-note" rows="2" maxlength="600"></textarea></label>
    <div class="row"><button class="btn btn-primary" id="sv-go">Envoyer</button><button class="btn btn-ghost" data-close>Annuler</button></div>`, (m) => {
    $("#sv-go", m).onclick = async (e) => {
      const btn = e.target; const f = $("#sv-file", m).files[0]; let url = $("#sv-link", m).value.trim();
      if (!f && !/^https?:\/\//i.test(url)) return toast("Ajoute la vidéo ou un lien https://", true);
      if (f && f.size > 200 * 1024 * 1024) return toast("Fichier trop lourd (200 Mo max). Envoie plutôt un lien.", true);
      busy(btn, true);
      try { if (f) { btn.textContent = "Envoi du fichier…"; url = await infUpload("influence-content", `${b.dataset.send}/${Date.now()}.${extOf(f)}`, f); }
        await rpc("inf_submit_content", crA({ p_id: b.dataset.send, p_url: url, p_note: $("#sv-note", m).value })); closeModal(); toast("Vidéo envoyée à la marque."); crGo("campagnes"); }
      catch (err) { toast(errMsg(err), true); busy(btn, false); }
    };
  }));
  body.querySelectorAll("[data-pub]").forEach((b) => b.onclick = () => openModal(`<h2 style="margin:0">Lien de la publication</h2>
    <label>Lien du post (TikTok, Instagram…)<input id="pb-url" type="url" placeholder="https://" required></label>
    <div class="row"><button class="btn btn-ok" id="pb-go">Confirmer</button><button class="btn btn-ghost" data-close>Annuler</button></div>`, (m) => {
    $("#pb-go", m).onclick = async (e) => { busy(e.target, true); try { await rpc("inf_mark_published", crA({ p_id: b.dataset.pub, p_post_url: $("#pb-url", m).value.trim() })); closeModal(); toast(CR.inf ? "Publication enregistrée. Vérifie-la dans Réservations." : "Publication enregistrée. StatuPub vérifie et lance ton paiement."); crGo("campagnes"); } catch (err) { toast(errMsg(err), true); busy(e.target, false); } };
  }));
}
/* Recadrage d'image : glisser pour déplacer, zoom avec le curseur (ou la molette). Renvoie un Blob JPEG ou null. */
function infCrop(file, { ratio = 1, outW = 600, round = false, title = "Recadrer l'image" } = {}) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); toast("Image illisible. Essaie un autre fichier (JPG ou PNG).", true); resolve(null); };
    img.onload = () => {
      let done = false; const finish = (v) => { if (done) return; done = true; URL.revokeObjectURL(url); resolve(v); };
      openModal(`<h2 style="margin:0">${esc(title)}</h2><p class="small muted" style="margin:0">Fais glisser l'image pour la placer, utilise le curseur pour zoomer.</p>
        <div id="cr-wrap" style="position:relative;width:100%;max-width:560px;margin:0 auto;touch-action:none;cursor:grab;border-radius:12px;overflow:hidden;background:#111">
          <canvas id="cr-cv" style="display:block;width:100%"></canvas>
          ${round ? `<div style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at center,transparent 0,transparent 49.5%,rgba(0,0,0,.55) 50%)"></div>` : ""}
          <div style="position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 2px rgba(255,255,255,.7);border-radius:12px"></div></div>
        <label class="small" style="font-weight:600">Zoom<input id="cr-z" type="range" min="1" max="4" step="0.01" value="1"></label>
        <div class="row"><button class="btn btn-primary" id="cr-ok">Valider</button><button class="btn btn-ghost" id="cr-c">Centrer</button><button class="btn btn-ghost" id="cr-x">Annuler</button></div>`, (m) => {
        const cv = $("#cr-cv", m), wrap = $("#cr-wrap", m), ctx = cv.getContext("2d");
        const W = Math.min(560, wrap.clientWidth || 560), H = Math.round(W / ratio), dpr = window.devicePixelRatio || 1;
        cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const base = Math.max(W / img.width, H / img.height); let z = 1, x = 0, y = 0;
        const clamp = () => { const s = base * z, iw = img.width * s, ih = img.height * s; x = Math.min(0, Math.max(W - iw, x)); y = Math.min(0, Math.max(H - ih, y)); };
        const center = () => { const s = base * z; x = (W - img.width * s) / 2; y = (H - img.height * s) / 2; clamp(); };
        const draw = () => { ctx.fillStyle = "#111"; ctx.fillRect(0, 0, W, H); const s = base * z; ctx.drawImage(img, x, y, img.width * s, img.height * s); };
        const zoomTo = (nz, cx = W / 2, cy = H / 2) => { nz = Math.max(1, Math.min(4, nz)); const k = nz / z; x = cx - (cx - x) * k; y = cy - (cy - y) * k; z = nz; clamp(); draw(); $("#cr-z", m).value = z; };
        center(); draw();
        let drag = null;
        wrap.onpointerdown = (e) => { drag = { px: e.clientX, py: e.clientY, x, y }; wrap.setPointerCapture(e.pointerId); wrap.style.cursor = "grabbing"; };
        wrap.onpointermove = (e) => { if (!drag) return; const r = W / wrap.clientWidth; x = drag.x + (e.clientX - drag.px) * r; y = drag.y + (e.clientY - drag.py) * r; clamp(); draw(); };
        wrap.onpointerup = wrap.onpointercancel = () => { drag = null; wrap.style.cursor = "grab"; };
        wrap.onwheel = (e) => { e.preventDefault(); const rc = wrap.getBoundingClientRect(), r = W / rc.width; zoomTo(z * (e.deltaY < 0 ? 1.08 : 0.92), (e.clientX - rc.left) * r, (e.clientY - rc.top) * r); };
        $("#cr-z", m).oninput = (e) => zoomTo(Number(e.target.value));
        $("#cr-c", m).onclick = () => { z = 1; $("#cr-z", m).value = 1; center(); draw(); };
        $("#cr-x", m).onclick = () => { closeModal(); finish(null); };
        $("#cr-ok", m).onclick = () => {
          const oh = Math.round(outW / ratio), out = document.createElement("canvas"); out.width = outW; out.height = oh;
          const k = outW / W, s = base * z, o = out.getContext("2d");
          o.fillStyle = "#fff"; o.fillRect(0, 0, outW, oh); o.imageSmoothingQuality = "high";
          o.drawImage(img, x * k, y * k, img.width * s * k, img.height * s * k);
          out.toBlob((bl) => { closeModal(); finish(bl); }, "image/jpeg", 0.9);
        };
        m.addEventListener("click", (e) => { if (e.target === m) finish(null); });
      });
    };
    img.src = url;
  });
}

async function crProfile(body, { me, reload }) {
  let avaBlob = null, banBlob = null, avaPrev = me.avatar_url, banPrev = me.banner_url;
  let color = me.color || "#0E3B36"; let cats = [...(me.categories || [])];
  body.innerHTML = `<form class="card stack" id="cp-f" style="max-width:760px">
    <h2 style="margin:0">Mon profil public</h2>
    <div class="inf-cover" id="cp-prev" style="${infCoverStyle(color, me.banner_url)};border-radius:14px">${infAva(me.avatar_url, me.display_name)}</div>
    <div class="grid g2"><label>Photo de profil (tu pourras la recadrer)<input type="file" id="cp-ava" accept="image/*"></label><label>Bannière, facultatif (tu pourras la recadrer)<input type="file" id="cp-ban" accept="image/*"></label></div>
    ${me.banner_url ? `<label class="row small" style="gap:8px"><input type="checkbox" id="cp-noban" style="width:auto"> Retirer la bannière</label>` : ""}
    <div class="stack" style="gap:8px"><b class="small">Ma couleur</b><div class="inf-sw" id="cp-sw">${INF_PALETTE.map(([n, c]) => `<button type="button" data-c="${c}" style="background:${c}" aria-label="${n}" title="${n}" aria-pressed="${c.toLowerCase() === color.toLowerCase()}"></button>`).join("")}</div></div>
    <label>Nom de créateur<input id="cp-name" value="${esc(me.display_name)}" required minlength="2" maxlength="60"></label>
    <label>Présentation<textarea id="cp-bio" rows="4" maxlength="800" placeholder="Qui tu es, ton style, ton audience…">${esc(me.bio || "")}</textarea></label>
    <div class="grid g2"><label>Ville<input id="cp-city" value="${esc(me.city || "")}" maxlength="60"></label><label>Pays<select id="cp-country">${countryOptions(me.country || "SN")}</select></label></div>
    <label>Langues (séparées par des virgules)<input id="cp-lang" value="${esc((me.languages || []).join(", "))}" placeholder="Français, Wolof"></label>
    <div class="stack" style="gap:8px"><b class="small">Catégories (4 max)</b><div class="inf-chips" id="cp-cats">${INF_CATS.map((c) => `<button type="button" class="inf-chip" data-cat="${esc(c)}" aria-pressed="${cats.includes(c)}">${esc(c)}</button>`).join("")}</div></div>
    <label class="row" style="gap:8px;font-weight:500"><input type="checkbox" id="cp-acc" style="width:auto" ${me.accepting ? "checked" : ""}> J'accepte de nouvelles campagnes</label>
    <div class="row"><button class="btn btn-primary" type="submit">Enregistrer</button></div></form>`;
  const prev = () => { const p = $("#cp-prev"); p.style.cssText = infCoverStyle(color, $("#cp-noban")?.checked ? null : banPrev) + ";border-radius:14px"; p.innerHTML = infAva(avaPrev, $("#cp-name")?.value || me.display_name); };
  const pick = async (inp, kind) => { const f = inp.files[0]; inp.value = ""; if (!f) return;
    if (!/^image\//.test(f.type)) return toast("Choisis une image (JPG ou PNG)", true);
    if (f.size > 20 * 1024 * 1024) return toast("Image trop lourde (20 Mo max)", true);
    const bl = await infCrop(f, kind === "avatar" ? { ratio: 1, outW: 600, round: true, title: "Recadrer la photo de profil" } : { ratio: 3, outW: 1500, title: "Recadrer la bannière" });
    if (!bl) return;
    const u = URL.createObjectURL(bl);
    if (kind === "avatar") { avaBlob = bl; avaPrev = u; } else { banBlob = bl; banPrev = u; const nb = $("#cp-noban"); if (nb) nb.checked = false; }
    prev(); toast(kind === "avatar" ? "Photo prête : clique Enregistrer" : "Bannière prête : clique Enregistrer"); };
  $("#cp-ava").onchange = (e) => pick(e.target, "avatar");
  $("#cp-ban").onchange = (e) => pick(e.target, "banner");
  $("#cp-sw").onclick = (e) => { const b = e.target.closest("[data-c]"); if (!b) return; color = b.dataset.c; $("#cp-sw").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); prev(); };
  $("#cp-cats").onclick = (e) => { const b = e.target.closest("[data-cat]"); if (!b) return; const c = b.dataset.cat;
    if (cats.includes(c)) cats = cats.filter((x) => x !== c); else if (cats.length < 4) cats.push(c); else return toast("4 catégories maximum", true);
    b.setAttribute("aria-pressed", String(cats.includes(c))); };
  $("#cp-noban")?.addEventListener("change", prev);
  $("#cp-f").onsubmit = async (e) => {
    e.preventDefault(); const b = e.submitter; busy(b, true);
    try {
      const up = async (bl, kind) => bl ? infUpload("influence", `${me.id}/${kind}-${Date.now()}.jpg`, new File([bl], kind + ".jpg", { type: "image/jpeg" })) : "";
      const ava = await up(avaBlob, "avatar"), ban = $("#cp-noban")?.checked ? "-" : await up(banBlob, "banner");
      await rpc("inf_update_profile", crA({ p_name: $("#cp-name").value, p_bio: $("#cp-bio").value, p_city: $("#cp-city").value, p_country: $("#cp-country").value,
        p_languages: $("#cp-lang").value.split(",").map((s) => s.trim()).filter(Boolean), p_categories: cats, p_color: color, p_avatar: ava, p_banner: ban, p_accepting: $("#cp-acc").checked }));
      toast("Profil enregistré"); reload();
    } catch (err) { toast(errMsg(err), true); busy(b, false); }
  };
}
async function crNetworks(body, { me, reload }) {
  const nets = await sb.from("influencer_networks").select("*").eq("influencer_id", me.id).order("followers", { ascending: false }).then((r) => r.data || []);
  body.innerHTML = `<div class="row between"><p class="muted" style="margin:0">Ajoute tes comptes avec des captures récentes de tes statistiques. StatuPub vérifie chaque chiffre.</p><button class="btn btn-primary btn-sm" id="nw-add">Ajouter un réseau</button></div>
    ${nets.length ? nets.map((n) => `<div class="card inf-req">${socBtn(n)}<div style="flex:1;min-width:200px"><b>${INF_NETS[n.network]} · ${esc(n.handle || "")}</b>${netUrl(n) ? "" : ` <span class="small" style="color:#8A3B2E">lien manquant</span>`}<div class="small muted">${kfmt(n.followers)} abonnés${n.avg_views ? " · " + kfmt(n.avg_views) + " vues moy." : ""}${n.engagement != null ? " · " + n.engagement + " %" : ""} · ${(n.proof_urls || []).length} capture(s)</div></div>
      ${n.verified_at ? `<span class="inf-badge v">✓ Vérifié</span>` : `<span class="small muted">En vérification</span>`}<button class="btn btn-ghost btn-sm" data-ed="${n.network}">Modifier</button><button class="btn btn-ghost btn-sm" data-del="${n.network}">Retirer</button></div>`).join("") : `<div class="empty">Aucun réseau ajouté.</div>`}`;
  const form = (n = {}) => openModal(`<h2 style="margin:0">${n.network ? "Modifier " + INF_NETS[n.network] : "Ajouter un réseau"}</h2>
    <form id="nw-f" class="stack">
      <label>Réseau<select id="nw-net" ${n.network ? "disabled" : ""}>${Object.entries(INF_NETS).map(([k, v]) => `<option value="${k}" ${k === n.network ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <div class="grid g2"><label>Nom du compte<input id="nw-h" value="${esc(n.handle || "")}" placeholder="@moncompte" required></label><label>Lien du compte<input id="nw-u" type="url" value="${esc(n.url || "")}" placeholder="https://www.tiktok.com/@moncompte" required></label></div>
      <p class="small muted" style="margin:0">Ce lien s'ouvre quand une marque appuie sur le logo du réseau sur ton profil. Copie-le depuis ton application (Partager le profil → Copier le lien).</p>
      <div class="grid g3"><label>Abonnés<input id="nw-fo" type="number" min="0" value="${n.followers ?? ""}" required></label><label>Vues moyennes<input id="nw-av" type="number" min="0" value="${n.avg_views ?? ""}"></label><label>Engagement (%)<input id="nw-en" type="number" min="0" max="100" step="0.1" value="${n.engagement ?? ""}"></label></div>
      <div class="grid g2"><label>Audience femmes / hommes<input id="nw-g" value="${esc(n.audience?.["Femmes/Hommes"] || "")}" placeholder="Ex. : 62 % / 38 %"></label><label>Âge principal<input id="nw-a" value="${esc(n.audience?.["Âge"] || "")}" placeholder="Ex. : 18-34 ans"></label></div>
      <label>Pays principaux<input id="nw-c" value="${esc(n.audience?.["Pays"] || "")}" placeholder="Ex. : Sénégal 70 %, France 12 %"></label>
      <label>Captures de statistiques (1 à 5 images)<input id="nw-p" type="file" accept="image/*" multiple></label>
      ${n.network ? `<p class="small muted" style="margin:0">Changer les abonnés ou les vues relance la vérification.</p>` : ""}
      <div class="row"><button class="btn btn-primary" type="submit">Enregistrer</button><button class="btn btn-ghost" type="button" data-close>Annuler</button></div></form>`, (m) => {
    $("#nw-f", m).onsubmit = async (e) => {
      e.preventDefault(); const b = e.submitter; busy(b, true);
      try {
        const files = [...$("#nw-p", m).files].slice(0, 5); const proofs = [];
        if (!n.network && !files.length && !CR.inf) throw new Error("Ajoute au moins une capture de tes statistiques");
        for (const f of files) { if (f.size > 8 * 1024 * 1024) throw new Error("Capture trop lourde (8 Mo max)"); proofs.push(await infUpload("influence", `${me.id}/proofs/${Date.now()}-${proofs.length}.${extOf(f)}`, f)); }
        const audience = {}; [["Femmes/Hommes", "#nw-g"], ["Âge", "#nw-a"], ["Pays", "#nw-c"]].forEach(([k, s]) => { const v = $(s, m).value.trim(); if (v) audience[k] = v; });
        const num = (s) => $(s, m).value === "" ? null : Number($(s, m).value);
        await rpc("inf_save_network", crA({ p_network: n.network || $("#nw-net", m).value, p_handle: $("#nw-h", m).value, p_url: $("#nw-u", m).value, p_followers: num("#nw-fo") || 0,
          p_avg_views: num("#nw-av"), p_engagement: num("#nw-en"), p_audience: audience, p_proofs: proofs }));
        closeModal(); toast("Réseau enregistré"); reload();
      } catch (err) { toast(errMsg(err), true); busy(b, false); }
    };
  });
  $("#nw-add").onclick = () => form();
  body.querySelectorAll("[data-ed]").forEach((b) => b.onclick = () => form(nets.find((x) => x.network === b.dataset.ed)));
  body.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => { if (!confirm("Retirer ce réseau de ton profil ?")) return; try { await rpc("inf_delete_network", crA({ p_network: b.dataset.del })); reload(); } catch (e) { toast(errMsg(e), true); } });
}
async function crPackages(body, { me, reload }) {
  const pks = await sb.from("influencer_packages").select("*").eq("influencer_id", me.id).eq("active", true).order("sort").order("price").then((r) => r.data || []);
  const fc = fees().c;
  body.innerHTML = `<div class="row between"><p class="muted" style="margin:0">Tes formules et tes prix. Tu gardes ${Math.round((1 - fc) * 100)} % du prix affiché.</p><button class="btn btn-primary btn-sm" id="pk-add">Nouvelle formule</button></div>
    ${pks.length ? pks.map((x) => `<div class="card inf-req"><div style="flex:1;min-width:200px"><b>${esc(x.title)}</b> ${pkNets(x)}${x.description ? `<p class="small muted" style="margin:4px 0 0">${esc(x.description)}</p>` : ""}</div>
      <div style="text-align:right">${x.on_request ? `<b>Sur demande</b>` : `<span class="inf-price">${fcfa(x.price)} F</span><div class="small muted">${fcfa(Math.round(x.price * (1 - fc)))} F pour toi</div>`}</div>
      <button class="btn btn-ghost btn-sm" data-ed="${x.id}">Modifier</button><button class="btn btn-ghost btn-sm" data-del="${x.id}">Retirer</button></div>`).join("") : `<div class="empty">Aucune formule. Exemple : « 1 vidéo TikTok », « 3 stories Instagram », « Pack lancement ».</div>`}`;
  let pkSel = [];
  const form = (x = {}) => { pkSel = [...(x.networks?.length ? x.networks : x.network && x.network !== "multi" ? [x.network] : [])]; if (pkSel.length === 5) pkSel.push("__all"); return openModal(`<h2 style="margin:0">${x.id ? "Modifier la formule" : "Nouvelle formule"}</h2>
    <form id="pk-f" class="stack">
      <label>Titre<input id="pk-t" value="${esc(x.title || "")}" required maxlength="80" placeholder="Ex. : 1 vidéo TikTok"></label>
      <label>Description<textarea id="pk-d" rows="3" maxlength="500" placeholder="Durée, nombre de publications, délai…">${esc(x.description || "")}</textarea></label>
      <div class="stack" style="gap:6px"><b class="small">Réseaux inclus (un, plusieurs ou tous)</b>${chipRow("pk-n", [["__all", "Tous les réseaux"], ...Object.entries(INF_NETS)], pkSel, "")}</div>
      <div class="grid g2"><label>Prix (F)<input id="pk-p" type="number" min="1000" step="1000" value="${x.price || ""}"></label></div>
      <label class="row" style="gap:8px;font-weight:500"><input type="checkbox" id="pk-r" style="width:auto" ${x.on_request ? "checked" : ""}> Prix sur demande</label>
      <p class="small muted" style="margin:0" id="pk-net"></p>
      <div class="row"><button class="btn btn-primary" type="submit">Enregistrer</button><button class="btn btn-ghost" type="button" data-close>Annuler</button></div></form>`, (m) => {
    const upd = () => { const p = Number($("#pk-p", m).value) || 0; $("#pk-p", m).disabled = $("#pk-r", m).checked; $("#pk-net", m).textContent = !$("#pk-r", m).checked && p ? `Tu recevras ${fcfa(Math.round(p * (1 - fc)))} F. La marque paiera ${fcfa(p + Math.round(p * fees().b))} F.` : ""; };
    $("#pk-p", m).oninput = $("#pk-r", m).onchange = upd; upd();
    const all = Object.keys(INF_NETS), chips = $("#pk-n", m);
    const paint = () => chips.querySelectorAll("[data-v]").forEach((z) => z.setAttribute("aria-pressed", String(pkSel.includes(z.dataset.v))));
    chips.onclick = (e) => { const b = e.target.closest("[data-v]"); if (!b) return; const v = b.dataset.v;
      if (v === "__all") pkSel = pkSel.includes("__all") ? [] : [...all, "__all"];
      else { pkSel = pkSel.includes(v) ? pkSel.filter((z) => z !== v && z !== "__all") : [...pkSel, v]; if (all.every((k) => pkSel.includes(k)) && !pkSel.includes("__all")) pkSel.push("__all"); }
      paint(); };
    $("#pk-f", m).onsubmit = async (e) => { e.preventDefault(); const b = e.submitter; busy(b, true);
      const nets = pkSel.filter((z) => z !== "__all"); if (!nets.length) { busy(b, false); return toast("Choisis au moins un réseau", true); }
      try { await rpc("inf_save_package", crA({ p_id: x.id || null, p_title: $("#pk-t", m).value, p_description: $("#pk-d", m).value, p_network: null, p_networks: nets,
        p_price: $("#pk-r", m).checked ? 0 : Number($("#pk-p", m).value) || 0, p_on_request: $("#pk-r", m).checked, p_active: true })); closeModal(); toast("Formule enregistrée"); reload(); }
      catch (err) { toast(errMsg(err), true); busy(b, false); } };
  }); };
  $("#pk-add").onclick = () => form();
  body.querySelectorAll("[data-ed]").forEach((b) => b.onclick = () => form(pks.find((x) => x.id === b.dataset.ed)));
  body.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => { if (!confirm("Retirer cette formule ?")) return; try { await rpc("inf_delete_package", crA({ p_id: b.dataset.del })); reload(); } catch (e) { toast(errMsg(e), true); } });
}
async function crGains(body, { bk }) {
  const rows = bk.filter((x) => ["verified", "paid_out", "published", "content_approved", "content_submitted", "accepted", "changes_requested"].includes(x.status));
  body.innerHTML = `<p class="muted" style="margin:0">Tu es payé ${state.settings?.inf_payout_hours || 72} h après la vérification de ta publication, sur ton numéro mobile money enregistré.</p>
    ${rows.length ? `<div class="table"><table><thead><tr><th>Marque</th><th>Formule</th><th>Statut</th><th>Pour toi</th><th>Payé le</th></tr></thead><tbody>
    ${rows.map((x) => `<tr><td>${esc(x.brand_company || "")}</td><td>${esc(x.package_title)}</td><td>${infSt(x.status)}</td><td>${money(x.net)}</td><td>${x.paid_at ? dateTimeFr(x.paid_at) : "—"}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Pas encore de gains.</div>`}`;
}

/* ---------- Espace marque ---------- */
async function viewMarque() {
  app.innerHTML = `<div class="spinner"></div>`;
  const uid = state.session.user.id;
  const [brand, bk, w] = await Promise.all([sb.from("brands").select("*").eq("id", uid).maybeSingle().then((r) => r.data), rpc("inf_my_bookings"), rpc("annonceur_wallet").then((r) => r[0]).catch(() => null)]);
  if (!brand) return brandForm(null);
  bk.forEach((x) => infBk.set(x.id, x));
  const unread = bk.reduce((s, x) => s + Number(x.unread || 0), 0);
  const toCheck = bk.filter((x) => x.status === "content_submitted");
  const running = bk.filter((x) => ["awaiting_creator", "accepted", "content_submitted", "changes_requested", "content_approved", "published"].includes(x.status));
  const engaged = running.reduce((s, x) => s + Number(x.total), 0);
  app.innerHTML = `<main class="wrap">
    <div class="page-head"><div><p class="eyebrow">Espace marque · Pub Influenceur</p><h1 style="font-size:2rem;margin:0">${esc(brand.company)}</h1>
      <p class="muted small" style="margin:4px 0 0">${brand.verified_at ? "✓ Entreprise vérifiée" : "Vérification de l'entreprise en cours"}${brand.ninea ? " · NINEA " + esc(brand.ninea) : ""} · <button class="btn btn-ghost btn-sm" id="br-ed" style="padding:2px 8px">Modifier</button></p></div>
      <div class="row"><a class="btn btn-ghost" href="#/messages">💬 Messages${unread ? ` (${unread})` : ""}</a><a class="btn btn-ghost" href="#/annonceur">Mes campagnes statuts</a><a class="btn btn-primary" href="#/influence">Trouver un créateur</a></div></div>
    ${!brand.terms_accepted_at ? `<div class="notice warn" style="margin-bottom:16px"><div><b>Acceptez les conditions de l'Espace Pub Influenceur</b><p class="small muted">Obligatoire avant votre première réservation.</p></div><button class="btn btn-ink btn-sm" id="br-terms">Lire et accepter</button></div>` : ""}
    <div class="grid g4" style="margin-bottom:20px">
      <div class="card kpi"><span class="eyebrow">Campagnes en cours</span><span class="num">${running.length}</span></div>
      <div class="card kpi"><span class="eyebrow">Vidéos à valider</span><span class="num">${toCheck.length}</span></div>
      <div class="card kpi"><span class="eyebrow">Budget engagé</span><div>${money(engaged)}</div></div>
      <div class="card kpi"><span class="eyebrow">Solde disponible</span><div>${money(w?.available || 0)}</div><button class="btn btn-ghost btn-sm" id="br-rc">Recharger</button></div>
    </div>
    <div id="br-check" class="stack"></div>
    <section class="stack" style="margin-top:20px"><h2>Mes réservations</h2>
      ${bk.length ? `<div class="table"><table><thead><tr><th>Créateur</th><th>Formule</th><th>Date</th><th>Statut</th><th>Total</th><th></th></tr></thead><tbody>
      ${bk.map((x) => `<tr><td><a href="#/influence/${esc(x.influencer_slug)}"><b>${esc(x.influencer_name)}</b></a></td><td>${esc(x.package_title)}</td><td>${x.publish_date ? new Date(x.publish_date).toLocaleDateString("fr-FR") : "—"}</td>
        <td>${infSt(x.status)}${x.refusal_reason ? `<div class="small muted">${esc(x.refusal_reason)}</div>` : ""}${Number(x.refund) ? `<div class="small muted">Remboursé : ${fcfa(x.refund)} F</div>` : ""}</td><td>${money(x.total)}</td>
        <td class="row" style="gap:6px;flex-wrap:nowrap">${x.post_url ? `<a class="btn btn-ghost btn-sm" href="${esc(x.post_url)}" target="_blank" rel="noopener">Voir le post</a>` : ""}
          ${["awaiting_creator", "accepted"].includes(x.status) ? `<button class="btn btn-ghost btn-sm" data-cancel="${x.id}" data-st="${x.status}">Annuler</button>` : ""}
          ${["verified", "paid_out"].includes(x.status) && !x.reviewed ? `<button class="btn btn-primary btn-sm" data-rev="${x.id}">Laisser un avis</button>` : ""}
          <a class="btn btn-ghost btn-sm" href="#/messages/${x.id}">💬${x.unread ? " " + x.unread : ""}</a><button class="btn btn-ghost btn-sm" data-det="${x.id}">Détails</button></td></tr>`).join("")}</tbody></table></div>`
        : `<div class="empty">Aucune réservation pour l'instant. <a href="#/influence">Découvrir les créateurs</a></div>`}
    </section>
    <p class="small muted" style="margin-top:16px">Annulation gratuite avant l'acceptation du créateur, 50 % remboursés après, rien après la livraison de la vidéo.</p></main>`;
  $("#br-ed").onclick = () => brandForm(brand);
  $("#br-terms")?.addEventListener("click", () => infTermsModal("brand", viewMarque));
  $("#br-rc").onclick = rechargeModal;
  const chk = $("#br-check");
  for (const x of toCheck) {
    const url = await signedContent(x.content_url);
    const media = !url ? `<div class="empty small">Contenu indisponible</div>` : isVideo(url) || x.content_url.startsWith("sb:") && /\.(mp4|mov|webm|m4v)$/i.test(x.content_url) ? `<video class="inf-video" src="${esc(url)}" controls playsinline preload="metadata"></video>`
      : /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url) ? `<img class="inf-video" style="object-fit:contain" src="${esc(url)}" alt="Contenu envoyé">` : `<a class="btn btn-ghost" href="${esc(url)}" target="_blank" rel="noopener">Ouvrir la vidéo</a>`;
    chk.insertAdjacentHTML("beforeend", `<section class="card" style="border:2px solid var(--saffron);display:flex;flex-wrap:wrap;gap:20px">
      <div style="flex:0 1 300px;min-width:220px">${media}</div>
      <div class="stack" style="flex:1 1 320px;gap:10px">${infSt(x.status)}<h2 style="margin:0">${esc(x.influencer_name)} · ${esc(x.package_title)}</h2>
        ${x.content_note ? `<p style="margin:0">Note du créateur : ${esc(x.content_note)}</p>` : ""}
        <p class="small muted" style="margin:0">Sans réponse de votre part, la vidéo est validée automatiquement ${state.settings?.inf_validate_hours || 48} h après l'envoi (${dateTimeFr(new Date(new Date(x.submitted_at).getTime() + (state.settings?.inf_validate_hours || 48) * 3600e3))}). Retouches utilisées : ${x.revisions || 0}/2.</p>
        <label>Commentaire pour le créateur<textarea data-cm="${x.id}" rows="3" maxlength="600" placeholder="Ex. : montrer le logo plus tôt"></textarea></label>
        <div class="row"><button class="btn btn-ok" data-ok="${x.id}">Valider la vidéo</button>${(x.revisions || 0) < 2 ? `<button class="btn btn-ghost" data-ch="${x.id}">Demander une retouche</button>` : ""}</div></div></section>`);
  }
  const review = async (b, approve) => { const cm = chk.querySelector(`[data-cm="${b.dataset.ok || b.dataset.ch}"]`).value.trim();
    if (!approve && cm.length < 5) return toast("Explique la retouche voulue", true);
    busy(b, true); try { await rpc("inf_review_content", { p_id: b.dataset.ok || b.dataset.ch, p_approve: approve, p_comment: cm }); toast(approve ? "Vidéo validée. Le créateur peut publier." : "Retouche demandée."); viewMarque(); } catch (e) { toast(errMsg(e), true); busy(b, false); } };
  chk.querySelectorAll("[data-ok]").forEach((b) => b.onclick = () => review(b, true));
  chk.querySelectorAll("[data-ch]").forEach((b) => b.onclick = () => review(b, false));
  app.querySelectorAll("[data-cancel]").forEach((b) => b.onclick = async () => {
    const x = bk.find((y) => y.id === b.dataset.cancel);
    const msg = b.dataset.st === "awaiting_creator" ? `Annuler ? Vous êtes remboursé intégralement (${fcfa(x.total)} F).` : `Le créateur a déjà accepté : vous serez remboursé de 50 % (${fcfa(Math.round(x.price / 2) + Number(x.brand_fee))} F). Annuler ?`;
    if (!confirm(msg)) return; busy(b, true);
    try { await rpc("inf_cancel", { p_id: x.id }); toast("Réservation annulée"); viewMarque(); } catch (e) { toast(errMsg(e), true); busy(b, false); } });
  app.querySelectorAll("[data-det]").forEach((b) => b.onclick = () => { const x = bk.find((y) => y.id === b.dataset.det);
    openModal(`<h2 style="margin:0">${esc(x.influencer_name)}</h2>${bkInfo(x, "brand")}<div class="small stack" style="gap:4px;border-top:1px solid var(--line);padding-top:10px">
      <div class="row between"><span>Prix du créateur</span><b>${fcfa(x.price)} F</b></div><div class="row between"><span>Frais de service</span><b>${fcfa(x.brand_fee)} F</b></div><div class="row between"><span>Total</span><b>${fcfa(x.total)} F</b></div>
      <div class="muted">Créée le ${dateTimeFr(x.created_at)}</div></div><button class="btn btn-ghost" data-close>Fermer</button>`); });
  app.querySelectorAll("[data-rev]").forEach((b) => b.onclick = () => openModal(`<h2 style="margin:0">Votre avis</h2>
    <div class="inf-chips" id="rv-st" role="radiogroup" aria-label="Note">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="inf-chip" data-n="${n}" aria-pressed="${n === 5}">${n} ★</button>`).join("")}</div>
    <label>Commentaire (facultatif)<textarea id="rv-b" rows="3" maxlength="600"></textarea></label>
    <div class="row"><button class="btn btn-primary" id="rv-go">Publier mon avis</button><button class="btn btn-ghost" data-close>Annuler</button></div>`, (m) => {
    let n = 5; $("#rv-st", m).onclick = (e) => { const c = e.target.closest("[data-n]"); if (!c) return; n = Number(c.dataset.n); m.querySelectorAll("[data-n]").forEach((z) => z.setAttribute("aria-pressed", String(z === c))); };
    $("#rv-go", m).onclick = async (e) => { busy(e.target, true); try { await rpc("inf_leave_review", { p_id: b.dataset.rev, p_rating: n, p_body: $("#rv-b", m).value }); closeModal(); toast("Merci ! Votre avis sera publié après relecture."); viewMarque(); } catch (err) { toast(errMsg(err), true); busy(e.target, false); } };
  }));
}
function brandForm(b) {
  const p = state.profile || {};
  app.innerHTML = `<main class="wrap" style="max-width:640px"><form class="card stack" id="bf">
    <p class="eyebrow">Espace Pub Influenceur</p><h1 style="font-size:1.8rem;margin:0">${b ? "Ma fiche entreprise" : "Créez votre fiche entreprise"}</h1>
    <p class="muted" style="margin:0">Ces informations permettent aux créateurs de savoir avec qui ils travaillent et figurent sur vos factures.</p>
    <label>Nom de l'entreprise<input id="bf-co" required minlength="2" maxlength="100" value="${esc(b?.company || p.company || "")}"></label>
    <div class="grid g2"><label>NINEA<input id="bf-ni" maxlength="30" value="${esc(b?.ninea || "")}"></label><label>RCCM (facultatif)<input id="bf-rc" maxlength="40" value="${esc(b?.rccm || "")}"></label></div>
    <div class="grid g2"><label>Personne à contacter<input id="bf-ct" required maxlength="80" value="${esc(b?.contact_name || p.full_name || "")}"></label><label>Téléphone<input id="bf-ph" type="tel" required value="${esc(b?.phone || p.phone || "")}"></label></div>
    <div class="grid g2"><label>Site ou page (facultatif)<input id="bf-ws" maxlength="200" value="${esc(b?.website || "")}" placeholder="https://"></label><label>Secteur<input id="bf-se" maxlength="60" value="${esc(b?.sector || "")}" placeholder="Ex. : cosmétique"></label></div>
    ${b ? `<p class="small muted" style="margin:0">Changer le nom ou le NINEA relance la vérification.</p>` : ""}
    ${!b?.terms_accepted_at ? `<label class="row" style="gap:8px;font-weight:500"><input type="checkbox" id="bf-terms" style="width:auto" required> J'accepte les <a href="#/conditions-influence" target="_blank">conditions de l'Espace Pub Influenceur</a></label>` : ""}
    <div class="row"><button class="btn btn-primary" type="submit">Enregistrer</button>${b ? `<a class="btn btn-ghost" href="#/marque">Annuler</a>` : `<a class="btn btn-ghost" href="#/annonceur">Plus tard</a>`}</div></form></main>`;
  $("#bf").onsubmit = async (e) => {
    e.preventDefault(); const btn = e.submitter; busy(btn, true);
    try { await rpc("brand_save", { p_company: $("#bf-co").value, p_ninea: $("#bf-ni").value, p_rccm: $("#bf-rc").value, p_contact: $("#bf-ct").value, p_phone: $("#bf-ph").value, p_website: $("#bf-ws").value, p_sector: $("#bf-se").value });
      if ($("#bf-terms")?.checked) await rpc("inf_accept_terms");
      toast("Fiche entreprise enregistrée");
      let back = ""; try { back = sessionStorage.getItem("sp_inf_back") || ""; sessionStorage.removeItem("sp_inf_back"); } catch {}
      if (back && back !== location.hash) location.hash = back; else viewMarque(); }
    catch (err) { toast(errMsg(err), true); busy(btn, false); }
  };
}

/* Lien d'accès à envoyer au créateur (WhatsApp) */
function inviteLink(code, name) {
  const link = `https://statupub.com/influenceur/?c=${code}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`Bonjour ${name} 👋\n\nTon profil créateur est prêt sur l'Espace Pub Influenceur de StatuPub : les marques te réservent et tu es payé après chaque publication.\n\nCrée ton accès ici (lien personnel, valable une fois) :\n${link}`)}`;
  openModal(`<h2 style="margin:0">Donner l'accès au créateur</h2><p class="small muted" style="margin:0">Envoie ce lien à ${esc(name)}. Il crée son mot de passe et retrouve son profil déjà rempli. Le lien ne sert qu'une fois. Tu peux continuer à gérer son profil après.</p>
    <input readonly value="${esc(link)}" id="iv-l"><div class="row"><button class="btn btn-primary" id="iv-c">Copier</button><a class="btn btn-ok" href="${esc(wa)}" target="_blank" rel="noopener">Envoyer sur WhatsApp</a><button class="btn btn-ghost" data-close>Fermer</button></div>`,
  (m) => { $("#iv-c", m).onclick = () => copy(link); });
}

/* ---------- Admin : onglet Influenceurs ---------- */
async function adminInfluence(body, reload) {
  const ov = await rpc("inf_admin_overview");
  const sub = new URLSearchParams(location.hash.split("?")[1] || "").get("s") || ((ov.applications || []).some((x) => x.status === "nouveau") ? "candidatures" : "createurs");
  const payH = Number(ov.payout_hours || 72);
  const toVerify = ov.bookings.filter((x) => x.status === "published");
  const payable = ov.bookings.filter((x) => x.status === "verified");
  const disputes = ov.bookings.filter((x) => x.status === "disputed");
  const pendingInf = ov.influencers.filter((x) => x.status === "pending");
  const newReq = ov.requests.filter((x) => x.status === "nouveau");
  const pendRev = ov.reviews.filter((x) => x.status === "pending");
  const apps = ov.applications || []; const newApps = apps.filter((x) => x.status === "nouveau");
  const comm = ov.bookings.filter((x) => ["verified", "paid_out"].includes(x.status)).reduce((s, x) => s + Number(x.creator_fee) + Number(x.brand_fee), 0);
  const subs = [["devis", "🤖 Devis IA"], ["candidatures", "Candidatures", newApps.length], ["createurs", "Créateurs", pendingInf.length], ["reservations", "Réservations", toVerify.length + payable.length + disputes.length], ["marques", "Marques", ov.brands.filter((x) => !x.verified_at).length], ["demandes", "Demandes de prix", newReq.length], ["avis", "Avis", pendRev.length]];
  body.innerHTML = `<div class="grid g4" style="margin-bottom:16px">
      <div class="card kpi"><span class="eyebrow">Créateurs visibles</span><span class="num">${ov.influencers.filter((x) => ["verified", "certified"].includes(x.status)).length}</span><span class="small muted">${pendingInf.length} à vérifier</span></div>
      <div class="card kpi"><span class="eyebrow">Publications à vérifier</span><span class="num">${toVerify.length}</span></div>
      <div class="card kpi"><span class="eyebrow">Paiements créateurs</span><span class="num">${payable.length}</span><span class="small muted">${fcfa(payable.reduce((s, x) => s + x.price - x.creator_fee, 0))} F</span></div>
      <div class="card kpi"><span class="eyebrow">Commissions gagnées</span><div>${money(comm)}</div></div></div>
    <div class="inf-chips" style="margin-bottom:16px">${subs.map(([k, l, n]) => `<button class="inf-chip" data-s="${k}" aria-pressed="${k === sub}">${l}${n ? ` (${n})` : ""}</button>`).join("")}</div>
    <div id="ai-b" class="stack"></div>`;
  body.querySelectorAll("[data-s]").forEach((b) => b.onclick = () => location.hash = "#/admin?t=influence&s=" + b.dataset.s);
  const box = $("#ai-b");
  const act = async (btn, fn, args, msg) => { busy(btn, true); try { await rpc(fn, args); toast(msg || "Fait"); reload(); } catch (e) { toast(errMsg(e), true); busy(btn, false); } };
  const inviteBox = (code, name) => inviteLink(code, name);

  if (sub === "devis") return adminQuotes(box, ov);

  if (sub === "candidatures") {
    box.innerHTML = apps.length ? apps.map((a) => { const tot = (a.networks || []).reduce((s, n) => s + Number(n.followers || 0), 0); const tel = String(a.phone || "").replace(/\D/g, "");
      return `<div class="card stack" style="gap:8px;${a.status === "nouveau" ? "" : "opacity:.65"}"><div class="row between" style="flex-wrap:wrap;gap:10px">
        <div><b>${esc(a.full_name)}</b> <span class="small muted">${dateTimeFr(a.created_at)}</span><div class="small muted">${esc([a.city, COUNTRIES?.[a.country]?.name].filter(Boolean).join(", "))} · ${esc(a.phone)}${a.email ? " · " + esc(a.email) : ""} · <b>${kfmt(tot)}</b> abonnés annoncés</div>
          <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:4px">${(a.categories || []).map((c) => `<span class="inf-net">${esc(c)}</span>`).join("")}</div></div>
        <div class="row" style="gap:6px"><a class="btn btn-ghost btn-sm" href="https://wa.me/${tel}" target="_blank" rel="noopener">WhatsApp</a>
          ${a.status === "nouveau" ? `<button class="btn btn-ghost btn-sm" data-ap="${a.id}" data-ok="0">Refuser</button>` : ""}${a.status !== "refuse" ? (a.status === "invite" && a.influencer_id ? `<a class="btn btn-primary btn-sm" href="#/admin/createur/${a.influencer_id}?t=profil">Gérer le profil</a>` : `<button class="btn btn-primary btn-sm" data-ap="${a.id}" data-ok="1" data-nm="${esc(a.full_name)}">Créer le profil</button>`) : `<span class="small muted">Refusée</span>`}</div></div>
        <div class="row" style="gap:8px;flex-wrap:wrap">${(a.networks || []).map((n) => `<a class="inf-net" style="display:inline-flex;gap:6px;align-items:center;text-decoration:none" href="${esc(n.url)}" target="_blank" rel="noopener">${netIcon(n.network, 14)} ${INF_NETS[n.network]} · ${kfmt(n.followers)}</a>`).join("")}</div>
        ${a.message ? `<p class="small" style="margin:0">${esc(a.message)}</p>` : ""}</div>`; }).join("") : `<div class="empty">Aucune candidature. Partage le lien <b>statupub.com/influenceur/</b>.</div>`;
    box.querySelectorAll("[data-ap]").forEach((b) => b.onclick = async () => { const ok = b.dataset.ok === "1"; if (!ok && !confirm("Refuser cette candidature ?")) return; busy(b, true);
      try { const r = await rpc("inf_admin_application", { p_id: b.dataset.ap, p_invite: ok }); if (ok && r?.id) { toast("Profil créé à partir de la candidature."); location.hash = `#/admin/createur/${r.id}?t=profil`; } else reload(); } catch (e) { toast(errMsg(e), true); busy(b, false); } });
  }

  if (sub === "createurs") {
    const ST = { pending: "À vérifier", verified: "Vérifié", certified: "Certifié", hidden: "Masqué", rejected: "Refusé" };
    box.innerHTML = `<div class="row between"><p class="muted" style="margin:0">Ajoute un créateur et remplis son profil toi-même. Tu lui enverras son lien d'accès quand il sera prêt.</p><button class="btn btn-primary btn-sm" id="ai-new">Ajouter un créateur</button></div>
      ${ov.influencers.length ? ov.influencers.map((i) => `<div class="card stack" style="gap:10px"><div class="row" style="gap:14px;flex-wrap:wrap">
        <span style="width:14px;height:14px;border-radius:50%;background:${esc(i.color)}"></span>${infAva(i.avatar_url, i.display_name)}
        <div style="flex:1;min-width:200px"><b>${esc(i.display_name)}</b> <span class="inf-status" style="background:#EEF3F1;color:var(--ink)">${ST[i.status] || i.status}</span>
          <div class="small muted">${i.user_id ? esc(i.email || "Compte relié") : "Invitation pas encore utilisée"}${i.contact_phone ? " · " + esc(i.contact_phone) : ""}${i.city ? " · " + esc(i.city) : ""} · ${i.packages} formule(s)</div></div>
        <div class="row" style="gap:6px;flex-wrap:wrap">
          <a class="btn btn-primary btn-sm" href="#/admin/createur/${i.id}?t=profil">Gérer le profil</a>
          ${!i.user_id ? `<button class="btn btn-ghost btn-sm" data-code="${i.id}" data-nm="${esc(i.display_name)}">Lien d'accès</button>` : ""}
          <a class="btn btn-ghost btn-sm" href="#/influence/${esc(i.slug)}">Profil</a>
          ${i.status !== "verified" ? `<button class="btn btn-ink btn-sm" data-st="verified" data-id="${i.id}">Vérifier</button>` : ""}
          ${i.status !== "certified" ? `<button class="btn btn-primary btn-sm" data-st="certified" data-id="${i.id}">Certifier</button>` : ""}
          ${i.status !== "hidden" ? `<button class="btn btn-ghost btn-sm" data-st="hidden" data-id="${i.id}">Masquer</button>` : ""}
          ${i.status === "pending" ? `<button class="btn btn-bad btn-sm" data-st="rejected" data-id="${i.id}">Refuser</button>` : ""}</div></div>
        ${(i.networks || []).length ? `<div class="stack" style="gap:6px">${i.networks.map((n) => `<div class="row small" style="gap:10px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:6px">
          <span class="inf-net">${INF_NETS[n.network]}</span><span>${n.url ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.handle || n.url)}</a>` : esc(n.handle || "")}</span><b>${kfmt(n.followers)}</b><span class="muted">${n.avg_views ? kfmt(n.avg_views) + " vues" : ""} ${n.engagement != null ? n.engagement + " %" : ""}</span>
          ${(n.proof_urls || []).map((u, k) => `<a href="${esc(u)}" target="_blank" rel="noopener">Capture ${k + 1}</a>`).join(" ")}
          ${n.verified_at ? `<span class="inf-badge v">✓</span><button class="btn btn-ghost btn-sm" data-net="${n.id}" data-ok="0">Retirer ✓</button>` : `<button class="btn btn-ok btn-sm" data-net="${n.id}" data-ok="1">Chiffres OK</button>`}</div>`).join("")}</div>` : ""}</div>`).join("")
      : `<div class="empty">Aucun créateur. Commence par inviter tes ~20 créateurs.</div>`}`;
    const anCats = [];
    $("#ai-new").onclick = () => { anCats.splice(0); openModal(`<h2 style="margin:0">Ajouter un créateur</h2><p class="small muted" style="margin:0">Juste l'essentiel : tu complètes le reste (photo, réseaux, formules) à l'étape suivante.</p><form id="an-f" class="stack">
      <label>Nom de créateur<input id="an-n" required minlength="2" maxlength="60"></label>
      <label>Adresse du profil (facultatif)<input id="an-s" placeholder="ex. : aminata-diallo" pattern="[a-z0-9-]{3,40}"></label>
      <div class="grid g2"><label>Téléphone<input id="an-p" type="tel"></label><label>E-mail<input id="an-e" type="email"></label></div>
      <label>Ville<input id="an-c"></label>
      <div class="stack" style="gap:6px"><b class="small">Catégories (4 max)</b>${chipRow("an-k", INF_CATS.map((c) => [c, c]), [], "")}</div>
      <div class="row"><button class="btn btn-primary" type="submit">Créer et remplir le profil</button><button class="btn btn-ghost" type="button" data-close>Annuler</button></div></form>`, (m) => {
      bindChips($("#an-k", m), anCats, null, 4);
      $("#an-f", m).onsubmit = async (e) => { e.preventDefault(); const b = e.submitter; busy(b, true);
        try { const r = await rpc("inf_admin_create", { p_name: $("#an-n", m).value, p_slug: $("#an-s", m).value, p_phone: $("#an-p", m).value, p_email: $("#an-e", m).value, p_city: $("#an-c", m).value,
          p_categories: [...anCats] });
          closeModal(); toast("Créateur ajouté. Remplis son profil."); location.hash = `#/admin/createur/${r.id}?t=profil`; }
        catch (err) { toast(errMsg(err), true); busy(b, false); } };
    }); };
    box.querySelectorAll("[data-code]").forEach((b) => b.onclick = async () => { try { const c = await rpc("inf_admin_new_code", { p_id: b.dataset.code }); inviteBox(c, b.dataset.nm); } catch (e) { toast(errMsg(e), true); } });
    box.querySelectorAll("[data-st]").forEach((b) => b.onclick = () => act(b, "inf_admin_set_status", { p_id: b.dataset.id, p_status: b.dataset.st }, "Statut mis à jour"));
    box.querySelectorAll("[data-net]").forEach((b) => b.onclick = () => act(b, "inf_admin_verify_network", { p_net: b.dataset.net, p_ok: b.dataset.ok === "1" }));
  }

  if (sub === "reservations") {
    const row = (x) => { const due = x.verified_at ? new Date(new Date(x.verified_at).getTime() + payH * 3600e3) : null; const canPay = due && due <= new Date();
      return `<tr><td><b>${esc(x.influencer_name)}</b><div class="small muted">${esc(x.brand_company || "")}</div></td><td>${esc(x.package_title)}<div class="small muted">${dateTimeFr(x.created_at)}</div></td><td>${infSt(x.status)}${x.admin_note ? `<div class="small muted">${esc(x.admin_note)}</div>` : ""}</td>
      <td>${money(x.total)}<div class="small muted">créateur ${fcfa(x.price - x.creator_fee)} F</div></td><td class="row" style="gap:6px">
      <a class="btn btn-ghost btn-sm" href="#/messages/${x.id}">💬${x.messages ? " " + x.messages : ""}</a>
      ${x.post_url ? `<a class="btn btn-ghost btn-sm" href="${esc(x.post_url)}" target="_blank" rel="noopener">Post</a>` : ""}
      ${x.status === "published" ? `<button class="btn btn-ok btn-sm" data-vp="${x.id}" data-ok="1">Publication OK</button><button class="btn btn-bad btn-sm" data-vp="${x.id}" data-ok="0">Litige</button>` : ""}
      ${x.status === "verified" ? (canPay ? `<button class="btn btn-primary btn-sm" data-pay="${x.id}" data-amt="${x.price - x.creator_fee}">Payer</button>` : `<span class="small muted">Payable le ${dateTimeFr(due)}</span>`) : ""}
      ${x.status === "disputed" ? `<button class="btn btn-ink btn-sm" data-res="${x.id}">Trancher</button>` : ""}</td></tr>`; };
    const pri = { published: 0, disputed: 1, verified: 2 };
    const list = [...ov.bookings].sort((a, b) => (pri[a.status] ?? 9) - (pri[b.status] ?? 9));
    box.innerHTML = list.length ? `<div class="table"><table><thead><tr><th>Créateur / marque</th><th>Formule</th><th>Statut</th><th>Montant</th><th></th></tr></thead><tbody>${list.map(row).join("")}</tbody></table></div>` : `<div class="empty">Aucune réservation.</div>`;
    box.querySelectorAll("[data-vp]").forEach((b) => b.onclick = () => { const ok = b.dataset.ok === "1"; const note = ok ? null : prompt("Motif du litige (ex. : #pub absent, post supprimé) :"); if (!ok && !note) return; act(b, "inf_admin_verify_post", { p_id: b.dataset.vp, p_ok: ok, p_note: note }, ok ? "Publication vérifiée" : "Litige ouvert"); });
    box.querySelectorAll("[data-pay]").forEach((b) => b.onclick = () => { const ref = prompt(`Référence du paiement de ${fcfa(b.dataset.amt)} F (Wave / OM) :`); if (ref) act(b, "inf_admin_payout", { p_id: b.dataset.pay, p_ref: ref }, "Paiement enregistré"); });
    box.querySelectorAll("[data-res]").forEach((b) => b.onclick = () => { const x = ov.bookings.find((y) => y.id === b.dataset.res);
      openModal(`<h2 style="margin:0">Trancher le litige</h2><p class="small muted" style="margin:0">${esc(x.influencer_name)} / ${esc(x.brand_company || "")} · total ${fcfa(x.total)} F</p>
        <label>Remboursement marque (F)<input id="rs-r" type="number" min="0" max="${x.total}" value="${x.total}"></label>
        <label class="row" style="gap:8px;font-weight:500"><input type="checkbox" id="rs-p" style="width:auto"> Payer quand même le créateur</label>
        <label>Note<textarea id="rs-n" rows="2"></textarea></label>
        <div class="row"><button class="btn btn-primary" id="rs-go">Valider</button><button class="btn btn-ghost" data-close>Annuler</button></div>`, (m) => {
        $("#rs-go", m).onclick = (e) => act(e.target, "inf_admin_resolve", { p_id: x.id, p_refund: Number($("#rs-r", m).value) || 0, p_pay_creator: $("#rs-p", m).checked, p_note: $("#rs-n", m).value }, "Litige réglé");
      }); });
  }

  if (sub === "marques") {
    box.innerHTML = ov.brands.length ? `<div class="table"><table><thead><tr><th>Entreprise</th><th>NINEA / RCCM</th><th>Contact</th><th>Statut</th><th></th></tr></thead><tbody>
      ${ov.brands.map((b) => `<tr><td><b>${esc(b.company)}</b><div class="small muted">${esc(b.sector || "")}${b.website ? ` · <a href="${esc(b.website)}" target="_blank" rel="noopener">site</a>` : ""}</div></td><td>${esc(b.ninea || "—")}<div class="small muted">${esc(b.rccm || "")}</div></td>
        <td>${esc(b.contact_name || b.full_name || "")}<div class="small muted">${esc(b.phone || "")} · ${esc(b.email || "")}</div></td><td>${b.verified_at ? `<span class="inf-badge v">✓ Vérifiée</span>` : "À vérifier"}</td>
        <td>${b.verified_at ? `<button class="btn btn-ghost btn-sm" data-vb="${b.id}" data-ok="0">Retirer</button>` : `<button class="btn btn-ok btn-sm" data-vb="${b.id}" data-ok="1">Vérifier</button>`}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Aucune marque inscrite.</div>`;
    box.querySelectorAll("[data-vb]").forEach((b) => b.onclick = () => act(b, "inf_admin_verify_brand", { p_id: b.dataset.vb, p_ok: b.dataset.ok === "1" }));
  }

  if (sub === "demandes") {
    box.innerHTML = ov.requests.length ? ov.requests.map((q) => { const tel = String(q.phone || "").replace(/\D/g, "");
      return `<div class="card inf-req" style="${q.status === "nouveau" ? "" : "opacity:.6"}"><div style="flex:1;min-width:220px"><b>${esc(q.company)}</b> <span class="small muted">${dateTimeFr(q.created_at)}</span>
        <div class="small">Pour <b>${esc(q.influencer_name || "—")}</b>${q.package_title ? " · " + esc(q.package_title) : ""}</div><div class="small muted">${esc(q.contact_name || "")} · ${esc(q.phone)}${q.email ? " · " + esc(q.email) : ""}</div>${q.message ? `<p class="small" style="margin:4px 0 0">${esc(q.message)}</p>` : ""}</div>
        <div class="row"><a class="btn btn-ghost btn-sm" href="tel:${esc(q.phone)}">Appeler</a><a class="btn btn-ok btn-sm" href="https://wa.me/${tel}" target="_blank" rel="noopener">WhatsApp</a>${q.status === "nouveau" ? `<button class="btn btn-ghost btn-sm" data-rq="${q.id}">Traité</button>` : ""}</div></div>`; }).join("") : `<div class="empty">Aucune demande de prix.</div>`;
    box.querySelectorAll("[data-rq]").forEach((b) => b.onclick = () => act(b, "inf_admin_price_request", { p_id: b.dataset.rq }));
  }

  if (sub === "avis") {
    box.innerHTML = ov.reviews.length ? ov.reviews.map((r) => `<div class="card stack" style="gap:6px"><div class="row between"><b>${esc(r.brand_company || "Marque")} → ${esc(r.influencer_name)}</b>${stars(r.rating)}</div>${r.body ? `<p style="margin:0">${esc(r.body)}</p>` : ""}
      <div class="row"><span class="small muted">${r.status === "pending" ? "En attente" : r.status === "published" ? "Publié" : "Masqué"}</span>${r.status !== "published" ? `<button class="btn btn-ok btn-sm" data-rv="${r.booking_id}" data-s="published">Publier</button>` : ""}${r.status !== "hidden" ? `<button class="btn btn-ghost btn-sm" data-rv="${r.booking_id}" data-s="hidden">Masquer</button>` : ""}</div></div>`).join("") : `<div class="empty">Aucun avis.</div>`;
    box.querySelectorAll("[data-rv]").forEach((b) => b.onclick = () => act(b, "inf_admin_review", { p_booking: b.dataset.rv, p_status: b.dataset.s }));
  }
}

/* ==================== Conditions, charte et contrat ==================== */
const INF_TERMS_V = "v1";
const INF_RULES = () => { const s = state.settings || {}; return [
  ["Réponse du créateur", `${s.inf_accept_hours || 48} h pour accepter ou refuser. Sans réponse, la marque est remboursée automatiquement.`],
  ["Validation de la vidéo", `La marque a ${s.inf_validate_hours || 48} h pour valider ou demander une retouche (2 retouches incluses). Sans réponse, la vidéo est validée automatiquement.`],
  ["Annulation", "Gratuite avant l'acceptation du créateur. 50 % du prix remboursés après l'acceptation. Aucun remboursement après la livraison de la vidéo."],
  ["Durée en ligne", "La publication reste en ligne au moins 30 jours. Une suppression avant ce délai ouvre un litige."],
  ["Paiement du créateur", `Versé ${s.inf_payout_hours || 72} h après la vérification de la publication par StatuPub, sur mobile money.`],
  ["Mention obligatoire", "#pub ou « partenariat rémunéré » visible dans chaque publication."],
  ["Commission", `Le créateur garde ${Math.round((1 - fees().c) * 100)} % de son prix. La marque paie ${Math.round(fees().b * 100)} % de frais de service en plus du prix.`],
]; };
const INF_CREATOR_CHARTER = [
  "Je publie seulement le contenu validé par la marque (ou conforme au brief si elle n'a pas demandé de validation), à la date convenue, depuis mes propres comptes.",
  "J'ajoute toujours la mention #pub ou « partenariat rémunéré » et je laisse la publication en ligne au moins 30 jours.",
  "Mes chiffres (abonnés, vues, engagement) sont vrais et récents. Je n'utilise ni faux abonnés, ni achat de vues, ni robots.",
  "Je ne fais pas la promotion de produits illégaux, dangereux, trompeurs ou contraires à la loi sénégalaise.",
  "Toutes les réservations et tous les paiements passent par StatuPub. Je ne demande pas à la marque de me payer en dehors de la plateforme pour une campagne trouvée ici.",
  "Je garde confidentielles les informations du brief qui ne sont pas encore publiques.",
  "Je reste libre de travailler avec d'autres plateformes et d'autres marques : l'Espace Pub Influenceur n'est pas exclusif.",
];
const INF_BRAND_TERMS = [
  "Les informations de mon entreprise (nom, NINEA, contact) sont exactes. J'ai le droit de faire la promotion du produit ou du service réservé.",
  "Mon brief est clair et respecte la loi : pas de produit illégal, dangereux ou trompeur, pas de propos mensongers sur la concurrence.",
  "Le montant de la réservation est bloqué sur mon solde StatuPub jusqu'à la fin de la campagne. Le créateur n'est payé qu'après la publication vérifiée.",
  "Je peux repartager la publication sur mes propres comptes en citant le créateur. Toute utilisation en publicité payante (boost, Spark Ads, affichage, TV) demande l'accord écrit du créateur et peut être facturée à part.",
  "Toutes les réservations et tous les paiements passent par StatuPub. Je ne contacte pas le créateur pour le payer en dehors de la plateforme pour une campagne trouvée ici.",
  "Je laisse un avis honnête, basé seulement sur la campagne réalisée.",
];
const INF_COMMON = [
  "StatuPub (West Africa SN Production) met en relation les marques et les créateurs, garde l'argent pendant la campagne et règle les litiges. StatuPub n'est pas l'employeur du créateur.",
  "Les numéros de téléphone, e-mails et liens WhatsApp sont masqués dans la messagerie pour protéger les deux parties.",
  "En cas de litige, StatuPub examine les échanges, le brief et la publication, puis décide du remboursement total, partiel ou du paiement du créateur.",
  "Un compte qui ne respecte pas ces règles peut être suspendu. Les sommes dues pour les campagnes terminées restent versées.",
  "Ces conditions sont soumises au droit sénégalais. À défaut d'accord amiable, les tribunaux de Dakar sont compétents.",
];
const liList = (a) => `<ul class="stack" style="gap:8px;padding-left:20px;margin:0">${a.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
const rulesTable = () => `<div class="table"><table><tbody>${INF_RULES().map(([k, v]) => `<tr><th style="text-align:left;width:34%">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>`;

function viewInfTerms() {
  app.innerHTML = `<main class="wrap stack" style="max-width:860px;gap:22px;padding-bottom:48px">
    <div><p class="eyebrow">Espace Pub Influenceur</p><h1 style="font-size:2rem;margin:4px 0 0">Conditions de l'Espace Pub Influenceur</h1><p class="muted small">Version ${INF_TERMS_V} · s'appliquent en plus des <a href="/conditions/">conditions générales de StatuPub</a>.</p></div>
    <section class="card stack"><h2 style="margin:0">Les règles de chaque campagne</h2>${rulesTable()}</section>
    <section class="card stack"><h2 style="margin:0">Charte créateur</h2>${liList(INF_CREATOR_CHARTER)}</section>
    <section class="card stack"><h2 style="margin:0">Engagements des marques</h2>${liList(INF_BRAND_TERMS)}</section>
    <section class="card stack"><h2 style="margin:0">Pour tout le monde</h2>${liList(INF_COMMON)}</section>
    <p><a class="btn btn-ghost" href="#/influence">Retour aux créateurs</a></p></main>`;
}
function infTermsModal(kind, onOk) {
  openModal(`<h2 style="margin:0">${kind === "creator" ? "Charte créateur" : "Conditions pour les marques"}</h2>
    <div class="stack small" style="max-height:52vh;overflow:auto;gap:14px">${rulesTable()}${liList(kind === "creator" ? INF_CREATOR_CHARTER : INF_BRAND_TERMS)}${liList(INF_COMMON)}</div>
    <label class="row" style="gap:8px;font-weight:600"><input type="checkbox" id="tm-ok" style="width:auto"> J'ai lu et j'accepte ces conditions</label>
    <div class="row"><button class="btn btn-primary" id="tm-go" disabled>Accepter</button><button class="btn btn-ghost" data-close>Plus tard</button></div>`, (m) => {
    $("#tm-ok", m).onchange = (e) => { $("#tm-go", m).disabled = !e.target.checked; };
    $("#tm-go", m).onclick = async (e) => { busy(e.target, true); try { await rpc("inf_accept_terms", kind === "creator" ? crA() : {}); closeModal(); toast("Conditions acceptées"); onOk?.(); } catch (err) { toast(errMsg(err), true); busy(e.target, false); } };
  });
}
/* Contrat de collaboration d'une réservation : page imprimable / PDF */
function infContract(x) {
  const ref = "SP-INF-" + String(x.id).slice(0, 8).toUpperCase();
  const d = (v) => v ? new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const w = window.open("", "_blank");
  if (!w) return toast("Autorise les fenêtres pour ouvrir le contrat", true);
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Contrat ${ref}</title>
  <style>body{font:15px/1.55 system-ui,sans-serif;color:#10201D;max-width:780px;margin:24px auto;padding:0 16px;background:#fff}h1{font-size:22px;margin:0}h2{font-size:16px;margin:22px 0 8px;color:#0E3B36}
  table{border-collapse:collapse;width:100%}td,th{border:1px solid #DDD;padding:8px;text-align:left;vertical-align:top}th{background:#F6F4EF;width:34%}.muted{color:#55625F;font-size:13px}
  .sig{display:flex;gap:24px;margin-top:28px}.sig div{flex:1;border-top:1px solid #999;padding-top:6px;font-size:13px}button{margin:16px 0;padding:10px 16px;border:0;border-radius:10px;background:#0E3B36;color:#fff;font-weight:700;cursor:pointer}
  @media print{button{display:none}body{margin:0}}</style></head><body>
  <button onclick="print()">Imprimer / enregistrer en PDF</button>
  <h1>Contrat de collaboration · Espace Pub Influenceur</h1><p class="muted">Référence ${ref} · conditions ${esc(x.terms_version || INF_TERMS_V)} · créé le ${d(x.created_at)}</p>
  <h2>Les parties</h2><table>
    <tr><th>La marque</th><td>${esc(x.brand_company || "")}${x.brand_ninea ? " · NINEA " + esc(x.brand_ninea) : ""}</td></tr>
    <tr><th>Le créateur</th><td>${esc(x.influencer_name || "")}</td></tr>
    <tr><th>L'intermédiaire</th><td>StatuPub, plateforme de West Africa SN Production (Sénégal), qui garde le paiement et vérifie la publication</td></tr></table>
  <h2>La prestation</h2><table>
    <tr><th>Formule</th><td>${esc(x.package_title || "")}${x.kind === "offer" ? " (offre acceptée)" : ""}</td></tr>
    <tr><th>Produit ou marque</th><td>${esc(x.product || "—")}</td></tr>
    <tr><th>Date de publication souhaitée</th><td>${d(x.publish_date)}</td></tr>
    <tr><th>Validation avant publication</th><td>${x.wants_validation ? "Oui, 2 retouches incluses" : "Non"}</td></tr>
    <tr><th>Lien à mettre</th><td>${esc(x.link || "—")}</td></tr>
    <tr><th>Brief</th><td style="white-space:pre-wrap">${esc(x.brief || "")}</td></tr></table>
  <h2>Le prix</h2><table>
    <tr><th>Prix du créateur</th><td>${fcfa(x.price)} FCFA</td></tr>
    <tr><th>Frais de service marque</th><td>${fcfa(x.brand_fee)} FCFA</td></tr>
    <tr><th>Total payé par la marque</th><td><b>${fcfa(x.total)} FCFA</b></td></tr>
    <tr><th>Net versé au créateur</th><td>${fcfa(x.price - x.creator_fee)} FCFA, après vérification de la publication</td></tr></table>
  <h2>Règles de la campagne</h2><table>${INF_RULES().map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table>
  <h2>Engagements du créateur</h2><ul>${INF_CREATOR_CHARTER.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  <h2>Engagements de la marque</h2><ul>${INF_BRAND_TERMS.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  <h2>Dispositions communes</h2><ul>${INF_COMMON.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  <p class="muted">Les deux parties ont accepté ces conditions en ligne sur statupub.com : la marque en envoyant la réservation, le créateur en l'acceptant${x.accepted_at ? " le " + d(x.accepted_at) : ""}. Ce document fait foi sans signature manuscrite.</p>
  <div class="sig"><div>La marque<br>${esc(x.brand_company || "")}</div><div>Le créateur<br>${esc(x.influencer_name || "")}</div><div>StatuPub</div></div>
  </body></html>`);
  w.document.close();
}

/* ==================== Candidature créateur (publique) ==================== */
function viewInfApply() {
  const cats = [];
  app.innerHTML = `<div class="inf-pro"><section class="inf-hero"><div class="wrap stack" style="gap:16px">
    <span class="inf-kicker">Espace Pub Influenceur · Candidature</span>
    <h1>Tu es créateur ? Rejoins StatuPub.</h1>
    <p>Réservé aux créateurs avec une vraie audience (200 000 abonnés ou plus sur au moins un réseau). Les marques te réservent, tu es payé après chaque publication vérifiée. Tu gardes ${Math.round((1 - fees().c) * 100)} % de ton prix.</p>
  </div></section>
  <main class="wrap" style="max-width:760px;margin-top:-56px;padding-bottom:48px"><form class="card stack" id="ap-f">
    <h2 style="margin:0">Ta candidature</h2>
    <div class="grid g2"><label>Nom de créateur<input id="ap-n" required minlength="2" maxlength="80"></label><label>Téléphone / WhatsApp<input id="ap-p" type="tel" required></label></div>
    <div class="grid g3"><label>E-mail<input id="ap-e" type="email"></label><label>Ville<input id="ap-c" maxlength="60"></label><label>Pays<select id="ap-co">${countryOptions("SN")}</select></label></div>
    <div class="stack" style="gap:6px"><b class="small">Catégories (4 max)</b>${chipRow("ap-k", INF_CATS.map((c) => [c, c]), cats, "")}</div>
    <div class="stack" style="gap:10px"><b class="small">Tes réseaux : remplis ceux que tu utilises (un, plusieurs ou tous)</b>
      ${Object.entries(INF_NETS).map(([k, v]) => `<div class="row" style="gap:10px;flex-wrap:wrap;align-items:center">
        <span class="inf-soc" style="background:${INF_BG[k]};color:${k === "snapchat" ? "#111" : "#fff"}">${netIcon(k)}</span>
        <input data-url="${k}" type="url" placeholder="Lien de ton compte ${v}" style="flex:3 1 220px" aria-label="Lien ${v}">
        <input data-fo="${k}" type="number" min="0" placeholder="Abonnés" style="flex:1 1 110px" aria-label="Abonnés ${v}"></div>`).join("")}</div>
    <label>Un mot sur toi (facultatif)<textarea id="ap-m" rows="3" maxlength="800" placeholder="Ton contenu, les marques avec qui tu as déjà travaillé…"></textarea></label>
    <button class="btn btn-primary" type="submit">Envoyer ma candidature</button>
    <p class="small muted" style="margin:0">Après vérification, tu reçois sur WhatsApp ton lien d'invitation pour créer ton profil. <a href="#/conditions-influence">Lire les conditions</a></p>
  </form></main></div>`;
  bindChips($("#ap-k"), cats, null, 4);
  $("#ap-f").onsubmit = async (e) => {
    e.preventDefault(); const b = e.submitter;
    const nets = Object.keys(INF_NETS).map((k) => ({ network: k, url: app.querySelector(`[data-url="${k}"]`).value.trim(), followers: Number(app.querySelector(`[data-fo="${k}"]`).value) || 0 })).filter((n) => n.url);
    if (!nets.length) return toast("Ajoute au moins un réseau avec le lien de ton compte", true);
    if (nets.some((n) => !/^https?:\/\//i.test(n.url))) return toast("Les liens doivent commencer par https://", true);
    busy(b, true);
    try { await rpc("inf_apply", { p_name: $("#ap-n").value, p_phone: $("#ap-p").value, p_email: $("#ap-e").value, p_city: $("#ap-c").value, p_country: $("#ap-co").value, p_categories: cats, p_networks: nets, p_message: $("#ap-m").value });
      app.querySelector("main").innerHTML = `<div class="card stack" style="text-align:center;padding:36px"><h2 style="margin:0">Candidature reçue 🎉</h2><p class="muted" style="margin:0">L'équipe StatuPub vérifie tes comptes et te contacte sur WhatsApp, en général sous 48 h.</p><a class="btn btn-ghost" href="#/influence">Voir l'Espace Pub Influenceur</a></div>`; }
    catch (err) { toast(errMsg(err), true); busy(b, false); }
  };
}

/* ==================== Messagerie marque ↔ créateur ==================== */
let infChatTimer = null;
async function viewInfMessages(id) {
  clearInterval(infChatTimer);
  app.innerHTML = `<div class="spinner"></div>`;
  const admin = state.profile.role === "admin";
  const list = admin ? (await rpc("inf_admin_overview")).bookings.filter((x) => x.messages > 0 || x.id === id) : await rpc("inf_my_bookings");
  const me = state.profile.role;
  const other = (x) => me === "annonceur" ? x.influencer_name : me === "createur" ? (x.brand_company || "Marque") : `${x.brand_company || "Marque"} ↔ ${x.influencer_name}`;
  if (!id && list.length && window.innerWidth >= 860) id = list[0].id;
  app.innerHTML = `<main class="wrap"><div class="page-head"><div><p class="eyebrow">Espace Pub Influenceur</p><h1 style="font-size:2rem;margin:0">Messages</h1></div>
    <a class="btn btn-ghost btn-sm" href="${me === "annonceur" ? "#/marque" : me === "createur" ? "#/createur" : "#/admin?t=influence&s=reservations"}">Retour</a></div>
    <div class="inbox"><div class="stack" style="gap:8px" ${id && window.innerWidth < 860 ? "hidden" : ""}>${list.length ? list.map((x) => `<a class="thread" href="#/messages/${x.id}" aria-current="${x.id === id}" style="text-decoration:none">
      <div class="row between"><b>${esc(other(x))}</b>${x.unread ? `<span class="count" style="background:var(--saffron);color:#231705;border-radius:999px;padding:0 8px;font-size:.75rem;font-weight:700">${x.unread}</span>` : ""}</div>
      <div class="last">${esc(x.package_title)} · ${(INF_ST[x.status] || [x.status])[0]}</div></a>`).join("") : `<div class="empty small">Pas encore de conversation. Une conversation s'ouvre avec chaque réservation.</div>`}</div>
    <div id="ch-box">${id ? `<div class="spinner"></div>` : `<div class="empty">Choisis une conversation.</div>`}</div></div></main>`;
  if (!id) return;
  const box = $("#ch-box");
  let data;
  const paint = (keepDraft) => {
    const b = data.booking; const draft = keepDraft ? $("#ch-t")?.value || "" : "";
    const who = { brand: b.brand_company || "Marque", creator: b.influencer_name, admin: "StatuPub" };
    box.innerHTML = `<div class="conv"><div class="chat-head">${infAva(b.influencer_avatar, b.influencer_name)}<div style="flex:1;min-width:0"><b>${esc(data.me === "creator" ? b.brand_company || "Marque" : data.me === "brand" ? b.influencer_name : who.brand + " ↔ " + who.creator)}</b>
        <div class="small" style="opacity:.8">${esc(b.package_title)}${b.product ? " · " + esc(b.product) : ""}</div></div>${window.innerWidth < 860 ? `<a class="btn btn-ghost btn-sm" style="color:inherit" href="#/messages">Retour</a>` : ""}</div>
      <div class="chat-msgs" id="ch-msgs">
        <div class="notice info small" style="align-self:center;max-width:520px"><span>Les numéros, e-mails et liens WhatsApp sont masqués : toute la campagne et le paiement passent par StatuPub pour vous protéger tous les deux.</span></div>
        ${data.messages.map((m) => `<div class="msg ${m.role === data.me ? "me" : "them"}">${m.role !== data.me ? `<b style="display:block;font-size:.75rem">${esc(who[m.role])}</b>` : ""}${esc(m.body)}<small>${dateTimeFr(m.at)}${m.masked ? " · contact masqué" : ""}</small></div>`).join("")}
      </div>
      <form class="chat-form" id="ch-f"><textarea id="ch-t" rows="1" maxlength="2000" placeholder="Écris ton message…" aria-label="Message">${esc(draft)}</textarea><button class="btn btn-primary" type="submit">Envoyer</button></form></div>`;
    const ms = $("#ch-msgs"); ms.scrollTop = ms.scrollHeight;
    const t = $("#ch-t");
    t.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 860) { e.preventDefault(); $("#ch-f").requestSubmit(); } };
    $("#ch-f").onsubmit = async (e) => { e.preventDefault(); const txt = t.value.trim(); if (!txt) return; const btn = e.submitter; busy(btn, true);
      try { await rpc("inf_send_message", { p_booking: id, p_body: txt }); t.value = ""; await load(false); } catch (err) { toast(errMsg(err), true); } busy(btn, false); };
    if (keepDraft) t.focus();
  };
  const load = async (keep) => { const n = await rpc("inf_messages", { p_booking: id }); const changed = !data || n.messages.length !== data.messages.length; data = n; if (changed) paint(keep); };
  try { await load(false); } catch (e) { box.innerHTML = `<div class="notice warn">${esc(errMsg(e))}</div>`; return; }
  const hash = location.hash;
  infChatTimer = setInterval(() => { if (location.hash !== hash) return clearInterval(infChatTimer); if (!document.hidden) load(true).catch(() => {}); }, 6000);
}

/* ==================== Devis IA (admin) ==================== */
async function aiCall(body) {
  const { data: r, error } = await sb.functions.invoke("ai", { body });
  if (error) { let m = error.message; try { m = (await error.context.json()).error || m; } catch {} throw new Error(m); }
  if (r?.error) throw new Error(r.error);
  return r;
}
const qTotals = (items, fee) => { const sub = items.reduce((s, x) => s + (Number(x.price) || 0), 0), f = Math.round(sub * fee); return { subtotal: sub, fee: f, total: sub + f, reach: items.reduce((s, x) => s + (Number(x.reach) || 0), 0) }; };
const dLong = (v) => v ? new Date(v + (String(v).length === 10 ? "T12:00:00" : "")).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" }) : "à fixer";

async function adminQuotes(box, ov) {
  const { data: list } = await sb.from("influence_quotes").select("*").order("created_at", { ascending: false }).limit(60);
  const ST = { draft: "Brouillon", sent: "Envoyé", accepted: "Accepté", refused: "Refusé", expired: "Expiré" };
  box.innerHTML = `<div class="row between" style="flex-wrap:wrap;gap:10px"><p class="muted" style="margin:0">Décris le besoin d'une marque : l'IA choisit les créateurs, calcule le devis et prépare le plan de campagne.</p><button class="btn btn-primary btn-sm" id="q-new">🤖 Nouveau devis IA</button></div>
    ${(list || []).length ? `<div class="table"><table><thead><tr><th>N°</th><th>Marque</th><th>Créateurs</th><th>Total</th><th>Statut</th><th></th></tr></thead><tbody>${list.map((q) => `<tr><td><b>${esc(q.number)}</b><div class="small muted">${dateTimeFr(q.created_at)}</div></td><td>${esc(q.brand_name)}</td>
      <td class="small">${esc((q.items || []).map((x) => x.influencer_name).join(", "))}</td><td>${money(q.total)}</td><td>${ST[q.status] || q.status}</td><td><button class="btn btn-ghost btn-sm" data-q="${q.id}">Ouvrir</button></td></tr>`).join("")}</tbody></table></div>`
      : `<div class="empty">Aucun devis pour l'instant.</div>`}`;
  $("#q-new").onclick = () => quoteEditor(box, ov, null);
  box.querySelectorAll("[data-q]").forEach((b) => b.onclick = () => quoteEditor(box, ov, list.find((q) => q.id === b.dataset.q)));
}

async function quoteEditor(box, ov, q) {
  const fee = fees().b;
  const st = { token: q?.token || "", id: q?.id || null, number: q?.number || "", status: q?.status || "draft", req: { ...(q?.request || {}) }, brand_id: q?.brand_id || null, brand_name: q?.brand_name || "", contact: q?.contact || "",
    ai: q ? { summary: q.request?.summary || "", questions: q.request?.questions || [], options: q.options || [], plan: q.plan || [] } : null, chosen: q?.chosen || 0, valid: q?.valid_until || "" };
  if (st.ai && st.ai.options[st.chosen]) st.ai.options[st.chosen].items = q.items || st.ai.options[st.chosen].items;
  const nets = [...(st.req.networks || [])];
  const { data: pkAll } = await sb.from("influencer_packages").select("id, influencer_id, title, price, on_request, networks, network, influencers(display_name, status)").eq("active", true);
  const pkList = (pkAll || []).filter((p) => ["verified", "certified"].includes(p.influencers?.status));
  box.innerHTML = `<div class="row between" style="flex-wrap:wrap;gap:10px"><h2 style="margin:0">${st.number ? "Devis " + esc(st.number) : "Nouveau devis IA"}</h2><button class="btn btn-ghost btn-sm" id="q-back">← Tous les devis</button></div>
    <form class="card stack" id="q-f">
      <div class="grid g2"><label>Marque<input id="q-brand" list="q-brands" required value="${esc(st.brand_name)}" placeholder="Nom de l'entreprise"><datalist id="q-brands">${ov.brands.map((b) => `<option value="${esc(b.company)}">`).join("")}</datalist></label>
        <label>Contact (WhatsApp)<input id="q-contact" type="tel" value="${esc(st.contact)}" placeholder="+221…"></label></div>
      <label>Besoin de la marque<textarea id="q-need" rows="4" required minlength="10" placeholder="Ex. : Lancement d'un parfum pour femmes 18-35 ans à Dakar, on veut des vidéos naturelles qui montrent le produit, campagne en décembre.">${esc(st.req.need || "")}</textarea></label>
      <div class="grid g4"><label>Budget total (F)<input id="q-budget" type="number" min="0" step="5000" value="${esc(st.req.budget || "")}"></label><label>Début<input id="q-start" type="date" value="${esc(st.req.start || "")}"></label>
        <label>Fin<input id="q-end" type="date" value="${esc(st.req.end || "")}"></label><label>Pays<select id="q-country"><option value="">Tous</option>${countryOptions(st.req.country || "")}</select></label></div>
      <label>Ville (facultatif)<input id="q-city" value="${esc(st.req.city || "")}"></label>
      <div class="stack" style="gap:6px"><b class="small">Réseaux souhaités</b>${chipRow("q-nets", Object.entries(INF_NETS), nets, "Libre")}</div>
      <div class="row"><button class="btn btn-primary" type="submit">🤖 ${st.ai ? "Régénérer avec l'IA" : "Générer le devis avec l'IA"}</button><span class="small muted">L'IA met environ 20 à 40 secondes.</span></div>
    </form><div id="q-out" class="stack" style="margin-top:16px"></div>`;
  bindChips($("#q-nets"), nets, null);
  $("#q-back").onclick = () => adminQuotes(box, ov);
  const readForm = () => { st.brand_name = $("#q-brand").value.trim(); st.contact = $("#q-contact").value.trim(); st.brand_id = ov.brands.find((b) => b.company.toLowerCase() === st.brand_name.toLowerCase())?.id || null;
    Object.assign(st.req, { brand: st.brand_name, need: $("#q-need").value.trim(), budget: Number($("#q-budget").value) || 0, start: $("#q-start").value, end: $("#q-end").value, country: $("#q-country").value, city: $("#q-city").value.trim(), networks: [...nets] }); };
  $("#q-f").onsubmit = async (e) => {
    e.preventDefault(); readForm(); const b = e.submitter; busy(b, true); b.textContent = "L'IA prépare le devis…";
    try { const r = await aiCall({ action: "inf_quote", ...st.req }); st.ai = r; st.chosen = 0; draw(); toast("Devis proposé : vérifie et ajuste avant d'envoyer"); }
    catch (err) { toast(errMsg(err), true); }
    busy(b, false);
  };
  const out = $("#q-out");
  const cur = () => st.ai?.options?.[st.chosen];
  function draw() {
    if (!st.ai) { out.innerHTML = ""; return; }
    const o = cur(); const t = qTotals(o.items, fee); const budget = Number(st.req.budget) || 0;
    out.innerHTML = `${st.ai.summary ? `<div class="notice info"><div><b>Besoin compris par l'IA</b><p class="small" style="margin:4px 0 0">${esc(st.ai.summary)}</p></div></div>` : ""}
      ${(st.ai.questions || []).length ? `<div class="notice warn"><div><b>À demander à la marque</b><ul class="small" style="margin:4px 0 0;padding-left:18px">${st.ai.questions.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>` : ""}
      ${cur().note ? `<div class="notice warn"><div><b>Note interne (pas sur le devis)</b><p class="small" style="margin:4px 0 0">${esc(cur().note)}</p></div></div>` : ""}
      <div class="inf-chips">${st.ai.options.map((x, i) => { const tt = qTotals(x.items, fee); return `<button type="button" class="inf-chip" data-opt="${i}" aria-pressed="${i === st.chosen}">${esc(x.name)} · ${fcfa(tt.total)} F</button>`; }).join("")}</div>
      <section class="card stack">
        <div><h3 style="margin:0">Option « ${esc(o.name)} »</h3>${o.strategy ? `<p class="small muted" style="margin:4px 0 0">${esc(o.strategy)}</p>` : ""}</div>
        <label class="small">Pourquoi cette option (visible sur le devis)<textarea id="q-why" rows="3">${esc(o.why || "")}</textarea></label>
        <div class="table"><table><thead><tr><th>Créateur</th><th>Formule</th><th>Date</th><th>Prix (F)</th><th>Vues est.</th><th></th></tr></thead><tbody>
          ${o.items.map((x, i) => `<tr><td><b>${esc(x.influencer_name)}</b>${x.certified ? ' <span class="inf-badge" style="font-size:.65rem;padding:2px 6px">✓</span>' : ""}<details class="small"><summary>Brief</summary><textarea data-brief="${i}" rows="5" style="margin-top:6px">${esc(x.brief || "")}</textarea></details></td>
            <td>${esc(x.package_title)}<div>${pkNets({ networks: x.networks })}</div>${x.on_request ? `<div class="small" style="color:#8A3B2E">Prix sur demande : fixe-le</div>` : ""}</td>
            <td><input type="date" data-date="${i}" value="${esc(x.date || "")}" style="min-width:140px"><input data-time="${i}" value="${esc(x.time || "")}" placeholder="19:00" style="margin-top:4px;max-width:90px"></td>
            <td><input type="number" min="0" step="1000" data-price="${i}" value="${x.price || 0}" style="max-width:120px"></td><td>${kfmt(x.reach)}</td>
            <td><button type="button" class="btn btn-ghost btn-sm" data-rm="${i}" aria-label="Retirer">✕</button></td></tr>`).join("")}
        </tbody></table></div>
        <div class="row" style="gap:8px;flex-wrap:wrap"><select id="q-add" style="max-width:420px"><option value="">+ Ajouter un créateur / une formule…</option>${pkList.map((p) => `<option value="${p.id}">${esc(p.influencers.display_name)} · ${esc(p.title)} · ${p.on_request ? "sur demande" : fcfa(p.price) + " F"}</option>`).join("")}</select></div>
        <div class="stack small" style="gap:4px;border-top:1px solid var(--line);padding-top:10px;max-width:420px;margin-left:auto;width:100%">
          <div class="row between"><span>Prix des créateurs</span><b>${fcfa(t.subtotal)} F</b></div><div class="row between"><span>Frais de service (${Math.round(fee * 100)} %)</span><b>${fcfa(t.fee)} F</b></div>
          <div class="row between" style="font-size:1.05rem"><span>Total</span><b>${fcfa(t.total)} F</b></div><div class="row between muted"><span>Vues estimées</span><span>${kfmt(t.reach)}</span></div>
          ${budget && t.total > budget ? `<div class="notice warn small"><span>Dépasse le budget de ${fcfa(t.total - budget)} F.</span></div>` : budget ? `<div class="small muted">Reste sur le budget : ${fcfa(budget - t.total)} F</div>` : ""}</div>
      </section>
      <section class="card stack"><h3 style="margin:0">Plan de travail</h3>
        ${(st.ai.plan || []).map((p, i) => `<div class="row" style="gap:8px;flex-wrap:wrap"><input type="date" data-pd="${i}" value="${esc(p.date || "")}" style="max-width:160px"><input data-pe="${i}" value="${esc(p.etape)}" style="flex:3 1 260px"><input data-pq="${i}" value="${esc(p.qui || "")}" placeholder="Qui" style="flex:1 1 110px"><button type="button" class="btn btn-ghost btn-sm" data-prm="${i}">✕</button></div>`).join("")}
        <button type="button" class="btn btn-ghost btn-sm" id="q-padd" style="align-self:flex-start">+ Ajouter une étape</button></section>
      <div class="row" style="gap:8px;flex-wrap:wrap"><label class="small">Valable jusqu'au<input type="date" id="q-valid" value="${esc(st.valid || new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10))}"></label>
        <label class="small">Statut<select id="q-st">${[["draft", "Brouillon"], ["sent", "Envoyé"], ["accepted", "Accepté"], ["refused", "Refusé"]].map(([k, l]) => `<option value="${k}" ${k === st.status ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn btn-primary" id="q-save">Enregistrer</button><button class="btn btn-ink" id="q-pdf">📄 Devis + plan (PDF)</button><button class="btn btn-ghost" id="q-link">🔗 Copier le lien du devis</button><button class="btn btn-ok" id="q-wa">Envoyer sur WhatsApp</button></div>
      <p class="small muted" style="margin:0">La marque ouvre le lien, accepte et paie en ligne : les réservations sont créées toutes seules au prix du devis.</p>`;
    const o2 = cur();
    out.querySelectorAll("[data-opt]").forEach((b) => b.onclick = () => { sync(); st.chosen = Number(b.dataset.opt); draw(); });
    out.querySelectorAll("[data-price]").forEach((i) => i.onchange = () => { o2.items[i.dataset.price].price = Math.max(0, Number(i.value) || 0); sync(); draw(); });
    out.querySelectorAll("[data-rm]").forEach((b) => b.onclick = () => { sync(); o2.items.splice(Number(b.dataset.rm), 1); draw(); });
    out.querySelectorAll("[data-prm]").forEach((b) => b.onclick = () => { sync(); st.ai.plan.splice(Number(b.dataset.prm), 1); draw(); });
    $("#q-padd").onclick = () => { sync(); st.ai.plan.push({ date: "", etape: "", qui: "" }); draw(); };
    $("#q-add").onchange = async (e) => { const p = pkList.find((x) => x.id === e.target.value); if (!p) return; sync();
      const { data: nn } = await sb.from("influencer_networks").select("network, followers, avg_views").eq("influencer_id", p.influencer_id);
      const pn = p.networks?.length ? p.networks : p.network && p.network !== "multi" ? [p.network] : [];
      o2.items.push({ influencer_id: p.influencer_id, influencer_name: p.influencers.display_name, certified: p.influencers.status === "certified", package_id: p.id, package_title: p.title, networks: pn,
        price: p.on_request ? 0 : p.price, on_request: p.on_request, date: "", time: "", brief: "", reach: (nn || []).filter((n) => !pn.length || pn.includes(n.network)).reduce((s, n) => s + (Number(n.avg_views) || Math.round(n.followers * 0.2)), 0) });
      draw(); };
    $("#q-save").onclick = (e) => save(e.target);
    const ready = () => { sync(); const miss = cur().items.filter((x) => !(Number(x.price) > 0));
      if (miss.length) { toast(`Fixe le prix de : ${miss.map((x) => x.influencer_name).join(", ")} (formule sur demande)`, true); return false; }
      if (!cur().items.length) { toast("Ajoute au moins un créateur", true); return false; } return true; };
    $("#q-pdf").onclick = async (e) => { if (!ready()) return; const w = window.open("", "_blank"); if (!(await save(e.target))) { w?.close(); return; } quoteDoc(st, fee, w); };
    $("#q-link").onclick = async (e) => { if (!ready()) return; if (!(await save(e.target))) return; if (st.status === "draft") { st.status = "sent"; $("#q-st").value = "sent"; await save(e.target); } copy(`https://statupub.com/devis/?t=${st.token}`); };
    $("#q-wa").onclick = async (e) => { if (!ready()) return; if (st.status === "draft") { st.status = "sent"; const sel = $("#q-st"); if (sel) sel.value = "sent"; } if (!(await save(e.target))) return; const t2 = qTotals(cur().items, fee); const tel = String(st.contact || "").replace(/\D/g, "");
      const msg = `Bonjour ${st.brand_name},\n\nVoici notre proposition de campagne influenceurs StatuPub${st.number ? " (devis " + st.number + ")" : ""} :\n\n${cur().items.map((x) => `• ${x.influencer_name} · ${x.package_title}${x.date ? " · " + dLong(x.date) : ""} : ${fcfa(x.price)} F`).join("\n")}\n\nFrais de service : ${fcfa(t2.fee)} F\nTotal : ${fcfa(t2.total)} F CFA\nVues estimées : ${kfmt(t2.reach)}\n\nVoir le devis, l'accepter et payer en ligne (Wave, Orange Money, carte) :\nhttps://statupub.com/devis/?t=${st.token}\n\nLe paiement est sécurisé : les créateurs sont payés seulement après la publication vérifiée.`;
      window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank", "noopener"); };
  }
  function sync() {
    const o = cur(); if (!o) return;
    const why = $("#q-why"); if (why) o.why = why.value;
    out.querySelectorAll("[data-date]").forEach((i) => { o.items[i.dataset.date].date = i.value; });
    out.querySelectorAll("[data-time]").forEach((i) => { o.items[i.dataset.time].time = i.value; });
    out.querySelectorAll("[data-brief]").forEach((i) => { o.items[i.dataset.brief].brief = i.value; });
    out.querySelectorAll("[data-pe]").forEach((i) => { const k = i.dataset.pe; st.ai.plan[k] = { date: out.querySelector(`[data-pd="${k}"]`).value, etape: i.value, qui: out.querySelector(`[data-pq="${k}"]`).value }; });
    st.valid = $("#q-valid")?.value || st.valid; st.status = $("#q-st")?.value || st.status;
  }
  async function save(btn) {
    readForm(); sync(); if (!st.brand_name) return toast("Indique le nom de la marque", true);
    const o = cur(); const t = qTotals(o.items, fee); st.ai.plan = st.ai.plan.filter((p) => p.etape.trim());
    const row = { brand_id: st.brand_id, brand_name: st.brand_name, contact: st.contact || null, request: { ...st.req, summary: st.ai.summary, questions: st.ai.questions },
      options: st.ai.options, chosen: st.chosen, items: o.items, plan: st.ai.plan, ...t, status: st.status, valid_until: st.valid || null, updated_at: new Date().toISOString() };
    busy(btn, true);
    try { const r = st.id ? await sb.from("influence_quotes").update(row).eq("id", st.id).select().single() : await sb.from("influence_quotes").insert(row).select().single();
      if (r.error) throw r.error; st.id = r.data.id; st.number = r.data.number; st.token = r.data.token; toast("Devis " + st.number + " enregistré");
      const h2 = box.querySelector("h2"); if (h2) h2.textContent = "Devis " + st.number; busy(btn, false); return true; }
    catch (e) { toast(errMsg(e), true); }
    busy(btn, false); return false;
  }
  draw();
}

function quoteDoc(st, fee, win) {
  const o = st.ai.options[st.chosen]; const t = qTotals(o.items, fee);
  const w = win || window.open("", "_blank"); if (!w) return toast("Autorise les fenêtres pour ouvrir le devis", true);
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const plan = [...(st.ai.plan || [])].filter((p) => p.etape).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Devis ${esc(st.number || "")} · ${esc(st.brand_name)}</title>
  <style>@page{size:A4;margin:0}.pg{width:100%;border-collapse:collapse}.pg>thead td,.pg>tfoot td{height:0;padding:0;border:0}.pg>tbody>tr>td{padding:0;border:0}
  @media print{.pg>thead td,.pg>tfoot td{height:14mm}body{padding:0 16mm!important}.noprint{display:none}}body{font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:#10201D;max-width:820px;margin:20px auto;padding:0 16px}
  .hd{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid #E8A33D;padding-bottom:14px}.logo{font-weight:800;font-size:26px;color:#0E3B36}.logo span{color:#E8A33D}
  h1{font-size:22px;margin:0}h2{font-size:16px;color:#0E3B36;margin:24px 0 8px}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #E3E0D8;padding:8px;text-align:left;vertical-align:top}th{background:#F6F4EF;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
  .r{text-align:right}.muted{color:#55625F;font-size:12px}.tot{width:380px;max-width:100%;margin-left:auto}.tot .r{white-space:nowrap}.tot td{border:0;padding:4px 8px}.tot .g td{font-size:17px;font-weight:800;border-top:2px solid #0E3B36}
  .box{background:#F6F4EF;border-radius:10px;padding:12px 14px}.tl{border-left:3px solid #E8A33D;margin-left:6px;padding-left:16px}.tl div{margin:0 0 10px}.tl b{color:#0E3B36}
  .brief{border:1px solid #E3E0D8;border-radius:10px;padding:10px 12px;margin-bottom:10px;break-inside:avoid;white-space:pre-wrap}button{margin:0 0 16px;padding:10px 16px;border:0;border-radius:10px;background:#0E3B36;color:#fff;font-weight:700;cursor:pointer}
  @media print{button{display:none}body{margin:0}}</style></head><body>
  <div class="noprint"><button onclick="print()">Imprimer / enregistrer en PDF</button></div>
  <table class="pg"><thead><tr><td></td></tr></thead><tfoot><tr><td></td></tr></tfoot><tbody><tr><td>
  <div class="hd"><div><div class="logo">Statu<span>Pub</span></div><div class="muted">Espace Pub Influenceur · West Africa SN Production · statupub.com</div></div>
    <div style="text-align:right"><h1>DEVIS ${esc(st.number || "(brouillon)")}</h1><div class="muted">Émis le ${today}<br>Valable jusqu'au ${st.valid ? new Date(st.valid + "T12:00:00").toLocaleDateString("fr-FR") : "—"}</div></div></div>
  <p><b>Client :</b> ${esc(st.brand_name)}${st.contact ? " · " + esc(st.contact) : ""}</p>
  ${st.ai.summary ? `<div class="box"><b>Votre besoin</b><br>${esc(st.ai.summary)}</div>` : ""}
  <h2>Proposition : ${esc(o.name)}</h2>${o.why ? `<p>${esc(o.why)}</p>` : ""}
  <table><thead><tr><th>Créateur</th><th>Prestation</th><th>Publication</th><th class="r">Vues est.</th><th class="r">Prix</th></tr></thead><tbody>
  ${o.items.map((x) => `<tr><td><b>${esc(x.influencer_name)}</b>${x.certified ? " ✓" : ""}</td><td>${esc(x.package_title)}<div class="muted">${esc((x.networks || []).map((n) => INF_NETS[n] || n).join(", "))}</div></td><td>${esc(dLong(x.date))}${x.time ? " · " + esc(x.time) : ""}</td><td class="r">${kfmt(x.reach)}</td><td class="r">${fcfa(x.price)} F</td></tr>`).join("")}
  </tbody></table>
  <table class="tot"><tr><td>Prix des créateurs</td><td class="r">${fcfa(t.subtotal)} F</td></tr><tr><td>Frais de service StatuPub (${Math.round(fee * 100)} %)</td><td class="r">${fcfa(t.fee)} F</td></tr><tr class="g"><td>Total</td><td class="r">${fcfa(t.total)} F CFA</td></tr><tr><td class="muted">Vues estimées</td><td class="r muted">${kfmt(t.reach)}</td></tr></table>
  <p class="muted">Les vues sont une estimation basée sur les vues moyennes récentes des créateurs, pas une garantie. Paiement sécurisé par StatuPub : l'argent est bloqué pendant la campagne et les créateurs sont payés après la publication vérifiée.</p>
  ${plan.length ? `<h2>Plan de travail</h2><div class="tl">${plan.map((p) => `<div><b>${esc(p.date ? dLong(p.date) : "")}</b>${p.qui ? ` · <span class="muted">${esc(p.qui)}</span>` : ""}<br>${esc(p.etape)}</div>`).join("")}</div>` : ""}
  <h2>Conditions</h2><table>${INF_RULES().filter(([k]) => k !== "Commission" && k !== "Paiement du créateur").map(([k, v]) => `<tr><th style="width:32%">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table>
  ${o.items.some((x) => x.brief) ? `<h2>Annexe : briefs par créateur</h2>${o.items.filter((x) => x.brief).map((x) => `<div class="brief"><b>${esc(x.influencer_name)} · ${esc(x.package_title)}</b>\n${esc(x.brief)}</div>`).join("")}` : ""}
  <p class="muted" style="margin-top:24px">Bon pour accord (date, nom, cachet) :</p><div style="height:70px;border:1px dashed #C9C4B8;border-radius:10px"></div>
  </td></tr></tbody></table></body></html>`);
  w.document.close();
}

/* ==================== Devis en ligne (marque) ==================== */
async function viewQuotePublic(token, q) {
  token = String(token || "").toLowerCase().replace(/[^a-f0-9]/g, "");
  app.innerHTML = `<div class="spinner"></div>`;
  const d = await rpc("inf_quote_public", { p_token: token });
  if (!d) { app.innerHTML = `<main class="wrap"><div class="empty">Ce devis n'existe pas. Vérifiez le lien reçu ou contactez StatuPub.</div></main>`; return; }
  try { localStorage.setItem("sp_quote", token); } catch {}
  const pay = new URLSearchParams(q || "").get("paiement");
  const me = state.profile; const isBrand = me?.role === "annonceur";
  const wallet = isBrand ? await rpc("annonceur_wallet").then((r) => r[0]).catch(() => null) : null;
  const av = Number(wallet?.available) || 0, missing = Math.max(0, d.total - av);
  const accepted = d.status === "accepted";
  if (accepted) { try { localStorage.removeItem("sp_quote"); } catch {} }
  const plan = [...(d.plan || [])].filter((p) => p.etape).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  app.innerHTML = `<div class="inf-pro"><section class="inf-hero" style="padding-bottom:96px"><div class="wrap stack" style="gap:12px">
      <span class="inf-kicker">Devis ${esc(d.number)} · Espace Pub Influenceur</span>
      <h1>Votre campagne influenceurs, ${esc(d.brand_name)}</h1>
      <p>${d.summary ? esc(d.summary) : "Voici la proposition préparée par l'équipe StatuPub."}</p></div></section>
    <main class="wrap" style="margin-top:-64px;padding-bottom:48px"><div class="inf-layout" style="margin-top:0">
      <div class="inf-main">
        <section class="card stack"><div class="row between" style="flex-wrap:wrap"><h2 style="margin:0">${esc(d.option?.name || "Notre proposition")}</h2><span class="small muted">Valable jusqu'au ${new Date(d.valid_until + "T12:00:00").toLocaleDateString("fr-FR")}</span></div>
          ${d.option?.why ? `<p style="margin:0;line-height:1.6">${esc(d.option.why)}</p>` : ""}
          ${d.items.map((x) => `<div class="inf-req">${infAva(x.avatar, x.influencer_name)}<div style="flex:1;min-width:200px"><b>${x.slug ? `<a href="#/influence/${esc(x.slug)}">${esc(x.influencer_name)}</a>` : esc(x.influencer_name)}</b>${x.certified ? ` <span class="inf-badge" style="font-size:.7rem;padding:3px 8px">✓ Certifié</span>` : ""}
              <div class="small muted">${esc(x.package_title)} · ${esc((x.networks || []).map((n) => INF_NETS[n] || n).join(", "))} · ${esc(dLong(x.date))}${x.time ? " · " + esc(x.time) : ""}</div>
              ${x.brief ? `<details class="small" style="margin-top:4px"><summary>Idée de la vidéo</summary><p style="white-space:pre-wrap;margin:6px 0 0">${esc(x.brief)}</p></details>` : ""}</div>
            <div style="text-align:right"><span class="inf-price">${fcfa(x.price)} F</span><div class="small muted">${kfmt(x.reach)} vues est.</div></div></div>`).join("")}
        </section>
        ${plan.length ? `<section class="card stack"><h2 style="margin:0">Le déroulé</h2><div style="border-left:3px solid var(--saffron);padding-left:16px;margin-left:6px" class="stack">${plan.map((p) => `<div><b>${esc(p.date ? dLong(p.date) : "")}</b>${p.qui ? ` <span class="small muted">· ${esc(p.qui)}</span>` : ""}<div>${esc(p.etape)}</div></div>`).join("")}</div></section>` : ""}
        <section class="card stack"><h2 style="margin:0">Vos garanties</h2><div class="table"><table><tbody>${INF_RULES().filter(([k]) => !["Commission", "Paiement du créateur"].includes(k)).map(([k, v]) => `<tr><th style="text-align:left;width:34%">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div></section>
      </div>
      <aside class="inf-aside qp-aside"><div class="card stack" style="gap:12px" id="qp-box">
        <div class="stack small" style="gap:4px"><div class="row between"><span>Prix des créateurs</span><b>${fcfa(d.subtotal)} F</b></div><div class="row between"><span>Frais de service (${Math.round(fees().b * 100)} %)</span><b>${fcfa(d.fee)} F</b></div>
          <div class="row between" style="font-size:1.15rem"><span>Total</span><b>${fcfa(d.total)} F CFA</b></div><div class="row between muted"><span>Vues estimées</span><span>${kfmt(d.reach)}</span></div></div>
        <div id="qp-act" class="stack" style="gap:10px"></div>
        <p class="small muted" style="margin:0">Paiement sécurisé par StatuPub : votre argent est bloqué pendant la campagne, les créateurs sont payés seulement après la publication vérifiée. Créateur qui refuse = remboursement automatique.</p>
      </div></aside></div></main></div>`;
  const act = $("#qp-act");
  if (accepted) { act.innerHTML = `<div class="notice ok"><span><b>Devis accepté ✓</b> Les créateurs ont reçu votre demande.</span></div>${d.mine ? `<a class="btn btn-primary" href="#/marque">Suivre ma campagne</a>` : ""}`; return; }
  if (d.expired || ["refused", "expired"].includes(d.status)) { act.innerHTML = `<div class="notice warn"><span>Ce devis n'est plus valable. Contactez StatuPub pour une nouvelle proposition.</span></div>`; return; }
  if (!me) {
    try { sessionStorage.setItem("sp_after", location.hash.split("?")[0]); } catch {}
    act.innerHTML = `<p class="small" style="margin:0">Pour accepter, créez votre compte marque en 1 minute (ou connectez-vous).</p>
      <a class="btn btn-primary" href="#/inscription?role=annonceur">Créer mon compte et accepter</a><a class="btn btn-ghost" href="#/connexion">J'ai déjà un compte</a>`; return;
  }
  if (!isBrand) { act.innerHTML = `<div class="notice warn"><span>Vous êtes connecté avec un compte ${esc(me.role)}. Connectez-vous avec un compte marque (annonceur) pour accepter ce devis.</span></div>`; return; }
  let termsOk = false; try { termsOk = sessionStorage.getItem("sp_qterms") === token; } catch {}
  act.innerHTML = `<label class="row small" style="gap:8px;font-weight:500;align-items:flex-start"><input type="checkbox" id="qp-terms" style="width:auto;margin-top:3px" ${termsOk ? "checked" : ""}> J'accepte ce devis et les <a href="#/conditions-influence" target="_blank">conditions de l'Espace Pub Influenceur</a></label>
    ${av > 0 ? `<div class="small muted">Votre solde StatuPub : ${fcfa(av)} F${missing ? ` · reste à payer : <b>${fcfa(missing)} F</b>` : " (suffisant)"}</div>` : ""}
    <button class="btn btn-primary" id="qp-go">${missing ? `Accepter et payer ${fcfa(Math.max(missing, 1000))} F` : "Accepter le devis"}</button>
    <div class="small muted" style="text-align:center">Wave · Orange Money · Free Money · carte bancaire</div>`;
  const accept = async (btn) => {
    busy(btn, true);
    try { await rpc("inf_quote_accept", { p_token: token, p_accept_terms: true }); try { sessionStorage.removeItem("sp_qterms"); localStorage.removeItem("sp_quote"); } catch {}
      toast("Devis accepté ! Les créateurs ont reçu votre demande."); location.hash = "#/marque"; return true; }
    catch (e) { const m = String(e?.message || ""); if (/^SOLDE:/.test(m)) { busy(btn, false); return false; } toast(errMsg(e), true); busy(btn, false); return null; }
  };
  $("#qp-go").onclick = async (e) => {
    const btn = e.currentTarget;
    if (!$("#qp-terms").checked) return toast("Cochez la case pour accepter le devis et les conditions", true);
    try { sessionStorage.setItem("sp_qterms", token); } catch {}
    if (!missing) { const r = await accept(btn); if (r === false) toast("Solde insuffisant, actualisez la page.", true); return; }
    busy(btn, true);
    try { const r = await payApi("checkout", { amount: Math.max(missing, 1000), quote: token }); location.href = r.url; }
    catch (err) { toast(errMsg(err), true); busy(btn, false); }
  };
  if (pay === "ok") {
    history.replaceState(null, "", location.pathname + "#/devis/" + token);
    toast("Paiement reçu, validation du devis…");
    // le serveur accepte normalement le devis tout seul après le paiement ; on vérifie et on complète si besoin
    setTimeout(async () => { const again = await rpc("inf_quote_public", { p_token: token }).catch(() => null);
      if (again?.status === "accepted") { toast("Devis accepté ! Les créateurs ont reçu votre demande."); location.hash = "#/marque"; return; }
      if (termsOk && !missing) accept($("#qp-go")); }, 1200);
  } else if (pay === "annule") { history.replaceState(null, "", location.pathname + "#/devis/" + token); toast("Paiement annulé. Vous pouvez réessayer.", true); }
  else if (pay) { history.replaceState(null, "", location.pathname + "#/devis/" + token); toast("Paiement en cours de confirmation : actualisez dans un instant."); }
}
