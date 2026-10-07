import { describe, expect, it } from "vitest";

import { calculateCurrent } from "../js/calculators/power-current.js";
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
