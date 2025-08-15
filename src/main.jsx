import React from "react";
import { createRoot } from "react-dom/client";
import LabelPrintingApp from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LabelPrintingApp />
  </React.StrictMode>
);
