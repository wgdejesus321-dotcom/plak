import { SEGMENT_BY_ID } from "./segments";
import type { BioSiteMeta, BusinessForm, CatalogItem, FeatureConfig, LayoutConfig, PageBlock, SegmentId } from "./types";
import { normalizeInstagram, normalizeSlug } from "./validation";

export interface CompanyInput {
  name: string;
  slug: string;
  description: string;
  whatsapp: string;
  instagram: string;
  address: string;
  hours: string;
  items: string;
  promotion: string;
  team: string;
  specialties: string;
  logo_url: string;
  cover_url: string;
  gallery_urls: string[];
  /** Include clearly marked sample products/services when no real items were typed. */
  useSamples: boolean;
}

export interface TemplateBlueprint {
  id: string;
  segment: SegmentId;
  name: string;
  description: string;
  palette: { primary: string; secondary: string; background: string; button: string; text: string };
  layout: Partial<LayoutConfig>;
  sections: Array<"cta" | "specialties" | "team" | "hours" | "map" | "social">;
}

export const EXAMPLE_BADGE = "EXEMPLO";

const baseLayout: LayoutConfig = {
  cover_enabled: true, profile_position: "cover", profile_shape: "circle", text_align: "center", button_style: "pill", show_gallery: true,
  cover_treatment: "dark", logo_size: "medium", logo_shape: "circle", logo_fit: "cover", cover_opacity: 45, font_family: "Inter", title_font_size: 32, tagline_font_size: 15,
  section_spacing: "comfortable", page_style: "clean", background_effect: "solid", hero_layout: "immersive", button_size: "large", button_shadow: true, card_style: "soft",
  gallery_layout: "editorial", gallery_radius: 22, gallery_gap: 10, section_title_color: "#17262d", body_text_color: "#5b6a70", accent_color: "#17262d", entrance: "soft",
};

export const BLUEPRINTS: TemplateBlueprint[] = [
  { id: "restaurant-trattoria", segment: "restaurant", name: "Trattoria", description: "Hero grande, tons quentes e cardápio com imagens.", palette: { primary: "#8F2D1F", secondary: "#D9A441", background: "#FFF7EC", button: "#8F2D1F", text: "#2B1A14" }, layout: { font_family: "Playfair Display", hero_layout: "immersive", cover_treatment: "dark", page_style: "editorial" }, sections: ["cta", "hours", "map", "social"] },
  { id: "restaurant-bistro", segment: "restaurant", name: "Bistrô Terracota", description: "Visual contemporâneo, forte e direto para pedidos.", palette: { primary: "#5B2A1E", secondary: "#C9973B", background: "#FBF1E6", button: "#5B2A1E", text: "#2B1A14" }, layout: { font_family: "Montserrat", hero_layout: "immersive", cover_treatment: "dark", card_style: "solid", accent_color: "#5B2A1E" }, sections: ["cta", "hours", "map", "social"] },
  { id: "barbershop-classic", segment: "barbershop", name: "Barbearia Clássica", description: "Banner forte, serviços claros e agendamento.", palette: { primary: "#1B1B1B", secondary: "#B88A44", background: "#F4F1EA", button: "#1B1B1B", text: "#1B1B1B" }, layout: { font_family: "Montserrat", button_style: "square", hero_layout: "immersive", page_style: "bold" }, sections: ["cta", "hours", "map", "social"] },
  { id: "barbershop-urban", segment: "barbershop", name: "Urban Cut", description: "Contraste alto e foco em agenda rápida.", palette: { primary: "#111418", secondary: "#E34B3A", background: "#EEF0F1", button: "#E34B3A", text: "#111418" }, layout: { font_family: "Poppins", button_style: "rounded", cover_treatment: "dark", card_style: "solid", accent_color: "#E34B3A" }, sections: ["cta", "hours", "map", "social"] },
  { id: "clinic-care", segment: "clinic", name: "Clínica Clara", description: "Visual limpo, especialidades, equipe e contato.", palette: { primary: "#0F5E73", secondary: "#7CC6D4", background: "#F3FAFB", button: "#0F5E73", text: "#12313A" }, layout: { font_family: "Nunito", hero_layout: "split", cover_treatment: "light", cover_opacity: 62, page_style: "clean" }, sections: ["specialties", "team", "hours", "cta", "map", "social"] },
  { id: "clinic-premium", segment: "clinic", name: "Saúde Premium", description: "Tons sóbrios para consultórios e centros médicos.", palette: { primary: "#233C57", secondary: "#B7A27A", background: "#F7F5F0", button: "#233C57", text: "#1C2B3A" }, layout: { font_family: "Lora", hero_layout: "classic", cover_treatment: "light", page_style: "editorial" }, sections: ["specialties", "team", "hours", "cta", "map", "social"] },
  { id: "store-showcase", segment: "store", name: "Vitrine", description: "Produtos em destaque, promoção e compra pelo WhatsApp.", palette: { primary: "#1F2933", secondary: "#E85D75", background: "#FFF8F6", button: "#E85D75", text: "#1F2933" }, layout: { font_family: "Poppins", hero_layout: "compact", cover_treatment: "light", button_style: "pill" }, sections: ["cta", "hours", "map", "social"] },
  { id: "store-minimal", segment: "store", name: "Loja Minimal", description: "Layout limpo para catálogos com poucas cores.", palette: { primary: "#111827", secondary: "#9CA3AF", background: "#FFFFFF", button: "#111827", text: "#111827" }, layout: { font_family: "Inter", hero_layout: "classic", cover_treatment: "light", card_style: "flat", page_style: "minimal" }, sections: ["cta", "hours", "map", "social"] },
  { id: "realestate-prime", segment: "realestate", name: "Imóveis Prime", description: "Imóveis em destaque com apresentação sofisticada.", palette: { primary: "#162B3A", secondary: "#B9975B", background: "#F6F3EE", button: "#162B3A", text: "#162B3A" }, layout: { font_family: "Playfair Display", hero_layout: "immersive", cover_treatment: "dark", page_style: "editorial" }, sections: ["cta", "map", "hours", "social"] },
  { id: "realestate-modern", segment: "realestate", name: "Casa Moderna", description: "Visual leve para corretores e imobiliárias locais.", palette: { primary: "#0F766E", secondary: "#F59E0B", background: "#F8FAFC", button: "#0F766E", text: "#0F172A" }, layout: { font_family: "Montserrat", hero_layout: "split", cover_treatment: "light", button_style: "rounded" }, sections: ["cta", "map", "hours", "social"] },
  { id: "professional-signature", segment: "professional", name: "Assinatura", description: "Apresentação pessoal, serviços e contato direto.", palette: { primary: "#27272A", secondary: "#A16207", background: "#FAFAF9", button: "#27272A", text: "#27272A" }, layout: { font_family: "Lora", hero_layout: "classic", cover_treatment: "light", profile_shape: "circle", page_style: "editorial" }, sections: ["cta", "hours", "map", "social"] },
  { id: "professional-bold", segment: "professional", name: "Marca Pessoal", description: "Cores fortes para criadores e consultores.", palette: { primary: "#312E81", secondary: "#22D3EE", background: "#F5F7FF", button: "#312E81", text: "#1E1B4B" }, layout: { font_family: "Poppins", hero_layout: "compact", cover_treatment: "dark", button_style: "pill", page_style: "bold" }, sections: ["cta", "hours", "map", "social"] },
];

export const blueprintsFor = (segment: SegmentId) => BLUEPRINTS.filter(item => item.segment === segment);
export const blueprintById = (id: string | undefined) => BLUEPRINTS.find(item => item.id === id);

export function emptyCompanyInput(): CompanyInput {
  return { name: "", slug: "", description: "", whatsapp: "", instagram: "", address: "", hours: "", items: "", promotion: "", team: "", specialties: "", logo_url: "", cover_url: "", gallery_urls: [], useSamples: false };
}

/** Converts a Brazilian phone typed by a person into the international digits used by wa.me. */
export function normalizeBrazilPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) return `55${digits}`;
  return digits;
}

const cleanLines = (value: string) => value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
const newId = (prefix: string, index: number) => `${prefix}-${index}-${Math.random().toString(36).slice(2, 8)}`;

export function parseCatalogItems(raw: string): CatalogItem[] {
  return cleanLines(raw).slice(0, 40).map((line, index) => {
    const [title = "", description = "", price = ""] = line.split("|").map(part => part.trim());
    return { id: newId("item", index), item_type: "product", title, description, price, image_url: "", button_label: "", button_url: "", featured: index === 0 } as CatalogItem;
  }).filter(item => item.title);
}

export function whatsappUrl(phone: string, message: string) {
  const digits = normalizeBrazilPhone(phone);
  if (!digits) return "";
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function mapsUrl(address: string) {
  return address.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}` : "";
}

export function buildBioSiteForm(blueprint: TemplateBlueprint, input: CompanyInput): BusinessForm {
  const segment = SEGMENT_BY_ID[blueprint.segment];
  const name = input.name.trim();
  const whatsapp = normalizeBrazilPhone(input.whatsapp);
  const message = segment.whatsappMessage;
  const typed = parseCatalogItems(input.items);
  const samples: CatalogItem[] = input.useSamples && typed.length === 0
    ? segment.samples.map((sample, index) => ({ id: newId("sample", index), item_type: "product", title: sample.title, description: sample.description, price: sample.price, image_url: "", badge: EXAMPLE_BADGE, button_label: "", button_url: "", featured: index === 0 } as CatalogItem))
    : [];
  const catalog_items = typed.length ? typed : samples;
  const blocks: PageBlock[] = [];
  const push = (block: Omit<PageBlock, "id" | "visible">) => blocks.push({ ...block, id: newId("block", blocks.length), visible: true });
  const hours = cleanLines(input.hours);
  const specialties = cleanLines(input.specialties);
  const team = cleanLines(input.team).map(line => line.split("|").map(part => part.trim()).filter(Boolean).join(" — "));
  for (const section of blueprint.sections) {
    if (section === "cta" && whatsapp) push({ type: "booking", eyebrow: segment.ctaEyebrow, title: segment.ctaTitle, text: segment.ctaText, button_label: segment.ctaButton, button_url: whatsappUrl(whatsapp, message), align: "center", radius: 28, padding: 22, background: blueprint.palette.button, text_color: "#FFFFFF", accent_color: "#FFFFFF" });
    if (section === "specialties" && specialties.length) push({ type: "list", eyebrow: "Especialidades", title: "Especialidades", items: specialties, align: "left", radius: 24, padding: 18 });
    if (section === "team" && team.length) push({ type: "list", eyebrow: "Equipe", title: "Nossa equipe", items: team, align: "left", radius: 24, padding: 18 });
    if (section === "hours" && hours.length) push({ type: "hours", eyebrow: "Horários", title: "Horário de funcionamento", items: hours, align: "left", radius: 24, padding: 18 });
    if (section === "map" && input.address.trim()) push({ type: "map", eyebrow: "Localização", title: "Como chegar", text: input.address.trim(), url: mapsUrl(input.address), align: "left", radius: 24, padding: 18 });
    if (section === "social" && input.instagram.trim()) push({ type: "social", eyebrow: "Instagram", title: "Acompanhe no Instagram", text: "Veja novidades, bastidores e atualizações.", button_label: "Abrir Instagram", button_url: normalizeInstagram(input.instagram), align: "center", radius: 24, padding: 18 });
  }
  const meta: BioSiteMeta = { segment: blueprint.segment, template_id: blueprint.id, workflow: "editing", generated_by: "manual" };
  const features: FeatureConfig = {
    meta,
    lead_enabled: blueprint.segment !== "restaurant", lead_title: "Fale com a gente", lead_button: "Enviar mensagem", campaign_enabled: Boolean(input.promotion.trim()),
    campaign_title: input.promotion.trim() ? "Promoção" : "", campaign_text: input.promotion.trim(), campaign_cta: segment.ctaButton, campaign_url: whatsappUrl(whatsapp, message),
    catalog_text: "", catalog_title: segment.catalogTitle, catalog_subtitle: segment.catalogSubtitle, catalog_items, testimonials_text: "", testimonials_title: "Avaliações", qr_label: "PLAK", show_badge: true,
    layout: { ...baseLayout, ...blueprint.layout, title_color: blueprint.palette.primary, tagline_color: blueprint.palette.text, button_text_color: blueprint.palette.text, custom_button_text_color: "#FFFFFF" },
    blocks,
  };
  const description = input.description.trim() || segment.defaultDescription;
  return {
    name, slug: normalizeSlug(input.slug || name), logo_url: input.logo_url, tagline: description.slice(0, 255), google_review_url: "", whatsapp_number: whatsapp, whatsapp_message: message,
    instagram_url: normalizeInstagram(input.instagram), website_url: "", address: input.address.trim(), maps_url: mapsUrl(input.address), primary_color: blueprint.palette.primary.toUpperCase(),
    secondary_color: blueprint.palette.secondary.toUpperCase(), background_color: blueprint.palette.background.toUpperCase(), background_image_url: input.cover_url, standard_button_color: "#FFFFFF",
    custom_button_color: blueprint.palette.button.toUpperCase(), seo_title: `${name} | ${segment.label}`, seo_description: description.slice(0, 160), seo_image_url: "", features, links: [],
    media: input.gallery_urls.map((url, position) => ({ type: "image" as const, url, alt: `Foto de ${name}`, position })),
  };
}
