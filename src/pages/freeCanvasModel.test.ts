import { describe, expect, it } from "vitest";
import { addElement, blocksFromDocument, cloneDocument, createStarterDocument, documentFromBlocks, moveElement, removeElement, reorderElement, resizeElement, rotateElement, updateElement, type CanvasElement } from "./freeCanvasModel";

const shape = (id = "shape") => ({ id, type: "shape", x: 10, y: 10, width: 20, height: 10, rotation: 0, zIndex: 1, locked: false, opacity: 1, visible: true, background: "#fff" } as CanvasElement);

describe("free canvas document", () => {
  it("creates a compatible starter document and serializes blocks", () => {
    const document = createStarterDocument("Acme", "Olá");
    expect(document.elements.length).toBeGreaterThan(2);
    expect(blocksFromDocument(document)[0]).toMatchObject({ id: "brand-name", x: 8, y: 11 });
  });

  it("moves, resizes and rotates without leaving the canvas", () => {
    const document = { ...createStarterDocument(), elements: [shape()] };
    const moved = moveElement(document, "shape", 90, 90);
    expect(moved.elements[0].x).toBe(80);
    expect(moved.elements[0].y).toBe(90);
    const resized = resizeElement(moved, "shape", 50, 30);
    expect(resized.elements[0].width).toBe(50);
    expect(rotateElement(resized, "shape", -45).elements[0].rotation).toBe(315);
  });

  it("supports layers, duplication and removal", () => {
    const document = { ...createStarterDocument(), elements: [shape("a"), shape("b")] };
    const duplicated = addElement(document, { ...shape("c"), zIndex: 1 });
    expect(duplicated.elements.find((item) => item.id === "c")?.zIndex).toBe(2);
    const raised = reorderElement(duplicated, "a", "up");
    expect(raised.elements.find((item) => item.id === "a")?.zIndex).toBeGreaterThan(duplicated.elements.find((item) => item.id === "a")?.zIndex || 0);
    expect(removeElement(raised, "b").elements.some((item) => item.id === "b")).toBe(false);
  });

  it("migrates old blocks and preserves editable geometry", () => {
    const old = [{ id: "legacy", type: "text" as const, title: "Título", text: "Texto", x: 20, y: 30, width: 50, height: 12, rotation: 10, zIndex: 9 }];
    const document = documentFromBlocks(old, "Nome", "Frase");
    expect(document.elements[0]).toMatchObject({ id: "legacy", x: 20, y: 30, rotation: 10, zIndex: 9 });
    expect(cloneDocument(document)).toEqual(document);
    expect(updateElement(document, "legacy", { locked: true }).elements[0].locked).toBe(true);
  });
});
