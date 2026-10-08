import { EXAMPLE_BADGE } from "./blueprints";
import type { Business, BusinessLink } from "./types";
import { safeHref, isReservedSlug } from "./validation";
import { publicUrlFor } from "./domains";

export type DeliveryCheck = { label: string; detail: string; ok: boolean; required: boolean };

const PLACEHOLDERS = [/^https?:\/\/(www\.)?g\.page\/?$/i, /^https?:\/\/(www\.)?instagram\.com\/?$/i, /^https?:\/\/plak\.app\/?$/i, /^https?:\/\/maps\.google\.com\/?$/i, /^5511999999999$/];
const PLACEHOLDER_TEXT = ["Rua principal, 100", "Marina | Atendimento impecável", "Serviço principal | Uma experiência pensada"];

export function buildDeliveryMessage(name: string, url: string) {
  return `Olá! O BioSite de ${name} está pronto.\n\nAcesse: ${url}\n\nVocê pode colocar esse link na bio do Instagram, compartilhar no WhatsApp e usar em materiais de divulgação. A página pode ser aberta sem login.\n\nPara atualizar fotos, informações ou botões, entre em contato comigo. Antes de divulgar, confira seus dados e teste os botões. Obrigado!`;
}

export function deliveryUrl(business: Pick<Business, "slug" | "features">, origin: string) {
  return publicUrlFor(business, origin);
}

export function placeholderFindings(b: Business, links: BusinessLink[]) {
  const values = [b.google_review_url, b.instagram_url, b.website_url, b.maps_url, b.whatsapp_number, ...links.map(l => l.url)].filter((x): x is string => Boolean(x));
  const found = values.filter(x => PLACEHOLDERS.some(p => p.test(x.trim())));
  const text = [b.address || "", b.features.catalog_text || "", b.features.testimonials_text || ""].join("\n");
  const samples = (b.features.catalog_items || []).filter(item => item.badge === EXAMPLE_BADGE).map(item => `${item.title} (exemplo)`);
  return [...found, ...PLACEHOLDER_TEXT.filter(x => text.includes(x)), ...samples];
}

export function deliveryChecks(b: Business, links: BusinessLink[]): DeliveryCheck[] {
  const destinations = [b.website_url, b.instagram_url, b.maps_url, b.google_review_url, ...links.map(l => l.url), b.features.campaign_enabled ? b.features.campaign_url : null, ...(b.features.catalog_items || []).map(x => x.button_url), ...(b.features.blocks || []).flatMap(x => [x.button_url, x.url]), ...(b.features.canvas_objects || []).map(x => x.href)].filter((x): x is string => Boolean(x));
  const hasContact = Boolean(b.whatsapp_number && /^\d{10,15}$/.test(b.whatsapp_number)) || destinations.some(x => Boolean(safeHref(x)));
  const placeholders = placeholderFindings(b, links);
  return [
    { label: "Nome e endereço válidos", detail: "O nome tem pelo menos 2 caracteres e o endereço não usa uma rota reservada.", ok: b.name.trim().length >= 2 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(b.slug) && !isReservedSlug(b.slug), required: true },
    { label: "Contato principal", detail: "Há WhatsApp válido ou ao menos um botão com destino permitido.", ok: hasContact, required: true },
    { label: "Links no formato correto", detail: "Aceitamos apenas https, http, mailto e tel. Não verificamos se a página de destino abre.", ok: destinations.every(x => Boolean(safeHref(x))), required: true },
    { label: "Sem dados de exemplo", detail: placeholders.length ? `Revise: ${placeholders.slice(0, 3).join("; ")}.` : "Não encontramos telefone, links ou itens de modelo conhecidos.", ok: placeholders.length === 0, required: true },
    { label: "Logo ou foto de perfil", detail: "Recomendado para dar identidade à página.", ok: Boolean(b.logo_url), required: false },
    { label: "Descrição de apresentação", detail: "Recomendado: uma frase clara sobre o negócio.", ok: Boolean(b.tagline.trim()), required: false },
  ];
}
