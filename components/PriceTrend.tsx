"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Toggle } from "@/components/ui/Toggle";
import { TrendTooltip } from "@/components/TrendTooltip";
import { formatCurrency, formatCurrencyFull, formatPercent } from "@/lib/format";
import type { PropertyTimeSeries } from "@/lib/types";
import { COLOR_TOKENS } from "@/lib/constants";

type Metric = "price" | "index" | "ratio" | "supply";

const METRIC_OPTIONS = ["price", "index", "ratio", "supply"] as const;
const METRIC_LABELS: Record<Metric, string> = {
  price: "Benchmark Price",
  index: "Price Index",
  ratio: "Sales-to-Listings",
  supply: "Supply Pressure",
};

const LINE_COLORS = {
  detached: COLOR_TOKENS.primary,
  townhome: COLOR_TOKENS.accent,
  apartment: "#6366F1",
};

function buildChartData(
  detached: PropertyTimeSeries | null,
  townhome: PropertyTimeSeries | null,
  apartment: PropertyTimeSeries | null,
  metric: Metric
) {
  // Merge all dates
  const allDates = new Set<string>();
  [detached, townhome, apartment].forEach((ts) => {
    ts?.dates.forEach((d) => allDates.add(d));
  });

  const sortedDates = Array.from(allDates).sort();

  function getValue(ts: PropertyTimeSeries | null, date: string, metric: Metric): number | null {
    if (!ts) return null;
    const idx = ts.dates.indexOf(date);
    if (idx === -1) return null;
    switch (metric) {
      case "price":
        return ts.benchmarkPrices[idx];
      case "index":
        return ts.priceIndices[idx];
      case "ratio":
        return ts.salesToListingsRatios[idx];
      case "supply": {
        const sales = ts.sales[idx];
        const listings = ts.newListings[idx];
        if (sales === null || listings === null || sales === 0) return null;
        return listings / sales;
      }
    }
  }

  return sortedDates.map((date) => ({
    date,
    Detached: getValue(detached, date, metric),
    Townhome: getValue(townhome, date, metric),
    Apartment: getValue(apartment, date, metric),
  }));
}

function getValueFormatter(metric: Metric): (value: number) => string {
  switch (metric) {
    case "price":
      return formatCurrencyFull;
    case "index":
      return (v: number) => v.toFixed(1);
    case "ratio":
      return (v: number) => `${(v * 100).toFixed(1)}%`;
    case "supply":
      return (v: number) => v.toFixed(2);
  }
}

function getYAxisFormatter(metric: Metric): (value: number) => string {
  switch (metric) {
    case "price":
      return formatCurrency;
    case "index":
      return (v: number) => v.toFixed(0);
    case "ratio":
      return (v: number) => `${(v * 100).toFixed(0)}%`;
    case "supply":
      return (v: number) => v.toFixed(1);
  }
}

export function PriceTrend({
  detached,
  townhome,
  apartment,
}: {
  detached: PropertyTimeSeries | null;
  townhome: PropertyTimeSeries | null;
  apartment: PropertyTimeSeries | null;
}) {
  const [metric, setMetric] = useState<Metric>("price");

  const data = useMemo(
    () => buildChartData(detached, townhome, apartment, metric),
    [detached, townhome, apartment, metric]
  );

  const valueFormatter = getValueFormatter(metric);
  const yAxisFormatter = getYAxisFormatter(metric);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Price Trends</h2>
          <div className="flex items-center gap-4">
            {(["Detached", "Townhome", "Apartment"] as const).map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-0.5 rounded"
                  style={{ backgroundColor: LINE_COLORS[type.toLowerCase() as keyof typeof LINE_COLORS] }}
                />
                <span className="text-[11px] text-neutral">{type}</span>
              </div>
            ))}
          </div>
        </div>
        <Toggle
          options={METRIC_OPTIONS}
          value={metric}
          onChange={setMetric}
          labels={METRIC_LABELS}
        />
      </div>
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => d.slice(0, 4)}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={60}
            />
            <YAxis
              tickFormatter={yAxisFormatter}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              width={65}
            />
            <Tooltip
              content={<TrendTooltip valueFormatter={valueFormatter} />}
            />
            <Line
              type="monotone"
              dataKey="Detached"
              stroke={LINE_COLORS.detached}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="Townhome"
              stroke={LINE_COLORS.townhome}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="Apartment"
              stroke={LINE_COLORS.apartment}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
