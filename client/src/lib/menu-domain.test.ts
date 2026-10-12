import { describe, expect, it } from "vitest";
import { canCancelOrder, elapsedLabel, formatOrderNumber, isAllowedOrderTransition, nextOrderAction, parsePriceToCents } from "./menu-domain";

describe("PLAK Web Cardápios: regras de domínio", () => {
  it("formata números legíveis sem substituir o identificador interno", () => {
    expect(formatOrderNumber(1)).toBe("#001");
    expect(formatOrderNumber(42)).toBe("#042");
    expect(formatOrderNumber(1000)).toBe("#1000");
  });

  it("interpreta preços em reais sem depender do valor calculado no navegador", () => {
    expect(parsePriceToCents("25,90")).toBe(2590);
    expect(parsePriceToCents("R$ 1.234,50")).toBe(123450);
    expect(parsePriceToCents("5.5")).toBe(550);
    expect(parsePriceToCents("-10,00")).toBeNull();
    expect(parsePriceToCents("texto")).toBeNull();
  });

  it("calcula tempo a partir do horário persistido", () => {
    expect(elapsedLabel("2026-10-08T12:00:00.000Z", Date.parse("2026-10-08T12:00:00.000Z"))).toBe("agora");
    expect(elapsedLabel("2026-10-08T12:00:00.000Z", Date.parse("2026-10-08T12:09:00.000Z"))).toBe("9 min");
    expect(elapsedLabel("2026-10-08T12:00:00.000Z", Date.parse("2026-10-08T13:14:00.000Z"))).toBe("1h 14m");
  });

  it("mantém as transições coerentes com a operação", () => {
    expect(isAllowedOrderTransition("new", "confirmed", "pickup")).toBe(true);
    expect(isAllowedOrderTransition("confirmed", "ready", "pickup")).toBe(false);
    expect(isAllowedOrderTransition("ready", "delivering", "pickup")).toBe(false);
    expect(isAllowedOrderTransition("ready", "delivering", "delivery")).toBe(true);
    expect(isAllowedOrderTransition("completed", "preparing", "dine_in")).toBe(false);
    expect(canCancelOrder("preparing")).toBe(true);
    expect(canCancelOrder("completed")).toBe(false);
  });

  it("apresenta próximos passos compatíveis com a modalidade e a cozinha", () => {
    expect(nextOrderAction("ready", "pickup")?.status).toBe("completed");
    expect(nextOrderAction("ready", "delivery")?.status).toBe("delivering");
    expect(nextOrderAction("confirmed", "dine_in", true)?.status).toBe("preparing");
    expect(nextOrderAction("completed", "pickup")).toBeNull();
  });
});
