import { ENGINEERING_SOURCE_IDS } from "./engineering-sources.js";

export const CONDUCTOR_MATERIALS = Object.freeze({
  copper: Object.freeze({
    // Transitional property used by the pre-v0.5 UI calculation.
    resistivityOhmMm2PerM: 0.0175,
    rho20OhmMm2PerM: 0.0175,
    alpha20PerK: 0.00395,
    normalServiceResistivityOhmMm2PerM: 0.0225,
    referenceTemperatureC: 20,
    temperatureDataSourceId: ENGINEERING_SOURCE_IDS.ABB_EIH_2005_ANNEX_E,
    normalServiceSourceId: ENGINEERING_SOURCE_IDS.IEC_60364_5_52_ANNEX_G
  }),
  aluminum: Object.freeze({
    // Kept only for the unchanged pre-v0.5 UI calculation and its regressions.
    resistivityOhmMm2PerM: 0.0285,
    rho20OhmMm2PerM: 0.0287,
    alpha20PerK: 0.0038,
    normalServiceResistivityOhmMm2PerM: 0.036,
    referenceTemperatureC: 20,
    temperatureDataSourceId: ENGINEERING_SOURCE_IDS.ABB_EIH_2005_ANNEX_E,
    normalServiceSourceId: ENGINEERING_SOURCE_IDS.IEC_60364_5_52_ANNEX_G
  })
});
