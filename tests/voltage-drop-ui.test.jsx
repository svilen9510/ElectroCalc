// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import VoltageDropCalculator from "../src/calculators/VoltageDropCalculator.jsx";

afterEach(cleanup);

describe("VoltageDropCalculator", () => {
  it("uses the RX model in Current mode with the explicit engineering basis", () => {
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    expect(document.getElementById("drop-current")).toBeTruthy();
    expect(document.getElementById("drop-result-volts").textContent).toBe("9,41");
    expect(document.getElementById("drop-result-percent").textContent).toBe("4,09%");
    expect(document.getElementById("drop-result-current").textContent).toContain("Използван ток");
    expect(document.getElementById("drop-result-resistance").textContent).toBe("5,6250 Ω/km");
    expect(document.getElementById("drop-result-reactance").textContent).toBe("0,08 Ω/km");
    const basis = screen.getByRole("heading", { name: "Основа на изчислението" })
      .closest("section");
    expect(within(basis).getByText(/IEC 60364-5-52 Annex G — инженерна апроксимация/)).toBeTruthy();
    expect(within(basis).getByText(/X = 0,08 Ω\/km — приблизителна стойност/)).toBeTruthy();
    expect(within(basis).getByText("50 Hz")).toBeTruthy();
  });

  it("switches declaratively between Current and Power inputs", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    expect(document.getElementById("drop-current")).toBeTruthy();
    expect(document.getElementById("drop-power")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Мощност" }));
    expect(document.getElementById("drop-current")).toBeNull();
    expect(document.getElementById("drop-power")).toBeTruthy();
    expect(document.getElementById("drop-result-current").textContent).toContain("Изчислен ток");
    expect(document.getElementById("drop-result-current").textContent).toContain("23,91 A");
  });

  it("preserves physical power and calculated current across W/kW changes", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Мощност" }));

    const powerInput = document.getElementById("drop-power");
    const unitSelect = screen.getByRole("combobox", { name: "Единица за мощност" });
    const initialCurrent = document.getElementById("drop-result-current").textContent;

    await user.selectOptions(unitSelect, "W");
    expect(powerInput.value).toBe("5500");
    expect(document.getElementById("drop-result-current").textContent).toBe(initialCurrent);

    await user.selectOptions(unitSelect, "kW");
    expect(powerInput.value).toBe("5.5");
    expect(document.getElementById("drop-result-current").textContent).toBe(initialCurrent);

    await user.click(document.getElementById("drop-power-unit-choice-1"));
    expect(powerInput.value).toBe("5500");
    expect(unitSelect.value).toBe("W");
    expect(document.getElementById("drop-result-current").textContent).toBe(initialCurrent);
  });

  it("uses IEC normal-service material data for Cu and Al section calculations", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    expect(document.getElementById("drop-result-volts").textContent).toBe("9,41");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Материал" }),
      "aluminum"
    );
    expect(document.getElementById("drop-result-volts").textContent).toBe("15,06");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Сечение" }),
      "10"
    );
    expect(document.getElementById("drop-result-volts").textContent).toBe("6,02");
  });

  it("uses line-to-line voltage for the balanced three-phase RX result", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Балансирана трифазна" }));

    expect(document.getElementById("drop-voltage").value).toBe("400");
    expect(document.getElementById("drop-result-volts").textContent).toBe("8,15");
    expect(document.getElementById("drop-result-percent").textContent).toBe("2,04%");
  });

  it("shows exact zero reactive contribution at cos φ = 1", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    await user.click(screen.getByText("Как е изчислено?"));

    const formula = document.getElementById("drop-formula").textContent;
    expect(document.getElementById("drop-result-power-factor").textContent)
      .toContain("sin φ 0,00");
    expect(formula).toContain("sin φ = 0,0000");
    expect(formula).toContain("= 0,0000 V");
    expect(formula).not.toContain("NaN");
    expect(formula).not.toContain("-0");
  });

  it("shows the reactive contribution for non-unity power factor", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    const cosPhiInput = document.getElementById("drop-cosphi");
    await user.clear(cosPhiInput);
    await user.type(cosPhiInput, "0.8");
    await user.click(screen.getByText("Как е изчислено?"));

    expect(document.getElementById("drop-result-volts").textContent).toBe("7,61");
    expect(document.getElementById("drop-result-power-factor").textContent)
      .toContain("sin φ 0,60");
    expect(document.getElementById("drop-formula").textContent)
      .toContain("= 0,0803 V");
  });

  it("selects a cable section from the five-row comparison window", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    const comparisonBody = document.getElementById("drop-comparison-body");
    expect(within(comparisonBody).getAllByRole("button")).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: "Избери сечение 10,0 mm²" }));
    expect(document.getElementById("drop-section").value).toBe("10");
    expect(within(comparisonBody).getAllByRole("button")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Избери сечение 10,0 mm²" }).className)
      .toContain("is-selected");
  });

  it("uses RX results in all five comparison rows without compliance-like status", () => {
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    const comparisonBody = document.getElementById("drop-comparison-body");
    const rows = within(comparisonBody).getAllByRole("button");

    expect(rows).toHaveLength(5);
    expect(rows[0].textContent).toContain("25,10 V");
    expect(screen.queryByText(/До 3%|Над 3%|Над 5%/)).toBeNull();
    expect(screen.queryByText("Статус")).toBeNull();
    expect(document.getElementById("drop-status")).toBeNull();
    expect(document.querySelector("#view-voltage-drop .status-pill")).toBeNull();
    expect(screen.queryByText("ориентир: 3%")).toBeNull();
  });

  it("clears all dependent output and comparison rows for invalid input", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    await user.clear(document.getElementById("drop-current"));

    expect(document.getElementById("drop-result-volts").textContent).toBe("—");
    expect(document.getElementById("drop-result-percent").textContent).toBe("—");
    expect(document.getElementById("drop-result-current").textContent).toContain("—");
    expect(document.getElementById("drop-summary").textContent).toBe("—");
    expect(document.getElementById("drop-formula").textContent).toBe("");
    expect(document.getElementById("drop-comparison-body").children).toHaveLength(0);
  });

  it("keeps Advanced collapsed with IEC defaults and a read-only 50 Hz model frequency", () => {
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    const advanced = screen.getByText("Разширени настройки").closest("details");
    expect(advanced.open).toBe(false);
    expect(screen.getByRole("combobox", { name: "Основа за съпротивлението" }).value)
      .toBe("iecNormalService");
    expect(screen.getByRole("combobox", { name: "Основа за реактивността" }).value)
      .toBe("iecApproximation");
    expect(document.getElementById("drop-model-frequency").textContent)
      .toContain("50 Hz");
    expect(document.querySelector("input[value='50'][readonly]")).toBeNull();
  });

  it("calculates resistance by temperature and removes it from the active model after returning to IEC", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    await user.click(screen.getByText("Разширени настройки"));

    const resistanceBasis = screen.getByRole("combobox", { name: "Основа за съпротивлението" });
    await user.selectOptions(resistanceBasis, "temperatureCalculated");

    const temperature = document.getElementById("drop-conductor-temperature");
    expect(temperature.value).toBe("20");
    expect(document.getElementById("drop-result-volts").textContent).toBe("7,32");

    await user.clear(temperature);
    await user.type(temperature, "35");
    expect(document.getElementById("drop-result-volts").textContent).toBe("7,75");
    expect(screen.getAllByText(/Изчислено за температура на проводника 35,0 °C/).length)
      .toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Основа на изчислението" })
      .closest("section").querySelector("small").textContent)
      .toContain("ABB Electrical Installation Handbook, Annex E");

    await user.selectOptions(resistanceBasis, "iecNormalService");
    expect(document.getElementById("drop-result-volts").textContent).toBe("9,41");
    expect(document.getElementById("drop-conductor-temperature")).toBeNull();

    await user.selectOptions(resistanceBasis, "temperatureCalculated");
    expect(document.getElementById("drop-conductor-temperature").value).toBe("35");
  });

  it("uses supplied manufacturer AC resistance and disables unsafe section comparison", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    await user.click(screen.getByText("Разширени настройки"));

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Основа за съпротивлението" }),
      "manufacturer"
    );
    expect(document.getElementById("drop-result-volts").textContent).toBe("—");
    expect(document.getElementById("drop-comparison-body")).toBeNull();
    expect(document.getElementById("drop-comparison-unavailable")).toBeTruthy();

    await user.type(document.getElementById("drop-manufacturer-resistance"), "0.5");
    expect(document.getElementById("drop-result-resistance").textContent).toBe("0,5000 Ω/km");
    expect(screen.getAllByText(/R = 0,5000 Ω\/km \(AC\)/).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Основа на изчислението" })
      .closest("section").querySelector("small").textContent)
      .toContain("въведени от потребителя данни за R");
    expect(document.getElementById("drop-validation").textContent).toBe("");
  });

  it("discloses uncorrected manufacturer DC resistance and preserves optional metadata", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    await user.click(screen.getByText("Разширени настройки"));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Основа за съпротивлението" }),
      "manufacturer"
    );
    await user.type(document.getElementById("drop-manufacturer-resistance"), "0.6");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Вид на съпротивлението" }),
      "dc"
    );
    await user.type(document.getElementById("drop-resistance-reference-temperature"), "90");
    await user.type(document.getElementById("drop-resistance-reference-frequency"), "50");

    expect(document.getElementById("drop-dc-resistance-disclosure").textContent)
      .toContain("без преобразуване към AC");
    expect(screen.getAllByText(/R = 0,6000 Ω\/km \(DC, 90,0 °C, 50,0 Hz\)/).length)
      .toBeGreaterThan(0);
  });

  it("withholds results for invalid manufacturer resistance instead of falling back", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    await user.click(screen.getByText("Разширени настройки"));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Основа за съпротивлението" }),
      "manufacturer"
    );
    await user.type(document.getElementById("drop-manufacturer-resistance"), "0");

    expect(document.getElementById("drop-result-volts").textContent).toBe("—");
    expect(document.getElementById("drop-validation").textContent)
      .toContain("Съпротивлението R трябва да е положително число");
    expect(document.getElementById("view-voltage-drop").textContent).not.toContain("NaN");
    expect(document.getElementById("view-voltage-drop").textContent).not.toContain("Infinity");
  });

  it("uses supplied manufacturer reactance at fixed 50 Hz and disables comparison", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    await user.click(screen.getByText("Разширени настройки"));
    await user.clear(document.getElementById("drop-cosphi"));
    await user.type(document.getElementById("drop-cosphi"), "0.8");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Основа за реактивността" }),
      "manufacturer"
    );

    expect(document.getElementById("drop-result-volts").textContent).toBe("—");
    await user.type(document.getElementById("drop-manufacturer-reactance"), "0.12");

    expect(document.getElementById("drop-result-reactance").textContent).toBe("0,12 Ω/km");
    expect(document.getElementById("drop-reactance-reference-frequency").textContent)
      .toContain("50 Hz");
    expect(screen.getAllByText(/X = 0,1200 Ω\/km при 50 Hz/).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Основа на изчислението" })
      .closest("section").querySelector("small").textContent)
      .toContain("въведени от потребителя данни за X");
    expect(document.getElementById("drop-comparison-unavailable")).toBeTruthy();
  });

  it("rejects negative manufacturer reactance and never displays non-finite output", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    await user.click(screen.getByText("Разширени настройки"));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Основа за реактивността" }),
      "manufacturer"
    );
    await user.type(document.getElementById("drop-manufacturer-reactance"), "-0.1");

    expect(document.getElementById("drop-result-volts").textContent).toBe("—");
    expect(document.getElementById("drop-validation").textContent)
      .toContain("Реактивността X трябва да е неотрицателно число");
    expect(document.getElementById("view-voltage-drop").textContent).not.toContain("NaN");
    expect(document.getElementById("view-voltage-drop").textContent).not.toContain("Infinity");
  });

  it("supports an explicitly ignored reactance with a zero reactive component", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    await user.click(screen.getByText("Разширени настройки"));
    await user.clear(document.getElementById("drop-cosphi"));
    await user.type(document.getElementById("drop-cosphi"), "0.8");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Основа за реактивността" }),
      "ignored"
    );
    await user.click(screen.getByText("Как е изчислено?"));

    expect(document.getElementById("drop-result-reactance").textContent).toBe("0,00 Ω/km");
    expect(document.getElementById("drop-formula").textContent).toContain("= 0,0000 V");
    expect(screen.getAllByText(/опростено резистивно изчисление с X = 0/i).length)
      .toBeGreaterThan(0);
  });

  it("keeps exact zero reactive contribution at unity PF in manufacturer X mode", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    await user.click(screen.getByText("Разширени настройки"));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Основа за реактивността" }),
      "manufacturer"
    );
    await user.type(document.getElementById("drop-manufacturer-reactance"), "0.2");
    await user.click(screen.getByText("Как е изчислено?"));

    expect(document.getElementById("drop-formula").textContent).toContain("sin φ = 0,0000");
    expect(document.getElementById("drop-formula").textContent).toContain("= 0,0000 V");
    expect(document.getElementById("drop-formula").textContent).not.toContain("-0");
  });

  it("recalculates all comparison rows for temperature mode", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    const defaultFirstRow = within(document.getElementById("drop-comparison-body"))
      .getAllByRole("button")[0].textContent;
    await user.click(screen.getByText("Разширени настройки"));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Основа за съпротивлението" }),
      "temperatureCalculated"
    );

    const rows = within(document.getElementById("drop-comparison-body")).getAllByRole("button");
    expect(rows).toHaveLength(5);
    expect(rows[0].textContent).not.toBe(defaultFirstRow);
    expect(rows[0].textContent).toContain("19,52 V");
  });

  it("restores IEC comparison after leaving manufacturer modes through native selects", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    await user.click(screen.getByText("Разширени настройки"));
    const resistanceBasis = screen.getByRole("combobox", { name: "Основа за съпротивлението" });
    const reactanceBasis = screen.getByRole("combobox", { name: "Основа за реактивността" });

    await user.selectOptions(resistanceBasis, "manufacturer");
    expect(document.getElementById("drop-comparison-body")).toBeNull();
    await user.selectOptions(resistanceBasis, "iecNormalService");
    expect(within(document.getElementById("drop-comparison-body")).getAllByRole("button"))
      .toHaveLength(5);

    await user.selectOptions(reactanceBasis, "manufacturer");
    expect(document.getElementById("drop-comparison-body")).toBeNull();
    await user.selectOptions(reactanceBasis, "iecApproximation");
    expect(within(document.getElementById("drop-comparison-body")).getAllByRole("button"))
      .toHaveLength(5);
  });

  it("keeps the enhanced Advanced picker path synchronized with its native select", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);
    await user.click(screen.getByText("Разширени настройки"));

    await user.click(document.getElementById("drop-resistance-basis-choice-1"));

    expect(screen.getByRole("combobox", { name: "Основа за съпротивлението" }).value)
      .toBe("temperatureCalculated");
    expect(document.getElementById("drop-conductor-temperature").value).toBe("20");
  });
});
