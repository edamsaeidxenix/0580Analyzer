import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "../phone";

describe("normalizePhone", () => {
  it.each([
    ["7771234", "+9607771234"],
    ["777-1234", "+9607771234"],
    ["777 1234", "+9607771234"],
    ["+960 777 1234", "+9607771234"],
    ["009607771234", "+9607771234"],
    ["9607771234", "+9607771234"],
    ["9123456", "+9609123456"],
  ])("accepts %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["", "12345", "3301234", "77712345", "+44 7771 234567", "abcdefg"])("rejects %s", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("formatPhone", () => {
  it("formats Maldivian numbers", () => {
    expect(formatPhone("+9607771234")).toBe("777-1234");
  });
});
