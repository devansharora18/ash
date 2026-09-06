from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .signaling import router as signaling_router

app = FastAPI(title="Ash signaling server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(signaling_router)
