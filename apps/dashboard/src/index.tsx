import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";

import App from "./App";
import { AuthProvider } from "context/AuthContext";
import { ThemeProvider } from "context/ThemeContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

const basename = import.meta.env.VITE_ROUTER_BASENAME || "/";

root.render(
  <BrowserRouter basename={basename}>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <SpeedInsights />
        <Analytics />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);
