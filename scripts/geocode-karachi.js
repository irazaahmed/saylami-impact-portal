/**
 * Geocode Karachi Saylani locations using Nominatim.
 * Only processes Karachi zones (480 locations ≈ 9 minutes).
 * Validates every result stays inside Karachi bounds.
 * Falls back to neighbourhood lookup for anything not found.
 *
 * Usage: node scripts/geocode-karachi.js
 */

const fs   = require("fs");
const path = require("path");

const DATA      = path.join(__dirname, "../data/locations.json");
const BACKUP    = path.join(__dirname, "../data/locations.backup-geocode.json");
const PROGRESS  = path.join(__dirname, "../data/khi-progress.json");

/* Karachi valid bounding box — rejects false matches */
const KHI_BOUNDS = { minLat: 24.80, maxLat: 25.20, minLng: 66.85, maxLng: 67.65 };

function inKarachi(lat, lng) {
  return lat >= KHI_BOUNDS.minLat && lat <= KHI_BOUNDS.maxLat &&
         lng >= KHI_BOUNDS.minLng && lng <= KHI_BOUNDS.maxLng;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* Karachi zones */
const KHI_ZONES = new Set([
  "KHI LOCATIONS","KARACHI RO PLANT","KARACHI MEDICAL","KARACHI SMIT",
  "KARACHI SWEET HOME","KARACHI TEXTILE","MADARIS FAIZAN E MUS MALE & FEM",
  "GREENTIME EDUCATION","BRANCH","SHED","HEAD OFFICE","SMIT",
  "TEXTILE TRAINING CENTER","PARCEL POINT","RO PLANT","Meal On Wheels",
]);

/* ── Neighbourhood fallback coords (all on land) ─────────────────────── */
function jitter(r=0.003) { return (Math.random()-0.5)*2*r; }

const KHI_AREAS = [
  ["UMER GOTH",24.842,66.946],["UMERGOTH",24.842,66.946],
  ["ORANGI",24.941,66.994],["BALDIA",24.920,66.956],
  ["MOMINABAD",24.872,66.968],["SHERSHAH",24.872,66.963],
  ["SITE",24.892,66.987],["LYARI",24.862,66.998],["LIYARI",24.862,66.998],
  ["LIAQUATABAD",24.906,67.026],["NAZIMABAD",24.916,67.025],
  ["NORTH NAZIMABAD",24.942,67.048],["NORTH KARACHI",24.972,67.052],
  ["NEW KARACHI",24.962,67.052],["SURJANI",25.077,67.074],
  ["GADAP",25.064,67.125],["TAISAR",24.999,67.060],
  ["PAK COLONY",24.910,66.990],["KEAMARI",24.834,66.978],["KEMARI",24.834,66.978],
  ["SADDAR",24.860,67.031],["PECHS",24.873,67.042],
  ["FEDERAL B",24.926,67.068],["FB AREA",24.926,67.068],
  ["GULSHAN",24.907,67.099],["GULISTAN",24.923,67.118],
  ["KORANGI",24.835,67.130],["MALIR",24.897,67.183],
  ["LANDHI",24.851,67.212],["QUAIDABAD",24.852,67.147],
  ["SHAH FAISAL",24.899,67.148],["SHAHFAISAL",24.899,67.148],
  ["BIN QASIM",24.830,67.335],["RERHI",24.830,67.190],
  ["CLIFTON",24.819,67.026],["DEFENCE",24.810,67.057],["DHA",24.810,67.057],
  ["ZAMZAMA",24.822,67.050],["CANTT",24.844,67.041],["CANT",24.844,67.041],
  ["LIAQUATABAD",24.906,67.026],
];

function neighbourhoodCoords(address, name) {
  const a = ((address||"")+" "+(name||"")).toUpperCase();
  for (const [kw,lat,lng] of KHI_AREAS) {
    if (a.includes(kw)) return [Math.max(lat+jitter(0.004),24.820), lng+jitter(0.004)];
  }
  return [24.863+jitter(0.025), 67.010+jitter(0.025)];
}

/* ── Nominatim search ────────────────────────────────────────────────── */
async function nominatim(q) {
  const url = "https://nominatim.openstreetmap.org/search?q="
    + encodeURIComponent(q) + "&format=json&limit=3&countrycodes=pk";
  const res = await fetch(url, { headers:{"User-Agent":"SaylaniWelfareMap/1.0"} });
  if (!res.ok) throw new Error("HTTP "+res.status);
  return res.json();
}

async function geocodeOne(loc) {
  const addr = (loc.a||"").trim();
  const name = (loc.n||"").trim();

  /* Build progressively simpler queries */
  const queries = [];

  if (addr) {
    queries.push(addr + ", Karachi, Pakistan");
    /* strip plot/sector numbers for a cleaner area fallback */
    const stripped = addr
      .replace(/plot\s*#?\s*[\w\-\/]+/gi, "")
      .replace(/sector\s+[\w\-\/]+/gi, "")
      .replace(/\s+/g, " ").trim();
    if (stripped.length > 5 && stripped !== addr)
      queries.push(stripped + ", Karachi, Pakistan");
  }

  /* Always try the name — bounds check will reject false matches */
  if (name && name.trim().length > 3) {
    queries.push(name.trim() + ", Karachi, Pakistan");
  }

  for (const q of queries) {
    if (q.length < 10) continue;
    const results = await nominatim(q);
    /* find first result inside Karachi */
    const hit = results.find(r => inKarachi(parseFloat(r.lat), parseFloat(r.lon)));
    if (hit) return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon), quality: "geocoded" };
    await sleep(1100);
  }

  /* Fall back to neighbourhood */
  const [lat, lng] = neighbourhoodCoords(addr, name);
  return { lat, lng, quality: "neighbourhood" };
}

/* ── Main ─────────────────────────────────────────────────────────────── */
async function main() {
  if (!fs.existsSync(BACKUP)) {
    fs.copyFileSync(DATA, BACKUP);
    console.log("Backup → data/locations.backup-geocode.json");
  }

  const raw = fs.readFileSync(DATA,"utf-8").replace(/^﻿/,"");
  const locations = JSON.parse(raw);

  const khiIndices = locations.map((l,i)=>KHI_ZONES.has(l.z)?i:-1).filter(i=>i>=0);
  console.log(`Karachi locations to geocode: ${khiIndices.length}`);
  console.log(`Estimated time: ~${Math.ceil(khiIndices.length*1.3/60)} minutes\n`);

  /* Load progress */
  let done = new Set();
  if (fs.existsSync(PROGRESS)) {
    try {
      const p = JSON.parse(fs.readFileSync(PROGRESS,"utf-8"));
      if (p.done) { done = new Set(p.done); p.data.forEach((item,i)=>{locations[i]=item;}); }
      console.log(`Resuming — already done: ${done.size}/${khiIndices.length}`);
    } catch(e) {}
  }

  let geocodedCount = 0, nbCount = 0;
  const pending = khiIndices.filter(i => !done.has(i));

  for (let n = 0; n < pending.length; n++) {
    const i   = pending[n];
    const loc = locations[i];
    const pct = `[${n+1}/${pending.length}]`;
    process.stdout.write(`${pct} ${(loc.n||"").slice(0,40).padEnd(40)} `);

    try {
      const result = await geocodeOne(loc);
      loc.lat = parseFloat(result.lat.toFixed(5));
      loc.lng = parseFloat(result.lng.toFixed(5));
      if (result.quality === "geocoded") { geocodedCount++; process.stdout.write("✓ exact\n"); }
      else                               { nbCount++;       process.stdout.write("~ area\n");  }
      done.add(i);
    } catch(err) {
      process.stdout.write(`ERR: ${err.message}\n`);
      fs.writeFileSync(PROGRESS, JSON.stringify({done:[...done], data:locations}));
      console.error("\nProgress saved. Re-run to continue.");
      process.exit(1);
    }

    /* Save progress every 40 */
    if ((n+1) % 40 === 0) {
      fs.writeFileSync(PROGRESS, JSON.stringify({done:[...done], data:locations}));
      process.stdout.write(`  ── saved progress ${n+1}/${pending.length} ──\n`);
    }

    await sleep(1100);
  }

  fs.writeFileSync(DATA, JSON.stringify(locations, null, 2));
  if (fs.existsSync(PROGRESS)) fs.unlinkSync(PROGRESS);

  console.log(`\n✅ Done!`);
  console.log(`   ✓ Geocoded exact : ${geocodedCount}`);
  console.log(`   ~ Area fallback  : ${nbCount}`);
  console.log(`\nSaved → data/locations.json`);
}

main().catch(err=>{ console.error(err); process.exit(1); });
