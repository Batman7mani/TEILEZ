"""
Seed the database with a large, realistic catalog of auto-parts products
across the five categories the frontend supports: bumpers, brakes, tires,
wraps, decals.

Run with:  python -m scripts.seed_data
"""
import random
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.models.models import Product, User, AuthProvider
from app.core.security import hash_password

random.seed(42)

Base.metadata.create_all(bind=engine)

BRANDS = {
    "bumpers": ["Vantage Aero", "Apex Motorsport", "Forge Composites", "GT Dynamics", "RaceCraft"],
    "brakes": ["Forge Performance", "StopTech Pro", "Apex Braking", "Titan Calipers", "CarbonEdge"],
    "tires": ["Apex Grip", "Forge Rubber Co.", "TrackLine", "Momentum Tyres", "RoadForge"],
    "wraps": ["ChromaWrap", "Forge Finish", "SpectraFilm", "UrbanCamo Wraps", "GlossCraft"],
    "decals": ["StripeWorks", "Forge Graphics", "TrackMark Decals", "PixelSkin", "RallyInk"],
}

CATEGORY_IMAGES = {
    "bumpers": [
        "https://c4.wallpaperflare.com/wallpaper/456/792/25/the-sun-light-the-city-bmw-wallpaper-preview.jpg",
        "https://w0.peakpx.com/wallpaper/791/941/HD-wallpaper-2020-toyota-camry-trd-rear-bumper-car.jpg",
        "https://c4.wallpaperflare.com/wallpaper/872/794/389/2016-rolls-royce-wraith-wallpaper-thumb.jpg",
    ],
    "brakes": [
        "https://www.forgemotorsport.asia/userfiles/images/sys/products/356mm_6pot_Big_Brake_Kit_for_Golf_Mk7_Audi_S3_8V_Chassis_65723jpeg.jpg",
        "https://www.performancemachine.com/assets/images/products/4-piston-rear-caliper-bracket_27.jpg",
        "https://www.motocorsestore.com/48650-large_default/pair-of-sicom-t-drive-330x6mm-carbon-ceramic-front-brake-discs-for-ducati-10981198-panigalestreetfighter-v4-desmosedici-rr.jpg",
    ],
    "tires": [
        "https://ytc-bm.s3.us-east-2.amazonaws.com/ADVAN-APEX-V601-3QL-WEB.png",
        "https://m.media-amazon.com/images/I/71ROiai1FKL.jpg",
    ],
    "wraps": [
        "https://i.ytimg.com/vi/IGbkFt_Ypuo/hq720.jpg",
        "https://i.etsystatic.com/9789225/r/il/7ed2a9/6932341605/il_570xN.6932341605_i2et.jpg",
    ],
    "decals": [
        "https://store.ijdmtoy.com/cdn/shop/products/double-bar-rally-stripe-10_918x700.jpg",
        "https://cdn.ecommercedns.uk/files/7/239087/7/37784077/p-example3.png",
    ],
}

BUMPER_NAMES = ["Front Bumper", "Rear Bumper", "Side Skirt Set", "Front Splitter", "Rear Diffuser", "Wide Body Kit", "Lip Spoiler"]
BUMPER_LINES = ["Vantage", "Apex", "GT", "Forge", "Track", "Carbon", "Aero", "Predator", "Phantom", "Raven"]

BRAKE_NAMES = ["6-Piston Front Caliper Kit", "4-Piston Rear Caliper Kit", "Slotted Rotor Pair", "Carbon-Ceramic Rotor Pair",
               "Performance Brake Pad Set", "Stainless Brake Line Kit", "Big Brake Upgrade Kit", "Drilled Rotor Pair"]
BRAKE_LINES = ["Forge", "Apex", "Titan", "Track", "Carbon", "Raptor", "Inferno", "Vortex"]

TIRE_SIZES = ["205/55 R16", "215/45 R17", "225/40 R18", "235/40 R18", "245/35 R19", "255/35 R19", "265/30 R20", "275/30 R20"]
TIRE_NAMES = ["Track Tire", "Street Performance Tire", "All-Season Tire", "Semi-Slick Tire", "Rally Tire", "Touring Tire"]
TIRE_LINES = ["Apex", "Forge", "Momentum", "RoadForge", "TrackLine", "Velocity"]

WRAP_COLORS = ["Satin Graphite", "Gloss Forge Orange", "Matte Black", "Pearl White", "Electric Blue", "Racing Green",
               "Chrome Silver", "Stealth Grey", "Candy Red", "Titanium"]
WRAP_FINISHES = ["Satin", "Gloss", "Matte", "Chrome", "Pearl"]

DECAL_NAMES = ["Carbon Stripe Decal Set", "Track Number Plate Decal", "Racing Stripe Kit", "Side Graphics Decal",
               "Hood Vinyl Decal", "Door Sponsor Decal Set", "Rally Livery Kit", "Windshield Banner Decal"]

FEATURES_POOL = [
    "OEM mounting points", "Paint-ready surface", "Track-tested durability", "Corrosion-resistant coating",
    "Lightweight construction", "Precision CNC-machined fitment", "UV-resistant finish", "5-year warranty",
    "Easy bolt-on installation", "Aerodynamically optimized", "Weatherproof adhesive backing",
    "Heat-resistant compound", "Reinforced structural core", "Professional installation recommended",
]


def rand_desc(name, brand, features):
    picked = random.sample(features, k=3)
    return (
        f"{brand} {name} engineered for enthusiasts who demand both form and function. "
        f"Featuring {picked[0].lower()}, {picked[1].lower()}, and {picked[2].lower()}, "
        f"this component is built to perform under real-world conditions while keeping your build looking sharp."
    )


def make_bumper(i):
    line = random.choice(BUMPER_LINES)
    kind = random.choice(BUMPER_NAMES)
    name = f"{line} {kind}"
    brand = random.choice(BRANDS["bumpers"])
    price = random.randint(28000, 145000)
    spec = {
        "Material": random.choice(["Polyurethane composite", "Carbon fiber", "ABS reinforced plastic", "Fiberglass"]),
        "Fitment": random.choice(["2012–2018 chassis", "2014–2023 chassis", "2018–2024 chassis", "Universal trim-to-fit"]),
        "Finish": random.choice(["Paint-ready", "Pre-primed", "Textured black", "Gloss black"]),
        "Weight": f"{round(random.uniform(4.5, 9.5), 1)} kg",
    }
    return name, brand, price, spec, "bumpers"


def make_brake(i):
    line = random.choice(BRAKE_LINES)
    kind = random.choice(BRAKE_NAMES)
    name = f"{line} {kind}"
    brand = random.choice(BRANDS["brakes"])
    price = random.randint(18000, 165000)
    spec = {
        "Pistons": random.choice(["2 (rear)", "4 (rear)", "4 (front)", "6 (front)", "8 (front)"]),
        "Rotor Type": random.choice(["Slotted, vented", "Drilled, vented", "Carbon-ceramic", "Vented"]),
        "Diameter": f"{random.choice([300, 320, 330, 350, 356, 380])}mm",
        "Compatibility": "Confirm VIN at checkout",
    }
    return name, brand, price, spec, "brakes"


def make_tire(i):
    line = random.choice(TIRE_LINES)
    kind = random.choice(TIRE_NAMES)
    size = random.choice(TIRE_SIZES)
    name = f"{line} {kind} {size}"
    brand = random.choice(BRANDS["tires"])
    price = random.randint(6500, 28500)
    spec = {
        "Size": size,
        "Compound": random.choice(["Semi-slick", "All-season performance", "Summer performance", "Rally compound"]),
        "Tread Life": random.choice(["Track-focused", "30,000 km", "40,000 km", "55,000 km"]),
        "Load Index": str(random.randint(88, 104)),
    }
    return name, brand, price, spec, "tires"


def make_wrap(i):
    color = random.choice(WRAP_COLORS)
    finish = random.choice(WRAP_FINISHES)
    name = f"{color} Full Wrap"
    brand = random.choice(BRANDS["wraps"])
    price = random.randint(65000, 220000)
    spec = {
        "Finish": finish,
        "Coverage": random.choice(["Full body", "Partial / roof + hood", "Full body + mirrors"]),
        "Warranty": random.choice(["3 years", "5 years", "7 years"]),
        "Material": "Cast vinyl film",
    }
    return name, brand, price, spec, "wraps"


def make_decal(i):
    kind = random.choice(DECAL_NAMES)
    name = kind
    brand = random.choice(BRANDS["decals"])
    price = random.randint(1800, 12500)
    spec = {
        "Material": "Cast vinyl + UV laminate",
        "Fit": "Universal, trim-to-fit",
        "Application": random.choice(["Wet application", "Dry application", "Professional install recommended"]),
    }
    return name, brand, price, spec, "decals"


GENERATORS = {
    "bumpers": make_bumper,
    "brakes": make_brake,
    "tires": make_tire,
    "wraps": make_wrap,
    "decals": make_decal,
}

COUNTS = {"bumpers": 40, "brakes": 40, "tires": 35, "wraps": 30, "decals": 35}


def slugify(name, cat, idx):
    base = name.lower().replace("&", "and")
    base = "".join(c if c.isalnum() or c == " " else "" for c in base)
    base = "-".join(base.split())
    return f"{base}-{cat[:-1]}-{idx}"


def seed():
    db = SessionLocal()
    try:
        existing_count = db.query(Product).count()
        if existing_count > 0:
            print(f"Products table already has {existing_count} rows. Skipping product seed. "
                  f"Delete rows or drop the table first to reseed.")
        else:
            total = 0
            for cat, count in COUNTS.items():
                gen = GENERATORS[cat]
                images = CATEGORY_IMAGES[cat]
                for i in range(count):
                    name, brand, price, spec, cat_key = gen(i)
                    pid = slugify(name, cat_key, i + 1)
                    discount = random.choice([0, 0, 0, 5, 10, 12, 15, 20, 25])
                    stock = random.choice([0, 3, 5, 8, 12, 20, 35, 50, 80])
                    rating = round(random.uniform(3.6, 5.0), 1)
                    rating_count = random.randint(4, 480)
                    img = random.choice(images)
                    gallery = random.sample(images, k=min(2, len(images)))
                    desc = rand_desc(name, brand, FEATURES_POOL)

                    product = Product(
                        id=pid, name=name, brand=brand, cat=cat_key, price=float(price),
                        discount=float(discount), description=desc, stock=stock,
                        rating=rating, rating_count=rating_count, img=img, images=gallery,
                        spec=spec, is_active=True,
                    )
                    db.add(product)
                    total += 1
            db.commit()
            print(f"Seeded {total} products across {len(COUNTS)} categories.")

        # Seed a demo admin + demo customer for convenience
        if not db.query(User).filter(User.email == "admin@forge.dev").first():
            admin = User(
                name="Forge Admin", email="admin@forge.dev",
                hashed_password=hash_password("Admin@123"),
                provider=AuthProvider.local, is_admin=True,
            )
            db.add(admin)
        if not db.query(User).filter(User.email == "demo@forge.dev").first():
            demo = User(
                name="Demo Customer", email="demo@forge.dev",
                hashed_password=hash_password("Demo@123"),
                provider=AuthProvider.local, is_admin=False,
            )
            db.add(demo)
        db.commit()
        print("Seeded demo accounts: admin@forge.dev / Admin@123, demo@forge.dev / Demo@123")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
