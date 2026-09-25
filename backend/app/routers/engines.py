from fastapi import APIRouter, HTTPException

from app.agents.graph import analyze_single_engine
from app.config import COHERE_API_KEY, OPENAI_API_KEY
from app.services import data_service

router = APIRouter(prefix="/api/engines", tags=["engines"])


@router.get("")
def list_engines():
    """All ~100 test engines with the cheap ML-only risk score."""
    return data_service.get_risk_scores()


@router.get("/{unit}")
def get_engine(unit: int):
    engines = {e["unit"]: e for e in data_service.get_risk_scores()}
    if unit not in engines:
        raise HTTPException(404, f"Engine {unit} not found")

    result = dict(engines[unit])
    shap = data_service.get_shap_explanations().get(unit)
    if shap:
        result["shap"] = shap

    agent_analysis = data_service.get_agent_analysis(unit)
    if agent_analysis:
        result["agent_analysis"] = agent_analysis

    return result


@router.get("/{unit}/sensors")
def get_engine_sensors(unit: int):
    series = data_service.get_engine_sensor_series(unit)
    if series is None:
        raise HTTPException(404, f"Sensor data for engine {unit} not found")
    return series


@router.post("/{unit}/analyze")
def analyze_engine(unit: int):
    """On-demand Synthesis -> Hypothesis -> Critique pipeline for any engine,
    not just the pre-flagged top 15 (e.g. a user wants a full literature
    cross-check on a mid-risk engine)."""
    if not OPENAI_API_KEY or not COHERE_API_KEY:
        raise HTTPException(
            503,
            "OPENAI_API_KEY and COHERE_API_KEY must be configured on the server to run deep analysis.",
        )

    engines = {e["unit"]: e for e in data_service.get_risk_scores()}
    if unit not in engines:
        raise HTTPException(404, f"Engine {unit} not found")

    shap = data_service.get_shap_explanations().get(unit)
    if not shap:
        raise HTTPException(404, f"No SHAP explanation for engine {unit} — run ml/explain_shap.py first.")

    if data_service.get_agent_analysis(unit):
        raise HTTPException(409, f"Engine {unit} has already been analyzed.")

    return analyze_single_engine(shap, include_critique=True)
