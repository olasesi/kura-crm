import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/App";
import { initMonitoring } from "@/lib/monitoring";
import "@/styles/index.css";

initMonitoring();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root was not found in the document.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
