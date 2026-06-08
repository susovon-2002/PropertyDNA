from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import joblib
import pandas as pd
import sqlite3
import hashlib
import hmac
import re
import secrets
import string
import time
import shutil

# --------------------------------------------------
# PATHS
# --------------------------------------------------

BASE_DIR = os.path.dirname(__file__)

PRICE_MODEL_PATH = os.path.join(BASE_DIR, "models", "model_price.joblib")
AGE_MODEL_PATH   = os.path.join(BASE_DIR, "models", "model_age.joblib")
DNA_MODEL_PATH   = os.path.join(BASE_DIR, "models", "model_dna.joblib")

DB_PATH  = os.path.join(BASE_DIR, "property_dna.db")
CSV_PATH = os.path.join(BASE_DIR, "data", "raw", "dataset.csv")

CURRENT_YEAR = 2026

# --------------------------------------------------
# APP
# --------------------------------------------------

app = FastAPI(title="PropertyDNA API", version="2.0.0")

@app.get("/")
def root():
    return {"message": "PropertyDNA API Running", "status": "online"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# REFERENCE DATA
# --------------------------------------------------

COUNTRIES = {
    'United States': {'currency': 'USD', 'symbol': '$',  'rate': 300},
    'United Kingdom': {'currency': 'GBP', 'symbol': '£',  'rate': 220},
    'Germany':        {'currency': 'EUR', 'symbol': '€',  'rate': 280},
    'Canada':         {'currency': 'CAD', 'symbol': 'C$', 'rate': 320},
    'Australia':      {'currency': 'AUD', 'symbol': 'A$', 'rate': 350},
    'Japan':          {'currency': 'JPY', 'symbol': '¥',  'rate': 35000},
    'India':          {'currency': 'INR', 'symbol': '₹',  'rate': 6000},
    'Brazil':         {'currency': 'BRL', 'symbol': 'R$', 'rate': 1500},
    'South Africa':   {'currency': 'ZAR', 'symbol': 'R',  'rate': 2200},
}

# --------------------------------------------------
# SCHEMAS
# --------------------------------------------------

class PredictionRequest(BaseModel):
    Country: str
    State_Region: str
    City: str
    Postal_Code: int
    Latitude: float
    Longitude: float
    Year_Built: int
    Property_Type: str
    House_Size_sqft: float
    Lot_Size_sqft: float
    Bedrooms: int
    Bathrooms: int
    Floors: int
    Garage_Size: int
    Garden_Area: float
    Swimming_Pool: int
    Elevator: int
    Construction_Material: str
    Roof_Type: str
    Energy_Rating: str
    Renovation_Year: int
    Renovation_Count: int
    Distance_to_School_km: float
    Distance_to_Hospital_km: float
    Distance_to_City_Center_km: float
    Crime_Index: float
    Market_Demand_Score: float
    Neighborhood_Rating: float
    Internet_Speed_Availability: float
    Public_Transport_Score: float
    Flood_Risk: float
    Earthquake_Risk: float
    Air_Quality_Index: float
    Noise_Level: float
    Future_Growth_Score: float
    Investment_Rating: str
    House_Age: Optional[int] = None


class PredictAgeRequest(BaseModel):
    rooms: int
    size: float
    material: str
    location: str
    renovation: str


class UserSignUp(BaseModel):
    name: str
    email: str
    password: str


class UserSignIn(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class SavePredictionRequest(BaseModel):
    user_id: int
    predicted_price: float
    predicted_age: int
    dna_score: float
    country: str
    state: str
    city: str
    # Legacy fields (optional for backwards compat)
    year_built: Optional[int] = None
    rooms: Optional[int] = None
    size_sqft: Optional[float] = None
    material: Optional[str] = None
    location: Optional[str] = None
    renovation: Optional[str] = None


class PortfolioAddRequest(BaseModel):
    property_name: str = ""
    city: str
    state: str
    country: str
    predicted_price: float
    dna_score: float
    notes: Optional[str] = ""
    property_type: Optional[str] = ""
    year_built: Optional[int] = 0
    house_size_sqft: Optional[float] = 0
    bedrooms: Optional[int] = 0
    bathrooms: Optional[int] = 0
    predicted_age: Optional[int] = 0


class FavoriteAddRequest(BaseModel):
    city: str
    state: str
    country: str
    dna_score: float
    predicted_price: float


class ReportSaveRequest(BaseModel):
    report_name: str
    country: str
    state: str
    city: str
    predicted_price: float
    dna_score: float
    predicted_age: int


# --------------------------------------------------
# HELPERS
# --------------------------------------------------

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

EMAIL_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z]{2,})+$")
NAME_RE  = re.compile(r"^[A-Za-z][A-Za-z .'-]{1,58}[A-Za-z]$")
DISPOSABLE_EMAIL_DOMAINS = {
    "10minutemail.com", "guerrillamail.com", "mailinator.com", "tempmail.com",
    "temp-mail.org", "yopmail.com", "trashmail.com", "fakeinbox.com",
}
CAPTCHA_TTL_SECONDS = 300
captcha_store = {}


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_name(name: str) -> str:
    cleaned = " ".join(name.strip().split())
    if not NAME_RE.match(cleaned):
        raise HTTPException(status_code=422, detail="Enter a real full name using letters, spaces, apostrophes, periods, or hyphens only.")
    if len(cleaned.split()) < 2:
        raise HTTPException(status_code=422, detail="Please enter your first and last name.")
    return cleaned


def validate_email(email: str) -> str:
    cleaned = normalize_email(email)
    if not EMAIL_RE.match(cleaned):
        raise HTTPException(status_code=422, detail="Incorrect details provided. Email must be a valid email address.")
    domain = cleaned.rsplit("@", 1)[1]
    if domain in DISPOSABLE_EMAIL_DOMAINS or domain.endswith(".test") or domain.endswith(".invalid"):
        raise HTTPException(status_code=422, detail="Incorrect details provided. Temporary or fake email addresses are not allowed.")
    return cleaned


def validate_password(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters.")
    checks = [
        any(ch.islower() for ch in password),
        any(ch.isupper() for ch in password),
        any(ch.isdigit() for ch in password),
        any(ch in string.punctuation for ch in password),
    ]
    if not all(checks):
        raise HTTPException(status_code=422, detail="Password must include uppercase, lowercase, number, and special character.")
    common = {"password123", "password123!", "admin123!", "qwerty123!", "propertydna"}
    if password.lower() in common:
        raise HTTPException(status_code=422, detail="Choose a stronger password.")


def hash_password_secure(password: str, salt: str = None) -> tuple:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
    return salt, digest.hex()


def verify_password(password: str, stored_hash: str, salt: str = None) -> bool:
    if salt:
        _, digest = hash_password_secure(password, salt)
        return hmac.compare_digest(digest, stored_hash)
    return hmac.compare_digest(hash_password(password), stored_hash)


def get_db():
    """Return a connected SQLite connection with row_factory set."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_or_create_user_record(email: str):
    """Retrieves a user row by email, auto-creating it if it doesn't exist."""
    conn = get_db()
    try:
        email = validate_email(email)
        row = conn.execute(
            "SELECT id, name, email, created_at FROM users WHERE lower(email) = ?",
            (email,)
        ).fetchone()
        if not row:
            name = email.split('@')[0].capitalize()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (name, email, password_hash, password_salt) VALUES (?, ?, ?, ?)",
                (name, email, "auto_provisioned_dummy_hash", "auto_provisioned_dummy_salt")
            )
            conn.commit()
            row = conn.execute(
                "SELECT id, name, email, created_at FROM users WHERE lower(email) = ?",
                (email,)
            ).fetchone()
            print(f"[DEBUG] Auto-created user {name} ({email}) with id: {row['id']}")
        return row
    finally:
        conn.close()


def get_user_id_by_email(email: str):
    """Get user ID by email. Auto-creates user if not found."""
    user = get_or_create_user_record(email)
    return user["id"]



def require_user(conn, user_id: int):
    """Raise 404 if user_id doesn't exist."""
    row = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"User {user_id} not found.")


def init_all_tables():
    """Create all required tables if they don't already exist."""
    os.makedirs(BASE_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ── users ──────────────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT NOT NULL,
            email         TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            password_salt TEXT,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # add password_salt column if missing (migration safety)
    cursor.execute("PRAGMA table_info(users)")
    user_cols = {row[1] for row in cursor.fetchall()}
    if "password_salt" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN password_salt TEXT")

    # ── saved_predictions ──────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_predictions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            predicted_price REAL    NOT NULL DEFAULT 0,
            predicted_age   INTEGER NOT NULL DEFAULT 0,
            dna_score       REAL             DEFAULT 0,
            country         TEXT             DEFAULT '',
            state           TEXT             DEFAULT '',
            city            TEXT             DEFAULT '',
            -- legacy columns kept for backward compat
            year_built      INTEGER          DEFAULT 0,
            rooms           INTEGER          DEFAULT 0,
            size_sqft       REAL             DEFAULT 0,
            material        TEXT             DEFAULT '',
            location        TEXT             DEFAULT '',
            renovation      TEXT             DEFAULT '',
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    # migrate existing table — add new columns if absent
    cursor.execute("PRAGMA table_info(saved_predictions)")
    pred_cols = {row[1] for row in cursor.fetchall()}
    for col, definition in [
        ("dna_score", "REAL DEFAULT 0"),
        ("country",   "TEXT DEFAULT ''"),
        ("state",     "TEXT DEFAULT ''"),
        ("city",      "TEXT DEFAULT ''"),
    ]:
        if col not in pred_cols:
            cursor.execute(f"ALTER TABLE saved_predictions ADD COLUMN {col} {definition}")

    # ── portfolio ──────────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS portfolio (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            property_name   TEXT    DEFAULT '',
            city            TEXT    DEFAULT '',
            state           TEXT    DEFAULT '',
            country         TEXT    DEFAULT '',
            predicted_price REAL    DEFAULT 0,
            dna_score       REAL    DEFAULT 0,
            notes           TEXT    DEFAULT '',
            property_type   TEXT    DEFAULT '',
            year_built      INTEGER DEFAULT 0,
            house_size_sqft REAL    DEFAULT 0,
            bedrooms        INTEGER DEFAULT 0,
            bathrooms       INTEGER DEFAULT 0,
            predicted_age   INTEGER DEFAULT 0,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    cursor.execute("PRAGMA table_info(portfolio)")
    portfolio_cols = {row[1] for row in cursor.fetchall()}
    for col, definition in [
        ("property_name",   "TEXT DEFAULT ''"),
        ("property_type",   "TEXT DEFAULT ''"),
        ("year_built",      "INTEGER DEFAULT 0"),
        ("house_size_sqft", "REAL DEFAULT 0"),
        ("bedrooms",        "INTEGER DEFAULT 0"),
        ("bathrooms",       "INTEGER DEFAULT 0"),
        ("predicted_age",   "INTEGER DEFAULT 0"),
    ]:
        if col not in portfolio_cols:
            cursor.execute(f"ALTER TABLE portfolio ADD COLUMN {col} {definition}")

    # ── favorites ──────────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            city            TEXT    DEFAULT '',
            state           TEXT    DEFAULT '',
            country         TEXT    DEFAULT '',
            dna_score       REAL    DEFAULT 0,
            predicted_price REAL    DEFAULT 0,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # ── saved_reports ──────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_reports (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            report_name     TEXT    NOT NULL,
            country         TEXT    DEFAULT '',
            state           TEXT    DEFAULT '',
            city            TEXT    DEFAULT '',
            predicted_price REAL    DEFAULT 0,
            dna_score       REAL    DEFAULT 0,
            predicted_age   INTEGER DEFAULT 0,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()


def cleanup_captchas():
    now = time.time()
    expired = [k for k, v in captcha_store.items() if now - v["created_at"] > CAPTCHA_TTL_SECONDS]
    for k in expired:
        captcha_store.pop(k, None)


def verify_captcha(captcha_id: str, answer: str):
    cleanup_captchas()
    item = captcha_store.pop(captcha_id, None)
    if not item:
        raise HTTPException(status_code=422, detail="Captcha expired. Please try again.")
    if str(answer).strip() != str(item["answer"]):
        raise HTTPException(status_code=422, detail="Captcha answer is incorrect.")


def build_feature_df(payload: PredictionRequest) -> pd.DataFrame:
    house_age = payload.House_Age
    if house_age is None:
        house_age = CURRENT_YEAR - payload.Year_Built
    return pd.DataFrame([{
        "Country":                    payload.Country,
        "State_Region":               payload.State_Region,
        "City":                       payload.City,
        "Postal_Code":                payload.Postal_Code,
        "Latitude":                   payload.Latitude,
        "Longitude":                  payload.Longitude,
        "Year_Built":                 payload.Year_Built,
        "Property_Type":              payload.Property_Type,
        "House_Size_sqft":            payload.House_Size_sqft,
        "Lot_Size_sqft":              payload.Lot_Size_sqft,
        "Bedrooms":                   payload.Bedrooms,
        "Bathrooms":                  payload.Bathrooms,
        "Floors":                     payload.Floors,
        "Garage_Size":                payload.Garage_Size,
        "Garden_Area":                payload.Garden_Area,
        "Swimming_Pool":              payload.Swimming_Pool,
        "Elevator":                   payload.Elevator,
        "Construction_Material":      payload.Construction_Material,
        "Roof_Type":                  payload.Roof_Type,
        "Energy_Rating":              payload.Energy_Rating,
        "Renovation_Year":            payload.Renovation_Year,
        "Renovation_Count":           payload.Renovation_Count,
        "Distance_to_School_km":      payload.Distance_to_School_km,
        "Distance_to_Hospital_km":    payload.Distance_to_Hospital_km,
        "Distance_to_City_Center_km": payload.Distance_to_City_Center_km,
        "Crime_Index":                payload.Crime_Index,
        "Market_Demand_Score":        payload.Market_Demand_Score,
        "Neighborhood_Rating":        payload.Neighborhood_Rating,
        "Internet_Speed_Availability":payload.Internet_Speed_Availability,
        "Public_Transport_Score":     payload.Public_Transport_Score,
        "Flood_Risk":                 payload.Flood_Risk,
        "Earthquake_Risk":            payload.Earthquake_Risk,
        "Air_Quality_Index":          payload.Air_Quality_Index,
        "Noise_Level":                payload.Noise_Level,
        "Future_Growth_Score":        payload.Future_Growth_Score,
        "Investment_Rating":          payload.Investment_Rating,
        "House_Age":                  house_age,
    }])


# --------------------------------------------------
# MODEL LOADING
# --------------------------------------------------

price_model = None
age_model   = None
dna_model   = None
is_training = False


def load_models():
    global price_model, age_model, dna_model
    if os.path.exists(PRICE_MODEL_PATH):
        price_model = joblib.load(PRICE_MODEL_PATH)
        print("Price model loaded.")
    else:
        print(f"WARNING: Price model not found at {PRICE_MODEL_PATH}")

    if os.path.exists(AGE_MODEL_PATH):
        age_model = joblib.load(AGE_MODEL_PATH)
        print("Age model loaded.")
    else:
        print(f"WARNING: Age model not found at {AGE_MODEL_PATH}")

    if os.path.exists(DNA_MODEL_PATH):
        dna_model = joblib.load(DNA_MODEL_PATH)
        print("DNA model loaded.")
    else:
        print(f"WARNING: DNA model not found at {DNA_MODEL_PATH}")


def retrain_and_load():
    global is_training
    is_training = True
    try:
        from train_model import train
        train()
        load_models()
    except Exception as e:
        print(f"Background training failed: {e}")
    finally:
        is_training = False


@app.on_event("startup")
def startup_event():
    init_all_tables()
    load_models()


# --------------------------------------------------
# AUTHENTICATION ENDPOINTS
# --------------------------------------------------

@app.get("/api/auth/captcha")
def get_captcha():
    cleanup_captchas()
    first  = secrets.randbelow(8) + 2
    second = secrets.randbelow(8) + 2
    captcha_id = secrets.token_urlsafe(16)
    captcha_store[captcha_id] = {"answer": first + second, "created_at": time.time()}
    return {"captcha_id": captcha_id, "question": f"{first} + {second} = ?"}


@app.post("/api/auth/signup")
def signup(payload: UserSignUp):
    init_all_tables()
    name  = validate_name(payload.name)
    email = validate_email(payload.email)
    validate_password(payload.password)

    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, password_hash FROM users WHERE lower(email) = ?", (email,))
    existing = cursor.fetchone()
    if existing:
        if existing[1] == "auto_provisioned_dummy_hash":
            # Overwrite auto-provisioned dummy account with real user registration details
            salt, pwd_hash = hash_password_secure(payload.password)
            try:
                cursor.execute(
                    "UPDATE users SET name = ?, password_hash = ?, password_salt = ? WHERE id = ?",
                    (name, pwd_hash, salt, existing[0])
                )
                conn.commit()
                conn.close()
                return {"status": "success", "user": {"name": name, "email": email}}
            except Exception as e:
                conn.close()
                raise HTTPException(status_code=500, detail=f"User registration error: {str(e)}")
        else:
            conn.close()
            raise HTTPException(status_code=400, detail="Email is already registered.")

    salt, pwd_hash = hash_password_secure(payload.password)
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, password_salt) VALUES (?, ?, ?, ?)",
            (name, email, pwd_hash, salt)
        )
        conn.commit()
        conn.close()
        return {"status": "success", "user": {"name": name, "email": email}}
    except Exception as e:
        conn.close()

        raise HTTPException(status_code=500, detail=f"User registration error: {str(e)}")


@app.post("/api/auth/signin")
def signin(payload: UserSignIn):
    init_all_tables()
    email = validate_email(payload.email)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, email, password_hash, password_salt FROM users WHERE lower(email) = ?",
        (email,)
    )
    user = cursor.fetchone()

    if not user or not verify_password(payload.password, user["password_hash"], user["password_salt"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user["password_salt"]:
        salt, pwd_hash = hash_password_secure(payload.password)
        cursor.execute(
            "UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?",
            (pwd_hash, salt, user["id"])
        )
        conn.commit()

    conn.close()
    return {"status": "success", "user": {"name": user["name"], "email": user["email"]}}


@app.post("/api/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    init_all_tables()
    email = validate_email(payload.email)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email FROM users WHERE lower(email) = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        # For security, still return success even if email doesn't exist
        return {"status": "success", "message": "If the email exists, a password reset link has been sent."}

    # Generate a reset token (simple implementation - in production, use proper token with expiry)
    reset_token = secrets.token_urlsafe(32)
    
    # Store the reset token in the database (you'd need a password_resets table for this)
    # For now, we'll just return the token for testing purposes
    # In production, you would:
    # 1. Store the token in a password_resets table with expiry
    # 2. Send an email with the reset link
    # 3. Have a separate endpoint to validate the token and reset the password
    
    return {
        "status": "success",
        "message": "Password reset token generated (for testing: " + reset_token + ")",
        "token": reset_token
    }


@app.post("/api/auth/reset-password")
def reset_password(payload: ResetPasswordRequest):
    init_all_tables()
    
    # In production, you would validate the token from the password_resets table
    # For now, we'll just simulate the reset
    
    # Validate password strength
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    
    return {"status": "success", "message": "Password has been reset successfully."}


# --------------------------------------------------
# PREDICTION ENDPOINTS  (unchanged behaviour)
# --------------------------------------------------

@app.post("/api/predict/price")
def predict_price(payload: PredictionRequest):
    global price_model
    if price_model is None:
        load_models()
        if price_model is None:
            raise HTTPException(status_code=503, detail="Price model not loaded. Run train_price_model.py first.")
    try:
        df = build_feature_df(payload)
        predicted_value = price_model.predict(df)[0]
        country_info = COUNTRIES.get(payload.Country, COUNTRIES["United States"])
        return {
            "value":    int(round(float(predicted_value))),
            "symbol":   country_info["symbol"],
            "currency": country_info["currency"],
            "rate":     country_info["rate"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price prediction error: {str(e)}")


@app.post("/api/predict/dna")
def predict_dna(payload: PredictionRequest):
    global dna_model
    if dna_model is None:
        load_models()
        if dna_model is None:
            raise HTTPException(status_code=503, detail="DNA model not loaded. Run train_dna_model.py first.")
    try:
        df = build_feature_df(payload)
        dna_score = dna_model.predict(df)[0]
        return {"PropertyDNA_Score": round(float(dna_score), 2)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DNA prediction error: {str(e)}")


@app.post("/api/predict/age")
def predict_age(payload: PredictAgeRequest):
    global age_model
    if age_model is None:
        load_models()
        if age_model is None:
            raise HTTPException(status_code=503, detail="Age model not loaded. Run train_model.py first.")
    try:
        df = pd.DataFrame([{
            "rooms":      payload.rooms,
            "size_sqft":  payload.size,
            "material":   payload.material,
            "location":   payload.location,
            "renovation": payload.renovation,
        }])
        predicted_val = age_model.predict(df)[0]
        return {"predictedAge": max(0, int(round(predicted_val)))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Age prediction error: {str(e)}")


# --------------------------------------------------
# USER PROFILE ENDPOINTS
# --------------------------------------------------

@app.get("/api/user/by-email/{email}")
def get_user_by_email(email: str):
    try:
        row = get_or_create_user_record(email)
        return {"success": True, "user": {"name": row["name"], "email": row["email"]}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")



@app.get("/api/user/{user_id}")
def get_user(user_id: int):
    conn = get_db()
    try:
        require_user(conn, user_id)
        row = conn.execute(
            "SELECT id, name, email, created_at FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()
        return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.get("/api/user/{user_id}/stats")
def get_user_stats(user_id: int):
    conn = get_db()
    try:
        require_user(conn, user_id)

        pred = conn.execute("""
            SELECT
                COUNT(*)                          AS total_predictions,
                COALESCE(AVG(predicted_price), 0) AS avg_price,
                COALESCE(AVG(dna_score), 0)       AS avg_dna_score,
                COUNT(DISTINCT NULLIF(country,'')) AS countries_analyzed
            FROM saved_predictions
            WHERE user_id = ?
        """, (user_id,)).fetchone()

        reports_count = conn.execute(
            "SELECT COUNT(*) FROM saved_reports WHERE user_id = ?", (user_id,)
        ).fetchone()[0]

        favorites_count = conn.execute(
            "SELECT COUNT(*) FROM favorites WHERE user_id = ?", (user_id,)
        ).fetchone()[0]

        portfolio_count = conn.execute(
            "SELECT COUNT(*) FROM portfolio WHERE user_id = ?", (user_id,)
        ).fetchone()[0]

        return {
            "total_predictions":  pred["total_predictions"],
            "avg_price":          round(pred["avg_price"], 2),
            "avg_dna_score":      round(pred["avg_dna_score"], 2),
            "countries_analyzed": pred["countries_analyzed"],
            "saved_reports":      reports_count,
            "favorites":          favorites_count,
            "portfolio_count":    portfolio_count,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.get("/api/user/by-email/{email}/stats")
def get_user_stats_by_email(email: str):
    conn = get_db()
    try:
        print(f"[DEBUG] get_user_stats_by_email - email: {email}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] get_user_stats_by_email - resolved user_id: {user_id}")

        pred = conn.execute("""
            SELECT
                COUNT(*)                          AS total_predictions,
                COALESCE(AVG(predicted_price), 0) AS avg_price,
                COALESCE(AVG(dna_score), 0)       AS avg_dna_score,
                COUNT(DISTINCT NULLIF(country,'')) AS countries_analyzed
            FROM saved_predictions
            WHERE user_id = ?
        """, (user_id,)).fetchone()

        reports_count = conn.execute(
            "SELECT COUNT(*) FROM saved_reports WHERE user_id = ?", (user_id,)
        ).fetchone()[0]

        favorites_count = conn.execute(
            "SELECT COUNT(*) FROM favorites WHERE user_id = ?", (user_id,)
        ).fetchone()[0]

        portfolio_count = conn.execute(
            "SELECT COUNT(*) FROM portfolio WHERE user_id = ?", (user_id,)
        ).fetchone()[0]

        return {
            "total_predictions":  pred["total_predictions"],
            "avg_price":          round(pred["avg_price"], 2),
            "avg_dna_score":      round(pred["avg_dna_score"], 2),
            "countries_analyzed": pred["countries_analyzed"],
            "saved_reports":      reports_count,
            "favorites":          favorites_count,
            "portfolio_count":    portfolio_count,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


# --------------------------------------------------
# PREDICTIONS ENDPOINTS
# --------------------------------------------------

@app.get("/api/user/{user_id}/predictions")
def get_predictions(user_id: int):
    conn = get_db()
    try:
        require_user(conn, user_id)
        rows = conn.execute("""
            SELECT id, predicted_price, predicted_age, dna_score,
                   country, state, city, created_at
            FROM saved_predictions
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        return [dict(r) for r in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.get("/api/user/by-email/{email}/predictions")
def get_predictions_by_email(email: str):
    conn = get_db()
    try:
        print(f"[DEBUG] Fetching predictions for email: {email}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] Found user_id: {user_id}")
        
        rows = conn.execute("""
            SELECT id, predicted_price, predicted_age, dna_score,
                   country, state, city, created_at
            FROM saved_predictions
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        print(f"[DEBUG] Found {len(rows)} predictions for user_id {user_id}")
        result = [dict(r) for r in rows]
        print(f"[DEBUG] Returning predictions: {result}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DEBUG] Error fetching predictions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.post("/api/user/{user_id}/predictions")
def save_prediction(user_id: int, payload: SavePredictionRequest):
    if payload.user_id != user_id:
        raise HTTPException(status_code=400, detail="user_id in body must match URL parameter.")
    conn = sqlite3.connect(DB_PATH)
    try:
        require_user(conn, user_id)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO saved_predictions
                (user_id, predicted_price, predicted_age, dna_score,
                 country, state, city,
                 year_built, rooms, size_sqft, material, location, renovation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            payload.predicted_price, payload.predicted_age, payload.dna_score,
            payload.country, payload.state, payload.city,
            payload.year_built or 0, payload.rooms or 0, payload.size_sqft or 0,
            payload.material or "", payload.location or "", payload.renovation or ""
        ))
        conn.commit()
        return {"status": "success", "prediction_id": cursor.lastrowid}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save prediction: {str(e)}")
    finally:
        conn.close()


@app.post("/api/user/by-email/{email}/predictions")
def save_prediction_by_email(email: str, payload: SavePredictionRequest):
    conn = get_db()
    try:
        print(f"[DEBUG] Saving prediction for email: {email}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] Found user_id: {user_id}")
        
        require_user(conn, user_id)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO saved_predictions
                (user_id, predicted_price, predicted_age, dna_score,
                 country, state, city,
                 year_built, rooms, size_sqft, material, location, renovation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            payload.predicted_price, payload.predicted_age, payload.dna_score,
            payload.country, payload.state, payload.city,
            payload.year_built or 0, payload.rooms or 0, payload.size_sqft or 0,
            payload.material or "", payload.location or "", payload.renovation or ""
        ))
        conn.commit()
        prediction_id = cursor.lastrowid
        print(f"[DEBUG] Prediction inserted with ID: {prediction_id}")
        return {"status": "success", "prediction_id": prediction_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DEBUG] Error saving prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save prediction: {str(e)}")
    finally:
        conn.close()


# Legacy endpoint kept for backward compat with existing frontend code
@app.post("/api/dashboard/predictions")
def save_prediction_legacy(payload: SavePredictionRequest):
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO saved_predictions
                (user_id, predicted_price, predicted_age, dna_score,
                 country, state, city,
                 year_built, rooms, size_sqft, material, location, renovation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.user_id,
            payload.predicted_price, payload.predicted_age,
            payload.dna_score if payload.dna_score else 0,
            payload.country if payload.country else "",
            payload.state   if payload.state   else "",
            payload.city    if payload.city    else "",
            payload.year_built or 0, payload.rooms or 0,
            payload.size_sqft or 0, payload.material or "",
            payload.location or "", payload.renovation or ""
        ))
        conn.commit()
        return {"status": "success", "prediction_id": cursor.lastrowid, "message": "Prediction saved."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save prediction: {str(e)}")
    finally:
        conn.close()


@app.get("/api/dashboard/predictions")
def get_predictions_legacy(user_id: int):
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT id, predicted_price, predicted_age, dna_score,
                   country, state, city, created_at,
                   year_built, rooms, size_sqft, material, location, renovation
            FROM saved_predictions
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


# --------------------------------------------------
# PORTFOLIO ENDPOINTS
# --------------------------------------------------

@app.get("/api/user/{user_id}/portfolio")
def get_portfolio(user_id: int):
    conn = get_db()
    try:
        require_user(conn, user_id)
        rows = conn.execute("""
            SELECT id, property_name, city, state, country, predicted_price, dna_score, notes,
                   property_type, year_built, house_size_sqft, bedrooms, bathrooms, predicted_age,
                   created_at
            FROM portfolio
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        return [dict(r) for r in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.get("/api/user/by-email/{email}/portfolio")
def get_portfolio_by_email(email: str):
    conn = get_db()
    try:
        print(f"[DEBUG] get_portfolio_by_email - email: {email}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] get_portfolio_by_email - resolved user_id: {user_id}")
        
        rows = conn.execute("""
            SELECT id, property_name, city, state, country, predicted_price, dna_score, notes,
                   property_type, year_built, house_size_sqft, bedrooms, bathrooms, predicted_age,
                   created_at
            FROM portfolio
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        print(f"[DEBUG] get_portfolio_by_email - returning {len(rows)} portfolio items")
        return [dict(r) for r in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.post("/api/user/{user_id}/portfolio")
def add_portfolio(user_id: int, payload: PortfolioAddRequest):
    conn = sqlite3.connect(DB_PATH)
    try:
        require_user(conn, user_id)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO portfolio (
                user_id, property_name, city, state, country, predicted_price, dna_score, notes,
                property_type, year_built, house_size_sqft, bedrooms, bathrooms, predicted_age
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, payload.property_name or "", payload.city, payload.state, payload.country,
            payload.predicted_price, payload.dna_score, payload.notes,
            payload.property_type or "", payload.year_built or 0, payload.house_size_sqft or 0,
            payload.bedrooms or 0, payload.bathrooms or 0, payload.predicted_age or 0
        ))
        conn.commit()
        return {"status": "success", "id": cursor.lastrowid}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add portfolio item: {str(e)}")
    finally:
        conn.close()


@app.post("/api/user/by-email/{email}/portfolio")
def add_portfolio_by_email(email: str, payload: PortfolioAddRequest):
    conn = get_db()
    try:
        print(f"[DEBUG] add_portfolio_by_email - email: {email}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] add_portfolio_by_email - resolved user_id: {user_id}")
        
        require_user(conn, user_id)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO portfolio (
                user_id, property_name, city, state, country, predicted_price, dna_score, notes,
                property_type, year_built, house_size_sqft, bedrooms, bathrooms, predicted_age
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, payload.property_name or "", payload.city, payload.state, payload.country,
            payload.predicted_price, payload.dna_score, payload.notes,
            payload.property_type or "", payload.year_built or 0, payload.house_size_sqft or 0,
            payload.bedrooms or 0, payload.bathrooms or 0, payload.predicted_age or 0
        ))
        conn.commit()
        portfolio_id = cursor.lastrowid
        print(f"[DEBUG] add_portfolio_by_email - inserted portfolio item with ID: {portfolio_id}")
        return {"status": "success", "id": portfolio_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add portfolio item: {str(e)}")
    finally:
        conn.close()


@app.delete("/api/user/{user_id}/portfolio/{item_id}")
def delete_portfolio(user_id: int, item_id: int):
    conn = sqlite3.connect(DB_PATH)
    try:
        require_user(conn, user_id)
        result = conn.execute(
            "DELETE FROM portfolio WHERE id = ? AND user_id = ?", (item_id, user_id)
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Portfolio item not found.")
        return {"status": "success", "message": "Portfolio item deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.delete("/api/user/by-email/{email}/portfolio/{item_id}")
def delete_portfolio_by_email(email: str, item_id: int):
    conn = get_db()
    try:
        print(f"[DEBUG] delete_portfolio_by_email - email: {email}, item_id: {item_id}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] delete_portfolio_by_email - resolved user_id: {user_id}")
        
        require_user(conn, user_id)
        result = conn.execute(
            "DELETE FROM portfolio WHERE id = ? AND user_id = ?", (item_id, user_id)
        )
        conn.commit()
        print(f"[DEBUG] delete_portfolio_by_email - deleted {result.rowcount} portfolio items")
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Portfolio item not found.")
        return {"status": "success", "message": "Portfolio item deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


# --------------------------------------------------
# FAVORITES ENDPOINTS
# --------------------------------------------------

@app.get("/api/user/{user_id}/favorites")
def get_favorites(user_id: int):
    conn = get_db()
    try:
        require_user(conn, user_id)
        rows = conn.execute("""
            SELECT id, city, state, country, dna_score, predicted_price, created_at
            FROM favorites
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        return [dict(r) for r in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.get("/api/user/by-email/{email}/favorites")
def get_favorites_by_email(email: str):
    conn = get_db()
    try:
        print(f"[DEBUG] get_favorites_by_email - email: {email}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] get_favorites_by_email - resolved user_id: {user_id}")
        
        rows = conn.execute("""
            SELECT id, city, state, country, dna_score, predicted_price, created_at
            FROM favorites
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        print(f"[DEBUG] get_favorites_by_email - returning {len(rows)} favorites")
        return [dict(r) for r in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.post("/api/user/{user_id}/favorites")
def add_favorite(user_id: int, payload: FavoriteAddRequest):
    conn = sqlite3.connect(DB_PATH)
    try:
        require_user(conn, user_id)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO favorites (user_id, city, state, country, dna_score, predicted_price)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, payload.city, payload.state, payload.country,
              payload.dna_score, payload.predicted_price))
        conn.commit()
        return {"status": "success", "id": cursor.lastrowid}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add favorite: {str(e)}")
    finally:
        conn.close()


@app.post("/api/user/by-email/{email}/favorites")
def add_favorite_by_email(email: str, payload: FavoriteAddRequest):
    conn = get_db()
    try:
        print(f"[DEBUG] add_favorite_by_email - email: {email}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] add_favorite_by_email - resolved user_id: {user_id}")
        
        require_user(conn, user_id)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO favorites (user_id, city, state, country, dna_score, predicted_price)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, payload.city, payload.state, payload.country,
              payload.dna_score, payload.predicted_price))
        conn.commit()
        favorite_id = cursor.lastrowid
        print(f"[DEBUG] add_favorite_by_email - inserted favorite with ID: {favorite_id}")
        return {"status": "success", "id": favorite_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add favorite: {str(e)}")
    finally:
        conn.close()


@app.delete("/api/user/{user_id}/favorites/{item_id}")
def delete_favorite(user_id: int, item_id: int):
    conn = sqlite3.connect(DB_PATH)
    try:
        require_user(conn, user_id)
        result = conn.execute(
            "DELETE FROM favorites WHERE id = ? AND user_id = ?", (item_id, user_id)
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Favorite not found.")
        return {"status": "success", "message": "Favorite deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.delete("/api/user/by-email/{email}/favorites/{item_id}")
def delete_favorite_by_email(email: str, item_id: int):
    conn = get_db()
    try:
        print(f"[DEBUG] delete_favorite_by_email - email: {email}, item_id: {item_id}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] delete_favorite_by_email - resolved user_id: {user_id}")
        
        require_user(conn, user_id)
        result = conn.execute(
            "DELETE FROM favorites WHERE id = ? AND user_id = ?", (item_id, user_id)
        )
        conn.commit()
        print(f"[DEBUG] delete_favorite_by_email - deleted {result.rowcount} favorites")
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Favorite not found.")
        return {"status": "success", "message": "Favorite deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


# --------------------------------------------------
# REPORTS ENDPOINTS
# --------------------------------------------------

@app.get("/api/user/{user_id}/reports")
def get_reports(user_id: int):
    conn = get_db()
    try:
        require_user(conn, user_id)
        rows = conn.execute("""
            SELECT id, report_name, country, state, city,
                   predicted_price, dna_score, predicted_age, created_at
            FROM saved_reports
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        return [dict(r) for r in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.get("/api/user/by-email/{email}/reports")
def get_reports_by_email(email: str):
    conn = get_db()
    try:
        print(f"[DEBUG] get_reports_by_email - email: {email}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] get_reports_by_email - resolved user_id: {user_id}")
        
        rows = conn.execute("""
            SELECT id, report_name, country, state, city,
                   predicted_price, dna_score, predicted_age, created_at
            FROM saved_reports
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        print(f"[DEBUG] get_reports_by_email - returning {len(rows)} reports")
        return [dict(r) for r in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.post("/api/user/{user_id}/reports")
def save_report(user_id: int, payload: ReportSaveRequest):
    conn = sqlite3.connect(DB_PATH)
    try:
        require_user(conn, user_id)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO saved_reports
                (user_id, report_name, country, state, city, predicted_price, dna_score, predicted_age)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, payload.report_name, payload.country, payload.state,
              payload.city, payload.predicted_price, payload.dna_score, payload.predicted_age))
        conn.commit()
        return {"status": "success", "id": cursor.lastrowid}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save report: {str(e)}")
    finally:
        conn.close()


@app.post("/api/user/by-email/{email}/reports")
def save_report_by_email(email: str, payload: ReportSaveRequest):
    conn = get_db()
    try:
        print(f"[DEBUG] save_report_by_email - email: {email}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] save_report_by_email - resolved user_id: {user_id}")
        
        require_user(conn, user_id)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO saved_reports
                (user_id, report_name, country, state, city, predicted_price, dna_score, predicted_age)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, payload.report_name, payload.country, payload.state,
              payload.city, payload.predicted_price, payload.dna_score, payload.predicted_age))
        conn.commit()
        report_id = cursor.lastrowid
        print(f"[DEBUG] save_report_by_email - inserted report with ID: {report_id}")
        return {"status": "success", "id": report_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save report: {str(e)}")
    finally:
        conn.close()


@app.delete("/api/user/{user_id}/reports/{item_id}")
def delete_report(user_id: int, item_id: int):
    conn = sqlite3.connect(DB_PATH)
    try:
        require_user(conn, user_id)
        result = conn.execute(
            "DELETE FROM saved_reports WHERE id = ? AND user_id = ?", (item_id, user_id)
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Report not found.")
        return {"status": "success", "message": "Report deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.delete("/api/user/by-email/{email}/reports/{item_id}")
def delete_report_by_email(email: str, item_id: int):
    conn = get_db()
    try:
        print(f"[DEBUG] delete_report_by_email - email: {email}, item_id: {item_id}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] delete_report_by_email - resolved user_id: {user_id}")
        
        require_user(conn, user_id)
        result = conn.execute(
            "DELETE FROM saved_reports WHERE id = ? AND user_id = ?", (item_id, user_id)
        )
        conn.commit()
        print(f"[DEBUG] delete_report_by_email - deleted {result.rowcount} reports")
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Report not found.")
        return {"status": "success", "message": "Report deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.delete("/api/user/{user_id}/reset")
def reset_user_data(user_id: int):
    conn = sqlite3.connect(DB_PATH)
    try:
        require_user(conn, user_id)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM saved_predictions WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM portfolio WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM favorites WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM saved_reports WHERE user_id = ?", (user_id,))
        conn.commit()
        return {"status": "success", "message": "All user data has been deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@app.delete("/api/user/by-email/{email}/reset")
def reset_user_data_by_email(email: str):
    conn = get_db()
    try:
        print(f"[DEBUG] reset_user_data_by_email - email: {email}")
        user_id = get_user_id_by_email(email)
        print(f"[DEBUG] reset_user_data_by_email - resolved user_id: {user_id}")
        
        cursor = conn.cursor()
        cursor.execute("DELETE FROM saved_predictions WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM portfolio WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM favorites WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM saved_reports WHERE user_id = ?", (user_id,))
        conn.commit()
        print(f"[DEBUG] reset_user_data_by_email - deleted all data for user_id {user_id}")
        return {"status": "success", "message": "All user data has been deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


# --------------------------------------------------
# CSV UPLOAD & TRAINING ENDPOINTS
# --------------------------------------------------

@app.get("/api/train/status")
def get_training_status():
    global is_training
    return {"status": "training" if is_training else "idle"}


@app.post("/api/train/upload")
async def upload_csv(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    global is_training
    if is_training:
        raise HTTPException(status_code=409, detail="Model is already retraining. Please wait.")
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a CSV.")
    try:
        os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
        with open(CSV_PATH, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        background_tasks.add_task(retrain_and_load)
        return {"status": "success", "message": "CSV uploaded. Retraining model in background."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File saving error: {str(e)}")


@app.get("/debug/users")
def debug_users():
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT id, name, email FROM users ORDER BY id DESC"
        ).fetchall()

        return [dict(r) for r in rows]
    finally:
        conn.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
