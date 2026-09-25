"use client";

import useSWR from "swr";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { api } from "@/lib/api";
import { riskTier } from "@/components/dashboard/risk-badge";
import { Skeleton } from "@/components/ui/skeleton";

const tierColor: Record<"low" | "medium" | "high", string> = {
  low: "var(--risk-low)",
  medium: "var(--risk-medium)",
  high: "var(--risk-high)",
};

export function CalibrationChart() {
  const { data: engines, isLoading } = useSWR("engines", api.engines);

  if (isLoading || !engines) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  const maxRul = Math.max(...engines.map((e) => Math.max(e.true_RUL, e.predicted_RUL))) + 5;
  const byTier = { low: [], medium: [], high: [] } as Record<string, typeof engines>;
  for (const e of engines) byTier[riskTier(e.risk_score)].push(e);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-sm font-semibold">Predicted vs. true RUL</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Every test engine · points on the diagonal are perfect predictions
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="true_RUL"
            name="True RUL"
            domain={[0, maxRul]}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            label={{ value: "True RUL", position: "insideBottom", offset: -4, fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            type="number"
            dataKey="predicted_RUL"
            name="Predicted RUL"
            domain={[0, maxRul]}
            width={40}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <ZAxis range={[28, 28]} />
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: maxRul, y: maxRul },
            ]}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => [Number(value).toFixed(1), String(name)]}
            labelFormatter={() => ""}
          />
          {(["high", "medium", "low"] as const).map((tier) => (
            <Scatter key={tier} data={byTier[tier]} fill={tierColor[tier]} fillOpacity={0.75} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
