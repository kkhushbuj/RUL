"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ShapSensor } from "@/lib/api";

export function ShapChart({ sensors }: { sensors: ShapSensor[] }) {
  const data = [...sensors]
    .sort((a, b) => a.importance - b.importance)
    .map((s) => ({
      name: s.sensor.replace("sensor_", "S"),
      value: s.signed_contribution,
      direction: s.direction,
    }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <YAxis
          type="category"
          dataKey="name"
          width={40}
          tick={{ fontSize: 12, fill: "var(--foreground)" }}
        />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value, _name, item) => [
            Number(value).toFixed(2),
            item.payload.direction === "increases_risk" ? "Pushes RUL down (higher risk)" : "Pushes RUL up (lower risk)",
          ]}
        />
        <Bar dataKey="value" radius={[4, 4, 4, 4]}>
          <LabelList dataKey="name" position="insideLeft" style={{ display: "none" }} />
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.direction === "increases_risk" ? "var(--risk-high)" : "var(--risk-low)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
