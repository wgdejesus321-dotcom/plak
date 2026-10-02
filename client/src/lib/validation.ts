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
    .slice(0, 120);
}

export function ensureHttpUrl(value: string, fallbackScheme = "https") {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `${fallbackScheme}://${trimmed}`;
}

export function normalizeInstagram(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
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
  for (const [key, value] of Object.entries({
    primary_color: form.primary_color,
    secondary_color: form.secondary_color,
    background_color: form.background_color,
    standard_button_color: form.standard_button_color,
    custom_button_color: form.custom_button_color,
  })) if (!isHexColor(value)) errors[key] = "Use uma cor hexadecimal, como #0F766E.";
  for (const link of form.links) if (!link.label.trim() || !link.url.trim()) errors.links = "Revise os botões personalizados.";
  if (form.media.some((item) => item.url.startsWith("blob:") && !item.file)) errors.media = "Uma mídia precisa ser reenviada antes de salvar.";
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
