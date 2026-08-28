import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BenchmarksIndex } from "./BenchmarksIndex.jsx";
import { Footer } from "./Footer.jsx";
import { Gallery } from "./Gallery.jsx";
import { Home } from "./Home.jsx";
import { Nav } from "./Nav.jsx";
import { DraftingKissingTumblingPage } from "./pages/DraftingKissingTumblingPage";
import { FlowAroundCylinderPage } from "./pages/FlowAroundCylinderPage";
import { HinderedSettlingPage } from "./pages/HinderedSettlingPage";
import { NumericalViscometerPage } from "./pages/NumericalViscometerPage";
import { ParticleSedimentationPage } from "./pages/ParticleSedimentationPage";
import { ReferenceDataPage } from "./pages/ReferenceDataPage";
import { RisingBubble2DPage } from "./pages/RisingBubble2DPage";
import { RisingBubble3DPage } from "./pages/RisingBubble3DPage";

const routeLabels: Record<string, string> = {
  "/": "01 Home",
  "/benchmarks": "02 Benchmarks Index",
  "/benchmarks/bubble3": "03 Rising Bubble 3D",
  "/benchmarks/2d-rising-bubble": "04 Rising Bubble 2D",
  "/benchmarks/fac3": "05 Flow Around Cylinder 3D",
  "/benchmarks/particle-sedimentation": "06 Particle Sedimentation",
  "/benchmarks/drafting-kissing-tumbling": "07 Drafting-Kissing-Tumbling",
  "/benchmarks/hindered-settling": "08 Hindered Settling",
  "/benchmarks/numerical-viscometer": "09 Numerical Viscometer",
  "/reference-data": "10 Reference Data",
  "/gallery": "11 Gallery"
};

function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    document.body.dataset.theme ||= "dark";
    document.body.dataset.primary ||= "green";
    document.body.dataset.density ||= "compact";
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav activePath={location.pathname} />
      <div style={{ flex: 1 }} data-screen-label={routeLabels[location.pathname] ?? location.pathname}>
        {children}
      </div>
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/benchmarks" element={<BenchmarksIndex />} />
        <Route path="/benchmarks/bubble3" element={<RisingBubble3DPage />} />
        <Route path="/benchmarks/2d-rising-bubble" element={<RisingBubble2DPage />} />
        <Route path="/benchmarks/fac3" element={<FlowAroundCylinderPage />} />
        <Route path="/benchmarks/particle-sedimentation" element={<ParticleSedimentationPage />} />
        <Route path="/benchmarks/drafting-kissing-tumbling" element={<DraftingKissingTumblingPage />} />
        <Route path="/benchmarks/hindered-settling" element={<HinderedSettlingPage />} />
        <Route path="/benchmarks/numerical-viscometer" element={<NumericalViscometerPage />} />
        <Route path="/reference-data" element={<ReferenceDataPage />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
