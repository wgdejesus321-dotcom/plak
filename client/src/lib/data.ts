import { supabase } from "./supabase";
import type { AnalyticsEvent, AnalyticsSummary, Business, BusinessBundle, BusinessForm, BusinessLink, BusinessMedia, Lead, Profile } from "./types";
import { normalizeBusinessForm } from "./validation";

export const dbError = "Conecte o Supabase para carregar dados reais. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.";
const businessColumns = "id,name,slug,logo_url,tagline,google_review_url,whatsapp_number,whatsapp_message,instagram_url,website_url,address,maps_url,primary_color,secondary_color,background_color,background_image_url,standard_button_color,custom_button_color,seo_title,seo_description,seo_image_url,features,status,published_at,created_at,updated_at,created_by";
const profileColumns = "id,full_name,email,role,access_status,is_protected,created_at";

function requireDb() { if (!supabase) throw new Error(dbError); return supabase; }
function rejectBlob(value: string | null | undefined, label: string) { if (value?.startsWith("blob:")) throw new Error(`${label} ainda é uma prévia local. Aguarde o upload terminar antes de salvar.`); }

export async function listBusinesses() {
  const { data, error } = await requireDb().from("businesses").select(businessColumns).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Business[];
}

export async function getBusinessBySlug(slug: string, publishedOnly = true) {
  const db = requireDb();
  let query = db.from("businesses").select(`${businessColumns},business_links(id,label,url,kind,color,position),business_media(id,type,url,storage_path,alt,position,object_position_x,object_position_y,object_scale)`).eq("slug", slug);
  if (publishedOnly) query = query.eq("status", "published");
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    business: data as Business,
    links: ((data as any).business_links ?? []).sort((a: BusinessLink, b: BusinessLink) => a.position - b.position),
    media: ((data as any).business_media ?? []).filter((item: BusinessMedia) => !item.url.startsWith("blob:")).sort((a: BusinessMedia, b: BusinessMedia) => a.position - b.position),
  } as BusinessBundle;
}

export async function getBusiness(id: string) {
  const { data, error } = await requireDb().from("businesses").select(`${businessColumns},business_links(id,label,url,kind,color,position),business_media(id,type,url,storage_path,alt,position,object_position_x,object_position_y,object_scale)`).eq("id", id).single();
  if (error) throw error;
  return data as Business & { business_links?: BusinessLink[]; business_media?: BusinessMedia[] };
}

export async function saveBusiness(rawForm: BusinessForm, id?: string) {
  const db = requireDb();
  const form = normalizeBusinessForm(rawForm);
  rejectBlob(form.logo_url, "A logo");
  rejectBlob(form.background_image_url, "A imagem de fundo");
  form.media.forEach((media) => rejectBlob(media.url, "Uma mídia"));
  const payload = {
    name: form.name,
    slug: form.slug,
    logo_url: form.logo_url || null,
    tagline: form.tagline || "Olá! Como podemos ajudar?",
    google_review_url: form.google_review_url || null,
    whatsapp_number: form.whatsapp_number || null,
    whatsapp_message: form.whatsapp_message || null,
    instagram_url: form.instagram_url || null,
    website_url: form.website_url || null,
    address: form.address.trim() || null,
    maps_url: form.maps_url || null,
    primary_color: form.primary_color.toUpperCase(),
    secondary_color: form.secondary_color.toUpperCase(),
    background_color: form.background_color.toUpperCase(),
    background_image_url: form.background_image_url || null,
    standard_button_color: form.standard_button_color.toUpperCase(),
    custom_button_color: form.custom_button_color.toUpperCase(),
    seo_title: form.seo_title || `${form.name} | Página oficial`,
    seo_description: form.seo_description || `Conheça ${form.name}, entre em contato e encontre tudo em um só lugar.`,
    seo_image_url: form.seo_image_url || null,
    features: form.features,
  };
  const result = id
    ? await db.from("businesses").update(payload).eq("id", id).select(businessColumns).single()
    : await db.from("businesses").insert({ ...payload, created_by: (await db.auth.getUser()).data.user?.id }).select(businessColumns).single();
  if (result.error) throw result.error;
  const business = result.data as Business;
  const { error: linkDeleteError } = await db.from("business_links").delete().eq("business_id", business.id);
  if (linkDeleteError) throw linkDeleteError;
  if (form.links.length) {
    const { error } = await db.from("business_links").insert(form.links.map((link, position) => ({ business_id: business.id, label: link.label, url: link.url, kind: link.kind, color: link.color, position })));
    if (error) throw error;
  }
  const { error: mediaDeleteError } = await db.from("business_media").delete().eq("business_id", business.id);
  if (mediaDeleteError) throw mediaDeleteError;
  if (form.media.length) {
    const { error } = await db.from("business_media").insert(form.media.map((media, position) => ({ business_id: business.id, type: media.type, url: media.url, storage_path: media.storage_path ?? null, alt: media.alt || "Foto do cliente", position, object_position_x: media.object_position_x ?? 50, object_position_y: media.object_position_y ?? 50, object_scale: media.object_scale ?? 1 })));
    if (error) throw error;
  }
  return business;
}

export async function setBusinessStatus(id: string, status: "draft" | "inactive") {
  const { error } = await requireDb().from("businesses").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function publishBusiness(id: string) {
  const { error } = await requireDb().from("businesses").update({ status: "published", published_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteBusiness(id: string) {
  const { error } = await requireDb().from("businesses").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadAsset(file: File, businessId: string, kind: "logo" | "background" | "media" | "catalog") {
  const db = requireDb();
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-100);
  const path = `${businessId}/${kind}/${crypto.randomUUID()}-${safe}`;
  const { error } = await db.storage.from("business-assets").upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = db.storage.from("business-assets").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function trackEvent(event: AnalyticsEvent) {
  if (!supabase) return;
  await supabase.from("analytics_events").insert(event);
}

export async function getAnalytics(businessId: string, days: number): Promise<AnalyticsSummary> {
  const start = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await requireDb().from("analytics_events").select("event_type,target,source,device_type,created_at").eq("business_id", businessId).gte("created_at", start);
  if (error) throw error;
  const rows = (data ?? []) as (AnalyticsEvent & { created_at: string })[];
  const views = rows.filter((row) => row.event_type === "view").length;
  const clicks = rows.filter((row) => row.event_type === "click").length;
  const shares = rows.filter((row) => row.event_type === "share").length;
  const daysSet = new Set(rows.map((row) => row.created_at.slice(0, 10)));
  const devices: AnalyticsSummary["devices"] = { mobile: 0, tablet: 0, desktop: 0 };
  const sources: AnalyticsSummary["sources"] = { instagram: 0, whatsapp: 0, google: 0, placa: 0, direct: 0, other: 0 };
  const clickMap = new Map<string, number>();
  const dailyMap = new Map<string, number>();
  rows.forEach((row) => {
    if (row.device_type in devices) devices[row.device_type] += 1;
    if (row.source in sources) sources[row.source] += 1;
    if (row.event_type === "click") clickMap.set(row.target, (clickMap.get(row.target) ?? 0) + 1);
    if (row.event_type === "view") dailyMap.set(row.created_at.slice(0, 10), (dailyMap.get(row.created_at.slice(0, 10)) ?? 0) + 1);
  });
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - (days - index - 1) * 86400000).toISOString().slice(0, 10);
    return { day: date, views: dailyMap.get(date) ?? 0 };
  });
  return { views, clicks, shares, uniqueDays: daysSet.size, devices, sources, daily, topClicks: Array.from(clickMap.entries()).map(([target, count]) => ({ target, count })).sort((a, b) => b.count - a.count).slice(0, 5) };
}

export async function currentProfile() {
  const db = requireDb();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await db.from("profiles").select(profileColumns).eq("id", auth.user.id).single();
  if (error) throw error;
  return data as Profile;
}

export async function listProfiles() {
  const { data, error } = await requireDb().from("profiles").select(profileColumns).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateProfileAccess(id: string, access_status: "approved" | "revoked") {
  const { error } = await requireDb().from("profiles").update({ access_status }).eq("id", id);
  if (error) throw error;
}

export async function updateProfileRole(id: string, role: "user" | "admin") {
  const { error } = await requireDb().from("profiles").update({ role }).eq("id", id);
  if (error) throw error;
}

export async function removeProfile(id: string) {
  const { error } = await requireDb().from("profiles").delete().eq("id", id);
  if (error) throw error;
}


export async function createLead(lead: Omit<Lead, "id" | "created_at" | "status">) {
  const { data, error } = await requireDb().from("leads").insert({ ...lead, status: "new" }).select("*").single();
  if (error) throw error;
  return data as Lead;
}

export async function listLeads(businessId?: string) {
  let query = requireDb().from("leads").select("*").order("created_at", { ascending: false });
  if (businessId) query = query.eq("business_id", businessId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Lead[];
}

export async function duplicateBusiness(id: string) {
  const source = await getBusiness(id);
  const copy: BusinessForm = { name: `${source.name} (cópia)`, slug: `${source.slug}-copia`, logo_url: source.logo_url || "", tagline: source.tagline, google_review_url: source.google_review_url || "", whatsapp_number: source.whatsapp_number || "", whatsapp_message: source.whatsapp_message || "", instagram_url: source.instagram_url || "", website_url: source.website_url || "", address: source.address || "", maps_url: source.maps_url || "", primary_color: source.primary_color, secondary_color: source.secondary_color, background_color: source.background_color, background_image_url: source.background_image_url || "", standard_button_color: source.standard_button_color, custom_button_color: source.custom_button_color, seo_title: source.seo_title || "", seo_description: source.seo_description || "", seo_image_url: source.seo_image_url || "", features: source.features, links: (source.business_links || []).map(({ id: _id, business_id: _businessId, ...link }) => link), media: (source.business_media || []).map(({ id: _id, business_id: _businessId, ...media }) => media) };
  return saveBusiness(copy);
}
