-- =====================================================================
-- StatuPub — Régie publicitaire sur statuts WhatsApp
-- 01 : Schéma, sécurité (RLS) et stockage
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('annonceur','diffuseur','admin');
create type public.campaign_status as enum ('en_attente','active','pause','terminee','rejetee');
create type public.request_status as enum ('en_attente','validee','rejetee');

-- ---------------------------------------------------------------------
-- Réglages globaux (une seule ligne)
-- ---------------------------------------------------------------------
create table public.settings (
  id int primary key default 1 check (id = 1),
  cpc_min int not null default 25,                 -- prix minimum du clic payé par l'annonceur (FCFA)
  payout_ratio numeric not null default 0.5        -- part reversée au diffuseur
    check (payout_ratio > 0 and payout_ratio < 1),
  min_withdrawal int not null default 1000,        -- retrait minimum (FCFA)
  min_budget int not null default 2500,            -- budget minimum d'une campagne (FCFA)
  daily_cap_per_link int not null default 200,     -- clics valides max / jour / diffuseur / campagne
  max_clicks_per_ip_day int not null default 15,   -- clics valides max / jour / adresse IP
  hold_hours int not null default 24,              -- délai de validation des gains
  whatsapp_channel_url text not null default '',
  wave_number text not null default '',
  om_number text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1);

-- ---------------------------------------------------------------------
-- Profils
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null default '',
  phone text not null default '',
  city text not null default '',
  company text not null default '',
  avg_views int not null default 0 check (avg_views >= 0),
  channel_joined boolean not null default false,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Campagnes
-- ---------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  annonceur_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  message text not null check (char_length(message) between 5 and 700),
  media_url text,
  target_url text not null check (target_url ~* '^https?://'),
  cpc int not null check (cpc > 0),
  payout int not null check (payout > 0),
  budget int not null check (budget > 0),
  spent int not null default 0 check (spent >= 0),
  status public.campaign_status not null default 'en_attente',
  reject_reason text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  ended_at timestamptz,
  check (spent <= budget),
  check (payout < cpc)
);
create index campaigns_annonceur_idx on public.campaigns (annonceur_id, created_at desc);
create index campaigns_status_idx on public.campaigns (status);

-- ---------------------------------------------------------------------
-- Liens traçables (1 par diffuseur et par campagne)
-- ---------------------------------------------------------------------
create table public.links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  diffuseur_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (campaign_id, diffuseur_id)
);
create index links_diffuseur_idx on public.links (diffuseur_id);

-- ---------------------------------------------------------------------
-- Clics
-- ---------------------------------------------------------------------
create table public.clicks (
  id bigint generated always as identity primary key,
  link_id uuid not null references public.links(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  diffuseur_id uuid not null references public.profiles(id) on delete cascade,
  visitor_hash text not null,
  ip_hash text not null,
  country text,
  is_valid boolean not null,
  reason text,
  cost int not null default 0,
  payout int not null default 0,
  created_at timestamptz not null default now()
);
create index clicks_campaign_idx on public.clicks (campaign_id, created_at);
create index clicks_diffuseur_idx on public.clicks (diffuseur_id, created_at);
create index clicks_link_idx on public.clicks (link_id, created_at);
create index clicks_ip_idx on public.clicks (ip_hash, created_at);
create unique index clicks_unique_valid_visitor on public.clicks (campaign_id, visitor_hash) where is_valid;

-- ---------------------------------------------------------------------
-- Recharges annonceurs (Wave / Orange Money, validées par l'admin)
-- ---------------------------------------------------------------------
create table public.recharges (
  id uuid primary key default gen_random_uuid(),
  annonceur_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null check (amount >= 1000),
  method text not null check (method in ('wave','orange_money','free_money','autre')),
  reference text not null check (char_length(reference) between 3 and 80),
  status public.request_status not null default 'en_attente',
  admin_note text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index recharges_annonceur_idx on public.recharges (annonceur_id, created_at desc);

-- ---------------------------------------------------------------------
-- Retraits diffuseurs
-- ---------------------------------------------------------------------
create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  diffuseur_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null check (amount > 0),
  method text not null check (method in ('wave','orange_money','free_money')),
  phone text not null check (char_length(phone) between 7 and 20),
  status public.request_status not null default 'en_attente',
  admin_note text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index withdrawals_diffuseur_idx on public.withdrawals (diffuseur_id, created_at desc);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Création automatique du profil à l'inscription (jamais admin)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role', 'diffuseur');
begin
  if r not in ('annonceur','diffuseur') then r := 'diffuseur'; end if;
  insert into public.profiles (id, role, full_name, phone, city, company)
  values (new.id, r::public.user_role,
          left(coalesce(new.raw_user_meta_data->>'full_name',''), 80),
          left(coalesce(new.raw_user_meta_data->>'phone',''), 20),
          left(coalesce(new.raw_user_meta_data->>'city',''), 60),
          left(coalesce(new.raw_user_meta_data->>'company',''), 80));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Sécurité : RLS (toutes les écritures sensibles passent par des fonctions)
-- ---------------------------------------------------------------------
alter table public.settings    enable row level security;
alter table public.profiles    enable row level security;
alter table public.campaigns   enable row level security;
alter table public.links       enable row level security;
alter table public.clicks      enable row level security;
alter table public.recharges   enable row level security;
alter table public.withdrawals enable row level security;

create policy settings_read on public.settings for select using (true);

create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, city, company, avg_views, channel_joined) on public.profiles to authenticated;

create policy campaigns_read on public.campaigns for select to authenticated
  using (annonceur_id = auth.uid() or status = 'active' or public.is_admin());

create policy links_read on public.links for select to authenticated
  using (diffuseur_id = auth.uid() or public.is_admin());

create policy clicks_read on public.clicks for select to authenticated
  using (diffuseur_id = auth.uid()
         or public.is_admin()
         or exists (select 1 from public.campaigns c where c.id = campaign_id and c.annonceur_id = auth.uid()));

create policy recharges_read on public.recharges for select to authenticated
  using (annonceur_id = auth.uid() or public.is_admin());

create policy withdrawals_read on public.withdrawals for select to authenticated
  using (diffuseur_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- Stockage des visuels publicitaires
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('creatives', 'creatives', true, 16777216,
        array['image/jpeg','image/png','image/webp','video/mp4']);

create policy creatives_upload_own on storage.objects for insert to authenticated
  with check (bucket_id = 'creatives' and (storage.foldername(name))[1] = auth.uid()::text);
