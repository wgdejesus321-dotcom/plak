-- PLAK Web Cardápios: catálogo, pedidos, cozinha, tracking seguro e isolamento por estabelecimento.
-- Aplicar após 0001..0007. Não requer service role no navegador.
begin;
create extension if not exists pgcrypto;

-- O migration 0007 é opcional em instalações antigas; garanta a tabela de membros aqui também.
create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
alter table public.business_members enable row level security;
drop policy if exists members_admin_all on public.business_members;
create policy members_admin_all on public.business_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists members_self_read on public.business_members;
create policy members_self_read on public.business_members for select to authenticated using (user_id = auth.uid());

create or replace function public.has_business_access(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.business_members bm
    join public.profiles p on p.id = bm.user_id
    where bm.business_id = p_business_id and bm.user_id = auth.uid()
      and p.access_status = 'approved' and bm.role in ('owner','editor','viewer')
  );
$$;
revoke all on function public.has_business_access(uuid) from public;
grant execute on function public.has_business_access(uuid) to anon, authenticated;

create or replace function public.can_edit_business(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.business_members bm join public.profiles p on p.id=bm.user_id
    where bm.business_id=p_business_id and bm.user_id=auth.uid()
      and p.access_status='approved' and bm.role in ('owner','editor')
  );
$$;
revoke all on function public.can_edit_business(uuid) from public;
grant execute on function public.can_edit_business(uuid) to anon, authenticated;

-- Members may see their assigned business. Existing public read of published Bio-sites is preserved.
drop policy if exists business_member_read on public.businesses;
create policy business_member_read on public.businesses for select to authenticated
  using (public.has_business_access(id));
drop policy if exists links_member_read on public.business_links;
create policy links_member_read on public.business_links for select to authenticated
  using (public.has_business_access(business_id));
drop policy if exists media_member_read on public.business_media;
create policy media_member_read on public.business_media for select to authenticated
  using (public.has_business_access(business_id));

create table if not exists public.business_menus (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  name varchar(120) not null default 'Cardápio principal',
  template_key text not null default 'smash-dark'
    check (template_key in ('smash-dark','pizza-italiana','mesa-natural','delivery-bold','cafe-editorial')),
  settings jsonb not null default '{"allow_dine_in":true,"allow_pickup":true,"allow_delivery":false,"allow_manual_table_number":true,"delivery_fee_cents":0,"estimated_prep_minutes":25,"alert_sound":false,"currency":"BRL"}'::jsonb,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name varchar(100) not null,
  description varchar(300),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, name)
);
create index if not exists menu_categories_order_idx on public.menu_categories(business_id, position, name);

create table if not exists public.menu_stations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name varchar(80) not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists public.menu_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  station_id uuid references public.menu_stations(id) on delete set null,
  name varchar(140) not null,
  description varchar(1000) not null default '',
  price_cents integer not null check (price_cents >= 0),
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (image_url is null or (image_url ~* '^https://' and char_length(image_url) <= 4096))
);
create index if not exists menu_products_category_idx on public.menu_products(business_id, category_id, position);
create index if not exists menu_products_available_idx on public.menu_products(business_id, is_available);

create table if not exists public.menu_product_option_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.menu_products(id) on delete cascade,
  name varchar(100) not null default 'Adicionais',
  is_required boolean not null default false,
  min_selections integer not null default 0 check (min_selections >= 0),
  max_selections integer not null default 10 check (max_selections between 1 and 30),
  position integer not null default 0,
  is_active boolean not null default true,
  check (min_selections <= max_selections)
);
create index if not exists menu_option_groups_product_idx on public.menu_product_option_groups(product_id, position);

create table if not exists public.menu_product_option_choices (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.menu_product_option_groups(id) on delete cascade,
  name varchar(100) not null,
  price_cents integer not null default 0 check (price_cents >= 0),
  is_active boolean not null default true,
  position integer not null default 0
);
create index if not exists menu_option_choices_group_idx on public.menu_product_option_choices(group_id, position);

create or replace function public.validate_menu_product_tenant()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.menu_categories c where c.id=new.category_id and c.business_id=new.business_id
  ) then raise exception 'A categoria deve pertencer ao mesmo estabelecimento do produto.'; end if;
  if new.station_id is not null and not exists (
    select 1 from public.menu_stations s where s.id=new.station_id and s.business_id=new.business_id
  ) then raise exception 'A estação deve pertencer ao mesmo estabelecimento do produto.'; end if;
  return new;
end;
$$;
drop trigger if exists menu_product_tenant_guard on public.menu_products;
create trigger menu_product_tenant_guard before insert or update of business_id,category_id,station_id
  on public.menu_products for each row execute procedure public.validate_menu_product_tenant();

create or replace function public.validate_menu_option_group_tenant()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.menu_products p where p.id=new.product_id and p.business_id=new.business_id) then
    raise exception 'O grupo de opções deve pertencer ao mesmo estabelecimento do produto.';
  end if;
  return new;
end;
$$;
drop trigger if exists menu_option_group_tenant_guard on public.menu_product_option_groups;
create trigger menu_option_group_tenant_guard before insert or update of business_id,product_id
  on public.menu_product_option_groups for each row execute procedure public.validate_menu_option_group_tenant();

-- qr_token é aleatório e não é o número da mesa; o servidor valida o token em cada pedido.
create table if not exists public.menu_tables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  table_number varchar(12) not null,
  qr_token uuid not null unique default gen_random_uuid(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, table_number)
);
create index if not exists menu_tables_business_idx on public.menu_tables(business_id, table_number);

create table if not exists public.business_order_counters (
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_date date not null,
  last_number integer not null default 0 check (last_number >= 0),
  primary key (business_id, order_date)
);

create table if not exists public.menu_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  menu_id uuid not null references public.business_menus(id) on delete restrict,
  order_date date not null,
  daily_number integer not null check (daily_number > 0),
  idempotency_key uuid not null,
  tracking_token text not null unique,
  status text not null default 'new' check (status in ('new','confirmed','preparing','ready','delivering','completed','cancelled')),
  fulfillment text not null check (fulfillment in ('dine_in','pickup','delivery')),
  customer_name varchar(100) not null,
  customer_phone varchar(30) not null,
  customer_address text,
  table_number varchar(12),
  customer_notes varchar(1000),
  payment_method text not null check (payment_method in ('pix','card','cash')),
  payment_status text not null default 'pending' check (payment_status in ('pending','confirmed','failed','refunded')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  estimated_prep_minutes integer not null default 25 check (estimated_prep_minutes between 1 and 240),
  cancel_reason varchar(500),
  kitchen_notes varchar(1000),
  stage_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, order_date, daily_number),
  unique (business_id, idempotency_key)
);
create index if not exists menu_orders_business_created_idx on public.menu_orders(business_id, created_at desc);
create index if not exists menu_orders_business_status_idx on public.menu_orders(business_id, status, created_at desc);
create index if not exists menu_orders_business_date_idx on public.menu_orders(business_id, order_date desc, daily_number desc);

create table if not exists public.menu_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.menu_orders(id) on delete cascade,
  product_id uuid references public.menu_products(id) on delete set null,
  category_id uuid references public.menu_categories(id) on delete set null,
  station_id uuid references public.menu_stations(id) on delete set null,
  product_name varchar(140) not null,
  category_name varchar(100),
  station_name varchar(80),
  quantity integer not null check (quantity between 1 and 99),
  base_price_cents integer not null check (base_price_cents >= 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  selected_options jsonb not null default '[]'::jsonb,
  notes varchar(500),
  created_at timestamptz not null default now()
);
create index if not exists menu_order_items_order_idx on public.menu_order_items(order_id);
create index if not exists menu_order_items_category_idx on public.menu_order_items(category_id);
create index if not exists menu_order_items_station_idx on public.menu_order_items(station_id);

create table if not exists public.menu_order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.menu_orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  note varchar(500),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);
create index if not exists menu_order_history_order_idx on public.menu_order_status_history(order_id, changed_at);

-- Future subscriptions/feature gating. No payment provider or recurring charge is implied by this table.
create table if not exists public.business_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  plan_code text not null default 'biosite' check (plan_code in ('biosite','web_menu','complete')),
  status text not null default 'manual' check (status in ('trial','active','past_due','cancelled','manual')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.business_subscriptions(business_id, plan_code, status)
select b.id, 'biosite', 'manual' from public.businesses b
on conflict (business_id) do nothing;

-- Update timestamps and authorize all data through business membership.
create or replace function public.touch_menu_updated_at()
returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists business_menus_touch_updated_at on public.business_menus;
create trigger business_menus_touch_updated_at before update on public.business_menus for each row execute procedure public.touch_menu_updated_at();
drop trigger if exists menu_products_touch_updated_at on public.menu_products;
create trigger menu_products_touch_updated_at before update on public.menu_products for each row execute procedure public.touch_menu_updated_at();
drop trigger if exists business_subscriptions_touch_updated_at on public.business_subscriptions;
create trigger business_subscriptions_touch_updated_at before update on public.business_subscriptions for each row execute procedure public.touch_menu_updated_at();

create or replace function public.business_menu_is_public(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.business_menus m where m.business_id=p_business_id and m.is_published); $$;
revoke all on function public.business_menu_is_public(uuid) from public;
grant execute on function public.business_menu_is_public(uuid) to anon, authenticated;

-- Keep private business columns private: the public menu receives only its presentation fields via RPC.
drop policy if exists business_menu_public_read on public.businesses;
create or replace function public.get_public_menu_business(p_slug text)
returns jsonb language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'id',b.id,'name',b.name,'slug',b.slug,'logo_url',b.logo_url,'tagline',b.tagline,
    'primary_color',b.primary_color,'secondary_color',b.secondary_color,'background_color',b.background_color,'status',b.status
  )
  from public.businesses b join public.business_menus m on m.business_id=b.id
  where b.slug=p_slug and m.is_published
  limit 1;
$$;
revoke all on function public.get_public_menu_business(text) from public;
grant execute on function public.get_public_menu_business(text) to anon, authenticated;

create or replace function public.list_accessible_businesses()
returns setof public.businesses language sql stable security definer set search_path = public
as $$
  select b.* from public.businesses b
  where public.is_admin() or exists (
    select 1 from public.business_members bm join public.profiles p on p.id=bm.user_id
    where bm.business_id=b.id and bm.user_id=auth.uid() and p.access_status='approved'
  ) order by b.created_at desc;
$$;
revoke all on function public.list_accessible_businesses() from public;
grant execute on function public.list_accessible_businesses() to authenticated;

-- RLS: public visitors only see published menu/catalog data. Draft editing requires membership.
alter table public.business_menus enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_stations enable row level security;
alter table public.menu_products enable row level security;
alter table public.menu_product_option_groups enable row level security;
alter table public.menu_product_option_choices enable row level security;
alter table public.menu_tables enable row level security;
alter table public.business_order_counters enable row level security;
alter table public.menu_orders enable row level security;
alter table public.menu_order_items enable row level security;
alter table public.menu_order_status_history enable row level security;
alter table public.business_subscriptions enable row level security;

create policy menu_public_read on public.business_menus for select to anon, authenticated
  using ((is_published and public.business_menu_is_public(business_id)) or (auth.uid() is not null and public.has_business_access(business_id)));
create policy menu_manager_write on public.business_menus for all to authenticated
  using (public.can_edit_business(business_id)) with check (public.can_edit_business(business_id));

create policy menu_categories_public_read on public.menu_categories for select to anon, authenticated
  using (is_active and public.business_menu_is_public(business_id) or (auth.uid() is not null and public.has_business_access(business_id)));
create policy menu_categories_manager_write on public.menu_categories for all to authenticated
  using (public.can_edit_business(business_id)) with check (public.can_edit_business(business_id));

create policy menu_stations_manager_read on public.menu_stations for select to authenticated using (public.has_business_access(business_id));
create policy menu_stations_manager_write on public.menu_stations for all to authenticated
  using (public.can_edit_business(business_id)) with check (public.can_edit_business(business_id));

create policy menu_products_public_read on public.menu_products for select to anon, authenticated
  using (is_available and public.business_menu_is_public(business_id) or (auth.uid() is not null and public.has_business_access(business_id)));
create policy menu_products_manager_write on public.menu_products for all to authenticated
  using (public.can_edit_business(business_id)) with check (public.can_edit_business(business_id));

create policy menu_option_groups_public_read on public.menu_product_option_groups for select to anon, authenticated
  using (is_active and public.business_menu_is_public(business_id) or (auth.uid() is not null and public.has_business_access(business_id)));
create policy menu_option_groups_manager_write on public.menu_product_option_groups for all to authenticated
  using (public.can_edit_business(business_id)) with check (public.can_edit_business(business_id));
create policy menu_option_choices_public_read on public.menu_product_option_choices for select to anon, authenticated
  using (is_active and exists(select 1 from public.menu_product_option_groups g where g.id=group_id and g.is_active and (public.business_menu_is_public(g.business_id) or (auth.uid() is not null and public.has_business_access(g.business_id)))));
create policy menu_option_choices_manager_write on public.menu_product_option_choices for all to authenticated
  using (exists(select 1 from public.menu_product_option_groups g where g.id=group_id and public.can_edit_business(g.business_id)))
  with check (exists(select 1 from public.menu_product_option_groups g where g.id=group_id and public.can_edit_business(g.business_id)));

create policy menu_tables_manager_read on public.menu_tables for select to authenticated using (public.has_business_access(business_id));
create policy menu_tables_manager_write on public.menu_tables for all to authenticated using (public.can_edit_business(business_id)) with check (public.can_edit_business(business_id));
create policy order_counters_manager_read on public.business_order_counters for select to authenticated using (public.has_business_access(business_id));
create policy menu_orders_manager_read on public.menu_orders for select to authenticated using (public.has_business_access(business_id));
create policy menu_orders_manager_update on public.menu_orders for update to authenticated using (public.can_edit_business(business_id)) with check (public.can_edit_business(business_id));
create policy menu_order_items_manager_read on public.menu_order_items for select to authenticated
  using (exists(select 1 from public.menu_orders o where o.id=order_id and public.has_business_access(o.business_id)));
create policy menu_order_history_manager_read on public.menu_order_status_history for select to authenticated
  using (exists(select 1 from public.menu_orders o where o.id=order_id and public.has_business_access(o.business_id)));
create policy subscription_admin_all on public.business_subscriptions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy subscription_member_read on public.business_subscriptions for select to authenticated using (public.has_business_access(business_id));

-- Public order creation never grants direct INSERT or SELECT access to menu_orders.
create or replace function public.resolve_public_menu_table(p_business_slug text, p_table_token text)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare v_result jsonb;
begin
  if p_table_token is null or p_table_token !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return null; end if;
  select jsonb_build_object('table_number', t.table_number)
    into v_result
  from public.menu_tables t join public.businesses b on b.id=t.business_id
  join public.business_menus m on m.business_id=b.id
  where b.slug=p_business_slug and m.is_published
    and t.qr_token=p_table_token::uuid and t.is_active;
  return v_result;
exception when invalid_text_representation then return null;
end;
$$;
revoke all on function public.resolve_public_menu_table(text,text) from public;
grant execute on function public.resolve_public_menu_table(text,text) to anon, authenticated;

create or replace function public.place_menu_order(
  p_business_slug text,
  p_items jsonb,
  p_fulfillment text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_table_token text,
  p_manual_table_number text,
  p_payment_method text,
  p_notes text,
  p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_business_id uuid;
  v_menu_id uuid;
  v_settings jsonb;
  v_business_name text;
  v_allow boolean;
  v_order_date date;
  v_order_number integer;
  v_delivery_fee integer := 0;
  v_prep_minutes integer := 25;
  v_table_number text;
  v_subtotal bigint := 0;
  v_total bigint := 0;
  v_item jsonb;
  v_option_ids jsonb;
  v_requested_options integer;
  v_found_options integer;
  v_group record;
  v_group_count integer;
  v_product record;
  v_product_id uuid;
  v_quantity integer;
  v_base_price integer;
  v_unit_price integer;
  v_options_price integer;
  v_selected_options jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_existing record;
  v_saved record;
  v_token text;
  v_customer_name text := trim(coalesce(p_customer_name,''));
  v_customer_phone text := trim(coalesce(p_customer_phone,''));
  v_customer_address text := trim(coalesce(p_customer_address,''));
begin
  if p_idempotency_key is null then raise exception 'Não foi possível validar a solicitação. Atualize a página e tente novamente.'; end if;
  if p_business_slug is null or char_length(p_business_slug) < 2 then raise exception 'Estabelecimento inválido.'; end if;
  select b.id, b.name, m.id, m.settings into v_business_id, v_business_name, v_menu_id, v_settings
  from public.businesses b join public.business_menus m on m.business_id=b.id
  where b.slug=p_business_slug and m.is_published;
  if not found then raise exception 'Este cardápio não está publicado ou está indisponível.'; end if;

  -- Same idempotency key returns the original order, including its original tracking token.
  select o.id, o.order_date, o.daily_number, o.tracking_token, o.total_cents
    into v_existing from public.menu_orders o
    where o.business_id=v_business_id and o.idempotency_key=p_idempotency_key;
  if found then
    return jsonb_build_object('order_id',v_existing.id,'order_date',v_existing.order_date,
      'order_number',v_existing.daily_number,'tracking_token',v_existing.tracking_token,
      'total_cents',v_existing.total_cents,'duplicate',true);
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'O carrinho precisa conter de 1 a 50 itens.';
  end if;
  if p_fulfillment not in ('dine_in','pickup','delivery') then raise exception 'Modalidade de atendimento inválida.'; end if;
  v_allow := coalesce((v_settings->>'allow_dine_in')::boolean,false);
  if p_fulfillment='dine_in' and not v_allow then raise exception 'Consumo no local está indisponível.'; end if;
  v_allow := coalesce((v_settings->>'allow_pickup')::boolean,false);
  if p_fulfillment='pickup' and not v_allow then raise exception 'Retirada está indisponível.'; end if;
  v_allow := coalesce((v_settings->>'allow_delivery')::boolean,false);
  if p_fulfillment='delivery' and not v_allow then raise exception 'Entrega está indisponível.'; end if;
  if char_length(v_customer_name) < 2 or char_length(v_customer_name) > 100 then raise exception 'Informe o nome para identificar o pedido.'; end if;
  if char_length(regexp_replace(v_customer_phone,'[^0-9]','','g')) < 8 or char_length(v_customer_phone) > 30 then raise exception 'Informe um telefone válido.'; end if;
  if p_fulfillment='delivery' and char_length(v_customer_address) < 6 then raise exception 'Informe o endereço completo para entrega.'; end if;
  if p_payment_method not in ('pix','card','cash') then raise exception 'Forma de pagamento inválida.'; end if;
  if char_length(coalesce(p_notes,'')) > 1000 then raise exception 'As observações ultrapassam o limite permitido.'; end if;

  if p_fulfillment='dine_in' then
    if p_table_token is not null and p_table_token <> '' then
      if p_table_token !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Identificação de mesa inválida.'; end if;
      select t.table_number into v_table_number from public.menu_tables t
      where t.business_id=v_business_id and t.qr_token=p_table_token::uuid and t.is_active;
      if not found then raise exception 'QR Code de mesa inválido ou desativado. Abra o cardápio pelo QR Code da mesa.'; end if;
    else
      if not coalesce((v_settings->>'allow_manual_table_number')::boolean,true) then raise exception 'Use o QR Code da mesa para fazer o pedido.'; end if;
      v_table_number := trim(coalesce(p_manual_table_number,''));
      if v_table_number !~ '^[[:alnum:]-]{1,12}$' then raise exception 'Informe um número de mesa válido.'; end if;
    end if;
  end if;
  if p_fulfillment='delivery' then v_delivery_fee := greatest(coalesce((v_settings->>'delivery_fee_cents')::integer,0),0); end if;
  v_prep_minutes := least(greatest(coalesce((v_settings->>'estimated_prep_minutes')::integer,25),1),240);

  -- Prices, availability, option ownership and quantity are read and checked inside the database.
  for v_item in select value from jsonb_array_elements(p_items) loop
    if coalesce(v_item->>'product_id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Um produto do carrinho é inválido.'; end if;
    v_product_id := (v_item->>'product_id')::uuid;
    begin v_quantity := (v_item->>'quantity')::integer; exception when others then raise exception 'Quantidade inválida no carrinho.'; end;
    if v_quantity < 1 or v_quantity > 99 then raise exception 'As quantidades devem estar entre 1 e 99.'; end if;
    select p.id,p.business_id,p.category_id,p.station_id,p.name,p.description,p.price_cents,p.is_available,
           c.name as category_name,s.name as station_name
      into v_product
    from public.menu_products p
    left join public.menu_categories c on c.id=p.category_id and c.business_id=p.business_id and c.is_active
    left join public.menu_stations s on s.id=p.station_id and s.business_id=p.business_id and s.is_active
    where p.id=v_product_id and p.business_id=v_business_id and p.is_available;
    if not found then raise exception 'Um produto deixou de estar disponível. Atualize o cardápio e tente novamente.'; end if;
    if v_product.category_id is not null and v_product.category_name is null then raise exception 'A categoria de um produto está indisponível.'; end if;

    v_option_ids := coalesce(v_item->'option_choice_ids','[]'::jsonb);
    if jsonb_typeof(v_option_ids) is distinct from 'array' or jsonb_array_length(v_option_ids) > 30 then raise exception 'Opções inválidas no produto %.', v_product.name; end if;
    select count(*) into v_requested_options from jsonb_array_elements_text(v_option_ids);
    select count(distinct c.id) into v_found_options
    from jsonb_array_elements_text(v_option_ids) x(value)
    join public.menu_product_option_choices c on c.id=x.value::uuid and c.is_active
    join public.menu_product_option_groups g on g.id=c.group_id and g.product_id=v_product.id and g.business_id=v_business_id and g.is_active;
    if v_found_options <> v_requested_options then raise exception 'Uma opção de % não é mais válida.', v_product.name; end if;
    for v_group in select * from public.menu_product_option_groups g where g.product_id=v_product.id and g.is_active loop
      select count(*) into v_group_count
      from jsonb_array_elements_text(v_option_ids) x(value)
      join public.menu_product_option_choices c on c.id=x.value::uuid and c.group_id=v_group.id and c.is_active;
      if v_group_count < v_group.min_selections then raise exception 'Escolha pelo menos % opção(ões) em %.', v_group.min_selections, v_group.name; end if;
      if v_group_count > v_group.max_selections then raise exception 'Escolha no máximo % opção(ões) em %.', v_group.max_selections, v_group.name; end if;
    end loop;
    select coalesce(sum(c.price_cents),0),
      coalesce(jsonb_agg(jsonb_build_object('id',c.id,'group_name',g.name,'name',c.name,'price_cents',c.price_cents) order by g.position,c.position),'[]'::jsonb)
      into v_options_price,v_selected_options
    from jsonb_array_elements_text(v_option_ids) x(value)
    join public.menu_product_option_choices c on c.id=x.value::uuid and c.is_active
    join public.menu_product_option_groups g on g.id=c.group_id and g.product_id=v_product.id and g.business_id=v_business_id and g.is_active;
    v_base_price := v_product.price_cents;
    v_unit_price := v_base_price + coalesce(v_options_price,0);
    if v_unit_price > 2147483647 or (v_unit_price::bigint * v_quantity) > 2147483647 then raise exception 'Valor do item ultrapassa o limite.'; end if;
    if char_length(coalesce(v_item->>'notes','')) > 500 then raise exception 'Observação de produto muito longa.'; end if;
    v_subtotal := v_subtotal + (v_unit_price::bigint * v_quantity);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id',v_product.id,'category_id',v_product.category_id,'station_id',v_product.station_id,
      'product_name',v_product.name,'category_name',v_product.category_name,'station_name',v_product.station_name,
      'quantity',v_quantity,'base_price_cents',v_base_price,'unit_price_cents',v_unit_price,
      'line_total_cents',v_unit_price*v_quantity,'selected_options',v_selected_options,'notes',coalesce(v_item->>'notes','')
    ));
  end loop;
  if v_subtotal > 2147483647 or (v_subtotal + v_delivery_fee) > 2147483647 then raise exception 'Total do pedido ultrapassa o limite permitido.'; end if;
  v_total := v_subtotal + v_delivery_fee;
  v_order_date := (now() at time zone 'America/Sao_Paulo')::date;
  v_token := gen_random_uuid()::text;

  insert into public.business_order_counters(business_id,order_date,last_number) values(v_business_id,v_order_date,1)
    on conflict (business_id,order_date) do update set last_number=public.business_order_counters.last_number+1
    returning last_number into v_order_number;

  insert into public.menu_orders(business_id,menu_id,order_date,daily_number,idempotency_key,tracking_token,status,fulfillment,
    customer_name,customer_phone,customer_address,table_number,customer_notes,payment_method,subtotal_cents,delivery_fee_cents,total_cents,estimated_prep_minutes)
  values(v_business_id,v_menu_id,v_order_date,v_order_number,p_idempotency_key,v_token,'new',p_fulfillment,
    v_customer_name,v_customer_phone,nullif(v_customer_address,''),v_table_number,nullif(trim(coalesce(p_notes,'')),''),p_payment_method,v_subtotal,v_delivery_fee,v_total,v_prep_minutes)
  on conflict (business_id,idempotency_key) do nothing
  returning id,order_date,daily_number,tracking_token,total_cents into v_saved;

  if v_saved.id is null then
    select o.id,o.order_date,o.daily_number,o.tracking_token,o.total_cents into v_existing
    from public.menu_orders o where o.business_id=v_business_id and o.idempotency_key=p_idempotency_key;
    return jsonb_build_object('order_id',v_existing.id,'order_date',v_existing.order_date,
      'order_number',v_existing.daily_number,'tracking_token',v_existing.tracking_token,
      'total_cents',v_existing.total_cents,'duplicate',true);
  end if;

  insert into public.menu_order_items(order_id,product_id,category_id,station_id,product_name,category_name,station_name,
    quantity,base_price_cents,unit_price_cents,line_total_cents,selected_options,notes)
  select v_saved.id,(x->>'product_id')::uuid,nullif(x->>'category_id','')::uuid,nullif(x->>'station_id','')::uuid,
    x->>'product_name',nullif(x->>'category_name',''),nullif(x->>'station_name',''),(x->>'quantity')::integer,
    (x->>'base_price_cents')::integer,(x->>'unit_price_cents')::integer,(x->>'line_total_cents')::integer,
    coalesce(x->'selected_options','[]'::jsonb),nullif(x->>'notes','')
  from jsonb_array_elements(v_lines) x;

  return jsonb_build_object('order_id',v_saved.id,'order_date',v_saved.order_date,
    'order_number',v_saved.daily_number,'tracking_token',v_saved.tracking_token,
    'total_cents',v_saved.total_cents,'duplicate',false);
end;
$$;
revoke all on function public.place_menu_order(text,jsonb,text,text,text,text,text,text,text,text,uuid) from public;
grant execute on function public.place_menu_order(text,jsonb,text,text,text,text,text,text,text,text,uuid) to anon, authenticated;

create or replace function public.get_public_order_tracking(p_tracking_token text)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare v_order record; v_items jsonb; v_history jsonb;
begin
  if p_tracking_token is null or p_tracking_token !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return null; end if;
  select o.id,o.daily_number,o.order_date,o.status,o.fulfillment,o.table_number,o.customer_name,
    o.subtotal_cents,o.delivery_fee_cents,o.total_cents,o.payment_method,o.payment_status,
    o.created_at,o.stage_updated_at,o.estimated_prep_minutes,b.name as business_name,b.slug as business_slug
  into v_order from public.menu_orders o join public.businesses b on b.id=o.business_id
  where o.tracking_token=p_tracking_token;
  if not found then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('product_name',i.product_name,'quantity',i.quantity,
    'unit_price_cents',i.unit_price_cents,'line_total_cents',i.line_total_cents,'selected_options',i.selected_options,'notes',i.notes) order by i.created_at),'[]'::jsonb)
    into v_items from public.menu_order_items i where i.order_id=v_order.id;
  select coalesce(jsonb_agg(jsonb_build_object('from_status',h.from_status,'to_status',h.to_status,'note',h.note,'changed_at',h.changed_at) order by h.changed_at),'[]'::jsonb)
    into v_history from public.menu_order_status_history h where h.order_id=v_order.id;
  return jsonb_build_object('id',v_order.id,'order_number',v_order.daily_number,'order_date',v_order.order_date,
    'status',v_order.status,'fulfillment',v_order.fulfillment,'table_number',v_order.table_number,
    'customer_name',split_part(v_order.customer_name,' ',1),'subtotal_cents',v_order.subtotal_cents,
    'delivery_fee_cents',v_order.delivery_fee_cents,'total_cents',v_order.total_cents,
    'payment_method',v_order.payment_method,'payment_status',v_order.payment_status,
    'created_at',v_order.created_at,'stage_updated_at',v_order.stage_updated_at,
    'estimated_prep_minutes',v_order.estimated_prep_minutes,'business_name',v_order.business_name,
    'business_slug',v_order.business_slug,'items',v_items,'history',v_history);
end;
$$;
revoke all on function public.get_public_order_tracking(text) from public;
grant execute on function public.get_public_order_tracking(text) to anon, authenticated;

create or replace function public.guard_menu_order_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op='UPDATE' and new.status is distinct from old.status then
    if not public.can_edit_business(old.business_id) then raise exception 'Você não tem acesso a este pedido.' using errcode='42501'; end if;
    if old.status in ('completed','cancelled') then raise exception 'Pedidos finalizados não podem mudar de etapa.'; end if;
    if not (
      (old.status='new' and new.status in ('confirmed','cancelled')) or
      (old.status='confirmed' and new.status in ('preparing','cancelled')) or
      (old.status='preparing' and new.status in ('ready','cancelled')) or
      (old.status='ready' and new.status in ('delivering','completed','cancelled')) or
      (old.status='delivering' and new.status in ('completed','cancelled'))
    ) then raise exception 'Transição de status inválida: % → %.',old.status,new.status; end if;
    if new.status='delivering' and old.fulfillment <> 'delivery' then raise exception 'Somente pedidos de entrega podem sair para entrega.'; end if;
    if new.status='cancelled' and char_length(trim(coalesce(new.cancel_reason,''))) < 3 then raise exception 'Informe o motivo do cancelamento.'; end if;
    new.stage_updated_at := now();
    new.updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists menu_order_status_guard on public.menu_orders;
create trigger menu_order_status_guard before update of status on public.menu_orders for each row execute procedure public.guard_menu_order_status();

create or replace function public.guard_menu_order_payment()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.payment_status is distinct from old.payment_status then
    if not public.can_edit_business(old.business_id) then raise exception 'Você não tem permissão para confirmar pagamentos.' using errcode='42501'; end if;
    if not ((old.payment_status='pending' and new.payment_status in ('confirmed','failed')) or
            (old.payment_status='confirmed' and new.payment_status='refunded')) then
      raise exception 'Transição de pagamento inválida.';
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists menu_order_payment_guard on public.menu_orders;
create trigger menu_order_payment_guard before update of payment_status on public.menu_orders for each row execute procedure public.guard_menu_order_payment();

create or replace function public.log_menu_order_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op='INSERT' then
    insert into public.menu_order_status_history(order_id,from_status,to_status,note,changed_by)
    values(new.id,null,new.status,'Pedido recebido',null);
  elsif new.status is distinct from old.status then
    insert into public.menu_order_status_history(order_id,from_status,to_status,note,changed_by)
    values(new.id,old.status,new.status,case when new.status='cancelled' then new.cancel_reason else null end,auth.uid());
  end if;
  return new;
end;
$$;
drop trigger if exists menu_order_status_log on public.menu_orders;
create trigger menu_order_status_log after insert or update on public.menu_orders for each row execute procedure public.log_menu_order_status();

-- Membership changes stay RLS-protected; platform admins manage invitations and roles.
grant select, insert, update, delete on public.business_members to authenticated;

-- Restrict direct table access for the public. Orders can only be created through the validated RPC.
revoke all on public.menu_orders, public.menu_order_items, public.menu_order_status_history, public.business_order_counters from anon;
grant select on public.business_menus, public.menu_categories, public.menu_products, public.menu_product_option_groups, public.menu_product_option_choices to anon, authenticated;
grant insert, update, delete on public.business_menus, public.menu_categories, public.menu_stations, public.menu_products, public.menu_product_option_groups, public.menu_product_option_choices, public.menu_tables to authenticated;
grant select on public.menu_stations, public.menu_tables, public.business_order_counters, public.menu_orders, public.menu_order_items, public.menu_order_status_history, public.business_subscriptions to authenticated;
grant update(status,cancel_reason,kitchen_notes,payment_status) on public.menu_orders to authenticated;
revoke insert, delete on public.menu_orders, public.menu_order_items, public.menu_order_status_history from anon, authenticated;
revoke update on public.menu_order_items, public.menu_order_status_history from anon, authenticated;

commit;
