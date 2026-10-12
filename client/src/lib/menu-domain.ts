import type { Fulfillment, OrderStatus } from "@/lib/menu-data";

export interface OrderAction { status: OrderStatus; label: string; }

export function formatOrderNumber(number: number): string {
  return `#${String(number).padStart(3, "0")}`;
}

export function elapsedLabel(createdAt: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
}

export function parsePriceToCents(value: string): number | null {
  const normalized = value.trim().replace(/R\$/i, "").replace(/\s/g, "");
  if (!normalized) return null;
  const decimal = normalized.includes(",") ? normalized.replace(/\./g, "").replace(",", ".") : normalized;
  if (!/^\d+(?:\.\d{1,2})?$/.test(decimal)) return null;
  const parsed = Number(decimal);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 21474836.47) return null;
  return Math.round(parsed * 100);
}

export function nextOrderAction(status: OrderStatus, fulfillment: Fulfillment, kitchenMode = false): OrderAction | null {
  if (kitchenMode) {
    if (status === "new") return { status: "confirmed", label: "Confirmar pedido" };
    if (status === "confirmed") return { status: "preparing", label: "Iniciar preparo" };
    if (status === "preparing") return { status: "ready", label: "Marcar pronto" };
    return null;
  }
  if (status === "new") return { status: "confirmed", label: "Confirmar" };
  if (status === "confirmed") return { status: "preparing", label: "Iniciar preparo" };
  if (status === "preparing") return { status: "ready", label: "Marcar pronto" };
  if (status === "ready") return fulfillment === "delivery"
    ? { status: "delivering", label: "Saiu para entrega" }
    : { status: "completed", label: "Concluir pedido" };
  if (status === "delivering") return { status: "completed", label: "Marcar entregue" };
  return null;
}

export function canCancelOrder(status: OrderStatus): boolean {
  return status !== "completed" && status !== "cancelled";
}

export function isAllowedOrderTransition(from: OrderStatus, to: OrderStatus, fulfillment: Fulfillment): boolean {
  const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
    new: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["delivering", "completed", "cancelled"],
    delivering: ["completed", "cancelled"],
  };
  if (to === "delivering" && fulfillment !== "delivery") return false;
  return (allowed[from] || []).includes(to);
}
