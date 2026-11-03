// StatuPub — assistant de rédaction pour la messagerie admin (Claude).
// Actions : "fix" (corrige / améliore un texte), "reply" (propose une réponse à une conversation)
// et "inf_quote" (devis + plan de campagne influenceurs).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const STYLE = `Tu écris au nom de l'équipe StatuPub, une régie publicitaire sur les statuts WhatsApp en Afrique francophone.
Style : français correct et naturel, tutoiement, chaleureux et professionnel, phrases courtes, clair et concret. Pas de jargon. 1 emoji maximum, seulement si ça aide. Pas de formule pompeuse, pas de signature. 700 caractères maximum.`;

async function claude(model: string, system: string, user: string, max = 600) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("La clé IA n'est pas encore configurée dans Supabase (ANTHROPIC_API_KEY).");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: max, system, messages: [{ role: "user", content: user }] }),
  });
  const d = await r.json();
  if (!r.ok) {
    const m = d?.error?.message || "Erreur IA";
    if (/credit|balance/i.test(m)) throw new Error("Crédits API épuisés : recharge ton compte sur console.anthropic.com.");
    if (r.status === 401) throw new Error("Clé IA invalide : vérifie ANTHROPIC_API_KEY dans Supabase.");
    throw new Error(m);
  }
  return (d.content || []).map((c: any) => c.text || "").join("").trim();
}

/* ===== Espace Pub Influenceur : devis + plan de campagne générés par l'IA ===== */
const iso = (d: Date) => d.toISOString().slice(0, 10);
async function infQuote(b: any) {
  const need = String(b.need || "").trim();
  if (need.length < 10) throw new Error("Décris le besoin de la marque (au moins une phrase).");
  const budget = Math.max(0, Math.round(Number(b.budget) || 0));
  const [{ data: infs }, { data: s }] = await Promise.all([
    sb.from("influencers").select("id, display_name, slug, city, country, languages, categories, status, accepting, bio").in("status", ["verified", "certified"]),
    sb.from("settings").select("inf_brand_fee, inf_accept_hours, inf_validate_hours").eq("id", 1).single(),
  ]);
  const list = (infs || []).filter((i: any) => i.accepting);
  if (!list.length) throw new Error("Aucun créateur publié et disponible pour l'instant : publie d'abord des profils (vérifié ou certifié).");
  const ids = list.map((i: any) => i.id);
  const [{ data: nets }, { data: pks }, { data: busy }, { data: revs }] = await Promise.all([
    sb.from("influencer_networks").select("influencer_id, network, followers, avg_views, engagement, audience").in("influencer_id", ids),
    sb.from("influencer_packages").select("id, influencer_id, title, description, networks, network, price, on_request").in("influencer_id", ids).eq("active", true),
    sb.from("influence_bookings").select("influencer_id, publish_date").in("influencer_id", ids).gte("publish_date", iso(new Date()))
      .in("status", ["accepted", "content_submitted", "changes_requested", "content_approved"]),
    sb.from("influence_reviews").select("influencer_id, rating").in("influencer_id", ids).eq("status", "published"),
  ]);
  const fee = Number(s?.inf_brand_fee ?? 0.05);
  const catalog = list.map((i: any) => {
    const r = (revs || []).filter((x: any) => x.influencer_id === i.id);
    return {
      id: i.id, nom: i.display_name, ville: i.city, pays: i.country, langues: i.languages, categories: i.categories, certifie: i.status === "certified",
      bio: (i.bio || "").slice(0, 300), note: r.length ? +(r.reduce((t: number, x: any) => t + x.rating, 0) / r.length).toFixed(1) : null, avis: r.length,
      reseaux: (nets || []).filter((n: any) => n.influencer_id === i.id).map((n: any) => ({ reseau: n.network, abonnes: n.followers, vues_moy: n.avg_views, engagement: n.engagement, audience: n.audience })),
      formules: (pks || []).filter((p: any) => p.influencer_id === i.id).map((p: any) => ({ id: p.id, titre: p.title, description: (p.description || "").slice(0, 200),
        reseaux: p.networks?.length ? p.networks : p.network ? [p.network] : [], prix_F: p.on_request ? null : p.price, sur_demande: p.on_request })),
      dates_prises: (busy || []).filter((x: any) => x.influencer_id === i.id).map((x: any) => x.publish_date),
    };
  }).filter((c: any) => c.formules.length);
  if (!catalog.length) throw new Error("Les créateurs publiés n'ont pas encore de formules : ajoute au moins une formule par créateur.");
  const today = iso(new Date());
  const tool = {
    name: "proposer_campagne",
    description: "Propose le plan de campagne influenceurs et les options de devis.",
    input_schema: {
      type: "object", required: ["resume", "options", "plan", "questions"],
      properties: {
        resume: { type: "string", description: "Résumé du besoin en 2 phrases, tel que compris." },
        questions: { type: "array", items: { type: "string" }, description: "Informations importantes manquantes (0 à 3 questions courtes)." },
        options: {
          type: "array", minItems: 1, maxItems: 3,
          items: { type: "object", required: ["nom", "strategie", "pourquoi", "lignes"], properties: {
            nom: { type: "string", description: "Ex. Visibilité, Équilibre, Proximité" },
            strategie: { type: "string" }, pourquoi: { type: "string", description: "2 à 3 phrases pour la marque" },
            lignes: { type: "array", minItems: 1, items: { type: "object", required: ["createur_id", "formule_id", "date", "brief"], properties: {
              createur_id: { type: "string" }, formule_id: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD" },
              heure: { type: "string", description: "Heure conseillée, ex. 19:00" },
              brief: { type: "string", description: "Brief adapté à ce créateur : idée de la vidéo, message clé, à faire, à éviter, mention #pub. 600 caractères max." } } } },
          } },
        },
        plan: { type: "array", items: { type: "object", required: ["date", "etape"], properties: { date: { type: "string", description: "YYYY-MM-DD" }, etape: { type: "string" }, qui: { type: "string", description: "Marque, Créateurs ou StatuPub" } } } },
      },
    },
  };
  const sys = `Tu es le directeur de campagnes influenceurs de StatuPub (Espace Pub Influenceur), en Afrique francophone.
À partir du besoin d'une marque et du catalogue de créateurs, tu proposes jusqu'à 3 options de campagne différentes (par exemple : Visibilité avec 1 gros créateur, Équilibre avec 2-3 créateurs sur plusieurs réseaux, Proximité avec plus de créateurs et un fort engagement).
Règles strictes :
- Utilise UNIQUEMENT les createur_id et formule_id du catalogue. Une formule appartient à son créateur. N'invente aucun chiffre ni créateur.
- Choisis des créateurs dont les catégories, le pays, la langue et l'audience collent au produit et à la cible.
- Respecte le budget : le total de chaque option (prix des formules + ${Math.round(fee * 100)} % de frais de service) ne doit pas dépasser le budget. Si le budget est trop petit, propose quand même la meilleure option possible et dis-le dans "pourquoi". Les formules "sur_demande" ne peuvent être choisies que si rien d'autre ne convient.
- Les dates de publication : au moins 4 jours après aujourd'hui (${today}), dans la période demandée, en évitant les dates_prises du créateur, et en décalant les créateurs d'une même option (pas tous le même jour, sauf demande).
- Le plan suit les règles StatuPub : brief envoyé, ${s?.inf_accept_hours || 48} h pour que les créateurs acceptent, vidéos à valider par la marque (${s?.inf_validate_hours || 48} h), publication, vérification, rapport à J+7. Les publications restent en ligne 30 jours avec la mention #pub.
- Écris en français simple et professionnel, en vouvoyant la marque.`;
  const user = `Aujourd'hui : ${today}
Besoin de la marque (${b.brand || "marque"}) : ${need}
Budget total : ${budget ? budget + " F CFA" : "non précisé"}
Période : ${b.start || "non précisée"} → ${b.end || "non précisée"}
Pays / ville ciblés : ${[b.city, b.country].filter(Boolean).join(", ") || "non précisé"}
Réseaux souhaités : ${(b.networks || []).length ? b.networks.join(", ") : "libre"}
Catalogue des créateurs (JSON) :
${JSON.stringify(catalog)}`;
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("La clé IA n'est pas encore configurée dans Supabase (ANTHROPIC_API_KEY).");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 6000, system: sys, tools: [tool], tool_choice: { type: "tool", name: "proposer_campagne" }, messages: [{ role: "user", content: user }] }),
  });
  const d = await r.json();
  if (!r.ok) { const m = d?.error?.message || "Erreur IA"; if (/credit|balance/i.test(m)) throw new Error("Crédits API épuisés : recharge ton compte sur console.anthropic.com."); throw new Error(m); }
  const out = (d.content || []).find((c: any) => c.type === "tool_use")?.input;
  if (!out?.options?.length) throw new Error("L'IA n'a pas pu proposer de campagne. Précise le besoin et réessaie.");
  // Vérification et calcul des prix côté serveur (on ne fait jamais confiance aux chiffres de l'IA)
  const byInf = new Map(catalog.map((c: any) => [c.id, c]));
  const minDate = iso(new Date(Date.now() + 2 * 864e5));
  const options = out.options.map((o: any) => {
    const lignes = (o.lignes || []).map((l: any) => {
      const c: any = byInf.get(l.createur_id); const p = c?.formules.find((f: any) => f.id === l.formule_id);
      if (!c || !p) return null;
      const reach = c.reseaux.filter((n: any) => !p.reseaux.length || p.reseaux.includes(n.reseau)).reduce((t: number, n: any) => t + (Number(n.vues_moy) || Math.round((Number(n.abonnes) || 0) * 0.2)), 0);
      const date = /^\d{4}-\d{2}-\d{2}$/.test(l.date || "") && l.date >= minDate ? l.date : null;
      return { influencer_id: c.id, influencer_name: c.nom, certified: c.certifie, package_id: p.id, package_title: p.titre, networks: p.reseaux,
        price: p.prix_F || 0, on_request: !!p.sur_demande, date, time: l.heure || "", brief: String(l.brief || "").slice(0, 1200), reach };
    }).filter(Boolean);
    return { name: o.nom, strategy: o.strategie, why: o.pourquoi, items: lignes };
  }).filter((o: any) => o.items.length);
  if (!options.length) throw new Error("L'IA a proposé des créateurs inconnus. Réessaie.");
  return { summary: out.resume, questions: out.questions || [], options, plan: (out.plan || []).filter((x: any) => x?.etape), fee, model: "claude-sonnet-5-5" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method === "GET") {   // vérifie seulement que la clé est en place et valide (ne consomme aucun crédit)
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ key: "absente" });
    const r = await fetch("https://api.anthropic.com/v1/models?limit=1", { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } });
    return json({ key: r.ok ? "valide" : "refusée (" + r.status + ")" });
  }
  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(token);
    if (!u?.user) return json({ error: "Connexion requise" }, 401);
    const { data: me } = await sb.from("profiles").select("role").eq("id", u.user.id).single();
    if (me?.role !== "admin") return json({ error: "Réservé à l'admin" }, 403);

    const body = await req.json(); const { action, text, thread, mode } = body;

    if (action === "fix") {
      if (!text || String(text).length > 2000) return json({ error: "Texte vide ou trop long" }, 400);
      const sys = mode === "improve"
        ? `${STYLE}\nRéécris le message pour qu'il soit sans faute, plus clair et plus professionnel, en gardant exactement le même sens, les mêmes informations (chiffres, noms, liens) et à peu près la même longueur. Réponds uniquement avec le message réécrit.`
        : `Corrige uniquement l'orthographe, la grammaire, les accents, la ponctuation et les majuscules de ce message en français. Ne change ni le sens, ni le ton, ni les mots corrects, ni les chiffres, noms et liens. Garde le tutoiement ou le vouvoiement d'origine. Réponds uniquement avec le message corrigé.`;
      return json({ text: await claude("claude-haiku-5-5", sys, String(text)) });
    }

    if (action === "reply") {
      if (!thread) return json({ error: "Conversation manquante" }, 400);
      const [{ data: p }, { data: msgs }, { data: s }, { data: camps }, { data: rech }, { data: wd }] = await Promise.all([
        sb.from("profiles").select("role, full_name, company, country, is_ambassador").eq("id", thread).single(),
        sb.from("messages").select("from_admin, body, created_at").eq("thread_user", thread).order("id", { ascending: false }).limit(20),
        sb.from("settings").select("cpc_min, min_budget, payout_ratio, min_withdrawal, hold_hours").limit(1).single(),
        sb.from("campaigns").select("title, status, cpc, budget, spent, reject_reason, created_at").eq("annonceur_id", thread).order("created_at", { ascending: false }).limit(5),
        sb.from("recharges").select("amount, status, method, created_at").eq("annonceur_id", thread).order("created_at", { ascending: false }).limit(5),
        sb.from("withdrawals").select("amount, status, method, created_at").eq("diffuseur_id", thread).order("created_at", { ascending: false }).limit(5),
      ]);
      if (!msgs?.length) return json({ error: "Aucun message dans cette conversation" }, 400);
      const conv = msgs.reverse().map((m) => `${m.from_admin ? "StatuPub" : "Client"} : ${m.body}`).join("\n");
      const ctx = {
        client: { role: p?.role, nom: p?.company || p?.full_name, pays: p?.country, ambassadeur: p?.is_ambassador },
        regles: { prix_min_par_clic_F: s?.cpc_min, budget_min_F: s?.min_budget, part_diffuseur: s?.payout_ratio, retrait_min_F: s?.min_withdrawal, validation_des_clics_heures: s?.hold_hours,
          fonctionnement: "L'annonceur recharge son solde (PayDunya : Wave, Orange Money, Free Money, MTN, Moov, carte), crée une campagne, l'équipe la valide, puis les diffuseurs la publient sur leur statut avec un lien traçable. Seuls les vrais clics sont payés (doublons et triche filtrés). La campagne s'arrête quand le budget est épuisé." },
        campagnes: camps, recharges: rech, retraits: wd,
      };
      const sys = `${STYLE}
Tu rédiges la prochaine réponse de StatuPub dans cette conversation. Appuie-toi uniquement sur la conversation et sur les données fournies ; n'invente jamais de délai, de montant, de promesse ou de fonctionnalité. Si une information te manque pour répondre, pose une question courte ou dis que l'équipe vérifie. Réponds uniquement avec le texte du message, prêt à envoyer.`;
      const user = `Données StatuPub (JSON) :\n${JSON.stringify(ctx)}\n\nConversation (du plus ancien au plus récent) :\n${conv}${text ? `\n\nIdée de réponse de l'admin à développer : ${text}` : ""}`;
      return json({ text: await claude("claude-sonnet-5-5", sys, user, 700) });
    }
    if (action === "inf_quote") return json(await infQuote(body));
    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
