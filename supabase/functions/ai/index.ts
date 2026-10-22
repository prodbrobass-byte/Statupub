// StatuPub — assistant de rédaction pour la messagerie admin (Claude).
// Actions : "fix" (corrige / améliore un texte) et "reply" (propose une réponse à une conversation).
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

    const { action, text, thread, mode } = await req.json();

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
    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
