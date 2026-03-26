"use client";

import { formatCurrencyFull, formatDate } from "@/lib/format";
import { COLOR_TOKENS } from "@/lib/constants";

interface TrendTooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: TrendTooltipPayload[];
  label?: string;
  valueFormatter?: (value: number) => string;
}

export function TrendTooltip({
  active,
  payload,
  label,
  valueFormatter = formatCurrencyFull,
}: TrendTooltipProps) {
  if (!active || !payload?.length || !label) return null;

  return (
    <div
      className="bg-surface rounded-card shadow-lg border border-border px-4 py-3 min-w-[180px]"
      style={{ pointerEvents: "none" }}
    >
      <p className="text-xs text-neutral mb-2 font-medium">{formatDate(label)}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-neutral">{entry.name}</span>
            </div>
            <span className="text-xs font-medium tabular-nums text-[#111827]">
              {valueFormatter(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
