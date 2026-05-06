import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import forklifts, incidents

app = FastAPI(
    title="Справочник погрузчиков",
    description="API для управления справочником погрузчиков и учёта простоев",
    version="1.0.0",
)

# Allow all origins so that Vercel frontend can reach this backend.
# Narrow down to a specific origin in production if needed via ALLOWED_ORIGINS env var.
_raw = os.environ.get("ALLOWED_ORIGINS", "*")
allow_origins = [o.strip() for o in _raw.split(",")] if _raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forklifts.router)
app.include_router(incidents.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
