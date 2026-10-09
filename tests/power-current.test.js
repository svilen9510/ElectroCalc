import { describe, expect, it } from "vitest";

import {
  calculateAcLoad,
  calculateCurrent,
  calculateMotorLoad
} from "../js/calculators/power-current.js";
import { convertUnit } from "../js/utils/units.js";

describe("calculateCurrent", () => {
  it("calculates single-phase current at unity power factor", () => {
    const current = calculateCurrent({
      powerWatts: 5500,
      voltage: 230,
      cosPhi: 1,
      phases: 1
    });

    expect(current).toBeCloseTo(23.9130434783, 10);
  });

  it("calculates single-phase current below unity power factor", () => {
    const current = calculateCurrent({
      powerWatts: 5500,
      voltage: 230,
      cosPhi: 0.85,
      phases: 1
    });

    expect(current).toBeCloseTo(28.1329923274, 10);
  });

  it("calculates balanced three-phase current at unity power factor", () => {
    const current = calculateCurrent({
      powerWatts: 10000,
      voltage: 400,
      cosPhi: 1,
      phases: 3
    });

    expect(current).toBeCloseTo(14.4337567297, 10);
  });

  it("calculates balanced three-phase current below unity power factor", () => {
    const current = calculateCurrent({
      powerWatts: 10000,
      voltage: 400,
      cosPhi: 0.8,
      phases: 3
    });

    expect(current).toBeCloseTo(18.0421959122, 10);
  });

  it("accepts power normalized from kilowatts", () => {
    const powerWatts = convertUnit(5.5, "kW", "W", "power");
    const current = calculateCurrent({
      powerWatts,
      voltage: 230,
      cosPhi: 1,
      phases: 1
    });

    expect(current).toBeCloseTo(23.9130434783, 10);
  });
});

describe("calculateAcLoad", () => {
  it("calculates a single-phase load at unity power factor", () => {
    const result = calculateAcLoad({
      activePowerWatts: 5500,
      voltage: 230,
      cosPhi: 1,
      phases: 1
    });

    expect(result).toEqual({
      mode: "general",
      phases: 1,
      voltage: 230,
      cosPhi: 1,
      activePowerWatts: 5500,
      apparentPowerVoltAmps: 5500,
      reactivePowerVars: 0,
      currentAmps: 5500 / 230
    });
    expect(Object.is(result.reactivePowerVars, -0)).toBe(false);
  });

  it("calculates a single-phase load below unity power factor", () => {
    const result = calculateAcLoad({
      activePowerWatts: 5500,
      voltage: 230,
      cosPhi: 0.85,
      phases: 1
    });

    expect(result.apparentPowerVoltAmps).toBeCloseTo(6470.5882352941, 10);
    expect(result.reactivePowerVars).toBeCloseTo(3408.5938612171, 10);
    expect(result.currentAmps).toBeCloseTo(28.1329923274, 10);
  });

  it("calculates a balanced three-phase load", () => {
    const result = calculateAcLoad({
      activePowerWatts: 10000,
      voltage: 400,
      cosPhi: 0.8,
      phases: 3
    });

    expect(result.apparentPowerVoltAmps).toBeCloseTo(12500, 10);
    expect(result.reactivePowerVars).toBeCloseTo(7500, 10);
    expect(result.currentAmps).toBeCloseTo(18.0421959122, 10);
  });

  it.each([0, -0.5, 1.01, NaN, Infinity, -Infinity])(
    "rejects invalid cosPhi %s",
    (cosPhi) => {
      expect(calculateAcLoad({
        activePowerWatts: 5500,
        voltage: 230,
        cosPhi,
        phases: 1
      })).toBeNull();
    }
  );

  it.each([0, 2, 4, "1", NaN, Infinity, -Infinity])(
    "rejects invalid phase value %s",
    (phases) => {
      expect(calculateAcLoad({
        activePowerWatts: 5500,
        voltage: 230,
        cosPhi: 1,
        phases
      })).toBeNull();
    }
  );

  it.each([0, -1, NaN, Infinity, -Infinity])(
    "rejects invalid active power %s",
    (activePowerWatts) => {
      expect(calculateAcLoad({
        activePowerWatts,
        voltage: 230,
        cosPhi: 1,
        phases: 1
      })).toBeNull();
    }
  );

  it.each([0, -230, NaN, Infinity, -Infinity])(
    "rejects invalid voltage %s",
    (voltage) => {
      expect(calculateAcLoad({
        activePowerWatts: 5500,
        voltage,
        cosPhi: 1,
        phases: 1
      })).toBeNull();
    }
  );

  it("rejects finite input whose derived result overflows", () => {
    expect(calculateAcLoad({
      activePowerWatts: Number.MAX_VALUE,
      voltage: 1,
      cosPhi: Number.MIN_VALUE,
      phases: 1
    })).toBeNull();
  });
});

describe("calculateMotorLoad", () => {
  it("calculates electrical input and AC results from shaft output", () => {
    const result = calculateMotorLoad({
      shaftPowerWatts: 7500,
      efficiency: 0.9,
      voltage: 400,
      cosPhi: 0.85,
      phases: 3
    });

    expect(result.mode).toBe("motor");
    expect(result.phases).toBe(3);
    expect(result.voltage).toBe(400);
    expect(result.cosPhi).toBe(0.85);
    expect(result.efficiency).toBe(0.9);
    expect(result.shaftPowerWatts).toBe(7500);
    expect(result.electricalInputPowerWatts).toBeCloseTo(8333.3333333333, 10);
    expect(result.apparentPowerVoltAmps).toBeCloseTo(9803.9215686275, 10);
    expect(result.reactivePowerVars).toBeCloseTo(5164.5361533592, 10);
    expect(result.currentAmps).toBeCloseTo(14.1507418919, 10);
    expect(result).not.toHaveProperty("activePowerWatts");
  });

  it("returns exactly zero reactive power at unity power factor", () => {
    const result = calculateMotorLoad({
      shaftPowerWatts: 7500,
      efficiency: 0.9,
      voltage: 400,
      cosPhi: 1,
      phases: 3
    });

    expect(result.reactivePowerVars).toBe(0);
    expect(Object.is(result.reactivePowerVars, -0)).toBe(false);
  });

  it.each([0, -0.1, 1.01, NaN, Infinity, -Infinity])(
    "rejects invalid efficiency %s",
    (efficiency) => {
      expect(calculateMotorLoad({
        shaftPowerWatts: 7500,
        efficiency,
        voltage: 400,
        cosPhi: 0.85,
        phases: 3
      })).toBeNull();
    }
  );

  it.each([0, -7500, NaN, Infinity, -Infinity])(
    "rejects invalid shaft power %s",
    (shaftPowerWatts) => {
      expect(calculateMotorLoad({
        shaftPowerWatts,
        efficiency: 0.9,
        voltage: 400,
        cosPhi: 0.85,
        phases: 3
      })).toBeNull();
    }
  );

  it("rejects invalid AC inputs delegated to the general load model", () => {
    expect(calculateMotorLoad({
      shaftPowerWatts: 7500,
      efficiency: 0.9,
      voltage: 400,
      cosPhi: 0,
      phases: 3
    })).toBeNull();
  });
});
