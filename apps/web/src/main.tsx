import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import "./app/base.css";
import "./features/reports/reports-layout.css";
import "./features/reports/reports-detail.css";

const container = document.getElementById("root");

if (container === null) {
  throw new Error("Unable to find the root element.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
