import { describe, expect, it } from "vitest";

import { convertUnit } from "../js/utils/units.js";

describe("convertUnit", () => {
  it.each([
    [500, "W", "kW", 0.5],
    [550, "W", "kW", 0.55],
    [5500, "W", "kW", 5.5],
    [0.5, "kW", "W", 500],
    [5.5, "kW", "W", 5500]
  ])("converts %s %s to %s", (value, fromUnit, toUnit, expected) => {
    expect(convertUnit(value, fromUnit, toUnit, "power")).toBe(expected);
  });

  it("preserves a value converted to the same unit", () => {
    expect(convertUnit(12.345, "kW", "kW", "power")).toBe(12.345);
  });

  it("preserves zero", () => {
    expect(convertUnit(0, "W", "kW", "power")).toBe(0);
  });

  it("converts decimal values without display rounding", () => {
    expect(convertUnit(123.456, "W", "kW", "power")).toBe(0.123456);
  });

  it.each([NaN, Infinity, -Infinity])("returns null for %s", (value) => {
    expect(convertUnit(value, "W", "kW", "power")).toBeNull();
  });

  it("returns null for an unknown unit", () => {
    expect(convertUnit(500, "W", "MW", "power")).toBeNull();
  });

  it("returns null for an unknown quantity", () => {
    expect(convertUnit(500, "W", "kW", "energy")).toBeNull();
  });
});
