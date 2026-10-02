import type { PageBlock, PageBlockType } from "@/lib/types";

export type CanvasElementType = PageBlockType | "heading" | "button" | "logo" | "shape";

export interface CanvasElement extends PageBlock {
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  borderColor?: string;
  borderWidth?: number;
  objectFit?: "cover" | "contain";
}

export interface CanvasDocument {
  width: number;
  height: number;
  background: string;
  elements: CanvasElement[];
}

const base = (id: string, type: CanvasElementType, partial: Partial<CanvasElement>): CanvasElement => ({
  id, type, x: 0, y: 0, width: 40, height: 10, rotation: 0, zIndex: 1, locked: false,
  opacity: 1, visible: true, align: "left", radius: 16, padding: 12,
  background: "transparent", text_color: "#263b3a", ...partial,
});

export function createStarterDocument(name = "Minha página", tagline = "Olá! Como podemos ajudar?"): CanvasDocument {
  return {
    width: 390,
    height: 844,
    background: "#f5f4ec",
    elements: [
      base("brand-name", "heading", { x: 8, y: 11, width: 84, height: 8, title: name || "Sua marca", fontSize: 30, fontWeight: 800, text_color: "#253d3e", fontFamily: "Inter", zIndex: 4 }),
      base("brand-tagline", "text", { x: 8, y: 20, width: 84, height: 9, text: tagline, fontSize: 14, text_color: "#718078", fontFamily: "Inter", zIndex: 4 }),
      base("primary-button", "button", { x: 8, y: 33, width: 84, height: 8, title: "Fale conosco", text: "Adicione seu WhatsApp", background: "#66754b", text_color: "#ffffff", radius: 18, fontSize: 14, fontWeight: 750, zIndex: 3 }),
      base("about-card", "text", { x: 8, y: 45, width: 84, height: 15, title: "Sobre o negócio", text: "Conte aqui por que sua empresa é especial.", background: "#ffffffcc", text_color: "#51645f", radius: 20, zIndex: 2 }),
      base("contact-card", "map", { x: 8, y: 65, width: 84, height: 12, title: "Onde estamos", text: "Adicione seu endereço", background: "#ffffffcc", text_color: "#51645f", radius: 20, zIndex: 2 }),
    ],
  };
}

export function documentFromBlocks(blocks: PageBlock[] | undefined, name: string, tagline: string): CanvasDocument {
  if (!blocks?.length) return createStarterDocument(name, tagline);
  const elements = blocks.map((block, index) => base(block.id || `block-${index + 1}`, block.type, {
    ...block,
    x: block.x ?? 8,
    y: block.y ?? Math.min(88, 8 + index * 14),
    width: block.width ?? 84,
    height: block.height ?? 12,
    rotation: block.rotation ?? 0,
    zIndex: block.zIndex ?? index + 1,
    locked: block.locked ?? false,
    opacity: block.opacity ?? 1,
  }));
  return { width: 390, height: 844, background: "#f5f4ec", elements };
}

export function blocksFromDocument(document: CanvasDocument): PageBlock[] {
  return document.elements.map(({ file: _file, ...element }) => element as PageBlock);
}

export function cloneDocument(document: CanvasDocument): CanvasDocument {
  return JSON.parse(JSON.stringify(document)) as CanvasDocument;
}

export function updateElement(document: CanvasDocument, id: string, patch: Partial<CanvasElement>): CanvasDocument {
  return { ...document, elements: document.elements.map((element) => element.id === id ? { ...element, ...patch } : element) };
}

export function moveElement(document: CanvasDocument, id: string, dx: number, dy: number): CanvasDocument {
  const element = document.elements.find((item) => item.id === id);
  if (!element) return document;
  return updateElement(document, id, { x: clamp(element.x + dx, 0, 100 - element.width), y: clamp(element.y + dy, 0, 100 - element.height) });
}

export function resizeElement(document: CanvasDocument, id: string, width: number, height: number): CanvasDocument {
  return updateElement(document, id, { width: clamp(width, 4, 100), height: clamp(height, 4, 100) });
}

export function rotateElement(document: CanvasDocument, id: string, rotation: number): CanvasDocument {
  return updateElement(document, id, { rotation: ((rotation % 360) + 360) % 360 });
}

export function addElement(document: CanvasDocument, element: CanvasElement): CanvasDocument {
  const top = Math.max(0, ...document.elements.map((item) => item.zIndex));
  return { ...document, elements: [...document.elements, { ...element, zIndex: top + 1 }] };
}

export function removeElement(document: CanvasDocument, id: string): CanvasDocument {
  return { ...document, elements: document.elements.filter((element) => element.id !== id) };
}

export function reorderElement(document: CanvasDocument, id: string, direction: "up" | "down"): CanvasDocument {
  const ordered = [...document.elements].sort((a, b) => a.zIndex - b.zIndex);
  const index = ordered.findIndex((element) => element.id === id);
  const nextIndex = direction === "up" ? Math.min(ordered.length - 1, index + 1) : Math.max(0, index - 1);
  if (index < 0 || index === nextIndex) return document;
  [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
  return { ...document, elements: ordered.map((element, itemIndex) => ({ ...element, zIndex: itemIndex + 1 })) };
}

export function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }

export function elementLabel(element: CanvasElement) {
  const labels: Record<string, string> = { heading: "Título", text: "Texto", button: "Botão", image: "Imagem", logo: "Logo", shape: "Forma", map: "Mapa", video: "Vídeo", quote: "Depoimento", offer: "Oferta", social: "Redes sociais", hours: "Horários", faq: "Perguntas", divider: "Divisor", booking: "Agendamento" };
  return element.title || element.text?.split("\n")[0] || labels[element.type] || element.type;
}
