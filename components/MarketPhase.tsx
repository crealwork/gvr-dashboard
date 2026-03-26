import type { MarketPhase as MarketPhaseType, Momentum } from "@/lib/types";

const PHASE_CONFIG: Record<MarketPhaseType, { label: string; bg: string; text: string }> = {
  buyer: { label: "Buyer's Market", bg: "bg-down/10", text: "text-down" },
  balanced: { label: "Balanced", bg: "bg-[#D4915C]/10", text: "text-accent" },
  seller: { label: "Seller's Market", bg: "bg-up/10", text: "text-up" },
};

const MOMENTUM_ARROWS: Record<Momentum, string> = {
  heating: "\u2191",
  cooling: "\u2193",
  stable: "\u2192",
};

export function MarketPhaseBadge({
  phase,
  momentum,
}: {
  phase: MarketPhaseType;
  momentum?: Momentum;
}) {
  const config = PHASE_CONFIG[phase];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
      {momentum && (
        <span className="text-sm leading-none">{MOMENTUM_ARROWS[momentum]}</span>
      )}
    </span>
  );
}
