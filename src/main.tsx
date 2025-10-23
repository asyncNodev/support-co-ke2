import { StrictMode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="356520852751-hm1as0662lkfhdgen8r2h87mgirh08ia.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
