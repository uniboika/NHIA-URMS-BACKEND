import React from "react";

export type MetricCardItem = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "bad";
  onClick?: () => void;
  active?: boolean;
};

const TONE = {
  default: "border-slate-200 bg-white text-slate-900",
  ok: "border-[#25a872]/30 bg-[#e8f5ee] text-[#0f3d2e]",
  warn: "border-amber-300 bg-amber-50 text-amber-950",
  bad: "border-rose-200 bg-rose-50 text-rose-800",
};

export default function MetricCards({ items }: { items: MetricCardItem[] }) {
  const cols =
    items.length >= 6
      ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
      : "grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid ${cols} gap-3`}>
      {items.map((item) => {
        const clickable = typeof item.onClick === "function";
        const className = [
          "rounded-lg border px-4 py-3 text-left",
          TONE[item.tone || "default"],
          clickable ? "cursor-pointer hover:shadow-sm transition-shadow" : "",
          item.active ? "ring-2 ring-[#145c3f] ring-offset-1" : "",
        ].join(" ");

        const body = (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{item.value}</p>
            {item.hint ? <p className="mt-0.5 text-[11px] font-medium text-slate-500">{item.hint}</p> : null}
          </>
        );

        if (clickable) {
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={className}
            >
              {body}
            </button>
          );
        }

        return (
          <div key={item.label} className={className}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
