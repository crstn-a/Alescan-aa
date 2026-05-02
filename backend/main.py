from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scan, prices, admin
from middleware import AdminAuthMiddleware
from scheduler import start_scheduler
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Alescan API",
    description="SRP verification backend",
    version="1.0.0"
)

# ── Middleware (registration order = reverse execution order) ─────────

# 1. CORS — registered first, executes last (wraps everything).
#    Must handle OPTIONS preflight before AdminAuthMiddleware sees it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://alescan.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Admin auth — registered second, executes first.
#    Blocks /admin/* requests without a valid X-Admin-Secret header.
app.add_middleware(AdminAuthMiddleware)

# ── Routers ───────────────────────────────────────────────────────────
app.include_router(scan.router,   tags=["scan"])
app.include_router(prices.router, tags=["prices"])
app.include_router(admin.router,  prefix="/admin/api", tags=["admin"])

# ── Startup ───────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    start_scheduler()
    from services.vision import warmup
    warmup()

@app.get("/health")
def health():
    return {"status": "ok", "project": "alescan"}