"use client";

export function Toggle<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  labels?: Record<T, string>;
}) {
  return (
    <div className="inline-flex bg-[#F3F4F6] rounded-lg p-1 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            value === opt
              ? "bg-surface text-primary shadow-sm"
              : "text-neutral hover:text-[#111827]"
          }`}
        >
          {labels?.[opt] ?? opt.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
