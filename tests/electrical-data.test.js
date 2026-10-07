import { describe, expect, it } from "vitest";

import {
  DEFAULT_CABLE_SECTION_MM2,
  STANDARD_CABLE_SECTIONS_MM2
} from "../data/cable-sizes.js";
import { CONDUCTOR_MATERIALS } from "../data/conductor-materials.js";

describe("electrical reference data", () => {
  it("keeps standard cable sections in ascending order", () => {
    const sortedSections = [...STANDARD_CABLE_SECTIONS_MM2].sort((a, b) => a - b);

    expect(STANDARD_CABLE_SECTIONS_MM2).toEqual(sortedSections);
  });

  it("contains the expected commonly used cable sections", () => {
    expect(STANDARD_CABLE_SECTIONS_MM2).toEqual(
      expect.arrayContaining([1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120])
    );
    expect(STANDARD_CABLE_SECTIONS_MM2).toContain(DEFAULT_CABLE_SECTION_MM2);
  });

  it("defines positive resistivity for every conductor material", () => {
    for (const material of Object.values(CONDUCTOR_MATERIALS)) {
      expect(material.resistivityOhmMm2PerM).toBeGreaterThan(0);
      expect(Number.isFinite(material.resistivityOhmMm2PerM)).toBe(true);
    }
  });
});
