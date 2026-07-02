from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.core.config import settings
from app.routers import auth, products, cart, orders

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FORGE Auto Parts API",
    description="Backend for the FORGE / TEILEZ autoparts storefront — auth, catalog, cart, checkout & delivery tracking.",
    version="1.0.0",
)

origins = [settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "forge-autoparts-api"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
