import type { BusinessForm, BusinessLink, LinkKind } from "./types";

export const MAX_FILE_BYTES = {
  logo: 5 * 1024 * 1024,
  background: 15 * 1024 * 1024,
  media: 15 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

export function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120).replace(/-+$/g, "");
}

export const RESERVED_SLUGS = ["admin", "login", "api", "assets", "__manus__", "manus-storage"];

export function isReservedSlug(value: string) {
  return RESERVED_SLUGS.includes(value.toLowerCase());
}

export function ensureHttpUrl(value: string, fallbackScheme = "https") {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) throw new Error("O link contém caracteres inválidos.");
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const candidate = hasScheme ? trimmed : `${fallbackScheme}://${trimmed.replace(/^\/\//, "")}`;
  let parsed: URL;
  try { parsed = new URL(candidate); } catch { throw new Error("Informe um link válido, como https://exemplo.com."); }
  if (!["https:", "http:", "mailto:", "tel:"].includes(parsed.protocol)) throw new Error("Esse tipo de link não é permitido.");
  if (["https:", "http:"].includes(parsed.protocol) && (!parsed.hostname || parsed.username || parsed.password)) throw new Error("Informe um endereço sem usuário ou senha no link.");
  return candidate;
}

export function safeHref(value: string | null | undefined) {
  if (!value) return undefined;
  try { return ensureHttpUrl(value); } catch { return undefined; }
}

export function normalizeInstagram(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return ensureHttpUrl(trimmed);
  const handle = trimmed.replace(/^@/, "").replace(/^instagram\.com\//i, "").replace(/^\/+/, "");
  return handle ? `https://instagram.com/${handle}` : "";
}

export function normalizeWhatsApp(value: string) {
  return value.trim().replace(/[^\d+]/g, "").replace(/^\+/, "");
}

export function normalizeLink(kind: LinkKind, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (kind === "email") return trimmed.replace(/^mailto:/i, "").includes("@") ? `mailto:${trimmed.replace(/^mailto:/i, "")}` : trimmed;
  if (kind === "phone") return `tel:${trimmed.replace(/[^+\d]/g, "")}`;
  if (kind === "whatsapp") return `https://wa.me/${normalizeWhatsApp(trimmed)}`;
  if (kind === "maps" && !/^https?:\/\//i.test(trimmed)) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
  return ensureHttpUrl(trimmed);
}

export function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}

export function validateFile(file: File, kind: keyof typeof MAX_FILE_BYTES) {
  const limit = MAX_FILE_BYTES[kind];
  if (file.size > limit) return `O arquivo deve ter no máximo ${Math.round(limit / 1024 / 1024)} MB.`;
  if (kind !== "video" && !file.type.startsWith("image/")) return "Escolha uma imagem válida.";
  if (kind === "video" && !file.type.startsWith("video/")) return "Escolha um vídeo válido.";
  return "";
}

export function validateBusinessForm(form: BusinessForm) {
  const errors: Record<string, string> = {};
  if (form.name.trim().length < 2) errors.name = "Informe o nome do negócio.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) errors.slug = "O endereço da página usa apenas letras minúsculas, números e hífens. Ele é gerado automaticamente pelo nome.";
  if (isReservedSlug(form.slug)) errors.slug = "Esse endereço é reservado. Escolha outro nome para o BioSite.";
  if (form.name.length > 160) errors.name = "O nome deve ter até 160 caracteres.";
  if (form.tagline.length > 255) errors.tagline = "A descrição deve ter até 255 caracteres.";
  for (const [key, value] of Object.entries({
    primary_color: form.primary_color,
    secondary_color: form.secondary_color,
    background_color: form.background_color,
    standard_button_color: form.standard_button_color,
    custom_button_color: form.custom_button_color,
  })) if (!isHexColor(value)) errors[key] = "Use uma cor hexadecimal, como #0F766E.";
  for (const link of form.links) if (!link.label.trim() || !link.url.trim()) errors.links = "Revise os botões personalizados.";
  if (form.media.some((item) => item.url.startsWith("blob:") && !item.file)) errors.media = "Uma mídia precisa ser reenviada antes de salvar.";
  const featureUrls = [form.features.campaign_url, ...(form.features.catalog_items || []).map(x => x.button_url), ...(form.features.blocks || []).flatMap(x => [x.button_url, x.type !== "image" && x.type !== "video" ? x.url : undefined]), ...(form.features.canvas_objects || []).map(x => x.href)].filter((x): x is string => Boolean(x));
  if (featureUrls.some(x => !safeHref(x))) errors.features = "Revise os links do catálogo, das seções e dos botões livres.";
  if (form.whatsapp_number && !/^\d{10,15}$/.test(normalizeWhatsApp(form.whatsapp_number))) errors.whatsapp_number = "Informe WhatsApp com código do país, DDD e número (ex.: 5511999999999).";
  return errors;
}

export function normalizeBusinessForm(form: BusinessForm): BusinessForm {
  return {
    ...form,
    name: form.name.trim(),
    slug: normalizeSlug(form.slug),
    tagline: form.tagline.trim(),
    google_review_url: ensureHttpUrl(form.google_review_url),
    whatsapp_number: normalizeWhatsApp(form.whatsapp_number),
    instagram_url: normalizeInstagram(form.instagram_url),
    website_url: ensureHttpUrl(form.website_url),
    maps_url: ensureHttpUrl(form.maps_url),
    seo_title: form.seo_title.trim(),
    seo_description: form.seo_description.trim(),
    seo_image_url: ensureHttpUrl(form.seo_image_url),
    links: form.links.map((link: BusinessLink, position) => ({ ...link, label: link.label.trim(), url: normalizeLink(link.kind, link.url), position })),
  };
}
