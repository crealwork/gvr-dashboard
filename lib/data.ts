import indexData from "@/data/gvr/index.json";
import type { IndexData, AreaMeta, PropertyTimeSeries, Summary } from "./types";

const data = indexData as unknown as IndexData;

export function getIndexData(): IndexData {
  return data;
}

export function getAreas(): AreaMeta[] {
  return data.areas;
}

export function getTimeSeries(areaSlug: string, propertyType: string): PropertyTimeSeries | null {
  return data.timeSeries[areaSlug]?.[propertyType] ?? null;
}

export function getLastUpdated(): string {
  return data.lastUpdated;
}

export function getLatestSummary(): Summary {
  return data.summaries[data.lastUpdated];
}

export function getSummaryForDate(date: string): Summary | null {
  return data.summaries[date] ?? null;
}

export function getYoYSummary(): { current: Summary; previous: Summary | null } {
  const current = getLatestSummary();
  const [y, m] = data.lastUpdated.split("-").map(Number);
  const prevDate = `${y - 1}-${String(m).padStart(2, "0")}`;
  return { current, previous: getSummaryForDate(prevDate) };
}
