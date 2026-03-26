import { Suspense } from "react";
import { getYoYSummary, getTimeSeries, getLastUpdated, getLatestMonthlyAreas } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { FilterBar } from "@/components/FilterBar";
import { MarketPulse } from "@/components/MarketPulse";
import { PriceHeatmap } from "@/components/PriceHeatmap";
import { PriceTrend } from "@/components/PriceTrend";

export default function Home() {
  const { current, previous } = getYoYSummary();
  const lastUpdated = getLastUpdated();
  const areas = getLatestMonthlyAreas();

  // Default to Greater Vancouver for trend chart
  const defaultSlug = "greater-vancouver";
  const detached = getTimeSeries(defaultSlug, "detached");
  const townhome = getTimeSeries(defaultSlug, "townhome");
  const apartment = getTimeSeries(defaultSlug, "apartment");

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Vancouver Market Pulse</h1>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-neutral">10 years of real estate data, visualized</p>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Updated {formatDate(lastUpdated)}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <Suspense fallback={null}>
        <FilterBar />
      </Suspense>

      {/* Market Pulse KPIs */}
      <section className="mt-10">
        <MarketPulse summary={current} prevSummary={previous ?? undefined} />
      </section>

      {/* Price Heatmap */}
      <section className="mt-12">
        <PriceHeatmap areas={areas} />
      </section>

      {/* Price Trend */}
      <section className="mt-12">
        <PriceTrend detached={detached} townhome={townhome} apartment={apartment} />
      </section>
    </main>
  );
}
