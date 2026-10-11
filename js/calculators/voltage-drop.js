import { CONDUCTOR_MATERIALS } from "../../data/conductor-materials.js";
import { ENGINEERING_SOURCE_IDS } from "../../data/engineering-sources.js";
import { calculateCurrent } from "./power-current.js";

export const VOLTAGE_DROP_CALCULATION_MODEL = "voltage-drop-rx-v1";
const SUPPORTED_FREQUENCY_HZ = 50;
const IEC_REACTANCE_OHM_PER_KM = 0.08;

export function calculateVoltageDropRx(input) {
  if (!input || typeof input !== "object") return null;

  const {
    inputMode,
    phases,
    voltageV,
    currentA,
    activePowerW,
    cosPhi,
    lengthM,
    material,
    sectionMm2,
    frequencyHz,
    powerFactorDirection,
    resistanceModel,
    reactanceModel
  } = input;

  if (
    !isSupportedInputMode(inputMode) ||
    !isSupportedPhaseCount(phases) ||
    !isPositiveFinite(voltageV) ||
    !isPositiveFinite(sectionMm2) ||
    !isNonNegativeFinite(lengthM) ||
    !isValidPowerFactor(cosPhi) ||
    frequencyHz !== SUPPORTED_FREQUENCY_HZ ||
    powerFactorDirection !== "lagging" ||
    !Object.hasOwn(CONDUCTOR_MATERIALS, material)
  ) {
    return null;
  }

  const loadValue = inputMode === "current" ? currentA : activePowerW;
  if (!isNonNegativeFinite(loadValue)) return null;

  const current = inputMode === "power"
    ? calculateCurrent({ powerWatts: activePowerW, voltage: voltageV, cosPhi, phases })
    : currentA;
  if (!isNonNegativeFinite(current)) return null;

  const resistance = resolveResistance({ material, sectionMm2, resistanceModel });
  const reactance = resolveReactance({ reactanceModel, frequencyHz });
  if (!resistance || !reactance) return null;

  const sinPhi = cosPhi === 1
    ? 0
    : Math.sqrt(Math.max(0, 1 - cosPhi ** 2));
  const phaseFactor = phases === 3 ? Math.sqrt(3) : 2;
  const lengthKm = lengthM / 1000;
  const impedanceProjectionOhmPerKm =
    resistance.resistanceOhmPerKm * cosPhi + reactance.reactanceOhmPerKm * sinPhi;
  const resistiveVoltageDrop =
    phaseFactor * current * lengthKm * resistance.resistanceOhmPerKm * cosPhi;
  const reactiveVoltageDrop =
    phaseFactor * current * lengthKm * reactance.reactanceOhmPerKm * sinPhi;
  const voltageDrop = resistiveVoltageDrop + reactiveVoltageDrop;
  const percent = 100 * voltageDrop / voltageV;
  const estimatedLoadVoltage = voltageV - voltageDrop;

  const numericResults = [
    current,
    sinPhi,
    phaseFactor,
    lengthKm,
    impedanceProjectionOhmPerKm,
    resistiveVoltageDrop,
    reactiveVoltageDrop,
    voltageDrop,
    percent,
    estimatedLoadVoltage
  ];
  if (!numericResults.every(Number.isFinite)) return null;

  return {
    calculationModel: VOLTAGE_DROP_CALCULATION_MODEL,
    current,
    voltageDrop,
    percent,
    resistiveVoltageDrop,
    reactiveVoltageDrop,
    resistanceOhmPerKm: resistance.resistanceOhmPerKm,
    reactanceOhmPerKm: reactance.reactanceOhmPerKm,
    impedanceProjectionOhmPerKm,
    cosPhi,
    sinPhi,
    phaseFactor,
    lengthKm,
    voltageConvention: phases === 3
      ? "three-phase-line-to-line"
      : "single-phase-circuit-voltage",
    resistanceBasis: resistance.resistanceBasis,
    reactanceBasis: reactance.reactanceBasis,
    ...(resistance.conductorTemperatureC === undefined
      ? {}
      : { conductorTemperatureC: resistance.conductorTemperatureC }),
    frequencyHz,
    sourceIds: [...new Set([
      ENGINEERING_SOURCE_IDS.IEC_60364_5_52_ANNEX_G,
      ENGINEERING_SOURCE_IDS.SCHNEIDER_EIG_2018_G20,
      ...resistance.sourceIds,
      ...reactance.sourceIds
    ])],
    assumptions: buildAssumptions({ phases, resistance, reactance }),
    estimatedLoadVoltage
  };
}

function resolveResistance({ material, sectionMm2, resistanceModel }) {
  if (!resistanceModel || typeof resistanceModel !== "object") return null;

  const materialData = CONDUCTOR_MATERIALS[material];

  if (resistanceModel.type === "iecNormalService") {
    return {
      resistanceOhmPerKm:
        1000 * materialData.normalServiceResistivityOhmMm2PerM / sectionMm2,
      resistanceBasis: "iecNormalService",
      sourceIds: [materialData.normalServiceSourceId]
    };
  }

  if (resistanceModel.type === "temperatureCalculated") {
    const { conductorTemperatureC } = resistanceModel;
    if (!Number.isFinite(conductorTemperatureC)) return null;

    const rhoTheta = materialData.rho20OhmMm2PerM * (
      1 + materialData.alpha20PerK * (
        conductorTemperatureC - materialData.referenceTemperatureC
      )
    );
    const resistanceOhmPerKm = 1000 * rhoTheta / sectionMm2;
    if (!isPositiveFinite(resistanceOhmPerKm)) return null;

    return {
      resistanceOhmPerKm,
      resistanceBasis: "temperatureCalculated",
      conductorTemperatureC,
      sourceIds: [materialData.temperatureDataSourceId]
    };
  }

  if (resistanceModel.type === "manufacturer") {
    const {
      resistanceOhmPerKm,
      resistanceKind,
      referenceTemperatureC,
      referenceFrequencyHz,
      sourceId
    } = resistanceModel;
    if (
      !isPositiveFinite(resistanceOhmPerKm) ||
      !["ac", "dc"].includes(resistanceKind) ||
      !isNonEmptyString(sourceId) ||
      (referenceTemperatureC !== undefined && !Number.isFinite(referenceTemperatureC)) ||
      (referenceFrequencyHz !== undefined && !isPositiveFinite(referenceFrequencyHz))
    ) {
      return null;
    }

    return {
      resistanceOhmPerKm,
      resistanceBasis: "manufacturer",
      sourceIds: [sourceId]
    };
  }

  return null;
}

function resolveReactance({ reactanceModel, frequencyHz }) {
  if (!reactanceModel || typeof reactanceModel !== "object") return null;

  if (reactanceModel.type === "iecApproximation") {
    return {
      reactanceOhmPerKm: IEC_REACTANCE_OHM_PER_KM,
      reactanceBasis: "iecApproximation",
      sourceIds: [
        ENGINEERING_SOURCE_IDS.IEC_60364_5_52_ANNEX_G,
        ENGINEERING_SOURCE_IDS.SCHNEIDER_EIG_2018_G20,
        ENGINEERING_SOURCE_IDS.SCHNEIDER_EIG_2018_G26
      ]
    };
  }

  if (reactanceModel.type === "manufacturer") {
    const { reactanceOhmPerKm, referenceFrequencyHz, sourceId } = reactanceModel;
    if (
      !isNonNegativeFinite(reactanceOhmPerKm) ||
      referenceFrequencyHz !== frequencyHz ||
      !isNonEmptyString(sourceId)
    ) {
      return null;
    }

    return {
      reactanceOhmPerKm,
      reactanceBasis: "manufacturer",
      sourceIds: [sourceId]
    };
  }

  if (reactanceModel.type === "ignored") {
    return {
      reactanceOhmPerKm: 0,
      reactanceBasis: "ignored",
      sourceIds: []
    };
  }

  return null;
}

function buildAssumptions({ phases, resistance, reactance }) {
  return [
    "sinusoidal-steady-state-ac",
    "lagging-or-unity-power-factor",
    "one-way-route-length",
    "frequency-50-hz",
    "concentrated-end-load",
    "estimated-load-voltage-not-load-flow",
    phases === 3 ? "balanced-three-phase-load" : "single-phase-circuit",
    `resistance-${resistance.resistanceBasis}`,
    `reactance-${reactance.reactanceBasis}`
  ];
}

function isSupportedInputMode(value) {
  return value === "current" || value === "power";
}

function isSupportedPhaseCount(value) {
  return value === 1 || value === 3;
}

function isPositiveFinite(value) {
  return Number.isFinite(value) && value > 0;
}

function isNonNegativeFinite(value) {
  return Number.isFinite(value) && value >= 0;
}

function isValidPowerFactor(value) {
  return Number.isFinite(value) && value > 0 && value <= 1;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
