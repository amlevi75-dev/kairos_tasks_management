import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { applyDocLang } from "./i18n";

// Language/direction follow the saved choice (browser, then the user's
// account) — applied before the first render so there's no flash of the
// wrong layout. See i18n.js for how the choice is read and persisted.
applyDocLang();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
