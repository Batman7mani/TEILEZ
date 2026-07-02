import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text,
    Enum as SAEnum, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuthProvider(str, enum.Enum):
    local = "local"
    google = "google"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    cancelled = "cancelled"


class DeliveryStatus(str, enum.Enum):
    order_placed = "order_placed"
    confirmed = "confirmed"
    packed = "packed"
    shipped = "shipped"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # null for SSO-only users
    provider = Column(SAEnum(AuthProvider), default=AuthProvider.local, nullable=False)
    google_sub = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(String(80), primary_key=True, index=True)  # slug id, matches frontend "id"
    name = Column(String(200), nullable=False)
    brand = Column(String(100), nullable=False)
    cat = Column(String(40), nullable=False, index=True)  # bumpers | brakes | tires | wraps | decals
    price = Column(Float, nullable=False)
    discount = Column(Float, default=0)  # percentage 0-100
    description = Column(Text, nullable=False)
    stock = Column(Integer, default=0)
    rating = Column(Float, default=4.0)
    rating_count = Column(Integer, default=0)
    img = Column(String(500), nullable=False)
    images = Column(JSON, default=list)  # extra gallery image URLs
    spec = Column(JSON, default=dict)  # key-value specs shown on ProductPage
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def final_price(self) -> float:
        if self.discount and self.discount > 0:
            return round(self.price * (1 - self.discount / 100), 2)
        return self.price


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("user_id", "product_id", "variant", name="uq_cart_user_product_variant"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(80), ForeignKey("products.id"), nullable=False)
    variant = Column(String(80), nullable=True, default="default")
    qty = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="cart_items")
    product = relationship("Product")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(40), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subtotal = Column(Float, nullable=False)
    shipping_fee = Column(Float, default=0)
    total = Column(Float, nullable=False)
    status = Column(SAEnum(OrderStatus), default=OrderStatus.pending)
    shipping_address = Column(Text, nullable=False)
    shipping_name = Column(String(120), nullable=False)
    shipping_phone = Column(String(20), nullable=False)

    razorpay_order_id = Column(String(80), nullable=True)
    razorpay_payment_id = Column(String(80), nullable=True)
    razorpay_signature = Column(String(255), nullable=True)

    delivery_status = Column(SAEnum(DeliveryStatus), default=DeliveryStatus.order_placed)
    estimated_delivery = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    tracking_events = relationship("TrackingEvent", back_populates="order", cascade="all, delete-orphan", order_by="TrackingEvent.created_at")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(80), ForeignKey("products.id"), nullable=False)
    variant = Column(String(80), nullable=True, default="default")
    name = Column(String(200), nullable=False)  # snapshot at purchase time
    img = Column(String(500), nullable=True)
    unit_price = Column(Float, nullable=False)
    qty = Column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class TrackingEvent(Base):
    __tablename__ = "tracking_events"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    status = Column(SAEnum(DeliveryStatus), nullable=False)
    message = Column(String(255), nullable=False)
    location = Column(String(120), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="tracking_events")
