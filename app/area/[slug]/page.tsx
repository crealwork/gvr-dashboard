import { getAreas, getTimeSeries } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  computeMarketPhase,
  computeMomentum,
  computeRelativeValue,
  computeSupplyPressure,
} from "@/lib/insights";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MarketPhaseBadge } from "@/components/MarketPhase";
import { RelativeValueBar } from "@/components/RelativeValueBar";
import { PriceTrend } from "@/components/PriceTrend";
import Link from "next/link";

export function generateStaticParams() {
  const areas = getAreas();
  return areas.map((area) => ({ slug: area.slug }));
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const areas = getAreas();
  const area = areas.find((a) => a.slug === slug);

  if (!area) return <div>Area not found</div>;

  // Get time series for this area
  const composite = getTimeSeries(slug, "composite");
  const detached = getTimeSeries(slug, "detached");
  const townhome = getTimeSeries(slug, "townhome");
  const apartment = getTimeSeries(slug, "apartment");

  // Compute insights
  const phase = composite
    ? computeMarketPhase(composite.salesToListingsRatios)
    : "balanced";
  const momentum = composite
    ? computeMomentum(composite.salesToListingsRatios)
    : "stable";
  const relativeValue = composite
    ? computeRelativeValue(composite.benchmarkPrices)
    : 0.5;
  const supplyPressure =
    detached
      ? computeSupplyPressure(detached.sales, detached.newListings)
      : 1.0;

  // Latest benchmark price
  const latestPrice =
    composite?.benchmarkPrices.filter(Boolean).pop() ?? 0;
  const prevYearPrice =
    composite?.benchmarkPrices.filter(Boolean).slice(-13, -12)[0] ?? 0;
  const yoyChange = prevYearPrice
    ? ((latestPrice - prevYearPrice) / prevYearPrice) * 100
    : 0;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Back link + title */}
      <Link href="/" className="text-sm text-primary hover:underline">
        &larr; Back to Dashboard
      </Link>
      <div className="flex items-center gap-3 mt-4 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{area.name}</h1>
        <MarketPhaseBadge phase={phase} momentum={momentum} />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Benchmark Price */}
        <Card>
          <p className="text-sm text-neutral mb-1">Benchmark Price</p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatCurrency(latestPrice)}
          </p>
          <div className="mt-2">
            <Badge value={yoyChange} />
          </div>
        </Card>

        {/* Market Phase */}
        <Card>
          <p className="text-sm text-neutral mb-1">Market Phase</p>
          <div className="mt-2">
            <MarketPhaseBadge phase={phase} momentum={momentum} />
          </div>
        </Card>

        {/* Relative Value */}
        <Card>
          <p className="text-sm text-neutral mb-1">
            Relative Value (10yr range)
          </p>
          <div className="mt-2">
            <RelativeValueBar value={relativeValue} />
          </div>
        </Card>

        {/* Supply Pressure */}
        <Card>
          <p className="text-sm text-neutral mb-1">Supply Pressure</p>
          <p className="text-2xl font-semibold tabular-nums">
            {supplyPressure.toFixed(1)}x
          </p>
          <p className="text-xs text-neutral mt-1">
            {supplyPressure > 2
              ? "High supply"
              : supplyPressure < 1
                ? "Tight supply"
                : "Balanced"}
          </p>
        </Card>
      </div>

      {/* Price Trend Chart (filtered to this area) */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Price History</h2>
        <PriceTrend
          detached={detached}
          townhome={townhome}
          apartment={apartment}
        />
      </section>
    </main>
  );
}
