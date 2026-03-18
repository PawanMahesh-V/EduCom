from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from utils.preprocess import clean_text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "models" / "moderation_model.pkl"
VECTORIZER_PATH = PROJECT_ROOT / "models" / "vectorizer.pkl"

app = FastAPI(title="Moderation API", version="1.0.0")

_model = None
_vectorizer = None


class ModerationRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


class ModerationResponse(BaseModel):
    toxic: bool
    confidence: float


@app.on_event("startup")
def load_artifacts() -> None:
    global _model, _vectorizer

    if not MODEL_PATH.exists() or not VECTORIZER_PATH.exists():
        return

    _model = joblib.load(MODEL_PATH)
    _vectorizer = joblib.load(VECTORIZER_PATH)


@app.get("/health")
def health() -> dict:
    ready = _model is not None and _vectorizer is not None
    return {"status": "ok", "model_loaded": ready}


@app.post("/moderate", response_model=ModerationResponse)
def moderate(payload: ModerationRequest) -> ModerationResponse:
    if _model is None or _vectorizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Train model first.")

    cleaned = clean_text(payload.text)
    features = _vectorizer.transform([cleaned])

    prediction = int(_model.predict(features)[0])

    if hasattr(_model, "predict_proba"):
        confidence = float(_model.predict_proba(features)[0][1])
    else:
        confidence = float(prediction)

    return ModerationResponse(toxic=bool(prediction == 1), confidence=confidence)
