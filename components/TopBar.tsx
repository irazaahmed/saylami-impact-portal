"use client";

import { useRef, useState } from "react";
import { Location, Theme } from "@/types";

interface Props {
  locations:    Location[];
  visibleCount: number;
  theme:        Theme;
  onFlyTo:      (loc: Location) => void;
  onTheme:      (t: Theme) => void;
  onMenuToggle: () => void;
}

export default function TopBar({ locations, visibleCount, theme, onFlyTo, onTheme, onMenuToggle }: Props) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";

  /* Surface colours */
  const bar  = isDark ? "#0f1c24" : "#ffffff";
  const bdr  = isDark ? "rgba(0,135,90,0.2)"  : "rgba(0,0,0,0.1)";
  const txt  = isDark ? "#fff"    : "#0a1510";
  const muted = isDark ? "#7a9488" : "#6a8a7a";
  const inp  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const inpBdr = isDark ? "rgba(0,135,90,0.22)" : "rgba(0,0,0,0.12)";
  const dropBg = isDark ? "#0f1c24" : "#ffffff";
  const dropBdr = isDark ? "rgba(0,135,90,0.3)" : "rgba(0,0,0,0.12)";
  const hoverBg = isDark ? "rgba(0,135,90,0.12)" : "rgba(0,135,90,0.08)";

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    const ql = q.toLowerCase();
    setResults(
      locations.filter(l =>
        l.n.toLowerCase().includes(ql) ||
        l.z.toLowerCase().includes(ql) ||
        l.nc.toLowerCase().includes(ql) ||
        l.a.toLowerCase().includes(ql)
      ).slice(0, 8)
    );
  }

  function pick(loc: Location) {
    setQuery(loc.n);
    setResults([]);
    onFlyTo(loc);
  }

  return (
    <header style={{
      height: 56, display: "flex", alignItems: "center", gap: 12,
      padding: "0 16px", flexShrink: 0, background: bar,
      borderBottom: `1px solid ${bdr}`, zIndex: 100,
    }}>

      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
        className="md-hide"
        style={{
          width: 36, height: 36, borderRadius: 8, border: `1px solid ${inpBdr}`,
          background: "transparent", cursor: "pointer", color: muted,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#00875A",
          boxShadow: "0 0 8px #00875A99", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: txt, letterSpacing: "-0.02em", lineHeight: 1 }}>
            Saylani Impact Map
          </div>
          <div className="topbar-subtitle" style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.15em", color: muted, marginTop: 1 }}>
            Welfare International Trust
          </div>
        </div>
      </div>

      <div className="topbar-divider" style={{ width: 1, height: 26, background: bdr, flexShrink: 0 }} />

      {/* Search */}
      <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          color: muted, pointerEvents: "none" }}
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={handleInput}
          onBlur={() => setTimeout(() => setResults([]), 180)}
          type="text"
          placeholder="Search location, city, category…"
          style={{
            width: "100%", paddingLeft: 34, paddingRight: 14,
            paddingTop: 8, paddingBottom: 8,
            borderRadius: 50, fontSize: 13, color: txt,
            background: inp, border: `1px solid ${inpBdr}`,
            outline: "none", fontFamily: "inherit",
          }}
        />
        {results.length > 0 && (
          <div style={{
            position: "absolute", top: 40, left: 0, right: 0,
            background: dropBg, border: `1px solid ${dropBdr}`,
            borderRadius: 12, overflow: "hidden", zIndex: 500,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)", maxHeight: 240, overflowY: "auto",
          }}>
            {results.map((loc, i) => (
              <div key={i}
                onMouseDown={() => pick(loc)}
                style={{
                  padding: "9px 14px", cursor: "pointer",
                  borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: txt }}>{loc.n}</div>
                <div style={{ fontSize: 11, color: muted, marginTop: 1 }}>{loc.nc} · {loc.z}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats — hidden on small screens */}
      <div style={{ display: "flex", gap: 16, marginLeft: "auto", flexShrink: 0 }}
        className="stats-hide">
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#71dba6", lineHeight: 1 }}>
            {visibleCount.toLocaleString()}
          </div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: muted }}>
            Visible
          </div>
        </div>
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => onTheme(isDark ? "light" : "dark")}
        title={isDark ? "Switch to Light Map" : "Switch to Dark Map"}
        style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          border: `1px solid ${inpBdr}`, background: inp,
          cursor: "pointer", color: isDark ? "#fbbf24" : "#0058bb",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        {isDark ? (
          /* Sun icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          /* Moon icon */
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>
    </header>
  );
}
