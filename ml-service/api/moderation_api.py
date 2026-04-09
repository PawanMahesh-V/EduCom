from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from utils.preprocess import clean_text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = PROJECT_ROOT / "models"
LATEST_MODEL_INFO_PATH = MODELS_DIR / "latest_model.txt"

app = FastAPI(title="Moderation API", version="1.0.0")

_model = None

class ModerationRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


class ModerationResponse(BaseModel):
    toxic: bool
    confidence: float


@app.on_event("startup")
def load_artifacts() -> None:
    global _model

    if not LATEST_MODEL_INFO_PATH.exists():
        return
        
    latest_model_filename = LATEST_MODEL_INFO_PATH.read_text().strip()
    model_path = MODELS_DIR / latest_model_filename
    
    if model_path.exists():
        _model = joblib.load(model_path)


@app.get("/health")
def health() -> dict:
    ready = _model is not None
    return {"status": "ok", "model_loaded": ready}


@app.post("/moderate", response_model=ModerationResponse)
def moderate(payload: ModerationRequest) -> ModerationResponse:
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Train model first.")

    cleaned = clean_text(payload.text)

    if hasattr(_model, "predict_proba"):
        confidence = float(_model.predict_proba([cleaned])[0][1])
        # Use a higher threshold to avoid false positives on short generic words
        prediction = 1 if confidence >= 0.7 else 0
    else:
        prediction = int(_model.predict([cleaned])[0])
        confidence = float(prediction)

    return ModerationResponse(toxic=bool(prediction == 1), confidence=confidence)
