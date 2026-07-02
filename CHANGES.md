# FORGE — Integration Changes Log

This zip contains the **full stack**: `frontend/` (your original TEILEZ React app, wired to the API)
and `backend/` (FastAPI + PostgreSQL, from the previous step).

## How to run

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # fill in RAZORPAY_KEY_SECRET at minimum
docker compose up -d      # starts Postgres
python -m scripts.seed_data
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
cp .env.example .env      # defaults already point at http://localhost:8000
npm install
npm run dev
```

Open the Vite dev URL (usually `http://localhost:5173`). Sign up a new account, browse `/shop`, add
items to the Garage, and check out — items, cart, auth and orders now all come from the backend.

---

## Backend changes (recap from previous delivery)
- New FastAPI service: `auth`, `products`, `cart`, `orders` routers.
- PostgreSQL models: `User`, `Product`, `CartItem`, `Order`, `OrderItem`, `TrackingEvent`.
- JWT auth (signup/login) + Google SSO (ID token verification).
- Razorpay order creation + server-side HMAC signature verification.
- Amazon-style delivery tracking timeline, auto-seeded on successful payment.
- Seed script generating ~180 products across bumpers/brakes/tires/wraps/decals with brand, price,
  discount, description, stock, rating, images, specs.

## Frontend changes made in this pass

**Nothing in the visual design, CSS, animations, or component layout was touched.** All changes are
either new files (API layer, two new pages) or swapping a *static/local data source* for a *live
backend call* inside the same component, keeping the exact same JSX/markup and CSS classes.

### New files
- `src/api/client.js` — shared fetch wrapper: base URL from `VITE_API_BASE_URL`, JWT attach/storage, error handling.
- `src/api/auth.js` — `signup`, `login`, `loginWithGoogle`, `fetchMe`, `updateMe`.
- `src/api/products.js` — `listProducts`, `getProduct`, `listCategories` (normalizes backend fields to the shape the UI already expected: `desc`, `price` = discounted price, `originalPrice` = list price).
- `src/api/cart.js` — `getCart`, `addToCart`, `updateCartItem`, `removeCartItem`, `clearCart`.
- `src/api/orders.js` — `checkout`, `verifyPayment`, `getHistory`, `getOrder`, `trackOrder`, and `startRazorpayCheckout(...)` which loads the Razorpay Checkout JS SDK, opens the modal, and verifies payment on success.
- `src/pages/OrdersPage.jsx` — **new** purchase-history page (`/orders`), styled with the existing Garage CSS classes so it matches the site.
- `src/pages/OrderDetailPage.jsx` — **new** Amazon-style order tracking page (`/orders/:id`) showing a step tracker (Order Placed → Confirmed → Packed → Shipped → Out for Delivery → Delivered) plus the tracking event log.
- `.env.example` — `VITE_API_BASE_URL`, `VITE_RAZORPAY_KEY_ID`, `VITE_GOOGLE_CLIENT_ID`.

### Edited files
- **`src/data/products.js`** — removed the hardcoded `PRODUCTS` array and `getProduct()`; kept only `formatINR()`, which every page still imports. The catalog now comes live from the backend.
- **`src/store/StoreContext.jsx`** — `login`/`logout` now call the real backend (`api/auth.js`) instead of just saving a name to localStorage; added `signup` and `loginWithGoogle`. The `garage` (cart) is now fetched from and synced with `/api/cart` on every add/update/remove instead of being purely `localStorage`-based. Public interface (`isAuthed`, `garage`, `addToGarage`, `updateQty`, `removeFromGarage`, `clearGarage`, `garageTotal`, `garageCount`) kept the same names so downstream components needed minimal changes.
- **`src/pages/LoginPage.jsx`** — form submit now calls `signup()`/`login()` against the backend instead of the old fake local-only `login(email, name)`. Added an optional "Sign in with Google" button (only renders if `VITE_GOOGLE_CLIENT_ID` is set) using Google Identity Services — no layout change, it just adds a button below the existing form.
- **`src/pages/ShopPage.jsx`** — fetches the category's products from `/api/products` instead of filtering the static array; added a loading state and a discount badge/strikethrough price (same card markup/classes as before).
- **`src/pages/ProductPage.jsx`** — fetches the product and its "related" products from `/api/products/:id` instead of the static file; shows stock/rating (new, small addition) and disables "Add to Garage" when out of stock; "Add to Garage" now calls the async backend cart endpoint and redirects to login if the request needs auth (same behavior as before, just backend-verified now).
- **`src/pages/GaragePage.jsx`** — cart data and mutations (`updateQty`, `removeFromGarage`, `clearGarage`) now go through the backend via `StoreContext`. Added a shipping-details mini-form and wired the **Checkout** button to `startRazorpayCheckout()`, which opens the real Razorpay Checkout modal (test key `rzp_test_T89lEU1UpQlopw`) and, on success, verifies payment server-side and redirects to the new `/orders` page. Added a "My Orders" link next to "Sign out". This replaces the old `alert('Checkout is a demo...')` placeholder — that was the only functional gap in the original frontend for payments.
- **`src/components/ProductGrid.jsx`** (homepage "Selected Components" section) — fetches the top products from `/api/products` (sorted by rating) instead of slicing the static array; markup/animation unchanged.
- **`src/components/Nav.jsx`** — fixed two dead links that existed in the original code and were never wired to a real route: the cart icon pointed to `/cart` (no such route existed) → now points to `/garage`; the mega-menu category links pointed to `/parts/:slug` (no such route existed) → now point to `/shop/:slug`, matching the routes actually defined in `App.jsx`.
- **`src/App.jsx`** — registered the two new routes: `/orders` and `/orders/:id`.

### Why these particular gaps existed
The original frontend was cart/auth/catalog only in `localStorage` + a hardcoded 12-item product file, with no payment flow (`alert('Checkout is a demo...')`) and no order history/tracking UI at all — those were the "missing pieces" needed to match everything the backend now provides. The Nav bugs (`/cart`, `/parts/:slug`) were pre-existing dead links unrelated to the backend work, fixed while touching that file.

No CSS files were modified. No npm packages were added — Razorpay Checkout and Google Identity Services are both loaded from their CDN `<script>` tags at runtime, exactly like the pattern already used for the loader video, so `package.json`/`package-lock.json` are untouched.
