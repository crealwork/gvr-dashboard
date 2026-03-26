import type { Summary, MarketPhase } from "@/lib/types";
import { formatCurrencyFull, formatNumber } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { Card } from "@/components/ui/Card";
import { GaugeChart } from "@/components/GaugeChart";
import { computeMarketPhase } from "@/lib/insights";

function yoyChange(current: number, previous: number | undefined): number | undefined {
  if (previous === undefined || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

export function MarketPulse({
  summary,
  prevSummary,
}: {
  summary: Summary;
  prevSummary?: Summary;
}) {
  const phase: MarketPhase =
    summary.salesToActiveRatio < 12
      ? "buyer"
      : summary.salesToActiveRatio > 20
        ? "seller"
        : "balanced";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard
        label="Total Sales"
        value={formatNumber(summary.totalSales)}
        change={yoyChange(summary.totalSales, prevSummary?.totalSales)}
      />
      <KpiCard
        label="New Listings"
        value={formatNumber(summary.newListings)}
        change={yoyChange(summary.newListings, prevSummary?.newListings)}
      />
      <KpiCard
        label="Active Listings"
        value={formatNumber(summary.activeListings)}
        change={yoyChange(summary.activeListings, prevSummary?.activeListings)}
      />
      <KpiCard
        label="Benchmark Price"
        value={formatCurrencyFull(summary.compositeBenchmarkPrice)}
        change={yoyChange(
          summary.compositeBenchmarkPrice,
          prevSummary?.compositeBenchmarkPrice
        )}
      />
      <Card className="flex flex-col items-center justify-center col-span-2 md:col-span-1">
        <p className="text-sm text-neutral mb-2">Market Temperature</p>
        <GaugeChart ratio={summary.salesToActiveRatio} phase={phase} />
      </Card>
    </div>
  );
}
