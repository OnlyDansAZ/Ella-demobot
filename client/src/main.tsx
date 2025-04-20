import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply some additional global styles for the dark theme
document.documentElement.classList.add('dark');
document.body.classList.add('bg-gray-900', 'text-gray-100');

createRoot(document.getElementById("root")!).render(<App />);
