-- Apply after 0001..0005. Back up the database before deployment.
begin;

alter table public.businesses drop constraint if exists businesses_delivery_slug;
alter table public.businesses add constraint businesses_delivery_slug
check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug not in ('admin','login','api','assets','__manus__','manus-storage')) not valid;
alter table public.business_links drop constraint if exists business_links_safe_url;
alter table public.business_links add constraint business_links_safe_url
check (url ~* '^(https?://|mailto:|tel:)' and char_length(url) <= 4096) not valid;
alter table public.leads drop constraint if exists leads_message_length;
alter table public.leads add constraint leads_message_length check (char_length(message) <= 4000) not valid;
alter table public.leads drop constraint if exists leads_contact_required;
alter table public.leads add constraint leads_contact_required check (char_length(trim(name)) >= 2 and (nullif(trim(email),'') is not null or nullif(trim(whatsapp),'') is not null)) not valid;
alter table public.analytics_events drop constraint if exists analytics_referrer_length;
alter table public.analytics_events add constraint analytics_referrer_length check (char_length(referrer) <= 4096) not valid;

create or replace function public.save_biosite(p_id uuid, p_business jsonb, p_links jsonb, p_media jsonb)
returns jsonb language plpgsql security invoker set search_path = public
as $$
declare
  v public.businesses%rowtype;
  saved public.businesses%rowtype;
begin
  if not public.is_admin() then raise exception 'Administrador aprovado necessário' using errcode = '42501'; end if;
  if jsonb_typeof(p_business) is distinct from 'object' or jsonb_typeof(p_links) is distinct from 'array' or jsonb_typeof(p_media) is distinct from 'array' then
    raise exception 'Documento inválido';
  end if;
  if jsonb_array_length(p_links) > 100 or jsonb_array_length(p_media) > 100 then raise exception 'Máximo de 100 botões e 100 mídias por BioSite'; end if;
  if octet_length(p_business::text) > 2097152 then raise exception 'Documento muito grande'; end if;
  v := jsonb_populate_record(null::public.businesses, p_business);
  if p_id is null then
    insert into public.businesses (name,slug,logo_url,tagline,google_review_url,whatsapp_number,whatsapp_message,instagram_url,website_url,address,maps_url,primary_color,secondary_color,background_color,background_image_url,standard_button_color,custom_button_color,seo_title,seo_description,seo_image_url,features,created_by)
    values (v.name,v.slug,v.logo_url,v.tagline,v.google_review_url,v.whatsapp_number,v.whatsapp_message,v.instagram_url,v.website_url,v.address,v.maps_url,v.primary_color,v.secondary_color,v.background_color,v.background_image_url,v.standard_button_color,v.custom_button_color,v.seo_title,v.seo_description,v.seo_image_url,v.features,auth.uid()) returning * into saved;
  else
    perform 1 from public.businesses where id=p_id for update;
    if not found then raise exception 'BioSite não encontrado'; end if;
    update public.businesses set name=v.name,
      slug=v.slug,
      logo_url=v.logo_url,
      tagline=v.tagline,
      google_review_url=v.google_review_url,
      whatsapp_number=v.whatsapp_number,
      whatsapp_message=v.whatsapp_message,
      instagram_url=v.instagram_url,
      website_url=v.website_url,
      address=v.address,
      maps_url=v.maps_url,
      primary_color=v.primary_color,
      secondary_color=v.secondary_color,
      background_color=v.background_color,
      background_image_url=v.background_image_url,
      standard_button_color=v.standard_button_color,
      custom_button_color=v.custom_button_color,
      seo_title=v.seo_title,
      seo_description=v.seo_description,
      seo_image_url=v.seo_image_url,
      features=v.features where id=p_id returning * into saved;
  end if;
  delete from public.business_links where business_id=saved.id;
  insert into public.business_links (business_id,label,url,kind,color,position)
  select saved.id,x.label,x.url,x.kind,x.color,x.position from jsonb_to_recordset(p_links)
    as x(label text,url text,kind text,color text,position integer);
  delete from public.business_media where business_id=saved.id;
  insert into public.business_media (business_id,type,url,storage_path,alt,position,object_position_x,object_position_y,object_scale)
  select saved.id,x.type,x.url,x.storage_path,x.alt,x.position,x.object_position_x,x.object_position_y,x.object_scale
  from jsonb_to_recordset(p_media) as x(type text,url text,storage_path text,alt text,position integer,object_position_x integer,object_position_y integer,object_scale numeric);
  return to_jsonb(saved);
end;
$$;
revoke all on function public.save_biosite(uuid,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.save_biosite(uuid,jsonb,jsonb,jsonb) to authenticated;
commit;
