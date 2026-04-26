"use client";

import { useMemo, useState, useCallback } from "react";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import MapView from "@/components/MapView";
import { Location, CAT_COLORS, Theme } from "@/types";

interface Props {
  locations: Location[];
}

export default function MapClient({ locations }: Props) {
  const [active,      setActive]      = useState<Set<string>>(new Set(Object.keys(CAT_COLORS)));
  const [flyTarget,   setFlyTarget]   = useState<Location | null>(null);
  const [theme,       setTheme]       = useState<Theme>("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    locations.forEach(l => { m[l.nc] = (m[l.nc] ?? 0) + 1; });
    return m;
  }, [locations]);

  const visibleCount = useMemo(() =>
    Object.entries(catCounts).reduce((s, [cat, n]) => s + (active.has(cat) ? n : 0), 0),
  [catCounts, active]);

  const toggleCat = useCallback((cat: string) => {
    setActive(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }, []);

  const isDark = theme === "dark";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100%",
        background: isDark ? "#0a0f12" : "#f5f0ea" }}
      suppressHydrationWarning
    >
      <TopBar
        locations={locations}
        visibleCount={visibleCount}
        theme={theme}
        onFlyTo={setFlyTarget}
        onTheme={setTheme}
        onMenuToggle={() => setSidebarOpen(o => !o)}
      />
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        <Sidebar
          catCounts={catCounts}
          active={active}
          theme={theme}
          isOpen={sidebarOpen}
          onToggle={toggleCat}
          onClose={() => setSidebarOpen(false)}
          visibleCount={visibleCount}
        />
        <MapView
          locations={locations}
          activeCategories={active}
          flyTarget={flyTarget}
          theme={theme}
        />
      </div>
    </div>
  );
}
