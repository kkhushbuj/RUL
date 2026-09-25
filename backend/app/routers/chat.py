"""Dashboard chat box: follow-up questions about a specific engine, grounded
in that engine's actual prediction/SHAP/agent-analysis data (no free-floating
LLM guesses)."""
import json

from fastapi import APIRouter, HTTPException
from openai import OpenAI
from pydantic import BaseModel

from app.config import OPENAI_API_KEY
from app.services import data_service

router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_PROMPT = """You are an assistant embedded in a predictive-maintenance \
dashboard for jet engine Remaining Useful Life (RUL) prediction. Answer the \
user's question using ONLY the engine data JSON provided in context — the \
LSTM's prediction, SHAP sensor attributions, and (if present) the literature \
synthesis/hypothesis/critique analysis. Be concise and specific to numbers in \
the data. If the data doesn't cover what's asked, say so rather than guessing."""


class ChatRequest(BaseModel):
    unit: int
    question: str


@router.post("")
def chat(req: ChatRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(503, "OPENAI_API_KEY is not configured on the server.")

    engines = {e["unit"]: e for e in data_service.get_risk_scores()}
    if req.unit not in engines:
        raise HTTPException(404, f"Engine {req.unit} not found")

    context = dict(engines[req.unit])
    shap = data_service.get_shap_explanations().get(req.unit)
    if shap:
        context["shap"] = shap
    agent_analysis = data_service.get_agent_analysis(req.unit)
    if agent_analysis:
        context["agent_analysis"] = agent_analysis

    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Engine data:\n{json.dumps(context, indent=2)}\n\nQuestion: {req.question}"},
        ],
    )

    return {"answer": response.choices[0].message.content}
