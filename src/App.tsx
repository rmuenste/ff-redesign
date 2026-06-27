import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { BenchmarksIndex } from "./BenchmarksIndex.jsx";
import { Footer } from "./Footer.jsx";
import { Gallery } from "./Gallery.jsx";
import { Home } from "./Home.jsx";
import { Nav } from "./Nav.jsx";
import { RisingBubble2DPage } from "./pages/RisingBubble2DPage";
import { RisingBubble3DPage } from "./pages/RisingBubble3DPage";

type LegacyRoute = "home" | "benchmarks" | "detail" | "rb2" | "gallery";

const routeLabels: Record<string, string> = {
  "/": "01 Home",
  "/benchmarks": "02 Benchmarks Index",
  "/benchmarks/bubble3": "03 Rising Bubble 3D",
  "/benchmarks/2d-rising-bubble": "04 Rising Bubble 2D",
  "/gallery": "05 Gallery"
};

function useLegacyRouteAdapter() {
  const navigate = useNavigate();
  const location = useLocation();

  const setRoute = (route: LegacyRoute) => {
    const path =
      route === "home" ? "/" :
      route === "benchmarks" ? "/benchmarks" :
      route === "detail" ? "/benchmarks/bubble3" :
      route === "rb2" ? "/benchmarks/2d-rising-bubble" :
      "/gallery";
    navigate(path);
  };

  const route =
    location.pathname === "/" ? "home" :
    location.pathname.startsWith("/benchmarks/bubble3") ? "detail" :
    location.pathname.startsWith("/benchmarks/2d-rising-bubble") ? "rb2" :
    location.pathname.startsWith("/benchmarks") ? "benchmarks" :
    location.pathname.startsWith("/gallery") ? "gallery" :
    "home";

  return { route, setRoute };
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { route, setRoute } = useLegacyRouteAdapter();
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
      <Nav route={route} setRoute={setRoute} onToggleTweaks={() => undefined} tweaksAvailable={false} />
      <div style={{ flex: 1 }} data-screen-label={routeLabels[location.pathname] ?? location.pathname}>
        {children}
      </div>
      <Footer />
    </div>
  );
}

export function App() {
  const { setRoute } = useLegacyRouteAdapter();

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home setRoute={setRoute} />} />
        <Route path="/benchmarks" element={<BenchmarksIndex setRoute={setRoute} />} />
        <Route path="/benchmarks/bubble3" element={<RisingBubble3DPage />} />
        <Route path="/benchmarks/2d-rising-bubble" element={<RisingBubble2DPage />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
