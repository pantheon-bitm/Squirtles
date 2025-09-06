<<<<<<< HEAD
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
=======
import { scan } from "react-scan"; // must be imported before React and React DOM

scan({
  enabled: true,
});
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app";

createRoot(document.getElementById("root")!).render(<App />);
>>>>>>> fafb721 (fresh frontend)
