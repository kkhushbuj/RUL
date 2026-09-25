"use client";

import useSWR from "swr";
import { Activity, AlertTriangle, Gauge, ShieldCheck } from "lucide-react";

import { api } from "@/lib/api";
import { StatCard } from "@/components/dashboard/stat-card";
import { EngineTable } from "@/components/dashboard/engine-table";
import { FleetGrid } from "@/components/dashboard/fleet-grid";
import { CalibrationChart } from "@/components/dashboard/calibration-chart";

export default function DashboardPage() {
  const { data: metrics } = useSWR("model-metrics", api.modelMetrics);
  const { data: summary } = useSWR("agent-summary", api.agentSummary);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <header className="mb-8 space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          Predictive Maintenance
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Turbofan Fleet — Remaining Useful Life
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          LSTM-based RUL prediction over the NASA C-MAPSS FD001 fleet (100 engines), explained with
          SHAP and cross-checked against published literature by a multi-agent research pipeline.
        </p>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Test RMSE"
          value={metrics ? metrics.test_rmse.toFixed(2) : "—"}
          hint="cycles, FD001 test set"
          icon={Gauge}
          accent="primary"
        />
        <StatCard
          label="NASA Score"
          value={metrics ? metrics.test_nasa_score.toFixed(0) : "—"}
          hint="asymmetric PHM08 metric"
          icon={Activity}
          accent="primary"
        />
        <StatCard
          label="Confirmed"
          value={summary?.confirmed != null ? String(summary.confirmed) : "—"}
          hint={`of ${summary?.total_engines_analyzed ?? 0} deep-analyzed engines`}
          icon={ShieldCheck}
          accent="low"
        />
        <StatCard
          label="Contradicted / Novel"
          value={
            summary?.contradicted != null && summary?.novel != null
              ? String(summary.contradicted + summary.novel)
              : "—"
          }
          hint={`${summary?.contradicted ?? 0} contradicted, ${summary?.novel ?? 0} novel`}
          icon={AlertTriangle}
          accent="high"
        />
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FleetGrid />
        </div>
        <div className="lg:col-span-2">
          <CalibrationChart />
        </div>
      </section>

      <EngineTable />
    </div>
  );
}
