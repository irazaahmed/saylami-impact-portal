import { readFileSync } from "fs";
import path from "path";
import MapClient from "@/components/MapClient";
import type { Location } from "@/types";

// Server Component — reads data at request time, no client fetch needed
export default function Home() {
  const raw = readFileSync(
    path.join(process.cwd(), "data", "locations.json"),
    "utf-8"
  ).replace(/^﻿/, ""); // strip BOM

  const locations: Location[] = JSON.parse(raw);

  return <MapClient locations={locations} />;
}
