"""
BeltGuard AI — ML Prediction Service
FastAPI service providing belt health predictions.

In production, replace the rule-based model with trained scikit-learn / PyTorch models.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

from routers import predict, health, chat

load_dotenv()

app = FastAPI(
    title="BeltGuard AI — ML Service",
    version="1.0.0",
    description="Predictive intelligence for conveyor belt monitoring",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*", "ngrok-skip-browser-warning"],
)

# Bypass ngrok browser warning interstitial on every response
@app.middleware("http")
async def add_ngrok_header(request, call_next):
    response = await call_next(request)
    response.headers["ngrok-skip-browser-warning"] = "true"
    return response

app.include_router(predict.router)
app.include_router(health.router)
app.include_router(chat.router)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("ML_PORT", "8001")),
        reload=True,
    )
