/**
 * Geocode all Saylani locations using OpenStreetMap Nominatim (free, no API key).
 * Rate limit: 1 request/second as required by Nominatim usage policy.
 *
 * Usage:  node scripts/geocode.js
 * Output: data/locations.json  (original backed up to data/locations.backup.json)
 *
 * Run time: ~25 minutes for 1103 locations.
 * Progress is saved every 50 locations — Ctrl+C and re-run to resume.
 */

const fs   = require("fs");
const path = require("path");

const DATA_FILE     = path.join(__dirname, "../data/locations.json");
const BACKUP_FILE   = path.join(__dirname, "../data/locations.backup.json");
const PROGRESS_FILE = path.join(__dirname, "../data/locations.progress.json");

/* ── Zone name → city hint for Nominatim ──────────────────────────────── */
const ZONE_CITY = {
  "KHI LOCATIONS":                    "Karachi",
  "KARACHI RO PLANT":                 "Karachi",
  "KARACHI MEDICAL":                  "Karachi",
  "KARACHI SMIT":                     "Karachi",
  "KARACHI SWEET HOME":               "Karachi",
  "KARACHI TEXTILE":                  "Karachi",
  "MADARIS FAIZAN E MUS MALE & FEM":  "Karachi",
  "HYD":                              "Hyderabad",
  "ISB PINDI ZONEY":                  "Islamabad",
  "MADARIS THAR":                     "Tharparkar",
  "GOTKI SMIT":                       "Ghotki",
  "GREENTIME EDUCATION":              "Karachi",
  "CHAKWAL SCHOOL":                   "Chakwal",
  "SWABI":                            "Swabi",
  "SWAT":                             "Swat",
  "BARA":                             "Khyber",
  "TMK":                              "Dera Ghazi Khan",
  "DUNIYAPUR":                        "Lodhran",
  "KOT ADDU":                         "Muzaffargarh",
  "LALA MOOSA":                       "Gujrat",
  "MORO":                             "Naushahro Feroze",
  "THATTA":                           "Thatta",
  "UMERKOT":                          "Umerkot",
  "MAMU KANJAN":                      "Faisalabad",
  "SUMANDRI":                         "Faisalabad",
  "JARANWALA (OUTSTATION)":           "Faisalabad",
  "JHANG (OUT STATION)":              "Jhang",
  "SANGLA HILL":                      "Nankana Sahib",
  "TANDLA":                           "Faisalabad",
  "BRANCH":                           "Karachi",
  "SHED":                             "Karachi",
  "HEAD OFFICE":                      "Karachi",
  "SMIT":                             "Karachi",
  "TEXTILE TRAINING CENTER":          "Karachi",
  "PARCEL POINT":                     "Karachi",
  "RO PLANT":                         "Karachi",
  "Meal On Wheels":                   "Karachi",
};

/* Zones that are already a real city name */
const CITY_ZONES = new Set([
  "FAISALABAD","LAHORE","MULTAN","PESHAWAR","QUETTA",
  "CHINIOT","SUKKUR","BAHAWALPUR","GUJRANWALA","OKARA","LODHRAN",
  "CHAKWAL","SWABI","SWAT","THATTA","UMERKOT","JHANG",
]);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function nominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=pk`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SaylaniWelfareMap/1.0 geocoding-script" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function geocode(address, zone) {
  const cityHint = ZONE_CITY[zone] ?? (CITY_ZONES.has(zone) ? zone : null);

  /* Strategy 1: full address + city hint */
  if (address && address.trim()) {
    const query = [address.trim(), cityHint, "Pakistan"].filter(Boolean).join(", ");
    const data  = await nominatim(query);
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), quality: "exact" };
    }
    await sleep(1100);
  }

  /* Strategy 2: city hint only (with small jitter so dots don't stack) */
  if (cityHint) {
    const data = await nominatim(`${cityHint}, Pakistan`);
    if (data.length > 0) {
      const jitter = () => (Math.random() - 0.5) * 0.01; /* ~±550m */
      return {
        lat: parseFloat(data[0].lat) + jitter(),
        lng: parseFloat(data[0].lon) + jitter(),
        quality: "city",
      };
    }
  }

  return null;
}

async function main() {
  /* Back up original once */
  if (!fs.existsSync(BACKUP_FILE)) {
    fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    console.log("Backup → data/locations.backup.json");
  }

  const raw       = fs.readFileSync(DATA_FILE, "utf-8").replace(/^﻿/, "");
  const locations = JSON.parse(raw);

  /* Resume support */
  let startIdx = 0;
  if (fs.existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    if (progress.nextIndex && progress.data) {
      startIdx = progress.nextIndex;
      progress.data.forEach((item, i) => { locations[i] = item; });
      console.log(`Resuming from ${startIdx} / ${locations.length}`);
    }
  }

  let exact = 0, city = 0, miss = 0;
  const total = locations.length;

  for (let i = startIdx; i < total; i++) {
    const loc    = locations[i];
    const label  = `[${String(i + 1).padStart(4)}/${total}]`;
    const name   = (loc.n || "").slice(0, 42).padEnd(42);
    process.stdout.write(`${label} ${name} `);

    try {
      const result = await geocode(loc.a, loc.z);
      if (result) {
        loc.lat = parseFloat(result.lat.toFixed(5));
        loc.lng = parseFloat(result.lng.toFixed(5));
        if (result.quality === "exact") { exact++; process.stdout.write("✓\n"); }
        else                            { city++;  process.stdout.write("~\n"); }
      } else {
        miss++;
        process.stdout.write("✗\n");
      }
    } catch (err) {
      process.stdout.write(`ERR: ${err.message}\n`);
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ nextIndex: i, data: locations }));
      console.error(`\nSaved progress at index ${i}. Re-run to continue.`);
      process.exit(1);
    }

    /* Save progress every 50 */
    if ((i + 1) % 50 === 0 || i === total - 1) {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ nextIndex: i + 1, data: locations }));
    }

    await sleep(1100); /* Nominatim requires ≥1s between requests */
  }

  /* Write final output */
  fs.writeFileSync(DATA_FILE, JSON.stringify(locations, null, 2));
  fs.writeFileSync(PROGRESS_FILE, "{}");

  console.log(`\n✅ Geocoding complete`);
  console.log(`   ✓ Exact address : ${exact}`);
  console.log(`   ~ City center   : ${city}`);
  console.log(`   ✗ Not found     : ${miss}`);
  console.log(`\nSaved → data/locations.json`);
}

main().catch(err => { console.error(err); process.exit(1); });
