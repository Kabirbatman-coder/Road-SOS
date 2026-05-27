from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from model_loader import model_service, risk_level
from schemas import PredictionRequest, PredictionResponse

app = FastAPI(title="Road SOS ML Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, bool | str]:
    return {
        "status": "ok",
        "modelLoaded": model_service.loaded,
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    if not model_service.loaded:
        raise HTTPException(status_code=503, detail=model_service.error or "Model is not loaded")

    try:
        feature_values = payload.features.model_dump()
        prediction, probability = model_service.predict(feature_values)
        return PredictionResponse(
            prediction=prediction,
            probability=max(0, min(1, probability)),
            riskLevel=risk_level(probability),
            modelUsed=True,
        )
    except Exception as exc:  # noqa: BLE001 - return useful API errors.
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
