import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global error handler to suppress ResizeObserver loop error
const observerErrHandler = (e) => {
  if (
    e.message ===
    "ResizeObserver loop completed with undelivered notifications."
  ) {
    // Ignore this specific error
    return;
  }
  console.error(e);
};

// Attach the global error handler
window.addEventListener("error", observerErrHandler);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
