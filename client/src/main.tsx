import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (!document.documentElement.classList.contains("dark")) {
  document.documentElement.classList.add("dark");
  document.documentElement.style.colorScheme = "dark";
}

createRoot(document.getElementById("root")!).render(<App />);
