import { describe, expect, it } from "vitest";

import { calculateVoltageDrop } from "../js/calculators/voltage-drop.js";

describe("calculateVoltageDrop", () => {
  it.each([
    [2.5, 11.711],
    [4, 7.319375],
    [10, 2.92775]
  ])("calculates the current single-phase copper model at %s mm²", (sectionMm2, expectedDrop) => {
    const result = calculateVoltageDrop({
      current: 23.9,
      voltage: 230,
      cosPhi: 1,
      lengthMeters: 35,
      sectionMm2,
      material: "copper",
      phases: 1
    });

    expect(result.current).toBe(23.9);
    expect(result.voltageDrop).toBeCloseTo(expectedDrop, 10);
    expect(result.percent).toBeCloseTo((expectedDrop / 230) * 100, 10);
  });

  it("calculates the balanced three-phase copper model below unity power factor", () => {
    const result = calculateVoltageDrop({
      current: 40,
      voltage: 400,
      cosPhi: 0.8,
      lengthMeters: 50,
      sectionMm2: 10,
      material: "copper",
      phases: 3
    });

    expect(result.voltageDrop).toBeCloseTo(4.8497422612, 10);
    expect(result.percent).toBeCloseTo(1.2124355653, 10);
  });

  it("calculates the single-phase aluminum model below unity power factor", () => {
    const result = calculateVoltageDrop({
      current: 25,
      voltage: 230,
      cosPhi: 0.9,
      lengthMeters: 30,
      sectionMm2: 6,
      material: "aluminum",
      phases: 1
    });

    expect(result.voltageDrop).toBeCloseTo(6.4125, 10);
    expect(result.percent).toBeCloseTo(2.7880434783, 10);
  });

  it("derives current from power in power-input mode", () => {
    const result = calculateVoltageDrop({
      inputMode: "power",
      powerWatts: 5500,
      voltage: 230,
      cosPhi: 1,
      lengthMeters: 35,
      sectionMm2: 4,
      material: "copper",
      phases: 1
    });

    expect(result.current).toBeCloseTo(23.9130434783, 10);
    expect(result.voltageDrop).toBeCloseTo(7.3233695652, 10);
  });
});
