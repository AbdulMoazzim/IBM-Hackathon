from fastapi import FastAPI

from vibeguard.app.api.routes import router

app = FastAPI(
    title="VibeGuard Security Analysis API",
    version="0.1.0",
)
app.include_router(router)
