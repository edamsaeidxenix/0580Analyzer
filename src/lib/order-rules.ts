import type { Fulfilment, OrderStatus } from "@/db/schema";

export type Actor = "customer" | "seller";

/**
 * Which status changes each side may make. Sellers drive the order forward;
 * customers can only cancel while the seller hasn't confirmed yet.
 */
const sellerTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "rejected"],
  confirmed: ["ready", "out_for_delivery", "completed", "cancelled"],
  ready: ["completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: [],
  rejected: [],
  cancelled: [],
};

const customerTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["cancelled"],
  confirmed: [],
  ready: [],
  out_for_delivery: [],
  completed: [],
  rejected: [],
  cancelled: [],
};

export function allowedTransitions(
  actor: Actor,
  from: OrderStatus,
  fulfilment: Fulfilment,
): OrderStatus[] {
  const next = (actor === "seller" ? sellerTransitions : customerTransitions)[from];
  return next.filter((status) => {
    if (status === "out_for_delivery") return fulfilment === "delivery";
    if (status === "ready") return fulfilment === "pickup";
    return true;
  });
}

export function canTransition(
  actor: Actor,
  from: OrderStatus,
  to: OrderStatus,
  fulfilment: Fulfilment,
): boolean {
  return allowedTransitions(actor, from, fulfilment).includes(to);
}

export function isOpenStatus(status: OrderStatus): boolean {
  return !["completed", "rejected", "cancelled"].includes(status);
}

export const statusLabels: Record<OrderStatus, string> = {
  pending: "Waiting for shop",
  confirmed: "Confirmed",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** Label for the button that moves an order into this status. */
export const actionLabels: Record<OrderStatus, string> = {
  pending: "Reopen",
  confirmed: "Accept order",
  ready: "Mark ready for pickup",
  out_for_delivery: "Mark out for delivery",
  completed: "Mark completed",
  rejected: "Reject",
  cancelled: "Cancel order",
};

export interface PricedLine {
  priceLaari: number;
  quantity: number;
}

export function orderTotals(
  lines: PricedLine[],
  fulfilment: Fulfilment,
  deliveryFeeLaari: number,
) {
  const subtotalLaari = lines.reduce((sum, l) => sum + l.priceLaari * l.quantity, 0);
  const fee = fulfilment === "delivery" ? deliveryFeeLaari : 0;
  return { subtotalLaari, deliveryFeeLaari: fee, totalLaari: subtotalLaari + fee };
}
