import { describe, expect, it } from "vitest";
import { ensureHttpUrl, normalizeSlug, isReservedSlug, safeHref, normalizeWhatsApp } from "./validation";

describe("URLs e endereços de BioSites", () => {
  it("adiciona https ao domínio", () => expect(ensureHttpUrl("exemplo.com")).toBe("https://exemplo.com"));
  it.each(["javascript:alert(1)", "data:text/html,test", "vbscript:test", "file:///tmp/a", "https://user:pass@example.com", "java\nscript:alert(1)"])("bloqueia link inseguro: %s", value => {
    expect(() => ensureHttpUrl(value)).toThrow();
    expect(safeHref(value)).toBeUndefined();
  });
  it.each(["https://example.com", "mailto:cliente@example.com", "tel:+5511999999999"])("mantém link permitido: %s", value => expect(ensureHttpUrl(value)).toBe(value));
  it("não deixa hífen na borda após truncar", () => expect(normalizeSlug("a".repeat(119) + "-b")).toBe("a".repeat(119)));
  it("remove acentos", () => expect(normalizeSlug(" Café da Praça ")).toBe("cafe-da-praca"));
  it("reserva rotas do painel", () => expect(isReservedSlug("admin")).toBe(true));
  it("normaliza telefone", () => expect(normalizeWhatsApp("+55 (11) 99999-9999")).toBe("5511999999999"));
});
