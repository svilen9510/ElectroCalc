// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import VoltageDropCalculator from "../src/calculators/VoltageDropCalculator.jsx";

afterEach(cleanup);

describe("VoltageDropCalculator", () => {
  it("switches declaratively between Current and Power inputs", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    expect(document.getElementById("drop-current")).toBeTruthy();
    expect(document.getElementById("drop-power")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Мощност" }));
    expect(document.getElementById("drop-current")).toBeNull();
    expect(document.getElementById("drop-power")).toBeTruthy();
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

  it("uses material and section selections in the existing calculation model", async () => {
    const user = userEvent.setup();
    render(<VoltageDropCalculator navigateHome={() => {}} />);

    expect(document.getElementById("drop-result-volts").textContent).toBe("7,32");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Материал" }),
      "aluminum"
    );
    expect(document.getElementById("drop-result-volts").textContent).toBe("11,92");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Сечение" }),
      "10"
    );
    expect(document.getElementById("drop-result-volts").textContent).toBe("4,77");
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
