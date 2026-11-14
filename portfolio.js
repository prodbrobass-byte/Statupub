/* ===== Portfolio privé (admin) : profil, œuvres, liens personnels ===== */
/* global sb, esc, toast, errMsg, openModal, closeModal, copy, busy, infCrop, dateTimeFr */
const PF_CAT = { realisation: "Réalisation", cadrage: "Cadrage", montage: "Montage", motion: "Motion design", web: "Développement web", photo: "Photo" };
const PF_MEDIA = { none: "Aucun média", youtube: "YouTube", vimeo: "Vimeo", video: "Vidéo envoyée", image: "Image", link: "Lien seulement" };
const pfCats = (i) => (i.categories && i.categories.length ? i.categories : [i.category]);
const pfUrl = (t) => location.origin + "/portfolio/?k=" + t;
const pfLines = (s) => String(s || "").split(/\n|,/).map((x) => x.trim()).filter(Boolean);

async function pfUpload(file, folder) {
  const ext = (file.name || "img.jpg").split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.type === "image/jpeg" && !file.name ? "jpg" : ext}`;
  const { error } = await sb.storage.from("portfolio").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) throw error;
  return sb.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
}
const pfPick = (accept) => new Promise((res) => { const i = document.createElement("input"); i.type = "file"; i.accept = accept; i.onchange = () => res(i.files[0] || null); i.click(); });

async function adminPortfolio(body, reload) {
  const sub = new URLSearchParams(location.hash.split("?")[1] || "").get("s") || "oeuvres";
  const go = (s) => { location.hash = "#/admin?t=portfolio&s=" + s; };
  body.innerHTML = `<div class="stack" style="gap:16px">
    <div class="notice">🔒 Ton portfolio n'est visible qu'avec un lien personnel. Crée un lien par client dans « Liens privés », tu sais qui l'a ouvert et tu peux le couper à tout moment.</div>
    <div class="row" style="gap:8px;flex-wrap:wrap">${[["oeuvres", "Œuvres"], ["profil", "Profil"], ["liens", "Liens privés"]].map(([k, l]) => `<button class="btn btn-sm ${k === sub ? "" : "btn-ghost"}" data-ps="${k}">${l}</button>`).join("")}</div>
    <div id="pf-body"><div class="spinner"></div></div></div>`;
  body.querySelectorAll("[data-ps]").forEach((b) => b.onclick = () => go(b.dataset.ps));
  const el = body.querySelector("#pf-body");
  if (sub === "profil") return pfProfile(el);
  if (sub === "liens") return pfLinks(el);
  return pfItems(el, reload);
}

/* ---------- Profil ---------- */
async function pfProfile(el) {
  const { data: p, error } = await sb.from("portfolio_profile").select("*").eq("id", 1).single();
  if (error) throw error;
  const stats = (p.stats || []).map((s) => `${s.value} | ${s.label}`).join("\n");
  const soc = p.socials || {};
  const img = (u, w, h, r) => u ? `<img src="${esc(u)}" alt="" style="width:${w};height:${h};object-fit:cover;border-radius:${r}">` : `<div style="width:${w};height:${h};border-radius:${r};background:#EEF3F1"></div>`;
  el.innerHTML = `<form class="card stack" id="pf-f" style="gap:14px">
    <div class="row" style="gap:16px;flex-wrap:wrap;align-items:flex-end">
      <div class="stack" style="gap:6px"><b>Photo</b>${img(p.avatar_url, "110px", "137px", "12px")}<button type="button" class="btn btn-ghost btn-sm" id="pf-av">Changer</button></div>
      <div class="stack" style="gap:6px;flex:1;min-width:240px"><b>Image de fond (haut de page)</b>${img(p.cover_url, "100%", "137px", "12px")}<button type="button" class="btn btn-ghost btn-sm" id="pf-cv" style="align-self:flex-start">Changer</button></div>
    </div>
    <label>Nom<input name="name" value="${esc(p.name)}" required></label>
    <label>Métiers (séparés par ·)<input name="headline" value="${esc(p.headline)}"></label>
    <label>Lieu<input name="location" value="${esc(p.location)}"></label>
    <label>Présentation<textarea name="bio" rows="5">${esc(p.bio)}</textarea></label>
    <label>Showreel (lien YouTube, Vimeo ou vidéo)<div class="row" style="gap:8px"><input name="showreel_url" value="${esc(p.showreel_url)}" placeholder="https://youtu.be/..." style="flex:1"><button type="button" class="btn btn-ghost btn-sm" id="pf-sr">Envoyer une vidéo</button></div></label>
    <div class="grid g2"><label>Métiers / compétences (un par ligne)<textarea name="skills" rows="6">${esc((p.skills || []).join("\n"))}</textarea></label>
    <label>Outils & matériel (un par ligne)<textarea name="tools" rows="6">${esc((p.tools || []).join("\n"))}</textarea></label></div>
    <label>Chaînes YouTube que je gère (une par ligne)<textarea name="youtube_channels" rows="6">${esc((p.youtube_channels || []).join("\n"))}</textarea></label>
    <label>Clients / partenaires (un par ligne)<textarea name="clients" rows="4">${esc((p.clients || []).join("\n"))}</textarea></label>
    <label>Chiffres clés (une ligne : valeur | texte)<textarea name="stats" rows="4" placeholder="10+ | années d'expérience&#10;120 | projets livrés">${esc(stats)}</textarea></label>
    <div class="grid g2"><label>WhatsApp (avec indicatif)<input name="contact_phone" value="${esc(p.contact_phone)}" placeholder="221 77 000 00 00"></label>
    <label>E-mail<input name="contact_email" type="email" value="${esc(p.contact_email)}"></label></div>
    <div class="grid g2">${["Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn", "Behance"].map((k) => `<label>${k}<input data-soc="${k}" value="${esc(soc[k] || "")}" placeholder="https://..."></label>`).join("")}</div>
    <label>Couleur d'accent<input name="accent" type="color" value="${esc(p.accent || "#E8A33D")}" style="width:80px;height:44px;padding:2px"></label>
    <button class="btn" type="submit">Enregistrer le profil</button></form>`;
  const f = el.querySelector("#pf-f");
  const save = async (patch) => { const { error: e } = await sb.from("portfolio_profile").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1); if (e) throw e; };
  const pickImg = async (key, ratio, outW, title) => {
    const file = await pfPick("image/*"); if (!file) return;
    const bl = await infCrop(file, { ratio, outW, title }); if (!bl) return;
    try { toast("Envoi…"); await save({ [key]: await pfUpload(new File([bl], "img.jpg", { type: "image/jpeg" }), "profil") }); toast("Image mise à jour"); pfProfile(el); } catch (e) { toast(errMsg(e), true); }
  };
  el.querySelector("#pf-av").onclick = () => pickImg("avatar_url", 4 / 5, 900, "Recadrer la photo");
  el.querySelector("#pf-cv").onclick = () => pickImg("cover_url", 16 / 9, 1920, "Recadrer l'image de fond");
  el.querySelector("#pf-sr").onclick = async () => {
    const file = await pfPick("video/mp4,video/webm,video/quicktime"); if (!file) return;
    if (file.size > 200 * 1024 * 1024) return toast("Vidéo trop lourde (200 Mo max). Mets-la plutôt sur YouTube en « non répertoriée ».", true);
    try { toast("Envoi de la vidéo…"); f.showreel_url.value = await pfUpload(file, "showreel"); toast("Vidéo envoyée, pense à enregistrer"); } catch (e) { toast(errMsg(e), true); }
  };
  f.onsubmit = async (e) => {
    e.preventDefault(); const btn = f.querySelector("[type=submit]");
    const socials = {}; f.querySelectorAll("[data-soc]").forEach((i) => { if (i.value.trim()) socials[i.dataset.soc] = i.value.trim(); });
    const st = String(f.stats.value).split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((a) => a[0]).map(([value, label]) => ({ value, label: label || "" }));
    busy(btn, true);
    {
      try {
        await save({ name: f.name.value.trim(), headline: f.headline.value.trim(), location: f.location.value.trim(), bio: f.bio.value.trim(), showreel_url: f.showreel_url.value.trim() || null,
          skills: pfLines(f.skills.value), tools: pfLines(f.tools.value), clients: pfLines(f.clients.value), youtube_channels: pfLines(f.youtube_channels.value), stats: st,
          contact_phone: f.contact_phone.value.replace(/\D/g, "") || null, contact_email: f.contact_email.value.trim() || null, socials, accent: f.accent.value });
        toast("Profil enregistré");
      } catch (er) { toast(errMsg(er), true); }
    }
    busy(btn, false);
  };
}

/* ---------- Œuvres ---------- */
async function pfItems(el) {
  const { data: items, error } = await sb.from("portfolio_items").select("*").order("featured", { ascending: false }).order("sort").order("created_at", { ascending: false });
  if (error) throw error;
  const thumb = (i) => i.thumb_url || (i.media_type === "youtube" && (String(i.media_url).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1] ? `https://i.ytimg.com/vi/${String(i.media_url).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)[1]}/mqdefault.jpg` : i.media_type === "image" ? i.media_url : "");
  el.innerHTML = `<div class="stack" style="gap:12px">
    <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><p class="muted" style="margin:0">${items.length} œuvre(s) · ${items.filter((i) => i.published).length} visible(s) sur le portfolio</p><button class="btn btn-sm" id="pf-new">+ Ajouter une œuvre</button></div>
    ${items.map((i) => `<div class="card row" style="gap:14px;flex-wrap:wrap;align-items:center;padding:14px">
      <div style="width:120px;height:68px;border-radius:10px;background:#EEF3F1 center/cover no-repeat;${thumb(i) ? `background-image:url('${esc(thumb(i))}')` : ""};flex:none"></div>
      <div style="flex:1;min-width:180px"><b>${esc(i.title)}</b> ${i.featured ? '<span class="pill">★ À la une</span>' : ""}<div class="small muted">${esc([pfCats(i).map((c) => PF_CAT[c]).join(" + "), i.year, i.client].filter(Boolean).join(" · "))} · ${PF_MEDIA[i.media_type]}</div></div>
      <span class="pill" style="background:${i.published ? "#E3F3EA;color:#145049" : "#F6E1DD;color:#8A3B2E"}">${i.published ? "Visible" : "Brouillon"}</span>
      <div class="row" style="gap:6px"><button class="btn btn-ghost btn-sm" data-pub="${i.id}">${i.published ? "Masquer" : "Publier"}</button><button class="btn btn-ghost btn-sm" data-ed="${i.id}">Modifier</button><button class="btn btn-ghost btn-sm" data-del="${i.id}" aria-label="Supprimer ${esc(i.title)}">🗑</button></div></div>`).join("") || '<div class="card muted">Aucune œuvre pour l\'instant.</div>'}</div>`;
  const byId = (id) => items.find((x) => x.id === id);
  el.querySelector("#pf-new").onclick = () => pfItemModal(null, () => pfItems(el));
  el.querySelectorAll("[data-ed]").forEach((b) => b.onclick = () => pfItemModal(byId(b.dataset.ed), () => pfItems(el)));
  el.querySelectorAll("[data-pub]").forEach((b) => b.onclick = async () => { const i = byId(b.dataset.pub); const { error: e } = await sb.from("portfolio_items").update({ published: !i.published }).eq("id", i.id); if (e) return toast(errMsg(e), true); toast(i.published ? "Masquée" : "Publiée"); pfItems(el); });
  el.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => { const i = byId(b.dataset.del); if (!confirm(`Supprimer « ${i.title} » ?`)) return; const { error: e } = await sb.from("portfolio_items").delete().eq("id", i.id); if (e) return toast(errMsg(e), true); toast("Supprimée"); pfItems(el); });
}

function pfItemModal(it, done) {
  const i = it || { title: "", category: "realisation", categories: ["realisation"], media_type: "youtube", published: true, featured: false, sort: 0, gallery: [] };
  openModal(`<h2 style="margin:0">${it ? "Modifier l'œuvre" : "Nouvelle œuvre"}</h2>
    <form id="pi" class="stack" style="gap:12px">
      <label>Titre<input name="title" value="${esc(i.title)}" required></label>
      <fieldset style="border:1px solid var(--line);border-radius:12px;padding:10px 14px"><legend class="small" style="font-weight:600;padding:0 6px">Ce que j'ai fait sur ce projet (plusieurs choix possibles)</legend><div class="row" style="gap:14px;flex-wrap:wrap">${Object.entries(PF_CAT).map(([k, l]) => `<label class="row" style="gap:6px"><input type="checkbox" name="cat" value="${k}" ${pfCats(i).includes(k) ? "checked" : ""}> ${l}</label>`).join("")}</div></fieldset>
      <div class="grid g2">
      <label>Année<input name="year" type="number" min="1990" max="2100" value="${esc(i.year || "")}"></label></div>
      <div class="grid g2"><label>Client / production<input name="client" value="${esc(i.client || "")}"></label><label>Mon rôle<input name="role" value="${esc(i.role || "")}" placeholder="Réalisation, montage…"></label></div>
      <label>Description<textarea name="description" rows="4">${esc(i.description || "")}</textarea></label>
      <label>Type de média<select name="media_type">${Object.entries(PF_MEDIA).map(([k, l]) => `<option value="${k}" ${k === i.media_type ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label id="pi-mu">Lien ou fichier du média<div class="row" style="gap:8px"><input name="media_url" value="${esc(i.media_url || "")}" placeholder="https://youtu.be/..." style="flex:1"><button type="button" class="btn btn-ghost btn-sm" id="pi-up">Envoyer</button></div><span class="small muted">Vidéo lourde : mets-la sur YouTube en « non répertoriée » et colle le lien.</span></label>
      <label>Miniature (facultatif pour YouTube)<div class="row" style="gap:8px"><input name="thumb_url" value="${esc(i.thumb_url || "")}" style="flex:1"><button type="button" class="btn btn-ghost btn-sm" id="pi-th">Envoyer</button></div></label>
      <label>Galerie photos (une adresse par ligne)<textarea name="gallery" rows="3">${esc((i.gallery || []).join("\n"))}</textarea><button type="button" class="btn btn-ghost btn-sm" id="pi-gal" style="align-self:flex-start;margin-top:6px">+ Ajouter des photos</button></label>
      <label>Lien du projet (site, article, plateforme)<input name="link_url" value="${esc(i.link_url || "")}" placeholder="https://..."></label>
      <div class="row" style="gap:18px;flex-wrap:wrap"><label class="row" style="gap:8px"><input type="checkbox" name="published" ${i.published ? "checked" : ""}> Visible</label><label class="row" style="gap:8px"><input type="checkbox" name="featured" ${i.featured ? "checked" : ""}> À la une (grande vignette)</label><label class="row" style="gap:8px">Ordre <input name="sort" type="number" value="${esc(i.sort || 0)}" style="width:80px"></label></div>
      <div class="row" style="gap:8px;justify-content:flex-end"><button type="button" class="btn btn-ghost" data-close>Annuler</button><button class="btn" type="submit">Enregistrer</button></div>
    </form>`, (m) => {
    const f = m.querySelector("#pi");
    const up = async (accept, folder, cb) => {
      const file = await pfPick(accept); if (!file) return;
      if (file.size > 200 * 1024 * 1024) return toast("Fichier trop lourd (200 Mo max).", true);
      try { toast("Envoi…"); cb(await pfUpload(file, folder)); toast("Fichier envoyé"); } catch (e) { toast(errMsg(e), true); }
    };
    m.querySelector("#pi-up").onclick = () => {
      const t = f.media_type.value;
      if (t !== "video" && t !== "image") f.media_type.value = /video/.test(prompt("Tu envoies une vidéo ou une image ? (video / image)", "video") || "") ? "video" : "image";
      up(f.media_type.value === "video" ? "video/*" : "image/*", "oeuvres", (u) => { f.media_url.value = u; });
    };
    m.querySelector("#pi-th").onclick = () => up("image/*", "miniatures", (u) => { f.thumb_url.value = u; });
    m.querySelector("#pi-gal").onclick = () => up("image/*", "galerie", (u) => { f.gallery.value = (f.gallery.value.trim() ? f.gallery.value.trim() + "\n" : "") + u; });
    f.onsubmit = async (e) => {
      e.preventDefault();
      const cats = [...f.querySelectorAll("[name=cat]:checked")].map((c) => c.value);
      if (!cats.length) return toast("Coche au moins un métier.", true);
      const row = { title: f.title.value.trim(), category: cats[0], categories: cats, year: f.year.value ? +f.year.value : null, client: f.client.value.trim() || null, role: f.role.value.trim() || null,
        description: f.description.value.trim() || null, media_type: f.media_type.value, media_url: f.media_url.value.trim() || null, thumb_url: f.thumb_url.value.trim() || null,
        gallery: pfLines(f.gallery.value.replace(/,/g, "\n")).filter((u) => /^https?:\/\//.test(u)), link_url: f.link_url.value.trim() || null,
        published: f.published.checked, featured: f.featured.checked, sort: +f.sort.value || 0 };
      const q = it ? sb.from("portfolio_items").update(row).eq("id", it.id) : sb.from("portfolio_items").insert(row);
      const { error } = await q; if (error) return toast(errMsg(error), true);
      closeModal(); toast("Œuvre enregistrée"); done();
    };
  });
}

/* ---------- Liens privés ---------- */
async function pfLinks(el) {
  const { data: links, error } = await sb.from("portfolio_links").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  el.innerHTML = `<div class="stack" style="gap:12px">
    <form class="card row" id="pl-new" style="gap:8px;flex-wrap:wrap;align-items:flex-end"><label style="flex:1;min-width:220px">Pour qui ? (nom du client ou de l'entreprise)<input name="label" required placeholder="Ex. Orange Sénégal, Moussa (agence X)"></label>
      <label>Expire<select name="exp"><option value="">Jamais</option><option value="7">Dans 7 jours</option><option value="30">Dans 30 jours</option><option value="90">Dans 90 jours</option></select></label><button class="btn" type="submit">Créer le lien</button></form>
    ${links.map((l) => { const off = l.revoked || (l.expires_at && new Date(l.expires_at) < new Date()); return `<div class="card stack" style="gap:8px;padding:14px;${off ? "opacity:.6" : ""}">
      <div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(l.label || "Sans nom")}</b><span class="small muted">👁 ${l.views} ouverture(s)${l.last_view_at ? " · dernière " + dateTimeFr(l.last_view_at) : ""}${l.revoked ? " · coupé" : l.expires_at ? " · expire " + dateTimeFr(l.expires_at) : ""}</span></div>
      <code class="small" style="word-break:break-all">${esc(pfUrl(l.token))}</code>
      ${off ? "" : `<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn btn-sm" data-cp="${l.token}">Copier</button><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent("Bonjour, voici mon portfolio privé (réalisation, cadrage, montage, motion design, web) : " + pfUrl(l.token))}">Envoyer sur WhatsApp</a><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${esc(pfUrl(l.token))}">Ouvrir</a><button class="btn btn-ghost btn-sm" data-rv="${l.id}">Couper l'accès</button></div>`}</div>`; }).join("") || '<div class="card muted">Aucun lien. Crée-en un pour chaque personne à qui tu envoies ton portfolio.</div>'}</div>`;
  const f = el.querySelector("#pl-new");
  f.onsubmit = async (e) => {
    e.preventDefault();
    const row = { label: f.label.value.trim() }; if (f.exp.value) row.expires_at = new Date(Date.now() + f.exp.value * 864e5).toISOString();
    const { data, error: er } = await sb.from("portfolio_links").insert(row).select().single(); if (er) return toast(errMsg(er), true);
    try { await navigator.clipboard.writeText(pfUrl(data.token)); toast("Lien créé et copié"); } catch { toast("Lien créé"); }
    pfLinks(el);
  };
  el.querySelectorAll("[data-cp]").forEach((b) => b.onclick = () => copy(pfUrl(b.dataset.cp), b));
  el.querySelectorAll("[data-rv]").forEach((b) => b.onclick = async () => { if (!confirm("Couper l'accès à ce lien ? La personne ne pourra plus voir ton portfolio.")) return; const { error: er } = await sb.from("portfolio_links").update({ revoked: true }).eq("id", b.dataset.rv); if (er) return toast(errMsg(er), true); toast("Accès coupé"); pfLinks(el); });
}
