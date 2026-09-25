import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { SynthesisVerdict } from "@/lib/api";
import { cn } from "@/lib/utils";

const config: Record<SynthesisVerdict, { icon: typeof CheckCircle2; classes: string; label: string }> = {
  Confirmed: {
    icon: CheckCircle2,
    classes: "bg-[color-mix(in_oklch,var(--risk-low)_16%,transparent)] text-[var(--risk-low)] border-[color-mix(in_oklch,var(--risk-low)_35%,transparent)]",
    label: "Confirmed by literature",
  },
  Contradicted: {
    icon: XCircle,
    classes: "bg-[color-mix(in_oklch,var(--risk-high)_16%,transparent)] text-[var(--risk-high)] border-[color-mix(in_oklch,var(--risk-high)_35%,transparent)]",
    label: "Contradicts literature",
  },
  Novel: {
    icon: HelpCircle,
    classes: "bg-[color-mix(in_oklch,var(--risk-medium)_18%,transparent)] text-[color-mix(in_oklch,var(--risk-medium)_75%,black)] border-[color-mix(in_oklch,var(--risk-medium)_40%,transparent)]",
    label: "Novel — no literature coverage",
  },
};

export function VerdictBadge({ verdict }: { verdict: SynthesisVerdict }) {
  const c = config[verdict];
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium", c.classes)}>
      <Icon className="h-4 w-4" />
      {c.label}
    </span>
  );
}
