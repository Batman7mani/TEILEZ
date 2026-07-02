import hmac
import hashlib
import uuid
from datetime import datetime, timedelta

import razorpay
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.models import (
    User, CartItem, Product, Order, OrderItem, TrackingEvent,
    OrderStatus, DeliveryStatus,
)
from app.schemas.schemas import (
    CheckoutRequest, RazorpayOrderOut, VerifyPaymentRequest, OrderOut,
    OrderSummaryOut, OrderItemOut, TrackingEventOut,
)

router = APIRouter(prefix="/api/orders", tags=["orders"])

razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

SHIPPING_FEE = 0.0  # free shipping, adjust as needed


def _order_number() -> str:
    return f"FORGE-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"


def _to_order_out(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id, order_number=order.order_number, status=order.status.value,
        delivery_status=order.delivery_status.value, subtotal=order.subtotal,
        shipping_fee=order.shipping_fee, total=order.total,
        shipping_name=order.shipping_name, shipping_phone=order.shipping_phone,
        shipping_address=order.shipping_address, estimated_delivery=order.estimated_delivery,
        created_at=order.created_at,
        items=[OrderItemOut(
            product_id=i.product_id, variant=i.variant or "default", name=i.name,
            img=i.img, unit_price=i.unit_price, qty=i.qty,
        ) for i in order.items],
        tracking_events=[TrackingEventOut(
            status=t.status.value, message=t.message, location=t.location, created_at=t.created_at,
        ) for t in order.tracking_events],
    )


@router.post("/checkout", response_model=RazorpayOrderOut)
def checkout(
    payload: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates an internal 'pending' order from the user's cart and a
    matching Razorpay order for the frontend Checkout widget to open.
    """
    cart_rows = (
        db.query(CartItem, Product)
        .join(Product, Product.id == CartItem.product_id)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )
    if not cart_rows:
        raise HTTPException(status_code=400, detail="Your cart is empty.")

    subtotal = 0.0
    order_items = []
    for ci, p in cart_rows:
        if p.stock < ci.qty:
            raise HTTPException(status_code=400, detail=f"'{p.name}' only has {p.stock} units left in stock.")
        unit_price = p.final_price
        subtotal += unit_price * ci.qty
        order_items.append(OrderItem(
            product_id=p.id, variant=ci.variant or "default", name=p.name,
            img=p.img, unit_price=unit_price, qty=ci.qty,
        ))

    subtotal = round(subtotal, 2)
    total = round(subtotal + SHIPPING_FEE, 2)

    order = Order(
        order_number=_order_number(),
        user_id=current_user.id,
        subtotal=subtotal,
        shipping_fee=SHIPPING_FEE,
        total=total,
        status=OrderStatus.pending,
        shipping_name=payload.shipping_name,
        shipping_phone=payload.shipping_phone,
        shipping_address=payload.shipping_address,
        delivery_status=DeliveryStatus.order_placed,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    amount_paise = int(round(total * 100))
    rp_order = razorpay_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": order.order_number,
        "notes": {"internal_order_id": str(order.id), "user_id": str(current_user.id)},
    })

    order.razorpay_order_id = rp_order["id"]
    db.commit()

    return RazorpayOrderOut(
        razorpay_order_id=rp_order["id"],
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
        amount=amount_paise,
        currency="INR",
        order_number=order.order_number,
        internal_order_id=order.id,
    )


@router.post("/verify-payment", response_model=OrderOut)
def verify_payment(
    payload: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.tracking_events))
        .filter(Order.id == payload.internal_order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == OrderStatus.paid:
        return _to_order_out(order)

    # Verify Razorpay signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret)
    generated_signature = hmac.new(
        key=settings.RAZORPAY_KEY_SECRET.encode(),
        msg=f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode(),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(generated_signature, payload.razorpay_signature):
        order.status = OrderStatus.failed
        db.commit()
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")

    # Mark paid, decrement stock, kick off delivery tracking timeline
    order.status = OrderStatus.paid
    order.razorpay_payment_id = payload.razorpay_payment_id
    order.razorpay_signature = payload.razorpay_signature
    order.delivery_status = DeliveryStatus.confirmed
    order.estimated_delivery = datetime.utcnow() + timedelta(days=5)

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock = max(0, product.stock - item.qty)

    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()

    tracking_seed = [
        (DeliveryStatus.order_placed, "Order placed successfully.", None),
        (DeliveryStatus.confirmed, "Payment confirmed. Your order is being prepared.", "FORGE Warehouse"),
        (DeliveryStatus.packed, "Your items have been packed and are ready for dispatch.", "FORGE Warehouse"),
        (DeliveryStatus.shipped, "Your order has been shipped.", "Regional Hub"),
        (DeliveryStatus.out_for_delivery, "Out for delivery.", "Local Courier Facility"),
    ]
    now = datetime.utcnow()
    for idx, (status, message, location) in enumerate(tracking_seed):
        db.add(TrackingEvent(
            order_id=order.id, status=status, message=message, location=location,
            created_at=now + timedelta(minutes=idx),
        ))

    db.commit()
    db.refresh(order)
    return _to_order_out(order)


@router.get("/history", response_model=list[OrderSummaryOut])
def purchase_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == current_user.id, Order.status == OrderStatus.paid)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [
        OrderSummaryOut(
            id=o.id, order_number=o.order_number, status=o.status.value,
            delivery_status=o.delivery_status.value, total=o.total,
            created_at=o.created_at, item_count=sum(i.qty for i in o.items),
        )
        for o in orders
    ]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.tracking_events))
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _to_order_out(order)


@router.patch("/{order_id}/advance-status", response_model=OrderOut)
def advance_delivery_status(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.tracking_events))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    sequence = [
        DeliveryStatus.order_placed, DeliveryStatus.confirmed, DeliveryStatus.packed,
        DeliveryStatus.shipped, DeliveryStatus.out_for_delivery, DeliveryStatus.delivered,
    ]
    try:
        current_idx = sequence.index(order.delivery_status)
    except ValueError:
        current_idx = -1

    if current_idx >= len(sequence) - 1:
        return _to_order_out(order)

    next_status = sequence[current_idx + 1]
    if next_status == DeliveryStatus.delivered:
        message, location = "Your package has been delivered. Enjoy the build!", order.shipping_address
    else:
        message, location = f"Order status updated to {next_status.value.replace('_', ' ')}.", None

    order.delivery_status = next_status
    db.add(TrackingEvent(order_id=order.id, status=next_status, message=message, location=location))
    db.commit()
    db.refresh(order)
    return _to_order_out(order)


@router.get("/{order_id}/track", response_model=list[TrackingEventOut])
def track_order(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    events = (
        db.query(TrackingEvent)
        .filter(TrackingEvent.order_id == order.id)
        .order_by(TrackingEvent.created_at.asc())
        .all()
    )
    return [TrackingEventOut(status=e.status.value, message=e.message, location=e.location, created_at=e.created_at) for e in events]
