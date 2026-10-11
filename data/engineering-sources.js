export const ENGINEERING_SOURCE_IDS = Object.freeze({
  IEC_60364_5_52_CLAUSE_525: "iec-60364-5-52-2009-clause-525",
  IEC_60364_5_52_ANNEX_G: "iec-60364-5-52-2009-annex-g",
  IEC_60364_5_52_CLAUSE_523_7: "iec-60364-5-52-2009-clause-523-7",
  IEC_60364_5_52_COR1_2011: "iec-60364-5-52-2009-cor1-2011",
  SCHNEIDER_EIG_2018_G6: "schneider-eig-2018-g6",
  SCHNEIDER_EIG_2018_G20: "schneider-eig-2018-g20",
  SCHNEIDER_EIG_2018_G25: "schneider-eig-2018-g25",
  SCHNEIDER_EIG_2018_G26: "schneider-eig-2018-g26",
  ABB_EIH_2005_ANNEX_E: "abb-electrical-installation-handbook-2005-annex-e"
});

export const ENGINEERING_SOURCES = Object.freeze({
  [ENGINEERING_SOURCE_IDS.IEC_60364_5_52_CLAUSE_525]: Object.freeze({
    sourceId: ENGINEERING_SOURCE_IDS.IEC_60364_5_52_CLAUSE_525,
    sourceType: "international-standard",
    publisher: "IEC",
    documentTitle: "IEC 60364-5-52 — Low-voltage electrical installations — Wiring systems",
    edition: "3.0",
    year: 2009,
    clause: "525",
    printedPage: "20",
    applicableScope: "Voltage drop in consumers' installations",
    classification: "future-compliance-candidate"
  }),
  [ENGINEERING_SOURCE_IDS.IEC_60364_5_52_ANNEX_G]: Object.freeze({
    sourceId: ENGINEERING_SOURCE_IDS.IEC_60364_5_52_ANNEX_G,
    sourceType: "international-standard",
    publisher: "IEC",
    documentTitle: "IEC 60364-5-52 — Low-voltage electrical installations — Wiring systems",
    edition: "3.0",
    year: 2009,
    annex: "G (informative)",
    table: "G.52.1",
    printedPage: "74–75",
    applicableScope: "Informative voltage-drop calculation and missing-information assumptions",
    classification: "informative-guidance"
  }),
  [ENGINEERING_SOURCE_IDS.IEC_60364_5_52_CLAUSE_523_7]: Object.freeze({
    sourceId: ENGINEERING_SOURCE_IDS.IEC_60364_5_52_CLAUSE_523_7,
    sourceType: "international-standard",
    publisher: "IEC",
    documentTitle: "IEC 60364-5-52 — Low-voltage electrical installations — Wiring systems",
    edition: "3.0",
    year: 2009,
    clause: "523.7",
    annex: "H (informative examples)",
    printedPage: "17–18, 76–78",
    applicableScope: "Current sharing and arrangements for parallel conductors",
    classification: "future-compliance-candidate"
  }),
  [ENGINEERING_SOURCE_IDS.IEC_60364_5_52_COR1_2011]: Object.freeze({
    sourceId: ENGINEERING_SOURCE_IDS.IEC_60364_5_52_COR1_2011,
    sourceType: "corrigendum",
    publisher: "IEC",
    documentTitle: "IEC 60364-5-52:2009 Corrigendum 1",
    edition: "Corrigendum 1",
    year: 2011,
    table: "B.52.18",
    printedPage: "56",
    applicableScope: "Correction to a buried-cable grouping factor; no voltage-drop formula change",
    classification: "future-compliance-candidate"
  }),
  [ENGINEERING_SOURCE_IDS.SCHNEIDER_EIG_2018_G6]: Object.freeze({
    sourceId: ENGINEERING_SOURCE_IDS.SCHNEIDER_EIG_2018_G6,
    sourceType: "manufacturer-guide",
    publisher: "Schneider Electric",
    documentTitle: "Electrical Installation Guide",
    edition: "2018",
    year: 2018,
    clause: "Chapter G, 1.5",
    printedPage: "G6",
    applicableScope: "Engineering conditions for conductors in parallel",
    classification: "informative-guidance"
  }),
  [ENGINEERING_SOURCE_IDS.SCHNEIDER_EIG_2018_G20]: Object.freeze({
    sourceId: ENGINEERING_SOURCE_IDS.SCHNEIDER_EIG_2018_G20,
    sourceType: "manufacturer-guide",
    publisher: "Schneider Electric",
    documentTitle: "Electrical Installation Guide",
    edition: "2018",
    year: 2018,
    clause: "Chapter G, 3.2",
    figure: "G29",
    printedPage: "G20",
    applicableScope: "Steady-state single-phase and balanced three-phase voltage drop",
    classification: "physical-model"
  }),
  [ENGINEERING_SOURCE_IDS.SCHNEIDER_EIG_2018_G25]: Object.freeze({
    sourceId: ENGINEERING_SOURCE_IDS.SCHNEIDER_EIG_2018_G25,
    sourceType: "manufacturer-guide",
    publisher: "Schneider Electric",
    documentTitle: "Electrical Installation Guide",
    edition: "2018",
    year: 2018,
    figure: "G38",
    printedPage: "G25",
    applicableScope: "Conductor resistivity calculation bases at stated temperatures",
    classification: "informative-guidance"
  }),
  [ENGINEERING_SOURCE_IDS.SCHNEIDER_EIG_2018_G26]: Object.freeze({
    sourceId: ENGINEERING_SOURCE_IDS.SCHNEIDER_EIG_2018_G26,
    sourceType: "manufacturer-guide",
    publisher: "Schneider Electric",
    documentTitle: "Electrical Installation Guide",
    edition: "2018",
    year: 2018,
    clause: "Chapter G, 4.2",
    printedPage: "G26",
    applicableScope: "Manufacturer reactance data and 50 Hz engineering approximation",
    classification: "informative-guidance"
  }),
  [ENGINEERING_SOURCE_IDS.ABB_EIH_2005_ANNEX_E]: Object.freeze({
    sourceId: ENGINEERING_SOURCE_IDS.ABB_EIH_2005_ANNEX_E,
    sourceType: "manufacturer-guide",
    publisher: "ABB SACE",
    documentTitle: "Electrical Installation Handbook",
    edition: "2005",
    year: 2005,
    annex: "E",
    printedPage: "262–264",
    applicableScope: "Resistivity and temperature coefficients of conductor materials",
    classification: "physical-model"
  })
});
