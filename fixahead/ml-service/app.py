from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, HTTPException

from model_loader import FixAheadModelService
from schemas import PredictionRequest, PredictionResponse


model_service = FixAheadModelService(os.getenv("MODEL_PATH"))


@asynccontextmanager
async def lifespan(_: FastAPI):
    model_service.load()
    yield


app = FastAPI(
    title="FixAhead ML Inference Service",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health_check():
    return {
        "ok": True,
        "modelLoaded": model_service.model is not None,
        "modelPath": str(model_service.model_path),
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(payload: PredictionRequest):
    try:
        return model_service.predict(payload.model_dump())
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Prediction service failed to generate an output.",
        ) from error
