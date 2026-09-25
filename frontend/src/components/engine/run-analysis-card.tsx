"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BrainCircuit, Loader2, Sparkles } from "lucide-react";

import { api, EngineDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KeyedMutator } from "swr";

const STAGES = [
  "Comparing SHAP attribution against the literature knowledge base...",
  "Running independent critique review...",
  "Finalizing verdict...",
];

export function RunAnalysisCard({
  engine,
  mutate,
}: {
  engine: EngineDetail;
  mutate: KeyedMutator<EngineDetail>;
}) {
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0);

  async function run() {
    setRunning(true);
    setStage(0);
    const interval = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 4000);
    try {
      const analysis = await api.analyzeEngine(engine.unit);
      await mutate({ ...engine, agent_analysis: analysis }, { revalidate: false });
      toast.success(`Deep analysis complete — verdict: ${analysis.synthesis_result?.verdict}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deep analysis failed.");
    } finally {
      clearInterval(interval);
      setRunning(false);
    }
  }

  if (running) {
    return (
      <Card className="border-dashed border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Running Synthesis → Hypothesis → Critique…</p>
            <p className="mt-1 text-xs text-muted-foreground">{STAGES[stage]}</p>
          </div>
          <p className="text-xs text-muted-foreground">Usually takes 15–30 seconds.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-border">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BrainCircuit className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium">No deep analysis yet</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            {engine.deep_analysis
              ? "This engine is flagged as high-risk but hasn't been analyzed yet."
              : "This engine wasn't in the top 15 highest-risk engines, so it only got the cheap ML-only risk score. You can still run the full literature cross-check on demand."}
          </p>
        </div>
        <Button onClick={run} size="sm" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Run deep analysis
        </Button>
      </CardContent>
    </Card>
  );
}
