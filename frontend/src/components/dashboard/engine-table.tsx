"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowUpDown, Search, Sparkles } from "lucide-react";

import { api, EngineRisk } from "@/lib/api";
import { RiskBadge, riskTier } from "@/components/dashboard/risk-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SortKey = "risk_rank" | "unit" | "predicted_RUL";

export function EngineTable() {
  const router = useRouter();
  const { data: engines, isLoading } = useSWR("engines", api.engines);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("risk_rank");
  const [onlyDeep, setOnlyDeep] = useState(false);

  const filtered = useMemo(() => {
    if (!engines) return [];
    let rows = engines;
    if (query.trim()) {
      rows = rows.filter((e) => String(e.unit).includes(query.trim()));
    }
    if (onlyDeep) {
      rows = rows.filter((e) => e.deep_analysis);
    }
    return [...rows].sort((a, b) => a[sortKey] - b[sortKey]);
  }, [engines, query, sortKey, onlyDeep]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by engine unit..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <button
          onClick={() => setOnlyDeep((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            onlyDeep
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Deep-analyzed only
        </button>
        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {engines?.length ?? 0} engines
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHead label="Rank" sortKey="risk_rank" active={sortKey} onSort={setSortKey} />
              <SortableHead label="Engine" sortKey="unit" active={sortKey} onSort={setSortKey} />
              <TableHead>Risk</TableHead>
              <SortableHead
                label="Predicted RUL"
                sortKey="predicted_RUL"
                active={sortKey}
                onSort={setSortKey}
              />
              <TableHead>True RUL</TableHead>
              <TableHead className="text-right">Analysis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading &&
              filtered.map((engine) => (
                <EngineRow key={engine.unit} engine={engine} onClick={() => router.push(`/engines/${engine.unit}`)} />
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SortableHead({
  label,
  sortKey,
  active,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  onSort: (k: SortKey) => void;
}) {
  return (
    <TableHead>
      <button
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide",
          active === sortKey ? "text-foreground" : "text-muted-foreground"
        )}
        onClick={() => onSort(sortKey)}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );
}

function EngineRow({ engine, onClick }: { engine: EngineRisk; onClick: () => void }) {
  const tier = riskTier(engine.risk_score);
  return (
    <TableRow className="cursor-pointer transition-colors hover:bg-muted/50" onClick={onClick}>
      <TableCell className="font-mono text-xs text-muted-foreground">#{engine.risk_rank}</TableCell>
      <TableCell className="font-medium">Engine {engine.unit}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                tier === "high" && "bg-[var(--risk-high)]",
                tier === "medium" && "bg-[var(--risk-medium)]",
                tier === "low" && "bg-[var(--risk-low)]"
              )}
              style={{ width: `${engine.risk_score}%` }}
            />
          </div>
          <RiskBadge score={engine.risk_score} />
        </div>
      </TableCell>
      <TableCell className="tabular-nums">{engine.predicted_RUL.toFixed(1)} cycles</TableCell>
      <TableCell className="tabular-nums text-muted-foreground">{engine.true_RUL.toFixed(0)} cycles</TableCell>
      <TableCell className="text-right">
        {engine.deep_analysis ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Deep AI
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">ML only</span>
        )}
      </TableCell>
    </TableRow>
  );
}
