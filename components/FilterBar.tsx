"use client";

import { useQueryState, parseAsString } from "nuqs";
import { Toggle } from "@/components/ui/Toggle";
import { BENCHMARK_AREAS, PROPERTY_TYPES } from "@/lib/constants";

const ALL_PROPERTY_OPTIONS = ["all", ...PROPERTY_TYPES] as const;
type PropertyOption = (typeof ALL_PROPERTY_OPTIONS)[number];

const PROPERTY_LABELS: Record<PropertyOption, string> = {
  all: "All",
  detached: "Detached",
  townhome: "Townhome",
  apartment: "Apartment",
};

export function FilterBar() {
  const [area, setArea] = useQueryState("area", parseAsString.withDefault("greater-vancouver"));
  const [propertyType, setPropertyType] = useQueryState("type", parseAsString.withDefault("all"));

  return (
    <div className="sticky top-0 z-30 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-border py-3">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 flex-wrap">
        {/* Area dropdown */}
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="text-sm font-medium bg-surface border border-border rounded-lg px-3 py-2 text-[#111827] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
        >
          {BENCHMARK_AREAS.map((name) => {
            const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            return (
              <option key={slug} value={slug}>
                {name}
              </option>
            );
          })}
        </select>

        {/* Property type toggle */}
        <Toggle
          options={ALL_PROPERTY_OPTIONS}
          value={propertyType as PropertyOption}
          onChange={(v) => setPropertyType(v)}
          labels={PROPERTY_LABELS}
        />
      </div>
    </div>
  );
}
