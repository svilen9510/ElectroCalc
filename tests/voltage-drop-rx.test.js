import { describe, expect, it } from "vitest";

import {
  calculateVoltageDropRx,
  VOLTAGE_DROP_CALCULATION_MODEL
} from "../js/calculators/voltage-drop.js";

const BASE_INPUT = Object.freeze({
  inputMode: "current",
  phases: 1,
  voltageV: 230,
  currentA: 10,
  cosPhi: 0.8,
  lengthM: 100,
  material: "copper",
  sectionMm2: 10,
  frequencyHz: 50,
  powerFactorDirection: "lagging",
  resistanceModel: Object.freeze({
    type: "temperatureCalculated",
    conductorTemperatureC: 20
  }),
  reactanceModel: Object.freeze({ type: "ignored" })
});

function calculate(overrides = {}) {
  return calculateVoltageDropRx({ ...BASE_INPUT, ...overrides });
}

describe("calculateVoltageDropRx resistance models", () => {
  it("uses the IEC normal-service copper resistivity", () => {
    const result = calculate({ resistanceModel: { type: "iecNormalService" } });

    expect(result.resistanceOhmPerKm).toBeCloseTo(2.25, 12);
    expect(result.resistanceBasis).toBe("iecNormalService");
  });

  it("uses the IEC normal-service aluminium resistivity", () => {
    const result = calculate({
      material: "aluminum",
      resistanceModel: { type: "iecNormalService" }
    });

    expect(result.resistanceOhmPerKm).toBeCloseTo(3.6, 12);
  });

  it("calculates copper resistance at 20°C", () => {
    expect(calculate().resistanceOhmPerKm).toBeCloseTo(1.75, 12);
  });

  it("calculates sourced aluminium resistance at 20°C", () => {
    const result = calculate({ material: "aluminum" });

    expect(result.resistanceOhmPerKm).toBeCloseTo(2.87, 12);
  });

  it("increases temperature-calculated resistance above 20°C", () => {
    const result = calculate({
      resistanceModel: {
        type: "temperatureCalculated",
        conductorTemperatureC: 30
      }
    });

    expect(result.resistanceOhmPerKm).toBeCloseTo(1.819125, 12);
    expect(result.conductorTemperatureC).toBe(30);
  });

  it("decreases temperature-calculated resistance below 20°C", () => {
    const result = calculate({
      resistanceModel: {
        type: "temperatureCalculated",
        conductorTemperatureC: 10
      }
    });

    expect(result.resistanceOhmPerKm).toBeCloseTo(1.680875, 12);
  });

  it("uses manufacturer resistance without further correction", () => {
    const result = calculate({
      resistanceModel: {
        type: "manufacturer",
        resistanceOhmPerKm: 0.5,
        resistanceKind: "ac",
        referenceTemperatureC: 90,
        referenceFrequencyHz: 50,
        sourceId: "cable-maker-data"
      }
    });

    expect(result.resistanceOhmPerKm).toBe(0.5);
    expect(result.resistanceBasis).toBe("manufacturer");
    expect(result.sourceIds).toContain("cable-maker-data");
  });
});

describe("calculateVoltageDropRx reactance and power factor", () => {
  it("uses the IEC/Schneider reactance approximation", () => {
    const result = calculate({ reactanceModel: { type: "iecApproximation" } });

    expect(result.reactanceOhmPerKm).toBe(0.08);
    expect(result.reactanceBasis).toBe("iecApproximation");
  });

  it("uses manufacturer reactance applicable at 50 Hz", () => {
    const result = calculate({
      reactanceModel: {
        type: "manufacturer",
        reactanceOhmPerKm: 0.12,
        referenceFrequencyHz: 50,
        sourceId: "cable-maker-data"
      }
    });

    expect(result.reactanceOhmPerKm).toBe(0.12);
    expect(result.reactanceBasis).toBe("manufacturer");
    expect(result.sourceIds).toContain("cable-maker-data");
  });

  it("uses zero reactance when explicitly ignored", () => {
    expect(calculate().reactanceOhmPerKm).toBe(0);
  });

  it("returns exactly zero sin φ at unity power factor", () => {
    const result = calculate({
      cosPhi: 1,
      reactanceModel: { type: "iecApproximation" }
    });

    expect(result.sinPhi).toBe(0);
    expect(result.reactiveVoltageDrop).toBe(0);
  });

  it("calculates sin φ for cos φ = 0.8", () => {
    expect(calculate().sinPhi).toBeCloseTo(0.6, 12);
  });
});

describe("calculateVoltageDropRx electrical results", () => {
  it("calculates a single-phase resistance-only drop", () => {
    const result = calculate();

    expect(result.phaseFactor).toBe(2);
    expect(result.resistiveVoltageDrop).toBeCloseTo(2.8, 12);
    expect(result.reactiveVoltageDrop).toBe(0);
    expect(result.voltageDrop).toBeCloseTo(2.8, 12);
  });

  it("calculates a single-phase R+X drop", () => {
    const result = calculate({ reactanceModel: { type: "iecApproximation" } });

    expect(result.resistiveVoltageDrop).toBeCloseTo(2.8, 12);
    expect(result.reactiveVoltageDrop).toBeCloseTo(0.096, 12);
    expect(result.voltageDrop).toBeCloseTo(2.896, 12);
  });

  it("calculates a balanced three-phase resistance-only drop", () => {
    const result = calculate({ phases: 3, voltageV: 400 });
    const expected = Math.sqrt(3) * 10 * 0.1 * 1.75 * 0.8;

    expect(result.phaseFactor).toBe(Math.sqrt(3));
    expect(result.voltageDrop).toBeCloseTo(expected, 12);
    expect(result.voltageConvention).toBe("three-phase-line-to-line");
  });

  it("calculates a balanced three-phase R+X drop", () => {
    const result = calculate({
      phases: 3,
      voltageV: 400,
      reactanceModel: { type: "iecApproximation" }
    });
    const expected = Math.sqrt(3) * 10 * 0.1 * (1.75 * 0.8 + 0.08 * 0.6);

    expect(result.voltageDrop).toBeCloseTo(expected, 12);
  });

  it("returns resistive and reactive components that sum to the total", () => {
    const result = calculate({ reactanceModel: { type: "iecApproximation" } });

    expect(result.resistiveVoltageDrop + result.reactiveVoltageDrop)
      .toBeCloseTo(result.voltageDrop, 12);
    expect(result.impedanceProjectionOhmPerKm).toBeCloseTo(1.448, 12);
  });

  it("calculates percentage from the supplied circuit voltage", () => {
    const result = calculate();

    expect(result.percent).toBeCloseTo(100 * 2.8 / 230, 12);
  });

  it("returns an estimated load voltage", () => {
    expect(calculate().estimatedLoadVoltage).toBeCloseTo(227.2, 12);
  });

  it("returns its stable model ID and machine-readable assumptions", () => {
    const result = calculate();

    expect(result.calculationModel).toBe(VOLTAGE_DROP_CALCULATION_MODEL);
    expect(result.calculationModel).toBe("voltage-drop-rx-v1");
    expect(result.assumptions).toContain("sinusoidal-steady-state-ac");
    expect(result.assumptions).toContain("single-phase-circuit");
    expect(result.sourceIds.length).toBeGreaterThan(0);
  });

  it("uses current mode directly", () => {
    expect(calculate({ currentA: 12 }).current).toBe(12);
  });

  it("uses the existing calculateCurrent function in power mode", () => {
    const result = calculate({
      inputMode: "power",
      currentA: undefined,
      activePowerW: 1840
    });

    expect(result.current).toBeCloseTo(10, 12);
    expect(result.voltageDrop).toBeCloseTo(2.8, 12);
  });

  it("accepts zero current", () => {
    const result = calculate({ currentA: 0 });

    expect(result).not.toBeNull();
    expect(result.voltageDrop).toBe(0);
  });

  it("accepts zero active power", () => {
    const result = calculate({
      inputMode: "power",
      currentA: undefined,
      activePowerW: 0
    });

    expect(result).not.toBeNull();
    expect(result.current).toBe(0);
    expect(result.voltageDrop).toBe(0);
  });

  it("accepts zero route length", () => {
    const result = calculate({ lengthM: 0 });

    expect(result).not.toBeNull();
    expect(result.lengthKm).toBe(0);
    expect(result.voltageDrop).toBe(0);
  });

  it("proves the IEC phase-neutral and line-line three-phase percentages are equivalent", () => {
    const result = calculate({
      phases: 3,
      voltageV: 400,
      resistanceModel: { type: "iecNormalService" },
      reactanceModel: { type: "iecApproximation" }
    });
    const phaseToNeutralVoltage = 400 / Math.sqrt(3);
    const iecPhaseDrop = 10 * 0.1 * (2.25 * 0.8 + 0.08 * 0.6);
    const iecPercentage = 100 * iecPhaseDrop / phaseToNeutralVoltage;

    expect(result.percent).toBeCloseTo(iecPercentage, 12);
  });
});

describe("calculateVoltageDropRx validation", () => {
  it.each([
    ["voltageV", 0],
    ["voltageV", -230],
    ["sectionMm2", 0],
    ["sectionMm2", -1],
    ["lengthM", -1],
    ["cosPhi", 0],
    ["cosPhi", 1.01]
  ])("rejects invalid %s = %s", (field, value) => {
    expect(calculate({ [field]: value })).toBeNull();
  });

  it("rejects invalid temperature", () => {
    expect(calculate({
      resistanceModel: {
        type: "temperatureCalculated",
        conductorTemperatureC: Number.NaN
      }
    })).toBeNull();
  });

  it("rejects a temperature that produces non-positive resistance", () => {
    expect(calculate({
      resistanceModel: {
        type: "temperatureCalculated",
        conductorTemperatureC: -1000
      }
    })).toBeNull();
  });

  it.each([0, -1, Number.NaN])("rejects manufacturer resistance %s", (value) => {
    expect(calculate({
      resistanceModel: {
        type: "manufacturer",
        resistanceOhmPerKm: value,
        resistanceKind: "ac",
        sourceId: "maker"
      }
    })).toBeNull();
  });

  it("rejects incomplete manufacturer resistance metadata", () => {
    expect(calculate({
      resistanceModel: {
        type: "manufacturer",
        resistanceOhmPerKm: 0.5,
        resistanceKind: "unknown",
        sourceId: ""
      }
    })).toBeNull();
    expect(calculate({
      resistanceModel: {
        type: "manufacturer",
        resistanceOhmPerKm: 0.5,
        resistanceKind: "dc",
        referenceTemperatureC: Number.NaN,
        sourceId: "maker"
      }
    })).toBeNull();
    expect(calculate({
      resistanceModel: {
        type: "manufacturer",
        resistanceOhmPerKm: 0.5,
        resistanceKind: "dc",
        referenceFrequencyHz: 0,
        sourceId: "maker"
      }
    })).toBeNull();
  });

  it.each([-1, Number.NaN])("rejects manufacturer reactance %s", (value) => {
    expect(calculate({
      reactanceModel: {
        type: "manufacturer",
        reactanceOhmPerKm: value,
        referenceFrequencyHz: 50,
        sourceId: "maker"
      }
    })).toBeNull();
  });

  it("accepts zero manufacturer reactance", () => {
    expect(calculate({
      reactanceModel: {
        type: "manufacturer",
        reactanceOhmPerKm: 0,
        referenceFrequencyHz: 50,
        sourceId: "maker"
      }
    })).not.toBeNull();
  });

  it("rejects manufacturer reactance for a different frequency or without provenance", () => {
    expect(calculate({
      reactanceModel: {
        type: "manufacturer",
        reactanceOhmPerKm: 0.08,
        referenceFrequencyHz: 60,
        sourceId: "maker"
      }
    })).toBeNull();
    expect(calculate({
      reactanceModel: {
        type: "manufacturer",
        reactanceOhmPerKm: 0.08,
        referenceFrequencyHz: 50,
        sourceId: ""
      }
    })).toBeNull();
  });

  it("rejects unsupported frequency and leading power factor", () => {
    expect(calculate({ frequencyHz: 60 })).toBeNull();
    expect(calculate({ powerFactorDirection: "leading" })).toBeNull();
  });

  it("rejects unsupported phases, modes, materials, and model types", () => {
    expect(calculate({ phases: 2 })).toBeNull();
    expect(calculate({ inputMode: "apparentPower" })).toBeNull();
    expect(calculate({ material: "silver" })).toBeNull();
    expect(calculate({ resistanceModel: { type: "unknown" } })).toBeNull();
    expect(calculate({ reactanceModel: { type: "unknown" } })).toBeNull();
  });

  it("requires explicit resistance and reactance models", () => {
    expect(calculate({ resistanceModel: undefined })).toBeNull();
    expect(calculate({ reactanceModel: undefined })).toBeNull();
    expect(calculateVoltageDropRx(null)).toBeNull();
  });

  it("rejects missing, negative, and non-finite load values", () => {
    expect(calculate({ currentA: undefined })).toBeNull();
    expect(calculate({ currentA: -1 })).toBeNull();
    expect(calculate({ currentA: Number.POSITIVE_INFINITY })).toBeNull();
    expect(calculate({
      inputMode: "power",
      currentA: undefined,
      activePowerW: Number.NaN
    })).toBeNull();
  });

  it.each([
    ["voltageV", Number.POSITIVE_INFINITY],
    ["sectionMm2", Number.NaN],
    ["lengthM", Number.POSITIVE_INFINITY],
    ["cosPhi", Number.NaN]
  ])("rejects non-finite %s", (field, value) => {
    expect(calculate({ [field]: value })).toBeNull();
  });
});

describe("calculateVoltageDropRx legacy compatibility", () => {
  it("reproduces the historical copper result at 20°C with ignored reactance", () => {
    const result = calculateVoltageDropRx({
      ...BASE_INPUT,
      currentA: 23.9,
      voltageV: 230,
      cosPhi: 1,
      lengthM: 35,
      sectionMm2: 4
    });

    expect(result.voltageDrop).toBeCloseTo(7.319375, 10);
  });

  it("documents the intentional sourced aluminium difference at 20°C", () => {
    const result = calculate({
      material: "aluminum",
      currentA: 25,
      cosPhi: 0.9,
      lengthM: 30,
      sectionMm2: 6
    });
    const oldAluminiumDrop = 2 * 25 * 30 * (0.0285 / 6) * 0.9;

    expect(result.voltageDrop).toBeCloseTo(6.4575, 10);
    expect(result.voltageDrop).not.toBeCloseTo(oldAluminiumDrop, 10);
  });
});
