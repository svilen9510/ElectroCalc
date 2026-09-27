import { initNavigation } from "./ui/navigation.js";
import { initPowerCurrentCalculator } from "./ui/power-current.js";
import { initTheme } from "./ui/theme.js";
import { initVoltageDropCalculator } from "./ui/voltage-drop.js";

initTheme(document.querySelector("#theme-toggle"));
initNavigation();
initPowerCurrentCalculator();
initVoltageDropCalculator();
