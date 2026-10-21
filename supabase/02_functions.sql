-- =====================================================================
-- StatuPub — 02 : Logique métier (portefeuilles, campagnes, clics, admin)
-- Toutes les opérations sensibles passent par ces fonctions.
-- =====================================================================

-- Le compte du fondateur devient admin automatiquement à l'inscription
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role', 'diffuseur');
begin
  if r not in ('annonceur','diffuseur') then r := 'diffuseur'; end if;
  if lower(new.email) = 'prodbrobass@gmail.com' then r := 'admin'; end if;
  insert into public.profiles (id, role, full_name, phone, city, company)
  values (new.id, r::public.user_role,
          left(coalesce(new.raw_user_meta_data->>'full_name',''), 80),
          left(coalesce(new.raw_user_meta_data->>'phone',''), 20),
          left(coalesce(new.raw_user_meta_data->>'city',''), 60),
          left(coalesce(new.raw_user_meta_data->>'company',''), 80));
  return new;
end $$;

create or replace function public.my_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and not is_blocked;
$$;

-- ---------------------------------------------------------------------
-- Portefeuille annonceur
--   crédit  = recharges validées
--   réservé = budget des campagnes en cours (ou dépensé si terminée)
-- ---------------------------------------------------------------------
create or replace function public.annonceur_wallet(p_uid uuid default auth.uid())
returns table (credited bigint, reserved bigint, spent bigint, available bigint)
language sql stable security definer set search_path = public as $$
  with c as (
    select coalesce(sum(amount),0)::bigint v from public.recharges
    where annonceur_id = p_uid and status = 'validee'
  ), r as (
    select coalesce(sum(case when status in ('en_attente','active','pause') then budget
                             when status = 'terminee' then spent else 0 end),0)::bigint v,
           coalesce(sum(spent),0)::bigint s
    from public.campaigns where annonceur_id = p_uid
  )
  select c.v, r.v, r.s, c.v - r.v from c, r
  where p_uid = auth.uid() or public.is_admin();
$$;

-- ---------------------------------------------------------------------
-- Portefeuille diffuseur
--   gains validés après le délai de contrôle (hold_hours)
-- ---------------------------------------------------------------------
create or replace function public.diffuseur_wallet(p_uid uuid default auth.uid())
returns table (earned bigint, pending bigint, withdrawn bigint, available bigint)
language sql stable security definer set search_path = public as $$
  with s as (select hold_hours from public.settings where id = 1),
  e as (
    select coalesce(sum(payout) filter (where created_at <  now() - make_interval(hours => s.hold_hours)),0)::bigint ok,
           coalesce(sum(payout) filter (where created_at >= now() - make_interval(hours => s.hold_hours)),0)::bigint pend
    from public.clicks, s where diffuseur_id = p_uid and is_valid
  ), w as (
    select coalesce(sum(amount),0)::bigint v from public.withdrawals
    where diffuseur_id = p_uid and status in ('en_attente','validee')
  )
  select e.ok, e.pend, w.v, e.ok - w.v from e, w
  where p_uid = auth.uid() or public.is_admin();
$$;

-- ---------------------------------------------------------------------
-- ANNONCEUR
-- ---------------------------------------------------------------------
create or replace function public.request_recharge(p_amount int, p_method text, p_reference text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if public.my_role() is distinct from 'annonceur' then raise exception 'Réservé aux annonceurs'; end if;
  if p_amount < 1000 then raise exception 'Recharge minimum : 1 000 FCFA'; end if;
  if (select count(*) from public.recharges where annonceur_id = auth.uid() and status = 'en_attente') >= 5 then
    raise exception 'Trop de recharges en attente';
  end if;
  insert into public.recharges (annonceur_id, amount, method, reference)
  values (auth.uid(), p_amount, p_method, trim(p_reference)) returning id into v_id;
  return v_id;
end $$;

create or replace function public.create_campaign(
  p_title text, p_message text, p_media_url text, p_target_url text, p_cpc int, p_budget int)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.settings; v_av bigint; v_id uuid; v_payout int;
begin
  if public.my_role() is distinct from 'annonceur' then raise exception 'Réservé aux annonceurs'; end if;
  select * into s from public.settings where id = 1;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  if p_cpc < s.cpc_min then raise exception 'Prix du clic minimum : % FCFA', s.cpc_min; end if;
  if p_budget < s.min_budget then raise exception 'Budget minimum : % FCFA', s.min_budget; end if;
  if p_budget < p_cpc then raise exception 'Le budget doit couvrir au moins un clic'; end if;
  select available into v_av from public.annonceur_wallet(auth.uid());
  if v_av < p_budget then raise exception 'Solde insuffisant (disponible : % FCFA). Rechargez votre compte.', v_av; end if;
  v_payout := floor(p_cpc * s.payout_ratio);
  if v_payout < 1 then v_payout := 1; end if;
  insert into public.campaigns (annonceur_id, title, message, media_url, target_url, cpc, payout, budget)
  values (auth.uid(), trim(p_title), trim(p_message), nullif(trim(p_media_url),''), trim(p_target_url), p_cpc, v_payout, p_budget)
  returning id into v_id;
  return v_id;
end $$;

-- pause / reprise / arrêt par l'annonceur (le reste du budget redevient disponible)
create or replace function public.set_campaign_status(p_id uuid, p_status public.campaign_status)
returns void language plpgsql security definer set search_path = public as $$
declare c public.campaigns;
begin
  select * into c from public.campaigns where id = p_id for update;
  if not found then raise exception 'Campagne introuvable'; end if;
  if c.annonceur_id <> auth.uid() and not public.is_admin() then raise exception 'Accès refusé'; end if;
  if c.status in ('terminee','rejetee') then raise exception 'Campagne déjà clôturée'; end if;
  if p_status = 'pause' and c.status = 'active' then
    update public.campaigns set status = 'pause' where id = p_id;
  elsif p_status = 'active' and c.status = 'pause' then
    if c.budget - c.spent < c.cpc then raise exception 'Budget épuisé'; end if;
    update public.campaigns set status = 'active' where id = p_id;
  elsif p_status = 'terminee' then
    update public.campaigns set status = 'terminee', ended_at = now() where id = p_id;
  else
    raise exception 'Changement de statut non autorisé';
  end if;
end $$;

-- Statistiques journalières d'une campagne
create or replace function public.campaign_daily_stats(p_id uuid)
returns table (day date, valid_clicks bigint, invalid_clicks bigint, cost bigint, diffuseurs bigint)
language sql stable security definer set search_path = public as $$
  select (cl.created_at at time zone 'Africa/Dakar')::date,
         count(*) filter (where is_valid), count(*) filter (where not is_valid),
         coalesce(sum(cost),0)::bigint, count(distinct diffuseur_id) filter (where is_valid)
  from public.clicks cl join public.campaigns c on c.id = cl.campaign_id
  where cl.campaign_id = p_id and (c.annonceur_id = auth.uid() or public.is_admin())
  group by 1 order by 1;
$$;

create or replace function public.annonceur_campaigns()
returns table (id uuid, title text, message text, media_url text, target_url text, cpc int, budget int, spent int,
               status public.campaign_status, reject_reason text, created_at timestamptz,
               valid_clicks bigint, invalid_clicks bigint, diffuseurs bigint, clicks_today bigint)
language sql stable security definer set search_path = public as $$
  select c.id, c.title, c.message, c.media_url, c.target_url, c.cpc, c.budget, c.spent, c.status, c.reject_reason, c.created_at,
         count(cl.id) filter (where cl.is_valid), count(cl.id) filter (where not cl.is_valid),
         count(distinct cl.diffuseur_id) filter (where cl.is_valid),
         count(cl.id) filter (where cl.is_valid and cl.created_at >= date_trunc('day', now()))
  from public.campaigns c left join public.clicks cl on cl.campaign_id = c.id
  where c.annonceur_id = auth.uid()
  group by c.id order by c.created_at desc;
$$;

-- ---------------------------------------------------------------------
-- DIFFUSEUR
-- ---------------------------------------------------------------------
create or replace function public.available_campaigns()
returns table (id uuid, title text, message text, media_url text, payout int, remaining_clicks int,
               my_code text, my_valid_clicks bigint, my_earnings bigint)
language sql stable security definer set search_path = public as $$
  select c.id, c.title, c.message, c.media_url, c.payout, ((c.budget - c.spent) / c.cpc)::int,
         l.code,
         (select count(*) from public.clicks k where k.link_id = l.id and k.is_valid),
         (select coalesce(sum(k.payout),0)::bigint from public.clicks k where k.link_id = l.id and k.is_valid)
  from public.campaigns c
  left join public.links l on l.campaign_id = c.id and l.diffuseur_id = auth.uid()
  where c.status = 'active' and c.budget - c.spent >= c.cpc and public.my_role() = 'diffuseur'
  order by c.approved_at desc nulls last;
$$;

create or replace function public.get_my_link(p_campaign uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text; p public.profiles; c public.campaigns; i int := 0;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.role is distinct from 'diffuseur' or p.is_blocked then raise exception 'Réservé aux diffuseurs actifs'; end if;
  if not p.channel_joined then raise exception 'Abonnez-vous d''abord à la Chaîne WhatsApp StatuPub'; end if;
  select * into c from public.campaigns where id = p_campaign;
  if c.status is distinct from 'active' then raise exception 'Campagne non disponible'; end if;
  select code into v_code from public.links where campaign_id = p_campaign and diffuseur_id = auth.uid();
  if v_code is not null then return v_code; end if;
  loop
    v_code := substr(translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/=lIO0', ''), 1, 7);
    begin
      insert into public.links (code, campaign_id, diffuseur_id) values (v_code, p_campaign, auth.uid());
      return v_code;
    exception when unique_violation then
      i := i + 1;
      select code into v_code from public.links where campaign_id = p_campaign and diffuseur_id = auth.uid();
      if v_code is not null then return v_code; end if;
      if i > 5 then raise; end if;
    end;
  end loop;
end $$;

create or replace function public.diffuseur_daily_stats()
returns table (day date, valid_clicks bigint, invalid_clicks bigint, earnings bigint)
language sql stable security definer set search_path = public as $$
  select (created_at at time zone 'Africa/Dakar')::date, count(*) filter (where is_valid),
         count(*) filter (where not is_valid), coalesce(sum(payout),0)::bigint
  from public.clicks where diffuseur_id = auth.uid() and created_at > now() - interval '30 days'
  group by 1 order by 1;
$$;

create or replace function public.request_withdrawal(p_amount int, p_method text, p_phone text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_av bigint; v_min int; v_id uuid;
begin
  if public.my_role() is distinct from 'diffuseur' then raise exception 'Réservé aux diffuseurs actifs'; end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  select min_withdrawal into v_min from public.settings where id = 1;
  if p_amount < v_min then raise exception 'Retrait minimum : % FCFA', v_min; end if;
  select available into v_av from public.diffuseur_wallet(auth.uid());
  if v_av < p_amount then raise exception 'Solde disponible insuffisant (% FCFA)', v_av; end if;
  insert into public.withdrawals (diffuseur_id, amount, method, phone)
  values (auth.uid(), p_amount, p_method, trim(p_phone)) returning id into v_id;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- CLIC (appelé uniquement par la fonction serveur « go »)
-- ---------------------------------------------------------------------
create or replace function public.record_click(
  p_code text, p_visitor text, p_ip text, p_country text, p_is_bot boolean)
returns text language plpgsql security definer set search_path = public as $$
declare l public.links; c public.campaigns; s public.settings; d public.profiles;
        v_valid boolean := true; v_reason text; v_cost int := 0; v_pay int := 0;
begin
  select * into l from public.links where code = p_code;
  if not found then return null; end if;
  select * into s from public.settings where id = 1;
  select * into c from public.campaigns where id = l.campaign_id for update;   -- sérialise les clics d'une campagne
  select * into d from public.profiles where id = l.diffuseur_id;

  if c.status <> 'active' then v_valid := false; v_reason := 'campagne_inactive';
  elsif d.is_blocked then v_valid := false; v_reason := 'diffuseur_bloque';
  elsif p_is_bot then v_valid := false; v_reason := 'robot';
  elsif exists (select 1 from public.clicks where campaign_id = c.id and visitor_hash = p_visitor and is_valid) then
    v_valid := false; v_reason := 'doublon';
  elsif (select count(*) from public.clicks where ip_hash = p_ip and is_valid
         and created_at >= date_trunc('day', now())) >= s.max_clicks_per_ip_day then
    v_valid := false; v_reason := 'limite_ip';
  elsif (select count(*) from public.clicks where link_id = l.id and is_valid
         and created_at >= date_trunc('day', now())) >= s.daily_cap_per_link then
    v_valid := false; v_reason := 'plafond_journalier';
  elsif c.budget - c.spent < c.cpc then
    v_valid := false; v_reason := 'budget_epuise';
  end if;

  if v_valid then
    v_cost := c.cpc; v_pay := c.payout;
    update public.campaigns set spent = spent + c.cpc,
      status = case when budget - (spent + c.cpc) < cpc then 'terminee'::public.campaign_status else status end,
      ended_at = case when budget - (spent + c.cpc) < cpc then now() else ended_at end
    where id = c.id;
  elsif v_reason = 'budget_epuise' then
    update public.campaigns set status = 'terminee', ended_at = now() where id = c.id;
  end if;

  insert into public.clicks (link_id, campaign_id, diffuseur_id, visitor_hash, ip_hash, country, is_valid, reason, cost, payout)
  values (l.id, c.id, l.diffuseur_id, p_visitor, p_ip, left(p_country, 4), v_valid, v_reason, v_cost, v_pay);

  return c.target_url;
end $$;

-- ---------------------------------------------------------------------
-- ADMIN
-- ---------------------------------------------------------------------
create or replace function public.admin_overview()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  return json_build_object(
    'annonceurs', (select count(*) from public.profiles where role = 'annonceur'),
    'diffuseurs', (select count(*) from public.profiles where role = 'diffuseur'),
    'campagnes_actives', (select count(*) from public.campaigns where status = 'active'),
    'campagnes_attente', (select count(*) from public.campaigns where status = 'en_attente'),
    'clics_valides_jour', (select count(*) from public.clicks where is_valid and created_at >= date_trunc('day', now())),
    'clics_invalides_jour', (select count(*) from public.clicks where not is_valid and created_at >= date_trunc('day', now())),
    'ca_total', (select coalesce(sum(cost),0) from public.clicks where is_valid),
    'reverse_total', (select coalesce(sum(payout),0) from public.clicks where is_valid),
    'recharges_attente', (select count(*) from public.recharges where status = 'en_attente'),
    'retraits_attente', (select count(*) from public.withdrawals where status = 'en_attente'),
    'retraits_attente_montant', (select coalesce(sum(amount),0) from public.withdrawals where status = 'en_attente')
  );
end $$;

create or replace function public.admin_review_campaign(p_id uuid, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  update public.campaigns
     set status = case when p_approve then 'active'::public.campaign_status else 'rejetee'::public.campaign_status end,
         approved_at = case when p_approve then now() else approved_at end,
         reject_reason = case when p_approve then null else p_reason end
   where id = p_id and status = 'en_attente';
  if not found then raise exception 'Campagne non en attente'; end if;
end $$;

create or replace function public.admin_process_recharge(p_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  update public.recharges set status = case when p_approve then 'validee'::public.request_status else 'rejetee'::public.request_status end,
         admin_note = p_note, processed_at = now()
   where id = p_id and status = 'en_attente';
  if not found then raise exception 'Recharge déjà traitée'; end if;
end $$;

create or replace function public.admin_process_withdrawal(p_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  update public.withdrawals set status = case when p_approve then 'validee'::public.request_status else 'rejetee'::public.request_status end,
         admin_note = p_note, processed_at = now()
   where id = p_id and status = 'en_attente';
  if not found then raise exception 'Retrait déjà traité'; end if;
end $$;

create or replace function public.admin_set_blocked(p_user uuid, p_blocked boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  update public.profiles set is_blocked = p_blocked where id = p_user and role <> 'admin';
end $$;

create or replace function public.admin_update_settings(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  update public.settings set
    cpc_min = coalesce((p->>'cpc_min')::int, cpc_min),
    payout_ratio = coalesce((p->>'payout_ratio')::numeric, payout_ratio),
    min_withdrawal = coalesce((p->>'min_withdrawal')::int, min_withdrawal),
    min_budget = coalesce((p->>'min_budget')::int, min_budget),
    daily_cap_per_link = coalesce((p->>'daily_cap_per_link')::int, daily_cap_per_link),
    max_clicks_per_ip_day = coalesce((p->>'max_clicks_per_ip_day')::int, max_clicks_per_ip_day),
    hold_hours = coalesce((p->>'hold_hours')::int, hold_hours),
    whatsapp_channel_url = coalesce(p->>'whatsapp_channel_url', whatsapp_channel_url),
    wave_number = coalesce(p->>'wave_number', wave_number),
    om_number = coalesce(p->>'om_number', om_number),
    updated_at = now()
  where id = 1;
end $$;

-- Diffuseurs avec indicateurs de fraude
create or replace function public.admin_diffuseurs()
returns table (id uuid, full_name text, phone text, city text, avg_views int, channel_joined boolean, is_blocked boolean,
               created_at timestamptz, valid_clicks bigint, invalid_clicks bigint, clicks_today bigint, earnings bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.phone, p.city, p.avg_views, p.channel_joined, p.is_blocked, p.created_at,
         count(k.id) filter (where k.is_valid), count(k.id) filter (where not k.is_valid),
         count(k.id) filter (where k.is_valid and k.created_at >= date_trunc('day', now())),
         coalesce(sum(k.payout) filter (where k.is_valid),0)::bigint
  from public.profiles p left join public.clicks k on k.diffuseur_id = p.id
  where p.role = 'diffuseur' and public.is_admin()
  group by p.id order by count(k.id) filter (where not k.is_valid) desc, p.created_at desc;
$$;

create or replace function public.admin_annonceurs()
returns table (id uuid, full_name text, company text, phone text, is_blocked boolean, created_at timestamptz,
               credited bigint, spent bigint, campaigns bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.company, p.phone, p.is_blocked, p.created_at,
         (select coalesce(sum(amount),0) from public.recharges r where r.annonceur_id = p.id and r.status = 'validee')::bigint,
         (select coalesce(sum(spent),0) from public.campaigns c where c.annonceur_id = p.id)::bigint,
         (select count(*) from public.campaigns c where c.annonceur_id = p.id)
  from public.profiles p where p.role = 'annonceur' and public.is_admin()
  order by p.created_at desc;
$$;

-- ---------------------------------------------------------------------
-- Droits d'exécution
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.is_admin(), public.my_role(), public.annonceur_wallet(uuid), public.diffuseur_wallet(uuid),
  public.request_recharge(int, text, text), public.create_campaign(text, text, text, text, int, int),
  public.set_campaign_status(uuid, public.campaign_status), public.campaign_daily_stats(uuid),
  public.annonceur_campaigns(), public.available_campaigns(), public.get_my_link(uuid),
  public.diffuseur_daily_stats(), public.request_withdrawal(int, text, text),
  public.admin_overview(), public.admin_review_campaign(uuid, boolean, text),
  public.admin_process_recharge(uuid, boolean, text), public.admin_process_withdrawal(uuid, boolean, text),
  public.admin_set_blocked(uuid, boolean), public.admin_update_settings(jsonb),
  public.admin_diffuseurs(), public.admin_annonceurs()
to authenticated;
revoke execute on function public.record_click(text, text, text, text, boolean) from authenticated;
grant execute on function public.record_click(text, text, text, text, boolean) to service_role;
