export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface EngineRisk {
  unit: number;
  true_RUL: number;
  predicted_RUL: number;
  error: number;
  risk_score: number;
  risk_rank: number;
  deep_analysis: boolean;
}

export interface ShapSensor {
  sensor: string;
  importance: number;
  direction: "increases_risk" | "decreases_risk";
  signed_contribution: number;
}

export interface ShapExplanation {
  unit: number;
  true_RUL: number;
  top_sensors: ShapSensor[];
  all_sensor_importance: Record<string, number>;
}

export type SynthesisVerdict = "Confirmed" | "Contradicted" | "Novel";

export interface SynthesisResult {
  verdict: SynthesisVerdict;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  matched_sources: string[];
}

export interface HypothesisResult {
  hypothesis: string;
  physical_reasoning: string;
  next_checks: string[];
  confidence: "high" | "medium" | "low";
}

export interface CritiqueResult {
  agrees_with_pipeline: boolean;
  critique: string;
  alternative_explanation: string | null;
  confidence: "high" | "medium" | "low";
}

export interface AgentAnalysis {
  unit: number;
  include_critique: boolean;
  synthesis_result: SynthesisResult | null;
  hypothesis_result: HypothesisResult | null;
  critique_result: CritiqueResult | null;
}

export interface EngineDetail extends EngineRisk {
  shap?: ShapExplanation;
  agent_analysis?: AgentAnalysis;
}

export interface SensorRow {
  unit: number;
  cycle: number;
  RUL: number;
  [sensor: string]: number;
}

export interface TrainingMetrics {
  subset: string;
  sequence_length: number;
  feature_columns: string[];
  test_rmse: number;
  test_nasa_score: number;
  n_train_engines: number;
  n_test_engines: number;
  history: { epoch: number; train_loss: number; val_loss: number }[];
}

export interface AgentSummary {
  total_engines_analyzed: number;
  confirmed: number;
  contradicted: number;
  novel: number;
  critiqued: number;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`${path} -> ${res.status}`);
  }
  return res.json();
}

export const api = {
  engines: () => getJSON<EngineRisk[]>("/api/engines"),
  engine: (unit: number) => getJSON<EngineDetail>(`/api/engines/${unit}`),
  engineSensors: (unit: number) => getJSON<SensorRow[]>(`/api/engines/${unit}/sensors`),
  modelMetrics: () => getJSON<TrainingMetrics>("/api/model/metrics"),
  knowledgeBase: () => getJSON<Record<string, unknown>>("/api/model/knowledge-base"),
  agentSummary: () => getJSON<AgentSummary>("/api/model/agent-summary"),
  analyzeEngine: async (unit: number) => {
    const res = await fetch(`${API_BASE}/api/engines/${unit}/analyze`, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? `analyze -> ${res.status}`);
    }
    return res.json() as Promise<AgentAnalysis>;
  },
  chat: async (unit: number, question: string) => {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unit, question }),
    });
    if (!res.ok) throw new Error(`chat -> ${res.status}`);
    return res.json() as Promise<{ answer: string }>;
  },
};
