"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type {
  Map as LMap,
  LayerGroup,
  CircleMarker as LCircle,
  TileLayer as LTile,
  LeafletMouseEvent,
} from "leaflet";
import { Location, CAT_COLORS, Theme } from "@/types";

const TILES = {
  dark:  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
};

interface Hover { loc: Location; x: number; y: number; }
interface Props {
  locations:        Location[];
  activeCategories: Set<string>;
  flyTarget:        Location | null;
  theme:            Theme;
}

export default function MapView({ locations, activeCategories, flyTarget, theme }: Props) {
  const divRef     = useRef<HTMLDivElement>(null);
  const mapRef     = useRef<LMap | null>(null);
  const tileRef    = useRef<LTile | null>(null);
  const groupsRef  = useRef<Map<string, LayerGroup>>(new Map());
  const readyRef   = useRef(false);
  const themeRef   = useRef(theme);

  /* Popup state — kept in ref+forceUpdate to avoid re-rendering MapContainer */
  const hoverRef        = useRef<Hover | null>(null);
  const [_, setTick]    = useState(0);
  const forcePopup      = () => setTick(t => t + 1);

  /* ── Init Leaflet once ─────────────────────────────────────── */
  useEffect(() => {
    if (readyRef.current || !divRef.current) return;
    readyRef.current = true;
    let cancelled = false;

    import("leaflet").then(L => {
      if (cancelled || !divRef.current) return;

      /* Fix marker icon URLs that Next.js breaks */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({ iconUrl: "", shadowUrl: "" });

      const map = L.map(divRef.current, {
        center: [30.0, 69.5],
        zoom: 6,
        preferCanvas: true,
        zoomSnap: 0.1,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 45,
        maxZoom: 18,
      });
      mapRef.current = map;

      /* Tile layer */
      const tile = L.tileLayer(TILES[themeRef.current], {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 18,
        keepBuffer: 4,
      });
      tile.addTo(map);
      tileRef.current = tile;

      /* Create all markers in category layer groups */
      const renderer = L.canvas({ padding: 0.6 });
      const groups   = new Map<string, LayerGroup>();

      locations.forEach(loc => {
        const color  = CAT_COLORS[loc.nc] ?? "#94A3B8";
        const circle = L.circleMarker([loc.lat, loc.lng], {
          radius: 5, renderer,
          color: "rgba(0,0,0,0.28)", fillColor: color,
          fillOpacity: 0.88, weight: 1.2,
        }) as LCircle;

        circle.on("mouseover", function (this: LCircle, e: LeafletMouseEvent) {
          this.setRadius(10);
          this.setStyle({ fillOpacity: 1, weight: 2 });
          hoverRef.current = { loc, x: e.originalEvent.clientX, y: e.originalEvent.clientY };
          forcePopup();
        });
        circle.on("mousemove", (e: LeafletMouseEvent) => {
          if (hoverRef.current) {
            hoverRef.current = { ...hoverRef.current, x: e.originalEvent.clientX, y: e.originalEvent.clientY };
            forcePopup();
          }
        });
        circle.on("mouseout", function (this: LCircle) {
          this.setRadius(5);
          this.setStyle({ fillOpacity: 0.88, weight: 1.2 });
          hoverRef.current = null;
          forcePopup();
        });
        /* Mobile tap */
        circle.on("click", (e: LeafletMouseEvent) => {
          hoverRef.current = { loc, x: e.originalEvent.clientX, y: e.originalEvent.clientY };
          forcePopup();
        });

        if (!groups.has(loc.nc)) groups.set(loc.nc, L.layerGroup());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        groups.get(loc.nc)!.addLayer(circle as any);
      });

      groups.forEach(g => g.addTo(map));
      groupsRef.current = groups;
    });

    return () => {
      cancelled = true;
      readyRef.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); /* run once only */

  /* ── Toggle category layers ───────────────────────────────── */
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    groupsRef.current.forEach((g, cat) => {
      if (activeCategories.has(cat)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!map.hasLayer(g as any)) g.addTo(map);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (map.hasLayer(g as any)) g.removeFrom(map);
      }
    });
  }, [activeCategories]);

  /* ── Swap tile on theme change ────────────────────────────── */
  useEffect(() => {
    themeRef.current = theme;
    if (!mapRef.current || !tileRef.current) return;
    import("leaflet").then(L => {
      if (!mapRef.current) return;
      tileRef.current!.remove();
      const t = L.tileLayer(TILES[theme], {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd", maxZoom: 18, keepBuffer: 4,
      });
      t.addTo(mapRef.current);
      tileRef.current = t;
    });
  }, [theme]);

  /* ── Fly to searched location ─────────────────────────────── */
  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;
    mapRef.current.flyTo([flyTarget.lat, flyTarget.lng], 14, { duration: 1.0 });
  }, [flyTarget]);

  /* ── Popup: desktop follows cursor, mobile = bottom sheet via CSS ─── */
  function popupStyle(x: number, y: number): React.CSSProperties {
    if (window.innerWidth < 768) return { zIndex: 9999 };
    const W = 292, H = 160;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = x + 16, top = y - 12;
    if (left + W > vw - 6) left = x - W - 16;
    if (top  + H > vh - 6) top  = vh - H - 6;
    if (top < 60) top = 60;
    return { position: "fixed", left, top, zIndex: 9999, pointerEvents: "none", width: W };
  }

  function closePopup() { hoverRef.current = null; forcePopup(); }

  const isDark = theme === "dark";
  const hover  = hoverRef.current;

  return (
    <div style={{ flex: 1, position: "relative", minWidth: 0, minHeight: 0 }}>

      {/* Map container — always rendered, no layout shift */}
      <div
        ref={divRef}
        style={{ width: "100%", height: "100%",
          background: isDark ? "#0a0f12" : "#e8e0d5" }}
      />

      {/* Hover / tap popup — desktop: floating card; mobile: bottom sheet */}
      {hover && (
        <div className="map-popup" style={popupStyle(hover.x, hover.y)}>
          <div style={{
            background:     isDark ? "rgba(7,12,15,0.97)" : "rgba(255,255,255,0.97)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border:         `1px solid ${isDark ? "rgba(0,135,90,0.38)" : "rgba(0,0,0,0.1)"}`,
            borderRadius:   13,
            overflow:       "hidden",
            boxShadow:      isDark ? "0 8px 32px rgba(0,0,0,0.75)" : "0 6px 24px rgba(0,0,0,0.15)",
          }}>
            {/* Drag handle — mobile only */}
            <div className="popup-handle" style={{
              display: "none", /* shown via CSS on mobile */
              justifyContent: "center", paddingTop: 10, paddingBottom: 4,
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2,
                background: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)" }} />
            </div>

            <div style={{
              padding: "10px 14px 9px",
              background: isDark
                ? "linear-gradient(135deg,rgba(0,107,71,0.5),rgba(0,135,90,0.22))"
                : "linear-gradient(135deg,rgba(0,135,90,0.1),rgba(0,135,90,0.04))",
              borderBottom: `1px solid ${isDark ? "rgba(0,135,90,0.16)" : "rgba(0,0,0,0.07)"}`,
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.2em", marginBottom: 3,
                  color: CAT_COLORS[hover.loc.nc] ?? "#94A3B8",
                }}>
                  {hover.loc.nc}
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.3,
                  color: isDark ? "#fff" : "#0d1f17" }}>
                  {hover.loc.n}
                </div>
              </div>
              {/* Close button — mobile only */}
              <button
                onClick={closePopup}
                className="popup-close-btn"
                style={{
                  display: "none", /* shown via CSS on mobile */
                  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  border: "none", borderRadius: 8, width: 30, height: 30,
                  cursor: "pointer", flexShrink: 0, alignItems: "center", justifyContent: "center",
                  color: isDark ? "#7a9488" : "#6a8a7a",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={{ padding: "8px 14px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5,
                fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: "#00875A" }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="3">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {hover.loc.z}
              </div>
              {hover.loc.c && hover.loc.c !== hover.loc.nc && (
                <div style={{ fontSize: 10, marginBottom: 4,
                  color: isDark ? "#7a9488" : "#5a7a6a" }}>{hover.loc.c}</div>
              )}
              <div style={{
                fontSize: 11, lineHeight: 1.55,
                color: hover.loc.a
                  ? (isDark ? "rgba(255,255,255,0.58)" : "rgba(0,0,0,0.52)")
                  : (isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)"),
                fontStyle: hover.loc.a ? "normal" : "italic",
              }}>
                {hover.loc.a || "Address not available"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
