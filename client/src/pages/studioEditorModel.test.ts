import { describe, expect, it } from "vitest";
import { documentToSvg, groupItems, guidesFor, resizeFromPointer, selectionForItem, ungroupItems } from "./studioEditorModel";
import type { EditorDoc, EditorItem } from "./studioEditorModel";

const text: EditorItem = { id: "text", kind: "text", name: "Texto", x: 100, y: 100, w: 240, h: 100, rotation: 30, fill: "transparent", text: "linha 1\nlinha 2", fontFamily: "Poppins", fontSize: 30, lineHeight: 1.4, align: "center" };
const rect: EditorItem = { id: "rect", kind: "rect", name: "Retângulo", x: 400, y: 100, w: 100, h: 100, rotation: 0, fill: "#fff" };

describe("PLAK Studio editor model", () => {
  it("redimensiona no eixo local de um objeto rotacionado e preserva proporção", () => {
    const resized = resizeFromPointer(text, 30, 0, "se", true);
    expect(resized.w).toBeGreaterThan(text.w);
    expect(resized.h).toBeGreaterThan(text.h);
    expect(resized.w / resized.h).toBeCloseTo(text.w / text.h, 2);
  });

  it("seleciona grupo inteiro e alterna seleção com Shift", () => {
    const grouped = groupItems([text, rect], ["text", "rect"], "group-1");
    expect(selectionForItem(grouped, grouped[0])).toEqual(["text", "rect"]);
    expect(selectionForItem(grouped, grouped[0], true, ["text", "rect"])).toEqual([]);
    expect(ungroupItems(grouped, ["text", "rect"]).every(item => !item.groupId)).toBe(true);
  });

  it("detecta linhas de alinhamento entre bordas e centros", () => {
    const moving = { ...rect, x: 170, y: 150 };
    const guides = guidesFor(moving, [text]);
    expect(guides.x).toBeDefined();
    expect(guides.y).toBeDefined();
  });

  it("exporta quebras de linha, alinhamento, fonte e dimensões no SVG", () => {
    const doc: EditorDoc = { name: "Teste", width: 800, height: 600, background: "#fff", items: [text] };
    const svg = documentToSvg(doc);
    expect(svg).toContain('width="800" height="600"');
    expect(svg).toContain('font-family="Poppins"');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('dy="42"');
    expect(svg).toContain("linha 1");
    expect(svg).toContain("linha 2");
  });
});
