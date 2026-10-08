import { describe, expect, it } from "vitest";
import { BLUEPRINTS, EXAMPLE_BADGE, blueprintsFor, buildBioSiteForm, emptyCompanyInput, normalizeBrazilPhone } from "./blueprints";
import { SEGMENTS } from "./segments";
import { normalizeBusinessForm, validateBusinessForm } from "./validation";

const input = { ...emptyCompanyInput(), name: "Casa Verde", whatsapp: "(11) 98888-7777", instagram: "@casaverde", address: "Rua A, 10, Centro, São Paulo", hours: "Seg a Sex: 9h às 18h", items: "Prato | Descrição | R$ 10" };

describe("modelos premium", () => {
  it("oferece dois modelos por segmento", () => SEGMENTS.forEach(segment => expect(blueprintsFor(segment.id)).toHaveLength(2)));
  it("normaliza telefone brasileiro", () => expect(normalizeBrazilPhone("(11) 98888-7777")).toBe("5511988887777"));
  it("gera formulários válidos para todos os modelos", () => BLUEPRINTS.forEach(item => {
    const form = normalizeBusinessForm(buildBioSiteForm(item, { ...input, items: "", specialties: "Clínica geral", team: "Ana | CRM 000", useSamples: false }));
    expect(validateBusinessForm(form)).toEqual({});
    expect(form.features.meta?.template_id).toBe(item.id);
  }));
  it("não inventa depoimentos", () => expect(buildBioSiteForm(BLUEPRINTS[0], input).features.testimonials_text).toBe(""));
  it("marca itens de exemplo", () => {
    const form = buildBioSiteForm(BLUEPRINTS[0], { ...input, items: "", useSamples: true });
    expect(form.features.catalog_items?.every(item => item.badge === EXAMPLE_BADGE)).toBe(true);
  });
});
