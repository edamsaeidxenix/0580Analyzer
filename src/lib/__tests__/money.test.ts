import { describe, expect, it } from "vitest";
import { formatMvr, laariToInput, parseMvr } from "../money";

describe("parseMvr", () => {
  it.each([
    ["25", 2500],
    ["25.5", 2550],
    ["25.50", 2550],
    ["0.05", 5],
    ["1,250", 125000],
    ["MVR 10", 1000],
    ["Rf 7.25", 725],
  ])("parses %s", (input, expected) => {
    expect(parseMvr(input)).toBe(expected);
  });

  it.each(["", "abc", "-5", "1.234", "1.2.3"])("rejects %s", (input) => {
    expect(parseMvr(input)).toBeNull();
  });
});

describe("formatMvr", () => {
  it("drops decimals for whole amounts", () => expect(formatMvr(2500)).toBe("MVR 25"));
  it("keeps two decimals otherwise", () => expect(formatMvr(2550)).toBe("MVR 25.50"));
  it("groups thousands", () => expect(formatMvr(125000)).toBe("MVR 1,250"));
});

describe("laariToInput", () => {
  it("round-trips with parseMvr", () => {
    for (const laari of [1, 99, 100, 2550, 125000]) expect(parseMvr(laariToInput(laari))).toBe(laari);
  });
  it("handles empty values", () => expect(laariToInput(null)).toBe(""));
});
