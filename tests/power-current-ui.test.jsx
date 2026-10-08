// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import PowerCurrentCalculator from "../src/calculators/PowerCurrentCalculator.jsx";

afterEach(cleanup);

describe("PowerCurrentCalculator", () => {
  it("preserves physical power when changing between W and kW", async () => {
    const user = userEvent.setup();
    render(<PowerCurrentCalculator navigateHome={() => {}} />);

    const powerInput = screen.getByLabelText("Мощност");
    const unitSelect = screen.getByRole("combobox", { name: "Единица за мощност" });

    await user.selectOptions(unitSelect, "W");
    await user.clear(powerInput);
    await user.type(powerInput, "500");
    await user.selectOptions(unitSelect, "kW");
    expect(powerInput.value).toBe("0.5");

    await user.selectOptions(unitSelect, "W");
    expect(powerInput.value).toBe("500");

    await user.click(document.getElementById("power-unit-choice-0"));
    expect(powerInput.value).toBe("0.5");
    expect(unitSelect.value).toBe("kW");
  });

  it("applies the existing voltage defaults when phases change", async () => {
    const user = userEvent.setup();
    render(<PowerCurrentCalculator navigateHome={() => {}} />);

    const voltageInput = screen.getByRole("textbox", { name: /Напрежение/ });
    await user.click(screen.getByRole("button", { name: "3-фазно" }));
    expect(voltageInput.value).toBe("400");

    await user.click(screen.getByRole("button", { name: "1-фазно" }));
    expect(voltageInput.value).toBe("230");
  });

  it("clears all dependent output when an input is invalid", async () => {
    const user = userEvent.setup();
    render(<PowerCurrentCalculator navigateHome={() => {}} />);

    expect(screen.getByText("23,91")).toBeTruthy();
    await user.clear(screen.getByLabelText("Мощност"));

    expect(screen.getByText("—", { selector: ".result-number" })).toBeTruthy();
    expect(screen.getByText("—", { selector: ".result-meta span" })).toBeTruthy();
    expect(screen.queryByText(/I = 5500/)).toBeNull();
  });
});
