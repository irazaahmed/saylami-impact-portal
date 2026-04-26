import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "locations.json");
  const raw = readFileSync(filePath, "utf-8").replace(/^﻿/, ""); // strip BOM
  const data = JSON.parse(raw);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
