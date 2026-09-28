-- Plak hardening: dados persistentes, proteção de contas e timestamps.

alter type public.analytics_event_type add value if not exists 'share';

alter table public.business_media
  drop constraint if exists business_media_url_not_blob;
alter table public.business_media
  add constraint business_media_url_not_blob check (url !~* '^blob:') not valid;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_touch_updated_at on public.businesses;
create trigger businesses_touch_updated_at
before update on public.businesses
for each row execute procedure public.touch_updated_at();

create or replace function public.protect_system_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_protected and (new.role is distinct from old.role or new.access_status is distinct from old.access_status or new.is_protected is distinct from old.is_protected) then
    raise exception 'A conta protegida não pode ter suas permissões alteradas';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_system_profile on public.profiles;
create trigger protect_system_profile
before update on public.profiles
for each row execute procedure public.protect_system_profile();

create or replace function public.block_system_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_protected then raise exception 'A conta protegida não pode ser removida'; end if;
  return old;
end;
$$;

drop trigger if exists block_system_profile_delete on public.profiles;
create trigger block_system_profile_delete
before delete on public.profiles
for each row execute procedure public.block_system_profile_delete();

-- Novos eventos públicos continuam possíveis, mas nunca podem apontar para mídia ou negócio inexistente.
create index if not exists analytics_business_type_date_idx on public.analytics_events(business_id, event_type, created_at desc);
