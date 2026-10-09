// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import PowerCurrentCalculator from "../src/calculators/PowerCurrentCalculator.jsx";

afterEach(cleanup);

describe("PowerCurrentCalculator", () => {
  it("switches load modes and shows efficiency only for a motor", async () => {
    const user = userEvent.setup();
    render(<PowerCurrentCalculator navigateHome={() => {}} />);

    expect(screen.getByLabelText("Активна електрическа мощност P")).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: /^Ефективност η/ })).toBeNull();

    await chooseMotorMode(user);
    expect(screen.getByLabelText("Номинална механична мощност на вала")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: /^Ефективност η/ })).toBeTruthy();
    expect(screen.queryByLabelText("Активна електрическа мощност P")).toBeNull();
  });

  it("preserves each mode's power value and unit independently", async () => {
    const user = userEvent.setup();
    render(<PowerCurrentCalculator navigateHome={() => {}} />);

    const generalPower = screen.getByLabelText("Активна електрическа мощност P");
    const generalUnit = screen.getByRole("combobox", { name: "Единица за активна мощност" });
    await user.selectOptions(generalUnit, "W");
    await user.clear(generalPower);
    await user.type(generalPower, "7250");

    await chooseMotorMode(user);
    const motorPower = screen.getByLabelText("Номинална механична мощност на вала");
    await user.clear(motorPower);
    await user.type(motorPower, "11");

    await user.click(screen.getByRole("button", { name: "Общ товар" }));
    expect(screen.getByLabelText("Активна електрическа мощност P").value).toBe("7250");
    expect(screen.getByRole("combobox", { name: "Единица за активна мощност" }).value)
      .toBe("W");

    await chooseMotorMode(user);
    expect(screen.getByLabelText("Номинална механична мощност на вала").value).toBe("11");
    expect(screen.getByRole("combobox", { name: "Единица за мощност на вала" }).value)
      .toBe("kW");
  });

  it("preserves general-load power through native and enhanced W/kW selection", async () => {
    const user = userEvent.setup();
    render(<PowerCurrentCalculator navigateHome={() => {}} />);

    const powerInput = screen.getByLabelText("Активна електрическа мощност P");
    const unitSelect = screen.getByRole("combobox", { name: "Единица за активна мощност" });

    await user.selectOptions(unitSelect, "W");
    expect(powerInput.value).toBe("5500");
    await user.clear(powerInput);
    await user.type(powerInput, "500");
    await user.selectOptions(unitSelect, "kW");
    expect(powerInput.value).toBe("0.5");

    await user.click(document.getElementById("general-power-unit-choice-1"));
    expect(powerInput.value).toBe("500");
    expect(unitSelect.value).toBe("W");
  });

  it("preserves motor shaft power through native and enhanced W/kW selection", async () => {
    const user = userEvent.setup();
    render(<PowerCurrentCalculator navigateHome={() => {}} />);
    await chooseMotorMode(user);

    const powerInput = screen.getByLabelText("Номинална механична мощност на вала");
    const unitSelect = screen.getByRole("combobox", { name: "Единица за мощност на вала" });

    await user.selectOptions(unitSelect, "W");
    expect(powerInput.value).toBe("5500");
    await user.selectOptions(unitSelect, "kW");
    expect(powerInput.value).toBe("5.5");

    await user.click(document.getElementById("motor-power-unit-choice-1"));
    expect(powerInput.value).toBe("5500");
    expect(unitSelect.value).toBe("W");
  });

  it("shows distinct motor powers and expected derived results", async () => {
    const user = userEvent.setup();
    render(<PowerCurrentCalculator navigateHome={() => {}} />);
    await chooseMotorMode(user);

    const shaftPower = screen.getByLabelText("Номинална механична мощност на вала");
    await user.clear(shaftPower);
    await user.type(shaftPower, "7.5");
    await user.type(screen.getByRole("textbox", { name: /^Ефективност η/ }), "90");
    const powerFactor = screen.getByRole("textbox", { name: /^cos φ/ });
    await user.clear(powerFactor);
    await user.type(powerFactor, "0.85");
    await user.click(screen.getByRole("button", { name: "3-фазно" }));

    expect(screen.getByText("14,15", { selector: ".result-number" })).toBeTruthy();
    expect(getResultValue("Механична мощност на вала")).toBe("7,50 kW");
    expect(getResultValue("Активна електрическа входна мощност P")).toBe("8,33 kW");
    expect(getResultValue("Привидна мощност S")).toBe("9,80 kVA");
    expect(getResultValue("Реактивна мощност Q")).toBe("5,16 kvar");
    expect(getResultValue("Ефективност η")).toBe("90,00%");
    expect(screen.getByText("Pел = Pвал / η")).toBeTruthy();
  });

  it("clears all dependent motor output when efficiency is invalid", async () => {
    const user = userEvent.setup();
    render(<PowerCurrentCalculator navigateHome={() => {}} />);
    await chooseMotorMode(user);

    const efficiencyInput = screen.getByRole("textbox", { name: /^Ефективност η/ });
    await user.type(efficiencyInput, "90");
    expect(screen.queryByText("—", { selector: ".result-number" })).toBeNull();

    await user.clear(efficiencyInput);
    expect(screen.getByText("—", { selector: ".result-number" })).toBeTruthy();
    expect(document.querySelector(".result-values")).toBeNull();
    expect(document.querySelector(".formula-content").textContent).toBe("");
    expect(screen.getByText("Ефективността η трябва да е положително число.")).toBeTruthy();

    await user.type(efficiencyInput, "101");
    expect(screen.getByText("Ефективността η трябва да е най-много 100%.")).toBeTruthy();
  });

  it("displays exactly zero reactive power at unity power factor", () => {
    render(<PowerCurrentCalculator navigateHome={() => {}} />);

    expect(getResultValue("Реактивна мощност Q")).toBe("0 var");
  });

  it("applies the existing voltage defaults when phases change", async () => {
    const user = userEvent.setup();
    render(<PowerCurrentCalculator navigateHome={() => {}} />);

    const voltageInput = screen.getByRole("textbox", { name: /^Напрежение/ });
    await user.click(screen.getByRole("button", { name: "3-фазно" }));
    expect(voltageInput.value).toBe("400");

    await user.click(screen.getByRole("button", { name: "1-фазно" }));
    expect(voltageInput.value).toBe("230");
  });

  it("clears all dependent general-load output when an input is invalid", async () => {
    const user = userEvent.setup();
    render(<PowerCurrentCalculator navigateHome={() => {}} />);

    await user.clear(screen.getByLabelText("Активна електрическа мощност P"));

    expect(screen.getByText("—", { selector: ".result-number" })).toBeTruthy();
    expect(document.querySelector(".result-values")).toBeNull();
    expect(document.querySelector(".formula-content").textContent).toBe("");
  });
});

async function chooseMotorMode(user) {
  await user.click(screen.getByRole("button", { name: "Електродвигател" }));
}

function getResultValue(label) {
  return screen.getByText(label, { selector: "dt" }).parentElement.querySelector("dd").textContent;
}
