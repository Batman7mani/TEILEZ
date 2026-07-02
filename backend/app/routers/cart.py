from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, CartItem, Product
from app.schemas.schemas import CartItemIn, CartItemUpdate, CartOut, CartItemOut

router = APIRouter(prefix="/api/cart", tags=["cart"])


def _build_cart_out(db: Session, user_id: int) -> CartOut:
    rows = (
        db.query(CartItem, Product)
        .join(Product, Product.id == CartItem.product_id)
        .filter(CartItem.user_id == user_id)
        .all()
    )
    items = []
    subtotal = 0.0
    count = 0
    for ci, p in rows:
        unit_price = p.final_price
        line_total = round(unit_price * ci.qty, 2)
        subtotal += line_total
        count += ci.qty
        items.append(CartItemOut(
            product_id=p.id, variant=ci.variant or "default", qty=ci.qty,
            name=p.name, img=p.img, unit_price=unit_price, line_total=line_total,
            stock=p.stock,
        ))
    return CartOut(items=items, subtotal=round(subtotal, 2), count=count)


@router.get("", response_model=CartOut)
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _build_cart_out(db, current_user.id)


@router.post("", response_model=CartOut, status_code=201)
def add_to_cart(
    payload: CartItemIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == payload.product_id, Product.is_active == True).first()  # noqa: E712
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < payload.qty:
        raise HTTPException(status_code=400, detail=f"Only {product.stock} units in stock")

    variant = payload.variant or "default"
    existing = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id, CartItem.product_id == payload.product_id, CartItem.variant == variant)
        .first()
    )
    if existing:
        existing.qty += payload.qty
    else:
        existing = CartItem(user_id=current_user.id, product_id=payload.product_id, variant=variant, qty=payload.qty)
        db.add(existing)

    db.commit()
    return _build_cart_out(db, current_user.id)


@router.put("/{product_id}", response_model=CartOut)
def update_cart_item(
    product_id: str,
    payload: CartItemUpdate,
    variant: str = "default",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id, CartItem.product_id == product_id, CartItem.variant == variant)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if payload.qty == 0:
        db.delete(item)
    else:
        item.qty = payload.qty
    db.commit()
    return _build_cart_out(db, current_user.id)


@router.delete("/{product_id}", response_model=CartOut)
def remove_cart_item(
    product_id: str,
    variant: str = "default",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id, CartItem.product_id == product_id, CartItem.variant == variant)
        .first()
    )
    if item:
        db.delete(item)
        db.commit()
    return _build_cart_out(db, current_user.id)


@router.delete("", response_model=CartOut)
def clear_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return _build_cart_out(db, current_user.id)
