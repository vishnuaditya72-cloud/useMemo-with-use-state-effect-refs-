import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// NOTE: <StrictMode> is intentionally NOT used.
// In dev, StrictMode runs every render and every useMemo callback TWICE on purpose,
// which would make the "compute counters" in these demos look doubled and confusing.
// In your real apps, keep StrictMode on.
createRoot(document.getElementById("root")).render(<App />);
