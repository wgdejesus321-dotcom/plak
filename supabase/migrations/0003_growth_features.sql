-- Recursos premium do PLAK: leads e configurações de conversão por página.
alter table public.businesses add column if not exists features jsonb not null default '{"lead_enabled":false,"lead_title":"Fale com a gente","lead_button":"Enviar mensagem","campaign_enabled":false,"campaign_title":"","campaign_text":"","campaign_cta":"Saiba mais","campaign_url":"","catalog_text":"","testimonials_text":"","qr_label":"PLAK","show_badge":true}'::jsonb;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name varchar(120) not null,
  whatsapp varchar(40),
  email varchar(180),
  message text,
  source varchar(40) not null default 'bio',
  status varchar(20) not null default 'new' check (status in ('new','contacted','converted')),
  created_at timestamptz not null default now()
);
create index if not exists leads_business_date_idx on public.leads(business_id, created_at desc);
alter table public.leads enable row level security;
drop policy if exists leads_public_insert on public.leads;
create policy leads_public_insert on public.leads for insert to anon, authenticated with check (exists(select 1 from public.businesses b where b.id = business_id and b.status = 'published'));
drop policy if exists leads_admin_read on public.leads;
create policy leads_admin_read on public.leads for select using (public.is_admin());
drop policy if exists leads_admin_update on public.leads;
create policy leads_admin_update on public.leads for update using (public.is_admin()) with check (public.is_admin());
