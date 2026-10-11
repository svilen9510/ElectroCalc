import { describe, expect, it } from "vitest";

import { calculateVoltageDropRx } from "../js/calculators/voltage-drop.js";

const LEGACY_REGRESSION_INPUT = Object.freeze({
  inputMode: "current",
  phases: 1,
  voltageV: 230,
  currentA: 23.9,
  cosPhi: 1,
  lengthM: 35,
  material: "copper",
  sectionMm2: 4,
  frequencyHz: 50,
  powerFactorDirection: "lagging",
  resistanceModel: Object.freeze({
    type: "temperatureCalculated",
    conductorTemperatureC: 20
  }),
  reactanceModel: Object.freeze({ type: "ignored" })
});

function calculateLegacyRegression(overrides = {}) {
  return calculateVoltageDropRx({ ...LEGACY_REGRESSION_INPUT, ...overrides });
}

describe("calculateVoltageDropRx historical resistance-only regressions", () => {
  it.each([
    [2.5, 11.711],
    [4, 7.319375],
    [10, 2.92775]
  ])("calculates the current single-phase copper model at %s mm²", (sectionMm2, expectedDrop) => {
    const result = calculateLegacyRegression({ sectionMm2 });

    expect(result.current).toBe(23.9);
    expect(result.voltageDrop).toBeCloseTo(expectedDrop, 10);
    expect(result.percent).toBeCloseTo((expectedDrop / 230) * 100, 10);
  });

  it("calculates the balanced three-phase copper model below unity power factor", () => {
    const result = calculateLegacyRegression({
      currentA: 40,
      voltageV: 400,
      cosPhi: 0.8,
      lengthM: 50,
      sectionMm2: 10,
      phases: 3
    });

    expect(result.voltageDrop).toBeCloseTo(4.8497422612, 10);
    expect(result.percent).toBeCloseTo(1.2124355653, 10);
  });

  it("uses the sourced 20°C aluminum value instead of the historical approximation", () => {
    const result = calculateLegacyRegression({
      currentA: 25,
      cosPhi: 0.9,
      lengthM: 30,
      sectionMm2: 6,
      material: "aluminum"
    });

    expect(result.voltageDrop).toBeCloseTo(6.4575, 10);
    expect(result.voltageDrop).not.toBeCloseTo(6.4125, 10);
    expect(result.percent).toBeCloseTo(2.8076086957, 10);
  });

  it("derives current from power in power-input mode", () => {
    const result = calculateLegacyRegression({
      inputMode: "power",
      currentA: undefined,
      activePowerW: 5500
    });

    expect(result.current).toBeCloseTo(23.9130434783, 10);
    expect(result.voltageDrop).toBeCloseTo(7.3233695652, 10);
  });
});
