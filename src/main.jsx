import { createRoot } from "react-dom/client";

import "../css/variables.css";
import "../css/base.css";
import "../css/components.css";
import "../css/responsive.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
