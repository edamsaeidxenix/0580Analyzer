import { describe, expect, it } from "vitest";
import { allowedTransitions, canTransition, orderTotals } from "../order-rules";

describe("order transitions", () => {
  it("lets the seller accept or reject a new order", () => {
    expect(allowedTransitions("seller", "pending", "pickup")).toEqual(["confirmed", "rejected"]);
  });

  it("only offers 'ready' for pickup and 'out for delivery' for delivery", () => {
    expect(allowedTransitions("seller", "confirmed", "pickup")).toContain("ready");
    expect(allowedTransitions("seller", "confirmed", "pickup")).not.toContain("out_for_delivery");
    expect(allowedTransitions("seller", "confirmed", "delivery")).toContain("out_for_delivery");
    expect(allowedTransitions("seller", "confirmed", "delivery")).not.toContain("ready");
    expect(allowedTransitions("seller", "confirmed", "booking")).toEqual(["completed", "cancelled"]);
  });

  it("lets customers cancel only before the shop confirms", () => {
    expect(canTransition("customer", "pending", "cancelled", "pickup")).toBe(true);
    expect(canTransition("customer", "confirmed", "cancelled", "pickup")).toBe(false);
    expect(canTransition("customer", "pending", "confirmed", "pickup")).toBe(false);
  });

  it("treats finished orders as final", () => {
    for (const status of ["completed", "rejected", "cancelled"] as const) {
      expect(allowedTransitions("seller", status, "delivery")).toEqual([]);
      expect(allowedTransitions("customer", status, "delivery")).toEqual([]);
    }
  });
});

describe("orderTotals", () => {
  const lines = [
    { priceLaari: 6500, quantity: 2 },
    { priceLaari: 1500, quantity: 1 },
  ];

  it("adds the delivery fee only for delivery", () => {
    expect(orderTotals(lines, "delivery", 1000)).toEqual({
      subtotalLaari: 14500,
      deliveryFeeLaari: 1000,
      totalLaari: 15500,
    });
    expect(orderTotals(lines, "pickup", 1000)).toEqual({
      subtotalLaari: 14500,
      deliveryFeeLaari: 0,
      totalLaari: 14500,
    });
  });
});
