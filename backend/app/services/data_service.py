"""Reads pre-computed ML/agent artifacts from disk for the API to serve.

All heavy computation (LSTM training, SHAP, agent pipeline) runs offline via
the ml/ scripts and backend/app/agents/graph.py; the API is a thin read layer
over their JSON/parquet outputs so the dashboard stays fast. These files are
small and rarely read (once per dashboard load), and they change every time
an offline pipeline reruns, so they are read fresh rather than cached in
process memory — a cache would otherwise keep serving stale/empty results
after a background pipeline finishes.
"""
import json

import pandas as pd

from app.config import AGENT_ANALYSIS_DIR, KNOWLEDGE_BASE_PATH, RESULTS_DIR

PROCESSED_DIR = RESULTS_DIR.parent.parent / "data" / "processed"


def _load_json(path):
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


def get_risk_scores():
    return _load_json(RESULTS_DIR / "risk_scores.json") or []


def get_shap_explanations():
    data = _load_json(RESULTS_DIR / "shap_explanations.json") or []
    return {e["unit"]: e for e in data}


def get_training_metrics():
    return _load_json(RESULTS_DIR / "training_metrics.json") or {}


def get_knowledge_base():
    return _load_json(KNOWLEDGE_BASE_PATH) or {}


def get_agent_analysis(unit: int):
    return _load_json(AGENT_ANALYSIS_DIR / f"engine_{unit}.json")


def get_agent_summary():
    return _load_json(AGENT_ANALYSIS_DIR / "_summary.json") or {}


def get_engine_sensor_series(unit: int):
    """Full sensor time series for one test engine, for charting."""
    path = PROCESSED_DIR / "test_FD001.parquet"
    if not path.exists():
        return None
    df = pd.read_parquet(path)
    engine_df = df[df["unit"] == unit].sort_values("cycle")
    if engine_df.empty:
        return None
    return engine_df.to_dict(orient="records")
