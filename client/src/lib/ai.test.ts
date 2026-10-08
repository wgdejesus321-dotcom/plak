import { describe, expect, it } from "vitest";
import { detectCity, detectSegment, rulesGenerator } from "./ai";
import { canCreateBioSite } from "./plans";
import { normalizeHostname } from "./domains";

describe("fundações de IA, planos e domínios", () => {
  it.each([["Restaurante italiano premium em São Paulo", "restaurant"], ["Barbearia moderna", "barbershop"], ["Clínica odontológica", "clinic"], ["Loja de roupas", "store"], ["Imobiliária", "realestate"], ["Consultor", "professional"]])("detecta %s", (prompt, segment) => expect(detectSegment(prompt)).toBe(segment));
  it("detecta cidade", () => expect(detectCity("Restaurante italiano premium em São Paulo")).toBe("São Paulo"));
  it("gera texto sem inventar dados", async () => {
    const draft = await rulesGenerator.generate({ prompt: "Restaurante italiano premium em São Paulo" });
    expect(draft.source).toBe("rules"); expect(draft.description).toContain("São Paulo"); expect(draft.description).not.toMatch(/\d{4}|melhor|premiado/i);
  });
  it("respeita limites de plano", () => { expect(canCreateBioSite("basic", 10)).toBe(false); expect(canCreateBioSite("agency", 10000)).toBe(true); });
  it("valida domínio", () => { expect(normalizeHostname("https://www.Cliente.com.br/")).toBe("www.cliente.com.br"); expect(normalizeHostname("localhost")).toBe(""); });
});
