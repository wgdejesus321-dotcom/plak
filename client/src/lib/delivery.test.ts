import { describe, expect, it } from "vitest";
import { buildDeliveryMessage, deliveryChecks } from "./delivery";
import type { Business } from "./types";

describe("Entrega ao cliente", () => {
  const business = { name: "Café", slug: "cafe", tagline: "Café especial", whatsapp_number: "5511988887777", features: {}, logo_url: null, address: "Av. Brasil, 10" } as unknown as Business;
  const required = (value: Business) => deliveryChecks(value, []).filter(x => x.required).every(x => x.ok);
  it("inclui nome e endereço sem credenciais", () => {
    const message = buildDeliveryMessage("Café", "https://example.com/cafe");
    expect(message).toContain("Café"); expect(message).toContain("https://example.com/cafe"); expect(message).toContain("sem login");
  });
  it("permite entrega com contato real", () => expect(required(business)).toBe(true));
  it("impede endereço reservado", () => expect(deliveryChecks({ ...business, slug: "admin" }, [])[0].ok).toBe(false));
  it("impede ausência de contato", () => expect(deliveryChecks({ ...business, whatsapp_number: null }, [])[1].ok).toBe(false));
  it("impede dados de modelo", () => expect(required({ ...business, whatsapp_number: "5511999999999" })).toBe(false));
  it("impede itens de exemplo", () => expect(required({ ...business, features: { catalog_items: [{ title: "X", badge: "EXEMPLO" }] } } as unknown as Business)).toBe(false));
});
