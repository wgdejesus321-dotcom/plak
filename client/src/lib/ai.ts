import { SEGMENT_BY_ID } from "./segments";
import type { SegmentId } from "./types";

export interface BioSiteBrief { prompt: string; segment?: SegmentId }
export interface BioSiteDraftCopy {
  segment: SegmentId;
  city: string;
  style: "premium" | "casual";
  headline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  sectionOrder: string[];
  ctaLabel: string;
  source: "rules" | "llm";
}

/** Contract for a future model-backed generator. UI code should depend only on this interface. */
export interface BioSiteGenerator {
  id: string;
  generate(brief: BioSiteBrief): Promise<BioSiteDraftCopy>;
}

const KEYWORDS: Array<[SegmentId, RegExp]> = [
  ["barbershop", /barbear|barber|corte de cabelo|salão masculino/i],
  ["clinic", /cl[ií]nica|dentista|odonto|m[eé]dic|consult[oó]rio|psic[oó]log|fisio|est[eé]tica|sa[uú]de/i],
  ["realestate", /imobili|corretor|im[oó]ve|apartamento/i],
  ["restaurant", /restaurante|pizzaria|hamb[uú]rg|sushi|lanchonete|padaria|caf[eé]|bistr[oô]|trattoria|churrasc|cozinha|italian|japon/i],
  ["store", /loja|boutique|moda|roupa|cal[cç]ado|eletr[oô]nic|presente|floricultura|pet ?shop/i],
];

export function detectSegment(prompt: string): SegmentId {
  return KEYWORDS.find(([, pattern]) => pattern.test(prompt))?.[0] ?? "professional";
}

export function detectCity(prompt: string) {
  const match = prompt.match(/\bem\s+([A-ZÀ-Ý][\p{L}]+(?:\s+(?:de|da|do|dos|das)?\s*[A-ZÀ-Ý][\p{L}]+)*)/u);
  return match?.[1]?.trim() ?? "";
}

/** Deterministic offline draft copy. It does not invent awards, prices, addresses, reviews or years of experience. */
export const rulesGenerator: BioSiteGenerator = {
  id: "rules-v1",
  async generate(brief) {
    const prompt = brief.prompt.trim();
    const segmentId = brief.segment ?? detectSegment(prompt);
    const segment = SEGMENT_BY_ID[segmentId];
    const city = detectCity(prompt);
    const style = /premium|luxo|sofistic|exclusiv|alto padr[aã]o/i.test(prompt) ? "premium" : "casual";
    const place = city ? ` em ${city}` : "";
    const headline = style === "premium" ? `${segment.label}${place}: atendimento cuidadoso do primeiro contato ao pós-venda` : `${segment.label}${place}: informações e contato em um só lugar`;
    const description = `${segment.defaultDescription}${city ? ` Atendimento em ${city}.` : ""}`.slice(0, 255);
    const order = segmentId === "clinic" ? ["especialidades", "equipe", "serviços", "horários", "contato", "mapa"] : segmentId === "restaurant" ? ["pedido", "cardápio", "galeria", "horários", "mapa", "instagram"] : ["cta", "catálogo", "galeria", "horários", "mapa", "instagram"];
    return { segment: segmentId, city, style, headline, description, seoTitle: `${segment.label}${place}`.slice(0, 70), seoDescription: description.slice(0, 160), sectionOrder: order, ctaLabel: segment.ctaButton, source: "rules" };
  },
};

export function getGenerator(): BioSiteGenerator {
  return rulesGenerator;
}
