"use client";

import { useState, useMemo } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { HeatmapCell } from "@/components/HeatmapCell";
import { BENCHMARK_AREAS, CHANGE_PERIODS, PROPERTY_TYPES } from "@/lib/constants";
import type { AreaData, ChangePeriod } from "@/lib/types";

type SortConfig = {
  column: (typeof PROPERTY_TYPES)[number] | null;
  direction: "asc" | "desc";
};

const PERIOD_LABELS: Record<ChangePeriod, string> = {
  "1m": "1M",
  "3m": "3M",
  "6m": "6M",
  "1y": "1Y",
  "3y": "3Y",
  "5y": "5Y",
};

const TYPE_LABELS: Record<(typeof PROPERTY_TYPES)[number], string> = {
  detached: "Detached",
  townhome: "Townhome",
  apartment: "Apartment",
};

export function PriceHeatmap({ areas }: { areas: AreaData[] }) {
  const [period, setPeriod] = useState<ChangePeriod>("1y");
  const [sort, setSort] = useState<SortConfig>({ column: null, direction: "desc" });

  const filteredAreas = useMemo(() => {
    return areas.filter((a) =>
      (BENCHMARK_AREAS as readonly string[]).includes(a.name)
    );
  }, [areas]);

  const sortedAreas = useMemo(() => {
    const list = [...filteredAreas];
    if (sort.column) {
      const col = sort.column;
      list.sort((a, b) => {
        const av = a.types[col]?.change[period] ?? null;
        const bv = b.types[col]?.change[period] ?? null;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return sort.direction === "asc" ? av - bv : bv - av;
      });
    }
    return list;
  }, [filteredAreas, sort, period]);

  function handleSort(col: (typeof PROPERTY_TYPES)[number]) {
    setSort((prev) =>
      prev.column === col
        ? { column: col, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column: col, direction: "desc" }
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Price Change Heatmap</h2>
        <Toggle
          options={CHANGE_PERIODS}
          value={period}
          onChange={setPeriod}
          labels={PERIOD_LABELS}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-neutral pr-3 py-2 sticky left-0 bg-[#FAFAFA] z-10 min-w-[140px]">
                Area
              </th>
              {PROPERTY_TYPES.map((type) => (
                <th key={type} className="px-1 py-2 min-w-[100px]">
                  <button
                    onClick={() => handleSort(type)}
                    className="text-xs font-medium text-neutral hover:text-[#111827] transition-colors flex items-center gap-1 mx-auto"
                  >
                    {TYPE_LABELS[type]}
                    {sort.column === type && (
                      <span className="text-[10px]">
                        {sort.direction === "asc" ? "\u25B2" : "\u25BC"}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedAreas.map((area) => (
              <tr key={area.slug} className="group">
                <td className="text-sm pr-3 py-1 sticky left-0 bg-[#FAFAFA] z-10 whitespace-nowrap group-hover:text-primary transition-colors">
                  {area.name}
                </td>
                {PROPERTY_TYPES.map((type) => {
                  const priceData = area.types[type];
                  return (
                    <td key={type} className="px-1 py-1">
                      <HeatmapCell
                        value={priceData?.change[period] ?? null}
                        areaName={area.name}
                        areaSlug={area.slug}
                        benchmarkPrice={priceData?.benchmarkPrice}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
