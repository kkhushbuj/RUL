"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useState } from "react";
import { ArrowLeft, Gauge, Sparkles, TrendingDown } from "lucide-react";

import { api } from "@/lib/api";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { RiskGauge } from "@/components/engine/risk-gauge";
import { ShapChart } from "@/components/engine/shap-chart";
import { SensorTrendChart } from "@/components/engine/sensor-trend-chart";
import { AgentAnalysisPanel } from "@/components/engine/agent-analysis-panel";
import { RunAnalysisCard } from "@/components/engine/run-analysis-card";
import { ChatPanel } from "@/components/engine/chat-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EngineDetailPage() {
  const params = useParams<{ unit: string }>();
  const unit = Number(params.unit);
  const router = useRouter();

  const { data: engine, isLoading, mutate } = useSWR(["engine", unit], () => api.engine(unit));
  const { data: sensorRows } = useSWR(["engine-sensors", unit], () => api.engineSensors(unit));

  const topSensors = engine?.shap?.top_sensors.map((s) => s.sensor) ?? [];
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const activeSensor = selectedSensor ?? topSensors[0];

  if (isLoading || !engine) {
    return (
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <button
        onClick={() => router.push("/")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to fleet overview
      </button>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Engine {engine.unit}</h1>
            <RiskBadge score={engine.risk_score} />
            {engine.deep_analysis && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" /> Deep AI analysis
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Risk rank #{engine.risk_rank} of 100 test engines · FD001
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Predicted RUL</p>
              <p className="flex items-center gap-1 text-xl font-semibold tabular-nums">
                <Gauge className="h-4 w-4 text-primary" /> {engine.predicted_RUL.toFixed(1)} cycles
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">True RUL</p>
              <p className="flex items-center gap-1 text-xl font-semibold tabular-nums text-muted-foreground">
                <TrendingDown className="h-4 w-4" /> {engine.true_RUL.toFixed(0)} cycles
              </p>
            </div>
          </div>
          <RiskGauge score={engine.risk_score} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Which sensors drove this prediction</CardTitle>
              <p className="text-sm text-muted-foreground">
                SHAP attribution — bars pushing right increase predicted risk (lower RUL), bars
                pushing left decrease it.
              </p>
            </CardHeader>
            <CardContent>
              {engine.shap ? (
                <ShapChart sensors={engine.shap.top_sensors} />
              ) : (
                <p className="text-sm text-muted-foreground">No SHAP data for this engine.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Sensor trend over engine life</CardTitle>
              {topSensors.length > 0 && (
                <Select value={activeSensor} onValueChange={setSelectedSensor}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topSensors.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("sensor_", "Sensor ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardHeader>
            <CardContent>
              {sensorRows && activeSensor ? (
                <SensorTrendChart rows={sensorRows} sensor={activeSensor} />
              ) : (
                <Skeleton className="h-56 w-full" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          {engine.agent_analysis ? (
            <AgentAnalysisPanel analysis={engine.agent_analysis} />
          ) : (
            <RunAnalysisCard engine={engine} mutate={mutate} />
          )}

          <div className="min-h-[22rem] flex-1">
            <ChatPanel unit={engine.unit} />
          </div>
        </div>
      </div>
    </div>
  );
}
