# Saylani Welfare — Interactive Impact Map

An interactive map showing **1,103 Saylani Welfare locations** across Pakistan — branches, RO plants, schools, madrasahs, medical centres, IT institutes, and more.

## Features

- **1,103 locations** across Pakistan plotted as interactive dots
- **Hover / tap** any dot to see name, category, address, and zone
- **Category filter** sidebar — toggle any service type on/off
- **Search** by name, city, category, or address with instant fly-to
- **Dark / Light map** toggle (CartoDB Dark Matter ↔ Voyager)
- **Mobile responsive** — slide-in sidebar, bottom-sheet popup on tap
- **Fast** — canvas renderer + imperative Leaflet (no React re-renders for markers)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Map | Leaflet.js (imperative canvas renderer) |
| Data | Static JSON read server-side via `fs.readFileSync` |
| Styling | Inline styles + Tailwind CSS globals |
| Language | TypeScript |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Format

`data/locations.json` — 1,103 entries:

```json
{
  "n":   "Branch / location name",
  "c":   "Original category from Excel",
  "nc":  "Normalised category",
  "a":   "Street address",
  "z":   "Zone / city",
  "lat": 24.819,
  "lng": 67.026
}
```

Coordinates geocoded using OpenStreetMap Nominatim API.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/fix-coords.js` | Assign neighbourhood-level coordinates from lookup table |
| `scripts/geocode-karachi.js` | Re-geocode all 480 Karachi locations via Nominatim (~9 min) |
| `scripts/geocode.js` | Re-geocode all 1,103 locations via Nominatim (~25 min) |

## Categories

| Category | Colour |
|----------|--------|
| Branch / Dastarkhwan | Green |
| RO Plant | Blue |
| Madrasah | Purple |
| School / Education | Yellow |
| Medical | Red |
| IT / Vocational | Cyan |
| Shed | Orange |
| Food Distribution | Lime |
| Sweet Home / Old Age | Pink |
| Other | Grey |

## License

Data © Saylani Welfare International Trust. Map tiles © OpenStreetMap contributors, © CARTO.
