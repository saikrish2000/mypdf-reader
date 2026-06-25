import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/lib/pdfjs";
import App from "./App.tsx";
import "./index.css";

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

for (const key of requiredEnvVars) {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
