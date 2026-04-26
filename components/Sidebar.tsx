"use client";

import { CAT_COLORS, Theme } from "@/types";

interface Props {
  catCounts:    Record<string, number>;
  active:       Set<string>;
  theme:        Theme;
  isOpen:       boolean;    // mobile: whether sidebar is visible
  onToggle:     (cat: string) => void;
  onClose:      () => void; // mobile: close sidebar
  visibleCount: number;
}

export default function Sidebar({ catCounts, active, theme, isOpen, onToggle, onClose, visibleCount }: Props) {
  const isDark = theme === "dark";

  const bg   = isDark ? "#0f1c24" : "#ffffff";
  const bdr  = isDark ? "rgba(0,135,90,0.15)" : "rgba(0,0,0,0.08)";
  const muted = isDark ? "#7a9488" : "#6a8a7a";
  const lbl  = isDark ? "#d8e8df" : "#1a3028";
  const accentBg  = isDark ? "rgba(0,135,90,0.10)" : "rgba(0,135,90,0.08)";
  const accentBdr = isDark ? "rgba(0,135,90,0.22)" : "rgba(0,135,90,0.2)";
  const footBdr   = isDark ? "rgba(0,135,90,0.1)"  : "rgba(0,0,0,0.07)";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            display: "none",
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 199, backdropFilter: "blur(2px)",
          }}
          className="mobile-backdrop"
        />
      )}

      <aside style={{
        width: 252, minWidth: 252, background: bg,
        borderRight: `1px solid ${bdr}`,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        /* mobile: slide-in overlay */
        position: "relative",
        zIndex: 200,
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
        className={`sidebar-base ${isOpen ? "sidebar-open" : ""}`}
      >
        {/* Mobile header */}
        <div style={{
          padding: "12px 14px 10px",
          borderBottom: `1px solid ${bdr}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.18em", color: muted }}>
            Filter by Category
          </span>
          {/* Close — only visible on mobile */}
          <button onClick={onClose} className="sidebar-close-btn"
            style={{ background: "none", border: "none", cursor: "pointer",
              color: muted, padding: 2, display: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Category list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
          {Object.entries(CAT_COLORS).map(([cat, color]) => {
            const count = catCounts[cat] ?? 0;
            if (!count) return null;
            const on = active.has(cat);
            return (
              <button key={cat} onClick={() => onToggle(cat)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 10, marginBottom: 3,
                  textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                  background:  on ? accentBg  : "transparent",
                  border:      on ? `1px solid ${accentBdr}` : "1px solid transparent",
                  opacity:     on ? 1 : 0.38,
                  transition:  "all 0.15s",
                }}
              >
                <span style={{
                  width: 11, height: 11, borderRadius: "50%", flexShrink: 0,
                  background: color,
                  boxShadow: on ? `0 0 5px ${color}80` : "none",
                }} />
                <span style={{ flex: 1, fontSize: 12, color: lbl }}>{cat}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 7px",
                  borderRadius: 20,
                  color:       on ? "#71dba6" : muted,
                  background:  on ? "rgba(0,135,90,0.14)" : "rgba(128,128,128,0.1)",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 14px 12px", borderTop: `1px solid ${footBdr}`, flexShrink: 0 }}>
          <span style={{ display: "block", fontSize: 20, fontWeight: 900,
            lineHeight: 1, color: "#71dba6" }}>
            {visibleCount.toLocaleString()}
          </span>
          <span style={{ fontSize: 10, color: muted }}>
            locations · Data:{" "}
            <strong style={{ color: "#00875A" }}>Nov 2025</strong>
          </span>
        </div>
      </aside>
    </>
  );
}
