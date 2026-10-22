// StatuPub — envoi des notifications push (appelé uniquement par la base via push_notify).
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const VAPID_PUBLIC = "BKhdA6JvO1dd3hOeNamefFTlfhJOGiDR5iRcb3SjX0hFoFJ73CJusBVhQZ2WsVLXTzYCEj_C-cWssUH0BCTnfrc";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
let cfg: { vapid_private: string; hook: string } | null = null;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  if (!cfg) { const { data, error } = await sb.rpc("push_config"); if (error) return new Response("config", { status: 500 }); cfg = data; webpush.setVapidDetails("mailto:contact@statupub.com", VAPID_PUBLIC, cfg!.vapid_private); }
  if (req.headers.get("x-push-hook") !== cfg!.hook) return new Response("forbidden", { status: 403 });
  const { users, role, title, body, url } = await req.json();

  let ids: string[] = Array.isArray(users) ? users : [];
  if (role) {
    const { data } = await sb.from("profiles").select("id").eq("role", role).eq("is_blocked", false);
    ids = ids.concat((data || []).map((p) => p.id));
  }
  if (!ids.length) return Response.json({ sent: 0 });
  const subs: any[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await sb.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("user_id", ids.slice(i, i + 200));
    subs.push(...(data || []));
  }
  const payload = JSON.stringify({ title, body, url: url || "/", tag: role ? "sp-" + role : undefined });
  let sent = 0; const dead: number[] = [];
  for (let i = 0; i < subs.length; i += 50) {
    await Promise.all(subs.slice(i, i + 50).map(async (s) => {
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: "high" }); sent++; }
      catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) dead.push(s.id); else console.log("push err", e?.statusCode, e?.body); }
    }));
  }
  if (dead.length) await sb.from("push_subscriptions").delete().in("id", dead);
  return Response.json({ sent, removed: dead.length });
});
