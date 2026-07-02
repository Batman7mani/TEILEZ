from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.models import Product
from app.schemas.schemas import ProductOut, ProductListResponse

router = APIRouter(prefix="/api/products", tags=["products"])

VALID_CATS = {"bumpers", "brakes", "tires", "wraps", "decals"}


def to_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id, name=p.name, brand=p.brand, cat=p.cat, price=p.price,
        discount=p.discount or 0, final_price=p.final_price,
        description=p.description, stock=p.stock, rating=p.rating,
        rating_count=p.rating_count, img=p.img, images=p.images or [],
        spec=p.spec or {}, in_stock=p.stock > 0,
    )


@router.get("", response_model=ProductListResponse)
def list_products(
    cat: Optional[str] = Query(None, description="Filter by category: bumpers|brakes|tires|wraps|decals"),
    q: Optional[str] = Query(None, description="Search in name/brand/description"),
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = Query(None, description="price_asc|price_desc|rating|newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.is_active == True)  # noqa: E712

    if cat:
        query = query.filter(Product.cat == cat)
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Product.name.ilike(like), Product.brand.ilike(like), Product.description.ilike(like)))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "rating":
        query = query.order_by(Product.rating.desc())
    elif sort == "newest":
        query = query.order_by(Product.created_at.desc())
    else:
        query = query.order_by(Product.name.asc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return ProductListResponse(
        total=total, page=page, page_size=page_size,
        items=[to_out(p) for p in items],
    )


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Product.cat).filter(Product.is_active == True).distinct().all()  # noqa: E712
    return {"categories": sorted([r[0] for r in rows]) or sorted(VALID_CATS)}


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()  # noqa: E712
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return to_out(p)
