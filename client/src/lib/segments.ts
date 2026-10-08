import type { SegmentId } from "./types";

export interface SegmentSample { title: string; description: string; price: string }

export interface SegmentDefinition {
  id: SegmentId;
  label: string;
  emoji: string;
  summary: string;
  itemsLabel: string;
  itemsHint: string;
  catalogTitle: string;
  catalogSubtitle: string;
  ctaEyebrow: string;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  whatsappMessage: string;
  defaultDescription: string;
  extraFields: { key: "team" | "specialties"; label: string; hint: string }[];
  /** Illustrative content only. Every sample is marked "EXEMPLO" and blocks delivery until replaced. */
  samples: SegmentSample[];
}

export const SEGMENTS: SegmentDefinition[] = [
  { id: "restaurant", label: "Restaurante", emoji: "🍔", summary: "Cardápio visual, pedidos e localização.", itemsLabel: "Pratos do cardápio", itemsHint: "Um por linha: Nome | Descrição | Preço", catalogTitle: "Cardápio", catalogSubtitle: "Destaques da casa", ctaEyebrow: "Pedidos", ctaTitle: "Faça seu pedido", ctaText: "Fale com a equipe pelo WhatsApp.", ctaButton: "Pedir pelo WhatsApp", whatsappMessage: "Olá! Gostaria de fazer um pedido.", defaultDescription: "Conheça o cardápio e faça seu pedido pelo WhatsApp.", extraFields: [], samples: [{ title: "Prato principal", description: "Descreva ingredientes e preparo.", price: "R$ 00,00" }, { title: "Entrada", description: "Descreva a porção.", price: "R$ 00,00" }, { title: "Sobremesa", description: "Descreva o sabor.", price: "R$ 00,00" }] },
  { id: "barbershop", label: "Barbearia", emoji: "💈", summary: "Serviços, preços e agendamento pelo WhatsApp.", itemsLabel: "Serviços e preços", itemsHint: "Um por linha: Serviço | Descrição | Preço", catalogTitle: "Serviços", catalogSubtitle: "Escolha o atendimento ideal", ctaEyebrow: "Agendamento", ctaTitle: "Agende seu horário", ctaText: "Escolha o serviço e combine o horário pelo WhatsApp.", ctaButton: "Agendar pelo WhatsApp", whatsappMessage: "Olá! Quero agendar um horário.", defaultDescription: "Serviços, preços e agendamento rápido pelo WhatsApp.", extraFields: [], samples: [{ title: "Corte", description: "Descreva o atendimento.", price: "R$ 00,00" }, { title: "Barba", description: "Descreva o atendimento.", price: "R$ 00,00" }, { title: "Corte e barba", description: "Descreva o combo.", price: "R$ 00,00" }] },
  { id: "clinic", label: "Clínica", emoji: "🏥", summary: "Especialidades, equipe, serviços e contato.", itemsLabel: "Serviços e procedimentos", itemsHint: "Um por linha: Serviço | Descrição | Valor ou “Consulte”", catalogTitle: "Serviços", catalogSubtitle: "Atendimento e procedimentos", ctaEyebrow: "Contato", ctaTitle: "Agende uma consulta", ctaText: "Fale com a recepção pelo WhatsApp.", ctaButton: "Falar com a recepção", whatsappMessage: "Olá! Gostaria de agendar uma consulta.", defaultDescription: "Informações, equipe e agendamento de consultas.", extraFields: [{ key: "specialties", label: "Especialidades", hint: "Uma por linha" }, { key: "team", label: "Equipe", hint: "Uma pessoa por linha: Nome | Especialidade ou registro profissional" }], samples: [{ title: "Consulta", description: "Descreva o atendimento.", price: "Consulte" }, { title: "Procedimento", description: "Descreva o procedimento.", price: "Consulte" }] },
  { id: "store", label: "Loja", emoji: "🛒", summary: "Produtos, catálogo, promoções e WhatsApp.", itemsLabel: "Produtos", itemsHint: "Um por linha: Produto | Descrição | Preço", catalogTitle: "Produtos", catalogSubtitle: "Veja os destaques da loja", ctaEyebrow: "Compras", ctaTitle: "Compre pelo WhatsApp", ctaText: "Tire dúvidas e combine a compra com a equipe.", ctaButton: "Comprar pelo WhatsApp", whatsappMessage: "Olá! Quero saber mais sobre os produtos.", defaultDescription: "Catálogo, promoções e atendimento pelo WhatsApp.", extraFields: [], samples: [{ title: "Produto destaque", description: "Descreva material, tamanho ou diferencial.", price: "R$ 00,00" }, { title: "Novidade", description: "Descreva o produto.", price: "R$ 00,00" }] },
  { id: "realestate", label: "Imobiliária", emoji: "🏠", summary: "Imóveis em destaque, atendimento e localização.", itemsLabel: "Imóveis ou serviços", itemsHint: "Um por linha: Imóvel | Descrição | Valor", catalogTitle: "Imóveis em destaque", catalogSubtitle: "Oportunidades selecionadas", ctaEyebrow: "Atendimento", ctaTitle: "Fale com um corretor", ctaText: "Informe o que você procura.", ctaButton: "Falar pelo WhatsApp", whatsappMessage: "Olá! Quero informações sobre imóveis.", defaultDescription: "Imóveis em destaque e atendimento direto pelo WhatsApp.", extraFields: [], samples: [{ title: "Imóvel em destaque", description: "Informe bairro, metragem e diferenciais.", price: "R$ 000.000" }] },
  { id: "professional", label: "Profissional", emoji: "👤", summary: "Apresentação, serviços e agenda.", itemsLabel: "Serviços", itemsHint: "Um por linha: Serviço | Descrição | Valor", catalogTitle: "Serviços", catalogSubtitle: "Como posso ajudar", ctaEyebrow: "Contato", ctaTitle: "Vamos conversar", ctaText: "Conte sua necessidade e combine os próximos passos.", ctaButton: "Falar pelo WhatsApp", whatsappMessage: "Olá! Vim pela sua página.", defaultDescription: "Apresentação profissional, serviços e contato direto.", extraFields: [], samples: [{ title: "Serviço principal", description: "Descreva o atendimento.", price: "Consulte" }] },
];

export const SEGMENT_BY_ID: Record<SegmentId, SegmentDefinition> = Object.fromEntries(SEGMENTS.map(s => [s.id, s])) as Record<SegmentId, SegmentDefinition>;

export function segmentLabel(id: SegmentId | undefined) {
  return id ? SEGMENT_BY_ID[id]?.label ?? "Sem categoria" : "Sem categoria";
}
export function segmentEmoji(id: SegmentId | undefined) {
  return id ? SEGMENT_BY_ID[id]?.emoji ?? "✨" : "✨";
}
