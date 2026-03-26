// Monthly report (one per PDF)
export interface MonthlyReport {
  date: string;
  board: "gvr" | "fvreb";
  summary: Summary;
  areas: AreaData[];
}

export interface Summary {
  totalSales: number;
  newListings: number;
  activeListings: number;
  salesToActiveRatio: number;
  compositeBenchmarkPrice: number;
  headline: string;
}

export interface AreaData {
  name: string;
  slug: string;
  activityGroup: string;
  types: {
    composite: PriceData | null;
    detached: PriceData | null;
    townhome: PriceData | null;
    apartment: PriceData | null;
  };
  activity: {
    detached: ActivityData | null;
    townhome: ActivityData | null;
    apartment: ActivityData | null;
  };
}

export interface PriceData {
  benchmarkPrice: number;
  priceIndex: number;
  change: {
    "1m": number;
    "3m": number;
    "6m": number;
    "1y": number;
    "3y": number;
    "5y": number;
    "10y": number;
  };
}

export interface ActivityData {
  sales: number;
  newListings: number;
  salesToListingsRatio: number;
  medianSellingPrice: number;
}

// Aggregated time series (index.json)
export interface IndexData {
  board: "gvr" | "fvreb";
  lastUpdated: string;
  areas: AreaMeta[];
  summaries: Record<string, Summary>;
  timeSeries: Record<string, AreaTimeSeries>;
}

export interface AreaMeta {
  name: string;
  slug: string;
  activityGroup: string;
}

export interface AreaTimeSeries {
  [propertyType: string]: PropertyTimeSeries;
}

export interface PropertyTimeSeries {
  dates: string[];
  benchmarkPrices: (number | null)[];
  priceIndices: (number | null)[];
  sales: (number | null)[];
  newListings: (number | null)[];
  salesToListingsRatios: (number | null)[];
  medianSellingPrices: (number | null)[];
}

// Computed insights
export type MarketPhase = "buyer" | "balanced" | "seller";
export type PriceCyclePhase = "accelerating" | "decelerating" | "correcting" | "bottoming";
export type Momentum = "heating" | "cooling" | "stable";
export type ChangePeriod = "1m" | "3m" | "6m" | "1y" | "3y" | "5y";
export type PropertyType = "composite" | "detached" | "townhome" | "apartment";
