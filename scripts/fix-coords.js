/**
 * Fix Saylani location coordinates.
 *
 * Problem: Random jitter pushed 126 Karachi locations into the Arabian Sea.
 * Solution: Parse each address for area/neighbourhood keywords, assign the
 *           matching land coordinate, then apply a tiny jitter (~300m max).
 *
 * Usage:  node scripts/fix-coords.js
 * Output: data/locations.json  (backup → data/locations.backup.json)
 */

const fs   = require("fs");
const path = require("path");

const DATA   = path.join(__dirname, "../data/locations.json");
const BACKUP = path.join(__dirname, "../data/locations.backup.json");

/* ── Tiny jitter — keeps dots spread but never reaches sea ───────────── */
function jitter(range = 0.003) {
  return (Math.random() - 0.5) * 2 * range;
}

/* ── Karachi neighbourhoods (all verified on land) ───────────────────── */
/* Order matters: more specific strings first. */
const KHI_AREAS = [
  /* ---- Western Karachi -------------------------------------------- */
  ["UMER GOTH",        24.842, 66.946],
  ["UMERGOTH",         24.842, 66.946],
  ["ORANGI",           24.941, 66.994],
  ["BALDIA",           24.882, 66.956],
  ["MOMINABAD",        24.872, 66.968],
  ["SHERSHAH",         24.872, 66.963],
  ["SITE",             24.892, 66.987],
  ["LYARI",            24.858, 66.982],
  ["LIYARI",           24.858, 66.982],
  ["LIAQUATABAD",      24.906, 67.026],
  ["NAZIMABAD",        24.916, 67.025],
  ["NORTH NAZIMABAD",  24.957, 67.028],
  ["NORTH KARACHI",    24.972, 67.052],
  ["NEW KARACHI",      24.962, 67.052],
  ["SURJANI",          25.018, 67.037],
  ["GADAP",            25.064, 67.125],
  ["TAISAR",           24.999, 67.060],
  ["PAK COLONY",       24.910, 66.990],
  ["KEAMARI",          24.834, 66.978],
  ["KEMARI",           24.834, 66.978],
  /* ---- Central Karachi -------------------------------------------- */
  ["SADDAR",           24.860, 67.010],
  ["PECHS",            24.873, 67.042],
  ["FEDERAL B",        24.926, 67.068],
  ["FB AREA",          24.926, 67.068],
  ["GULSHAN",          24.931, 67.098],
  ["GULISTAN",         24.923, 67.118],
  /* ---- Eastern Karachi -------------------------------------------- */
  ["KORANGI",          24.842, 67.122],
  ["MALIR",            24.897, 67.183],
  ["LANDHI",           24.839, 67.176],
  ["QUAIDABAD",        24.852, 67.147],
  ["SHAH FAISAL",      24.899, 67.148],
  ["SHAHFAISAL",       24.899, 67.148],
  ["BIN QASIM",        24.795, 67.355],
  ["GHARO",            24.745, 67.590],
  ["RERHI",            24.830, 67.190],
  /* ---- South Karachi ---------------------------------------------- */
  ["CLIFTON",          24.822, 67.028],
  ["DEFENCE",          24.810, 67.057],
  ["DHA",              24.810, 67.057],
  ["CLIFTON",          24.822, 67.028],
  ["ZAMZAMA",          24.822, 67.050],
  ["CANTT",            24.859, 67.048],
  ["CANT",             24.859, 67.048],
  /* ---- Generic ---------------------------------------------------- */
  ["KARACHI",          24.863, 67.010],
];

function matchKarachi(address) {
  const a = (address || "").toUpperCase();
  for (const [kw, lat, lng] of KHI_AREAS) {
    if (a.includes(kw)) return [lat + jitter(0.004), lng + jitter(0.004)];
  }
  /* default Karachi centre */
  return [24.863 + jitter(0.025), 67.010 + jitter(0.025)];
}

/* ── Tharparkar village clusters ─────────────────────────────────────── */
const THAR_AREAS = [
  ["CHACHRO",    24.905, 70.215],
  ["CHACHORO",   24.905, 70.215],
  ["DAHLI",      25.120, 70.050],
  ["DAHLE",      25.120, 70.050],
  ["MITHI",      24.733, 69.800],
  ["MITHHI",     24.733, 69.800],
  ["MITTHI",     24.733, 69.800],
  ["ISLAMKOT",   24.693, 70.180],
  ["ISLAM KOT",  24.693, 70.180],
  ["NAUKOT",     25.163, 69.459],
  ["NOKOT",      25.163, 69.459],
  ["DIPLO",      24.466, 69.587],
  ["DHIPLO",     24.466, 69.587],
  ["NAGARPARKAR",24.350, 70.210],
  ["KLOI",       24.800, 70.150],
  ["BAJEER",     24.950, 70.280],
];

function matchThar(address) {
  const a = (address || "").toUpperCase();
  for (const [kw, lat, lng] of THAR_AREAS) {
    if (a.includes(kw)) return [lat + jitter(0.015), lng + jitter(0.015)];
  }
  return [24.730 + jitter(0.080), 70.200 + jitter(0.080)];
}

/* ── City centre coordinates (all verified) ──────────────────────────── */
const CITY = {
  /* Punjab */
  LAHORE:           [31.5497, 74.3436],
  FAISALABAD:       [31.4154, 73.0789],
  GUJRANWALA:       [32.1877, 74.1945],
  CHINIOT:          [31.7309, 72.9781],
  MULTAN:           [30.1575, 71.5249],
  BAHAWALPUR:       [29.3956, 71.6836],
  LODHRAN:          [29.5333, 71.6333],
  OKARA:            [30.8107, 73.4450],
  "MAMU KANJAN":    [31.1333, 72.7667],
  SUMANDRI:         [31.0181, 72.8794],
  JARANWALA:        [31.3167, 73.4167],
  TANDLA:           [30.7081, 72.0060],
  "SANGLA HILL":    [31.7063, 73.3972],
  "LALA MOOSA":     [32.6956, 73.9583],
  JHANG:            [31.2697, 72.3167],
  DUNIYAPUR:        [29.7972, 71.8625],
  "KOT ADDU":       [30.4672, 70.9642],
  CHAKWAL:          [32.9332, 72.8535],
  /* KPK */
  PESHAWAR:         [34.0151, 71.5249],
  SWABI:            [34.1201, 72.4747],
  SWAT:             [35.2227, 72.4258],
  BARA:             [33.9814, 71.5478],
  /* Balochistan */
  QUETTA:           [30.1798, 66.9750],
  /* Sindh */
  KARACHI:          [24.863,  67.010],
  HYDERABAD:        [25.3960, 68.3578],
  HYD:              [25.3960, 68.3578],
  SUKKUR:           [27.7052, 68.8574],
  THATTA:           [24.7473, 67.9181],
  UMERKOT:          [25.3611, 69.7375],
  TMK:              [25.1336, 68.5365],  /* Tando Muhammad Khan */
  MORO:             [26.6651, 68.0004],
  GOTKI:            [27.9917, 69.3117],
  /* ICT */
  ISLAMABAD:        [33.7294, 73.0931],
  RAWALPINDI:       [33.6007, 73.0679],
};

/* ── Zone → city key ─────────────────────────────────────────────────── */
const ZONE_CITY_KEY = {
  "MADARIS FAIZAN E MUS MALE & FEM": "KHI",
  "KHI LOCATIONS":                   "KHI",
  "KARACHI RO PLANT":                "KHI",
  "KARACHI MEDICAL":                 "KHI",
  "KARACHI SMIT":                    "KHI",
  "KARACHI SWEET HOME":              "KHI",
  "KARACHI TEXTILE":                 "KHI",
  "GREENTIME EDUCATION":             "KHI",
  "BRANCH":                          "KHI",
  "SHED":                            "KHI",
  "HEAD OFFICE":                     "KHI",
  "SMIT":                            "KHI",
  "TEXTILE TRAINING CENTER":         "KHI",
  "PARCEL POINT":                    "KHI",
  "RO PLANT":                        "KHI",
  "Meal On Wheels":                  "KHI",
  "MADARIS THAR":                    "THAR",
  "HYD":                             "HYD",
  "ISB PINDI ZONEY":                 "ISB_PINDI",
  "GOTKI SMIT":                      "GOTKI",
  "CHAKWAL SCHOOL":                  "CHAKWAL",
  "FAISALABAD":                      "FAISALABAD",
  "LAHORE":                          "LAHORE",
  "MULTAN":                          "MULTAN",
  "QUETTA":                          "QUETTA",
  "PESHAWAR":                        "PESHAWAR",
  "CHINIOT":                         "CHINIOT",
  "SUKKUR":                          "SUKKUR",
  "BAHAWALPUR":                      "BAHAWALPUR",
  "GUJRANWALA":                      "GUJRANWALA",
  "OKARA":                           "OKARA",
  "LODHRAN":                         "LODHRAN",
  "JHANG (OUT STATION)":             "JHANG",
  "JARANWALA (OUTSTATION)":          "JARANWALA",
  "SUMANDRI":                        "SUMANDRI",
  "MAMU KANJAN":                     "MAMU KANJAN",
  "SANGLA HILL":                     "SANGLA HILL",
  "TANDLA":                          "TANDLA",
  "SWABI":                           "SWABI",
  "SWAT":                            "SWAT",
  "BARA":                            "BARA",
  "THATTA":                          "THATTA",
  "UMERKOT":                         "UMERKOT",
  "TMK":                             "TMK",
  "MORO":                            "MORO",
  "DUNIYAPUR":                       "DUNIYAPUR",
  "KOT ADDU":                        "KOT ADDU",
  "LALA MOOSA":                      "LALA MOOSA",
};

/* ── ISB/Pindi - decide per address ──────────────────────────────────── */
const PINDI_AREAS = [
  ["ISLAMABAD", 33.7294, 73.0931],
  ["G-9",       33.7170, 73.0620],
  ["G-10",      33.7050, 73.0450],
  ["G-11",      33.6920, 73.0300],
  ["F-10",      33.7100, 73.0180],
  ["F-7",       33.7280, 73.0460],
  ["F-6",       33.7340, 73.0560],
  ["RAWALPINDI", 33.6007, 73.0679],
  ["PINDI",      33.6007, 73.0679],
  ["ASGHAR MALL",33.5920, 73.0460],
  ["SADDAR",     33.5960, 73.0503],
  ["RAJA BAZAR", 33.6612, 73.0607],
];

function matchPindi(address) {
  const a = (address || "").toUpperCase();
  for (const [kw, lat, lng] of PINDI_AREAS) {
    if (a.includes(kw)) return [lat + jitter(0.005), lng + jitter(0.005)];
  }
  return [33.665 + jitter(0.030), 73.050 + jitter(0.030)];
}

/* ── Main ─────────────────────────────────────────────────────────────── */
function fixCoords(loc) {
  const zone = loc.z || "";
  const key  = ZONE_CITY_KEY[zone];

  if (key === "KHI") {
    const [lat, lng] = matchKarachi(loc.a);
    return { lat: Math.max(lat, 24.820), lng }; /* clamp above Karachi coast */
  }
  if (key === "THAR") {
    const [lat, lng] = matchThar(loc.a);
    return { lat, lng };
  }
  if (key === "ISB_PINDI") {
    const [lat, lng] = matchPindi(loc.a);
    return { lat, lng };
  }

  /* Look up city by key or zone name */
  const cityKey = key || zone.toUpperCase();
  const center  = CITY[cityKey] || CITY[zone] || null;
  if (center) {
    return {
      lat: center[0] + jitter(0.020),
      lng: center[1] + jitter(0.020),
    };
  }

  /* Unknown zone — keep original (probably already geocoded) */
  return null;
}

/* ── Run ─────────────────────────────────────────────────────────────── */
const raw       = fs.readFileSync(DATA, "utf-8").replace(/^﻿/, "");
const locations = JSON.parse(raw);

if (!fs.existsSync(BACKUP)) {
  fs.copyFileSync(DATA, BACKUP);
  console.log("Backup → data/locations.backup.json");
}

let fixed = 0, kept = 0;
locations.forEach(loc => {
  const result = fixCoords(loc);
  if (result) {
    loc.lat = parseFloat(result.lat.toFixed(5));
    loc.lng = parseFloat(result.lng.toFixed(5));
    fixed++;
  } else {
    kept++;
  }
});

fs.writeFileSync(DATA, JSON.stringify(locations, null, 2));

console.log(`✅ Done — fixed: ${fixed}, kept original: ${kept}`);
console.log("Saved → data/locations.json");

/* Quick sanity check */
const seaCheck = locations.filter(l =>
  ["KHI LOCATIONS","KARACHI RO PLANT","MADARIS FAIZAN E MUS MALE & FEM",
   "KARACHI MEDICAL","KARACHI SMIT","KHI"].includes(l.z) && l.lat < 24.80
);
console.log(`Sea check (Karachi lat < 24.80): ${seaCheck.length} (should be 0 or near 0)`);
