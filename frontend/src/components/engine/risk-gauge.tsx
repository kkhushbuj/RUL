"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";

import { riskTier } from "@/components/dashboard/risk-badge";

const tierColor: Record<"low" | "medium" | "high", string> = {
  low: "var(--risk-low)",
  medium: "var(--risk-medium)",
  high: "var(--risk-high)",
};

export function RiskGauge({ score }: { score: number }) {
  const tier = riskTier(score);
  const data = [{ value: score, fill: tierColor[tier] }];

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <RadialBarChart
        width={112}
        height={112}
        cx={56}
        cy={56}
        innerRadius={40}
        outerRadius={54}
        barSize={10}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar dataKey="value" background={{ fill: "var(--muted)" }} cornerRadius={6} />
      </RadialBarChart>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-semibold tabular-nums">{score.toFixed(0)}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">risk</span>
      </div>
    </div>
  );
}
