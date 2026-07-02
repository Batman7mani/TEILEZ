from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Auth ----------
class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleSSORequest(BaseModel):
    id_token: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    provider: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


# ---------- Products ----------
class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    brand: str
    cat: str
    price: float
    discount: float
    final_price: float
    description: str
    stock: int
    rating: float
    rating_count: int
    img: str
    images: List[str] = []
    spec: Dict[str, Any] = {}
    in_stock: bool = True


class ProductListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ProductOut]


# ---------- Cart ----------
class CartItemIn(BaseModel):
    product_id: str
    variant: Optional[str] = "default"
    qty: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    qty: int = Field(ge=0)


class CartItemOut(BaseModel):
    product_id: str
    variant: str
    qty: int
    name: str
    img: str
    unit_price: float
    line_total: float
    stock: int


class CartOut(BaseModel):
    items: List[CartItemOut]
    subtotal: float
    count: int


# ---------- Checkout / Orders ----------
class CheckoutRequest(BaseModel):
    shipping_name: str
    shipping_phone: str
    shipping_address: str


class RazorpayOrderOut(BaseModel):
    razorpay_order_id: str
    razorpay_key_id: str
    amount: int  # in paise
    currency: str = "INR"
    order_number: str
    internal_order_id: int


class VerifyPaymentRequest(BaseModel):
    internal_order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class OrderItemOut(BaseModel):
    product_id: str
    variant: str
    name: str
    img: Optional[str] = None
    unit_price: float
    qty: int


class TrackingEventOut(BaseModel):
    status: str
    message: str
    location: Optional[str] = None
    created_at: datetime


class OrderOut(BaseModel):
    id: int
    order_number: str
    status: str
    delivery_status: str
    subtotal: float
    shipping_fee: float
    total: float
    shipping_name: str
    shipping_phone: str
    shipping_address: str
    estimated_delivery: Optional[datetime] = None
    created_at: datetime
    items: List[OrderItemOut]
    tracking_events: List[TrackingEventOut] = []


class OrderSummaryOut(BaseModel):
    id: int
    order_number: str
    status: str
    delivery_status: str
    total: float
    created_at: datetime
    item_count: int
