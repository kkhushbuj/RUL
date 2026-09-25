"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";

import { api, EngineRisk } from "@/lib/api";
import { riskTier } from "@/components/dashboard/risk-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const tierClasses = {
  low: "bg-[var(--risk-low)]/25 hover:bg-[var(--risk-low)]/45 data-[deep=true]:ring-[var(--risk-low)]",
  medium:
    "bg-[var(--risk-medium)]/30 hover:bg-[var(--risk-medium)]/50 data-[deep=true]:ring-[var(--risk-medium)]",
  high: "bg-[var(--risk-high)]/35 hover:bg-[var(--risk-high)]/55 data-[deep=true]:ring-[var(--risk-high)]",
};

export function FleetGrid() {
  const { data: engines, isLoading } = useSWR("engines", api.engines);
  const router = useRouter();

  if (isLoading || !engines) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const byUnit = [...engines].sort((a, b) => a.unit - b.unit);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Fleet health at a glance</h2>
          <p className="text-xs text-muted-foreground">
            All 100 engines, ordered by unit ID · ring = flagged for deep AI analysis
          </p>
        </div>
        <Legend />
      </div>
      <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-20">
        {byUnit.map((engine) => (
          <GridCell key={engine.unit} engine={engine} onClick={() => router.push(`/engines/${engine.unit}`)} />
        ))}
      </div>
    </div>
  );
}

function GridCell({ engine, onClick }: { engine: EngineRisk; onClick: () => void }) {
  const tier = riskTier(engine.risk_score);
  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        data-deep={engine.deep_analysis}
        className={cn(
          "aspect-square w-full rounded-[4px] transition-all",
          "ring-1 ring-inset ring-transparent data-[deep=true]:ring-2",
          tierClasses[tier]
        )}
        aria-label={`Engine ${engine.unit}`}
      />
      <TooltipContent>
        <p className="font-medium">Engine {engine.unit}</p>
        <p className="text-xs text-muted-foreground">
          Predicted RUL {engine.predicted_RUL.toFixed(1)} · risk {engine.risk_score.toFixed(0)}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      {(["low", "medium", "high"] as const).map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-[2px]", tierClasses[t])} />
          {t}
        </span>
      ))}
    </div>
  );
}
