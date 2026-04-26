export interface Location {
  n: string;   // name
  c: string;   // raw category
  nc: string;  // normalized category
  a: string;   // address
  z: string;   // zone/city
  lat: number;
  lng: number;
}

export type Theme = "dark" | "light";

export const CAT_COLORS: Record<string, string> = {
  "Branch / Dastarkhwan": "#00C46E",
  "RO Plant":             "#3B8BFF",
  "Madrasah":             "#A78BFA",
  "School / Education":   "#FBBF24",
  "Medical":              "#F87171",
  "IT / Vocational":      "#22D3EE",
  "Shed":                 "#FB923C",
  "Food Distribution":    "#A3E635",
  "Sweet Home / Old Age": "#F472B6",
  "Other":                "#94A3B8",
};
