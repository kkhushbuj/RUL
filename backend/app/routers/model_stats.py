from fastapi import APIRouter

from app.services import data_service

router = APIRouter(prefix="/api/model", tags=["model"])


@router.get("/metrics")
def get_model_metrics():
    """LSTM test RMSE / NASA score, for the report/write-up view."""
    return data_service.get_training_metrics()


@router.get("/knowledge-base")
def get_knowledge_base():
    return data_service.get_knowledge_base()


@router.get("/agent-summary")
def get_agent_summary():
    """Counts of Confirmed / Contradicted / Novel across deep-analyzed engines."""
    return data_service.get_agent_summary()
