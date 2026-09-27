from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from vibeguard.app.api.routes import router

app = FastAPI(
    title="VibeGuard Security Analysis API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(router)
