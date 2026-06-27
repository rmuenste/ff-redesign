import React from "react";
import ReactDOM from "react-dom/client";
import { MathJaxContext } from "better-react-mathjax";
import { BrowserRouter } from "react-router-dom";
import "../assets/tokens.css";
import "./styles.css";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MathJaxContext
      version={3}
      config={{
        tex: {
          inlineMath: [["$", "$"]],
          displayMath: [["$$", "$$"]],
          packages: { "[+]": ["ams"] },
          macros: {
            notc: "\\not{c}"
          }
        }
      }}
    >
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </MathJaxContext>
  </React.StrictMode>
);
