import { describe, expect, it } from "vitest";
import { slugify } from "../labels";

describe("slugify", () => {
  it("makes URL-safe shop slugs", () => {
    expect(slugify("Amina's Kitchen")).toBe("aminas-kitchen");
    expect(slugify("  Sea  Breeze -- Café ")).toBe("sea-breeze-cafe");
  });
  it("falls back when nothing is left", () => {
    expect(slugify("ހަމްޒާ ސްޓޯރ")).toBe("shop");
  });
});
