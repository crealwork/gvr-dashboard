"use client";

import type { MarketPhase } from "@/lib/types";

const PHASE_LABELS: Record<MarketPhase, string> = {
  buyer: "Buyer's Market",
  balanced: "Balanced",
  seller: "Seller's Market",
};

const PHASE_COLORS: Record<MarketPhase, string> = {
  buyer: "#DC2626",
  balanced: "#D4915C",
  seller: "#16A34A",
};

export function GaugeChart({
  ratio,
  phase,
}: {
  ratio: number;
  phase: MarketPhase;
}) {
  // Gauge spans from 0% to 40%+ S/A ratio
  // Three zones: red (<12%), amber (12-20%), green (>20%)
  const clampedRatio = Math.max(0, Math.min(40, ratio));
  const needleAngle = -90 + (clampedRatio / 40) * 180;

  const cx = 100;
  const cy = 90;
  const r = 70;

  // Arc helper: angle in degrees, 0 = top, going clockwise
  function polarToCart(angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(startDeg: number, endDeg: number) {
    const start = polarToCart(startDeg);
    const end = polarToCart(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  // Zones mapped to degrees: 0-40% ratio -> -90 to 90 degrees
  // <12% => -90 to (-90 + (12/40)*180) = -90 + 54 = -36
  // 12-20% => -36 to (-90 + (20/40)*180) = -90 + 90 = 0
  // >20% => 0 to 90

  const zone1End = -90 + (12 / 40) * 180; // -36
  const zone2End = -90 + (20 / 40) * 180; // 0

  // Needle
  const needleRad = ((needleAngle - 90) * Math.PI) / 180;
  const needleLen = r - 10;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-full max-w-[160px]">
        {/* Red zone: 0% - 12% */}
        <path
          d={arcPath(-90, zone1End)}
          fill="none"
          stroke="#FCA5A5"
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* Amber zone: 12% - 20% */}
        <path
          d={arcPath(zone1End, zone2End)}
          fill="none"
          stroke="#FCD34D"
          strokeWidth={14}
          strokeLinecap="butt"
        />
        {/* Green zone: 20%+ */}
        <path
          d={arcPath(zone2End, 90)}
          fill="none"
          stroke="#86EFAC"
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#111827"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={4} fill="#111827" />
      </svg>
      <p className="text-xl font-semibold tabular-nums mt-1">
        {ratio.toFixed(1)}%
      </p>
      <p
        className="text-xs font-medium mt-0.5"
        style={{ color: PHASE_COLORS[phase] }}
      >
        {PHASE_LABELS[phase]}
      </p>
    </div>
  );
}
