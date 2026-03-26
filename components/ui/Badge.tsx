import { formatPercent } from "@/lib/format";

export function Badge({ value }: { value: number }) {
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ${
      isPositive ? "bg-up/10 text-up" : "bg-down/10 text-down"
    }`}>
      {formatPercent(value)}
    </span>
  );
}
