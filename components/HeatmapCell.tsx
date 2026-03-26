"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { changeColor, changeTextColor } from "@/lib/colors";
import { formatPercent, formatCurrencyFull } from "@/lib/format";

export function HeatmapCell({
  value,
  areaName,
  areaSlug,
  benchmarkPrice,
  relativeValue,
}: {
  value: number | null;
  areaName: string;
  areaSlug: string;
  benchmarkPrice?: number;
  relativeValue?: number;
}) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);

  if (value === null) {
    return (
      <div className="h-10 flex items-center justify-center text-xs text-neutral bg-[#F9FAFB] rounded">
        --
      </div>
    );
  }

  const bg = changeColor(value);
  const textColor = changeTextColor(value);

  return (
    <div className="relative">
      <button
        className="w-full h-10 flex items-center justify-center text-xs font-medium tabular-nums rounded cursor-pointer transition-transform hover:scale-105"
        style={{ backgroundColor: bg, color: textColor }}
        onClick={() => router.push(`/area/${areaSlug}`)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {formatPercent(value)}
      </button>
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-surface rounded-card shadow-lg border border-border p-3 text-left pointer-events-none">
          <p className="text-sm font-medium text-[#111827] mb-1.5">{areaName}</p>
          {benchmarkPrice !== undefined && (
            <p className="text-xs text-neutral">
              Benchmark: <span className="text-[#111827] font-medium">{formatCurrencyFull(benchmarkPrice)}</span>
            </p>
          )}
          <p className="text-xs text-neutral mt-0.5">
            Change: <span className="font-medium" style={{ color: value >= 0 ? "#16A34A" : "#DC2626" }}>{formatPercent(value)}</span>
          </p>
          {relativeValue !== undefined && (
            <p className="text-xs text-neutral mt-0.5">
              Relative Value: <span className="text-[#111827] font-medium">{(relativeValue * 100).toFixed(0)}%</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
