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
    expect(document.getElementById("drop-result-resistance").textContent).toBe("5,6250 Ω/km");
    expect(document.getElementById("drop-result-reactance").textContent).toBe("0,08 Ω/km");
    expect(screen.getByRole("heading", { name: "Основа на изчислението" })).toBeTruthy();
    expect(screen.getByText(/IEC 60364-5-52 Annex G — инженерна апроксимация/)).toBeTruthy();
    expect(screen.getByText(/X = 0,08 Ω\/km — приблизителна стойност/)).toBeTruthy();
    expect(screen.getByText("50 Hz")).toBeTruthy();
  });

  it("switches declaratively between Current and Power inputs", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    expect(document.getElementById("drop-current")).toBeTruthy();
    expect(document.getElementById("drop-power")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Мощност" }));
    expect(document.getElementById("drop-current")).toBeNull();
    expect(document.getElementById("drop-power")).toBeTruthy();
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

    await user.click(screen.getByRole("button", { name: "3-фазно" }));

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
});
