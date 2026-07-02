# FORGE Autoparts — Backend (FastAPI + PostgreSQL)

Backend only. Built to plug into the existing **TEILEZ / FORGE** React frontend without any frontend changes.

## Stack
- FastAPI + SQLAlchemy 2.0
- PostgreSQL
- JWT auth (email/password) + Google SSO (ID token verification)
- Razorpay (test mode) for checkout
- Seed script generating a 180-product catalog across bumpers, brakes, tires, wraps, decals

## 1. Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then edit .env
```

Start Postgres (or use your own instance):

```bash
docker compose up -d
```

Edit `.env`:
- `DATABASE_URL` — matches docker-compose defaults out of the box.
- `JWT_SECRET_KEY` — set a long random string.
- `RAZORPAY_KEY_ID` is pre-filled with the test key `rzp_test_T89lEU1UpQlopw`. You still need to add your **RAZORPAY_KEY_SECRET** from the Razorpay dashboard (Settings → API Keys) — the key ID alone cannot sign/verify payments.
- `GOOGLE_CLIENT_ID` — OAuth 2.0 Client ID from Google Cloud Console, needed for Google SSO.

## 2. Seed the database

```bash
python -m scripts.seed_data
```

This creates:
- ~180 products (40 bumpers, 40 brakes, 35 tires, 30 wraps, 35 decals), each with name, brand, price, discount, description, stock, rating, images, and category-specific specs.
- Demo accounts: `admin@forge.dev` / `Admin@123` (admin) and `demo@forge.dev` / `Demo@123`.

## 3. Run the API

```bash
uvicorn app.main:app --reload --port 8000
```

Docs at `http://localhost:8000/docs`.

## API overview

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/signup` | Email/password signup → returns JWT |
| POST | `/login` | Email/password login → returns JWT |
| POST | `/google` | Verify Google ID token (SSO) → returns JWT |
| GET | `/me` | Current user profile |
| PUT | `/me` | Update name/phone/address |

### Products — `/api/products`
| Method | Path | Description |
|---|---|---|
| GET | `` | List/search/filter/sort/paginate. Query params: `cat, q, brand, min_price, max_price, sort, page, page_size` |
| GET | `/categories` | Distinct categories |
| GET | `/{id}` | Single product |

Response fields match what the frontend expects (`id, name, cat, price, img, desc→description, spec`) plus `brand, discount, final_price, stock, rating, rating_count, images, in_stock`.

### Cart — `/api/cart` (auth required)
| Method | Path | Description |
|---|---|---|
| GET | `` | Get current cart |
| POST | `` | Add item `{product_id, variant, qty}` |
| PUT | `/{product_id}?variant=` | Update qty (0 removes) |
| DELETE | `/{product_id}?variant=` | Remove item |
| DELETE | `` | Clear cart |

### Orders / Checkout / Payment — `/api/orders` (auth required)
| Method | Path | Description |
|---|---|---|
| POST | `/checkout` | Creates a pending order from the cart + a Razorpay order. Returns `razorpay_order_id`, `razorpay_key_id`, `amount` for the frontend Razorpay Checkout widget |
| POST | `/verify-payment` | Verifies Razorpay signature, marks order paid, decrements stock, clears cart, seeds delivery tracking |
| GET | `/history` | Purchase history (paid orders) |
| GET | `/{id}` | Order detail incl. items + tracking events |
| GET | `/{id}/track` | Tracking events only (Amazon-style timeline) |
| PATCH | `/{id}/advance-status` | Admin-only: progress delivery status one step (for demoing tracking without waiting for real logistics) |

## Razorpay integration flow (frontend side, no UI changes needed)

1. Frontend calls `POST /api/orders/checkout` with shipping details → gets `razorpay_order_id`, `razorpay_key_id`, `amount`.
2. Frontend opens Razorpay Checkout using those values (standard Razorpay JS SDK `<script src="https://checkout.razorpay.com/v1/checkout.js">`), which is a modal overlay and requires no page/route changes.
3. On success, frontend calls `POST /api/orders/verify-payment` with `internal_order_id`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
4. Backend verifies the HMAC signature server-side, marks the order paid, and starts the delivery tracking timeline.

## Delivery tracking

On successful payment, 5 tracking events are auto-generated (order placed → confirmed → packed → shipped → out for delivery), with an `estimated_delivery` date. Use `PATCH /{id}/advance-status` (as the seeded admin user) to push an order to "delivered" for demo purposes, same as Amazon's tracking page.

## Notes
- CORS is open to `FRONTEND_ORIGIN` (defaults to Vite's `http://localhost:5173`).
- All product images currently reuse the same placeholder photo URLs already present in the frontend's `categoryImages.js`, duplicated across the generated catalog — swap `img`/`images` fields in the DB (or re-run seed with your own URLs) once you have real product photography.
- Tables auto-create on startup via `Base.metadata.create_all`; for production use, switch to Alembic migrations (an `alembic.ini` stub is not included — the schema is simple enough for a single init script for now).
