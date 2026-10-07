-- OPTIONAL. The current app does not depend on this migration.
-- Prepares custom domains and a future client area. Back up before applying.
begin;

create table if not exists public.business_domains (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  hostname text not null unique check (hostname = lower(hostname) and hostname ~ '^[a-z0-9.-]+$' and char_length(hostname) <= 253),
  status text not null default 'pending' check (status in ('pending','active','disabled')),
  created_at timestamptz not null default now()
);
create index if not exists business_domains_business_idx on public.business_domains(business_id);
alter table public.business_domains enable row level security;
drop policy if exists domains_admin_all on public.business_domains;
create policy domains_admin_all on public.business_domains for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists domains_public_active_read on public.business_domains;
create policy domains_public_active_read on public.business_domains for select
  using (status = 'active' and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'published'));

create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
alter table public.business_members enable row level security;
drop policy if exists members_admin_all on public.business_members;
create policy members_admin_all on public.business_members for all using (public.is_admin()) with check (public.is_admin());
-- No client-facing policy is created yet. Add policies only after the client portal is designed and reviewed.

commit;
