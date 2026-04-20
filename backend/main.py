from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scan, prices, admin
from scheduler import start_scheduler
from dotenv import load_dotenv
from services.sync import run_sync

load_dotenv()

app = FastAPI(
    title="Alescan API",
    description="SRP verification backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:4173",   # Vite preview
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router,   tags=["scan"])
app.include_router(prices.router, tags=["prices"])
app.include_router(admin.router,  prefix="/admin", tags=["admin"])

@app.on_event("startup")
def on_startup():
    start_scheduler()
    from services.vision import warmup
    warmup() 

@app.get("/health")
def health():
    return {"status": "ok", "project": "alescan"}