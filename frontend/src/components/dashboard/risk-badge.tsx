import { cn } from "@/lib/utils";

export function riskTier(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const tierStyles = {
  low: "bg-[color-mix(in_oklch,var(--risk-low)_18%,transparent)] text-[var(--risk-low)] border-[color-mix(in_oklch,var(--risk-low)_35%,transparent)]",
  medium:
    "bg-[color-mix(in_oklch,var(--risk-medium)_20%,transparent)] text-[color-mix(in_oklch,var(--risk-medium)_75%,black)] border-[color-mix(in_oklch,var(--risk-medium)_40%,transparent)]",
  high: "bg-[color-mix(in_oklch,var(--risk-high)_18%,transparent)] text-[var(--risk-high)] border-[color-mix(in_oklch,var(--risk-high)_35%,transparent)]",
};

const tierLabels = { low: "Low risk", medium: "Medium risk", high: "High risk" };

export function RiskBadge({ score }: { score: number }) {
  const tier = riskTier(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tierStyles[tier]
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tier === "high" && "bg-[var(--risk-high)]",
          tier === "medium" && "bg-[var(--risk-medium)]",
          tier === "low" && "bg-[var(--risk-low)]"
        )}
      />
      {tierLabels[tier]}
    </span>
  );
}
