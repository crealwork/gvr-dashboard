export const AREA_ACTIVITY_GROUP_MAP: Record<string, string> = {
  "Burnaby East": "Burnaby",
  "Burnaby North": "Burnaby",
  "Burnaby South": "Burnaby",
  "Maple Ridge": "Maple Ridge/Pitt Meadows",
  "Pitt Meadows": "Maple Ridge/Pitt Meadows",
  "Port Moody": "Port Moody/Belcarra",
  "Ladner": "Delta - South",
  "Tsawwassen": "Delta - South",
  "West Vancouver": "West Vancouver/Howe Sound",
  "Whistler": "Whistler/Pemberton",
};

// 21 benchmark areas (Lower Mainland excluded — it includes FVREB data)
export const BENCHMARK_AREAS = [
  "Greater Vancouver", "Bowen Island", "Burnaby East", "Burnaby North",
  "Burnaby South", "Coquitlam", "Ladner", "Maple Ridge", "New Westminster",
  "North Vancouver", "Pitt Meadows", "Port Coquitlam", "Port Moody",
  "Richmond", "Squamish", "Sunshine Coast", "Tsawwassen",
  "Vancouver East", "Vancouver West", "West Vancouver", "Whistler",
] as const;

export const PROPERTY_TYPES = ["detached", "townhome", "apartment"] as const;
export const CHANGE_PERIODS = ["1m", "3m", "6m", "1y", "3y", "5y", "10y"] as const;

export const COLOR_TOKENS = {
  background: "#FAFAFA",
  surface: "#FFFFFF",
  primary: "#4A7C6F",
  accent: "#D4915C",
  up: "#16A34A",
  down: "#DC2626",
  neutral: "#6B7280",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
} as const;

export function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
