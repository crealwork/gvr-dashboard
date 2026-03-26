import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function KpiCard({ label, value, change }: { label: string; value: string; change?: number }) {
  return (
    <Card>
      <p className="text-sm text-neutral mb-1">{label}</p>
      <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      {change !== undefined && (
        <div className="mt-2">
          <Badge value={change} />
          <span className="text-xs text-neutral ml-1.5">YoY</span>
        </div>
      )}
    </Card>
  );
}
