"use client";

export function RelativeValueBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  // value is 0 to 1, where 0 = 10-year low, 1 = 10-year high
  const clamped = Math.max(0, Math.min(1, value));
  const percent = clamped * 100;

  return (
    <div>
      {label && (
        <p className="text-sm text-neutral mb-2">{label}</p>
      )}
      <div className="relative h-3 rounded-full bg-gradient-to-r from-[#DC2626] via-[#D4915C] to-[#16A34A] overflow-visible">
        {/* Position dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-surface border-2 border-[#111827] shadow-md transition-all duration-300"
          style={{ left: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-neutral">10Y Low</span>
        <span className="text-xs font-medium tabular-nums text-[#111827]">
          {(clamped * 100).toFixed(0)}%
        </span>
        <span className="text-[10px] text-neutral">10Y High</span>
      </div>
    </div>
  );
}
