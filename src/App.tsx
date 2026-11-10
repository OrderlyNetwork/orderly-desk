import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";

const Landing = lazy(() => import("./pages/Landing"));
const Walkthrough = lazy(() => import("./pages/Walkthrough"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Reference = lazy(() => import("./pages/Reference"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    let frame = 0;
    let attempts = 0;

    const scrollToTarget = () => {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "instant", block: "start" });
        return;
      }
      // The target page is lazy-loaded; give the chunk a moment to mount.
      if (attempts++ < 90) {
        frame = window.requestAnimationFrame(scrollToTarget);
      }
    };

    frame = window.requestAnimationFrame(scrollToTarget);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}

function PageFallback() {
  return (
    <div className="shell py-24 font-mono text-[11px] uppercase tracking-[0.1em] text-dim">
      loading…
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="/walkthrough" element={<Walkthrough />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reference" element={<Reference />} />
            <Route path="*" element={<Landing />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
