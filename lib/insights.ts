import type { MarketPhase, PriceCyclePhase, Momentum } from "./types";

export function computeMarketPhase(ratios: (number | null)[]): MarketPhase {
  const recent = ratios.slice(-3).filter((r): r is number => r !== null);
  if (recent.length < 3) return "balanced";
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (avg < 40) return "buyer";
  if (avg > 70) return "seller";
  return "balanced";
}

export function computeMomentum(ratios: (number | null)[]): Momentum {
  const recent = ratios.filter((r): r is number => r !== null);
  if (recent.length < 6) return "stable";
  const current = recent[recent.length - 1];
  const avg3mo = recent.slice(-4, -1).reduce((a, b) => a + b, 0) / 3;
  if (avg3mo === 0) return "stable";
  const momentum = (current - avg3mo) / avg3mo;
  if (momentum > 0.05) return "heating";
  if (momentum < -0.05) return "cooling";
  return "stable";
}

export function computePriceCyclePhase(indices: (number | null)[]): PriceCyclePhase {
  const recent = indices.filter((v): v is number => v !== null);
  if (recent.length < 5) return "bottoming";
  const smooth = (i: number) => (recent[i] + recent[i - 1] + recent[i - 2]) / 3;
  const n = recent.length;
  const current = smooth(n - 1);
  const prev = smooth(n - 2);
  const prevPrev = smooth(n - 3);
  const change = current - prev;
  const prevChange = prev - prevPrev;
  const acceleration = change - prevChange;
  if (change > 0 && acceleration > 0) return "accelerating";
  if (change > 0 && acceleration <= 0) return "decelerating";
  if (change <= 0 && acceleration < 0) return "correcting";
  return "bottoming";
}

export function computeRelativeValue(prices: (number | null)[]): number {
  const valid = prices.filter((p): p is number => p !== null);
  if (valid.length < 2) return 0.5;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const current = valid[valid.length - 1];
  if (max === min) return 0.5;
  return (current - min) / (max - min);
}

export function computeSupplyPressure(
  sales: (number | null)[],
  newListings: (number | null)[]
): number {
  const lastSale = [...sales].reverse().find((s): s is number => s !== null);
  const lastListing = [...newListings].reverse().find((l): l is number => l !== null);
  if (!lastSale || lastSale === 0 || !lastListing) return 1.0;
  return lastListing / lastSale;
}
