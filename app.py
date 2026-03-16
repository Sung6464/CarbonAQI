"""
CarbonIQ — Flask Backend
Run: python app.py
API base: http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, date, timedelta
import json
import os
import sys
import uuid
import requests
from dotenv import load_dotenv
from functools import wraps

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import auth

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

load_dotenv()
CLIMATIQ_API_KEY = os.getenv("CLIMATIQ_API_KEY")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_firebase_credentials():
    """Load Firebase Admin credentials from env vars or a local dev file."""
    credentials_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if credentials_json:
        return credentials.Certificate(json.loads(credentials_json))

    credentials_path = (
        os.getenv("FIREBASE_CREDENTIALS_PATH")
        or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    )
    if credentials_path:
        return credentials.Certificate(credentials_path)

    local_credentials_path = os.path.join(BASE_DIR, "firebase_key.json")
    if os.path.exists(local_credentials_path):
        return credentials.Certificate(local_credentials_path)

    raise FileNotFoundError(
        "Firebase credentials not found. Set FIREBASE_CREDENTIALS_JSON, "
        "FIREBASE_CREDENTIALS_PATH, or GOOGLE_APPLICATION_CREDENTIALS."
    )

# Initialize Firebase Admin
try:
    cred = load_firebase_credentials()
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Successfully connected to Firebase Firestore!")
except Exception as e:
    print(f"❌ Failed to connect to Firebase: {e}")
    db = None

app = Flask(__name__)
# Update CORS to allow your Vercel frontend
CORS(app, resources={
    r"/*": {
        "origins": [
            r"https://.*\.vercel\.app",
            "https://carboniq.onrender.com",
            "http://localhost:3000",
            r"http://localhost:517\d",
            r"http://127\.0\.0\.1:517\d",
        ]
    }
})  # allow React frontend to call this API

# Production settings
if os.environ.get("FLASK_ENV") == "production":
    app.config["DEBUG"] = False
    app.config["TESTING"] = False

# ── Load emission factors ────────────────────────────────────────────────────

with open(os.path.join(BASE_DIR, "emission_factors.json")) as f:
    FACTORS = json.load(f)

# ── Firestore DB (Replaces in-memory DB) ────────────
# Collection: "users"
# Document structure: { "logs": [...], "streak": int, "best_streak": int, "last_log_date": str, "company_id": str, "role": "employee"|"admin", "account_type": "individual"|"company" }
# Collection: "companies"
# Document structure: { "name": str, "admin_id": str, "employees": [user_id], "created_at": timestamp }

def get_user(user_id):
    default_user = {
        "logs": [],
        "streak": 0,
        "best_streak": 0,
        "last_log_date": None,
        "company_id": None,
        "role": "employee",
        "account_type": "individual",
    }
    if not db:
        return default_user.copy()

    try:
        doc = db.collection('users').document(user_id).get()
        if doc.exists:
            user = doc.to_dict()
            for key, value in default_user.items():
                user.setdefault(key, value)
            return user
        else:
            # Create new user document
            new_user = default_user.copy()
            db.collection('users').document(user_id).set(new_user)
            return new_user
    except Exception as e:
        print(f"Error getting user {user_id}: {e}")
        return default_user.copy()

def get_company(company_id):
    if not db:
        return None

    try:
        doc = db.collection('companies').document(company_id).get()
        return doc.to_dict() if doc.exists else None
    except Exception as e:
        print(f"Error getting company {company_id}: {e}")
        return None

def save_user(user_id, user_data):
    if db:
        try:
            db.collection('users').document(user_id).set(user_data)
        except Exception as e:
            print(f"Error saving user {user_id}: {e}")

def save_company(company_id, company_data):
    if db:
        try:
            db.collection('companies').document(company_id).set(company_data)
        except Exception as e:
            print(f"Error saving company {company_id}: {e}")


CLIMATIQ_MAPPINGS = {
    "transport": {
        "metro": {"activity_id": "passenger_train-route_type_subway_tram-fuel_source_na", "data_version": "^5"},
        "bus": {"activity_id": "passenger_vehicle-vehicle_type_bus-fuel_source_na-distance_na-engine_size_na", "data_version": "^5"},
        "car": {"activity_id": "passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na", "data_version": "^5"},
        "ev": {"activity_id": "passenger_vehicle-vehicle_type_car-fuel_source_bev-engine_size_na-vehicle_age_na-vehicle_weight_na", "data_version": "^5"},
        "flight": {"activity_id": "passenger_flight-route_type_domestic-aircraft_type_na-distance_na-class_na-rf_included-distance_uplift_included", "data_version": "^5"}
    },
    "food": {
        "vegan": {"activity_id": "diet_type-diet_vegan", "data_version": "^5"},
        "veg": {"activity_id": "diet_type-diet_vegetarian", "data_version": "^5"},
        "fish": {"activity_id": "diet_type-diet_fish_eater", "data_version": "^5"},
        "chicken": {"activity_id": "diet_type-diet_meat_eater-meat_consumption_low", "data_version": "^5"},
        "beef": {"activity_id": "diet_type-diet_meat_eater-meat_consumption_high", "data_version": "^5"}
    },
    "energy": {
        "grid": {"activity_id": "electricity-energy_source_grid_mix", "data_version": "^5", "region": "IN"}
    }
}


# ── Helper: calculate CO2 breakdown ─────────────────────────────────────────

def calculate_co2(transport_mode, distance_km, meal_type, energy_kwh):
    transport_co2 = 0.0
    food_co2 = 0.0
    energy_co2 = 0.0

    if transport_mode in ["walk", "bike"]:
        transport_co2 = 0.0
    else:
        mapping = CLIMATIQ_MAPPINGS["transport"].get(transport_mode)
        if mapping and CLIMATIQ_API_KEY:
            try:
                res = requests.post("https://beta4.api.climatiq.io/estimate", headers={"Authorization": f"Bearer {CLIMATIQ_API_KEY}", "Content-Type": "application/json"}, json={
                    "emission_factor": {
                        "activity_id": mapping["activity_id"],
                        "data_version": mapping["data_version"],
                        "region": mapping.get("region", "GLOBAL")
                    },
                    "parameters": {"distance": float(distance_km), "distance_unit": "km"}
                })
                if res.status_code == 200:
                    transport_co2 = res.json().get("co2e", 0)
                else:
                    print("Transport Climatiq Error:", res.text)
                    transport_co2 = calculate_co2_local(transport_mode, distance_km, meal_type, energy_kwh)["breakdown"]["transport"]
            except Exception as e:
                print("Transport Request Error:", e)
                transport_co2 = calculate_co2_local(transport_mode, distance_km, meal_type, energy_kwh)["breakdown"]["transport"]
        else:
            transport_co2 = calculate_co2_local(transport_mode, distance_km, meal_type, energy_kwh)["breakdown"]["transport"]

    # Food
    mapping = CLIMATIQ_MAPPINGS["food"].get(meal_type)
    if mapping and CLIMATIQ_API_KEY:
        try:
            res = requests.post("https://beta4.api.climatiq.io/estimate", headers={"Authorization": f"Bearer {CLIMATIQ_API_KEY}", "Content-Type": "application/json"}, json={
                "emission_factor": {
                    "activity_id": mapping["activity_id"],
                    "data_version": mapping["data_version"],
                    "region": mapping.get("region", "GLOBAL")
                },
                "parameters": {"money": 1, "money_unit": "usd"}
            })
            if res.status_code == 200:
                food_co2 = res.json().get("co2e", 0)
            else:
                print("Food Climatiq Error:", res.text)
                food_co2 = calculate_co2_local(transport_mode, distance_km, meal_type, energy_kwh)["breakdown"]["food"]
        except Exception as e:
            print("Food Request Error:", e)
            food_co2 = calculate_co2_local(transport_mode, distance_km, meal_type, energy_kwh)["breakdown"]["food"]
    else:
        food_co2 = calculate_co2_local(transport_mode, distance_km, meal_type, energy_kwh)["breakdown"]["food"]

    # Energy
    mapping = CLIMATIQ_MAPPINGS["energy"]["grid"]
    if mapping and CLIMATIQ_API_KEY:
        try:
            res = requests.post("https://beta4.api.climatiq.io/estimate", headers={"Authorization": f"Bearer {CLIMATIQ_API_KEY}", "Content-Type": "application/json"}, json={
                "emission_factor": {
                    "activity_id": mapping["activity_id"],
                    "data_version": mapping["data_version"],
                    "region": mapping.get("region", "IN")
                },
                "parameters": {"energy": float(energy_kwh), "energy_unit": "kWh"}
            })
            if res.status_code == 200:
                energy_co2 = res.json().get("co2e", 0)
            else:
                print("Energy Climatiq Error:", res.text)
                energy_co2 = calculate_co2_local(transport_mode, distance_km, meal_type, energy_kwh)["breakdown"]["energy"]
        except Exception as e:
            print("Energy Request Error:", e)
            energy_co2 = calculate_co2_local(transport_mode, distance_km, meal_type, energy_kwh)["breakdown"]["energy"]
    else:
        energy_co2 = calculate_co2_local(transport_mode, distance_km, meal_type, energy_kwh)["breakdown"]["energy"]

    total_co2 = round(transport_co2 + food_co2 + energy_co2, 2)

    # Plain-language comparison
    km_equiv = round(total_co2 * FACTORS["comparisons"]["km_per_kg_co2_petrol_car"], 1)
    city_avg = FACTORS["comparisons"]["city_daily_avg_kg"]
    pct_vs_city = round((1 - total_co2 / city_avg) * 100, 1)

    return {
        "total_co2": total_co2,
        "breakdown": {
            "transport": round(transport_co2, 2),
            "food":      round(food_co2, 2),
            "energy":    round(energy_co2, 2)
        },
        "comparison": {
            "equivalent_driving_km": km_equiv,
            "pct_vs_city_avg": pct_vs_city,
            "city_avg_kg": city_avg
        }
    }


def calculate_co2_local(transport_mode, distance_km, meal_type, energy_kwh):
    transport_factors = FACTORS["transport"]
    food_factors      = FACTORS["food"]
    energy_factor     = FACTORS["energy"]["kg_per_kwh"]

    transport_co2 = transport_factors.get(transport_mode, {}).get("kg_per_km", 0) * float(distance_km)
    food_co2      = food_factors.get(meal_type, {}).get("kg_co2", 0)
    energy_co2    = float(energy_kwh) * energy_factor
    total_co2     = round(transport_co2 + food_co2 + energy_co2, 2)

    # Plain-language comparison
    km_equiv = round(total_co2 * FACTORS["comparisons"]["km_per_kg_co2_petrol_car"], 1)
    city_avg = FACTORS["comparisons"]["city_daily_avg_kg"]
    pct_vs_city = round((1 - total_co2 / city_avg) * 100, 1)

    return {
        "total_co2": total_co2,
        "breakdown": {
            "transport": round(transport_co2, 2),
            "food":      round(food_co2, 2),
            "energy":    round(energy_co2, 2)
        },
        "comparison": {
            "equivalent_driving_km": km_equiv,
            "pct_vs_city_avg": pct_vs_city,
            "city_avg_kg": city_avg
        }
    }


# ── Helper: generate top 3 nudges ───────────────────────────────────────────

def generate_nudges(breakdown, transport_mode, meal_type, distance_km, energy_kwh):
    nudges = []
    transport_co2 = breakdown["transport"]
    food_co2      = breakdown["food"]
    energy_co2    = breakdown["energy"]

    # Transport nudges
    if transport_mode == "car":
        metro_co2 = FACTORS["transport"]["metro"]["kg_per_km"] * float(distance_km)
        saving = round(transport_co2 - metro_co2, 2)
        nudges.append({
            "category": "Transport",
            "icon": "🚇",
            "title": "Switch to metro tomorrow",
            "description": f"For your {distance_km} km trip, metro emits 80% less than a petrol car.",
            "saving_kg": saving,
            "tag": "Transport"
        })
    elif transport_mode == "flight":
        saving = round(transport_co2 * 0.85, 2)
        nudges.append({
            "category": "Transport",
            "icon": "🚆",
            "title": "Take the train instead of flying",
            "description": "Rail travel emits up to 85% less CO₂ than a domestic flight.",
            "saving_kg": saving,
            "tag": "Transport"
        })

    # Food nudges
    if meal_type == "beef":
        chicken_co2 = FACTORS["food"]["chicken"]["kg_co2"]
        saving = round(food_co2 - chicken_co2, 2)
        nudges.append({
            "category": "Food",
            "icon": "🍗",
            "title": "Swap beef for chicken",
            "description": "Beef produces 27x more emissions than chicken per kg of protein.",
            "saving_kg": saving,
            "tag": "Food"
        })
        veg_saving = round(food_co2 - FACTORS["food"]["veg"]["kg_co2"], 2)
        nudges.append({
            "category": "Food",
            "icon": "🥗",
            "title": "Try a vegetarian meal",
            "description": "A veg meal cuts your food CO₂ by over 90% compared to beef.",
            "saving_kg": veg_saving,
            "tag": "Food"
        })
    elif meal_type == "chicken":
        veg_saving = round(food_co2 - FACTORS["food"]["veg"]["kg_co2"], 2)
        nudges.append({
            "category": "Food",
            "icon": "🥗",
            "title": "Go vegetarian once this week",
            "description": "Swapping one chicken meal for veg saves around 1 kg CO₂.",
            "saving_kg": veg_saving,
            "tag": "Food"
        })

    # Energy nudges
    if float(energy_kwh) > 10:
        saving = round(energy_co2 * 0.2, 2)
        nudges.append({
            "category": "Energy",
            "icon": "🌡️",
            "title": "Lower AC by 2°C tonight",
            "description": "Each degree warmer on AC reduces energy use by ~6%.",
            "saving_kg": saving,
            "tag": "Energy"
        })
    if float(energy_kwh) > 5:
        saving = round(energy_co2 * 0.1, 2)
        nudges.append({
            "category": "Energy",
            "icon": "💡",
            "title": "Switch off standby devices",
            "description": "Standby mode accounts for up to 10% of home electricity use.",
            "saving_kg": saving,
            "tag": "Energy"
        })

    # Sort by saving, return top 3
    nudges.sort(key=lambda x: x["saving_kg"], reverse=True)
    return nudges[:3]


# ── Helper: update streak ────────────────────────────────────────────────────

def update_streak(user):
    today_str = date.today().isoformat()
    last = user.get("last_log_date")

    if last == today_str:
        # Already logged today, no change
        return

    if last == (date.today() - timedelta(days=1)).isoformat():
        user["streak"] = user.get("streak", 0) + 1
    else:
        user["streak"] = 1  # streak broken, reset

    user["best_streak"] = max(user.get("streak", 0), user.get("best_streak", 0))
    user["last_log_date"] = today_str


# ════════════════════════════════════════════════════════════════════════════
# AUTHENTICATION MIDDLEWARE
# ════════════════════════════════════════════════════════════════════════════

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized. Missing or invalid Authorization header."}), 401
        
        token = auth_header.split("Bearer ")[1]
        try:
            # Reject revoked Firebase sessions so forced re-logins take effect immediately.
            decoded_token = auth.verify_id_token(token, check_revoked=True)
            # Inject the verified user's ID into the kwargs so the route can use it securely
            kwargs["user_id"] = decoded_token["uid"]
        except Exception as e:
            print("Token verification failed:", e)
            return jsonify({"error": "Unauthorized. Invalid token."}), 401
            
        return f(*args, **kwargs)
    return decorated_function

# ════════════════════════════════════════════════════════════════════════════
# ROUTES
# ════════════════════════════════════════════════════════════════════════════

# ── POST /api/log ─────────────────────────────────────────────────────────────
@app.route("/api/profile", methods=["POST"])
@require_auth
def update_profile(user_id):
    """Update persisted user preferences such as account type."""
    data = request.get_json() or {}
    account_type = data.get("account_type")

    if account_type not in {"individual", "company"}:
        return jsonify({"error": "Valid account_type required"}), 400

    user = get_user(user_id)
    user["account_type"] = account_type
    save_user(user_id, user)

    return jsonify({"success": True, "account_type": account_type})


@app.route("/api/log", methods=["POST"])
@require_auth
def log_activity(user_id):
    """
    Log a day's activities and get back CO2 breakdown + nudges.

    Request body (JSON):
    {
        "user_id": "abc123",
        "transport_mode": "car",       // walk|bike|metro|bus|car|ev|flight
        "distance_km": 15,
        "meal_type": "chicken",        // vegan|veg|fish|chicken|beef
        "energy_kwh": 8
    }
    """
    data = request.get_json(silent=True) or {}

    if not data:
        return jsonify({"error": "Missing JSON request body."}), 400

    # Validate required fields
    required = ["transport_mode", "distance_km", "meal_type", "energy_kwh"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    # user_id comes securely from the JWT now via @require_auth decorator
    transport_mode = data["transport_mode"]
    distance_km    = data["distance_km"]
    meal_type      = data["meal_type"]
    energy_kwh     = data["energy_kwh"]

    # Validate values
    if transport_mode not in FACTORS["transport"]:
        return jsonify({"error": f"Invalid transport_mode. Choose: {list(FACTORS['transport'].keys())}"}), 400
    if meal_type not in FACTORS["food"]:
        return jsonify({"error": f"Invalid meal_type. Choose: {list(FACTORS['food'].keys())}"}), 400

    # Calculate
    result = calculate_co2(transport_mode, distance_km, meal_type, energy_kwh)
    nudges = generate_nudges(result["breakdown"], transport_mode, meal_type, distance_km, energy_kwh)
    total_co2 = result["total_co2"]

    # Calculate credits earned (kg CO2 saved vs city average)
    city_avg = FACTORS["comparisons"]["city_daily_avg_kg"]
    co2_saved = max(0, city_avg - total_co2)  # Only positive credits
    credits_earned = round(co2_saved * 10, 0)  # 10 credits per kg CO2 saved

    # Save log
    user = get_user(user_id)
    log_entry = {
        "id":             str(uuid.uuid4()),
        "date":           date.today().isoformat(),
        "timestamp":      datetime.now().isoformat(),
        "transport_mode": transport_mode,
        "distance_km":    distance_km,
        "meal_type":      meal_type,
        "energy_kwh":     energy_kwh,
        "credits_earned": credits_earned,
        "co2_saved":      co2_saved,
        **result
    }
    user["logs"].append(log_entry)
    update_streak(user)

    # Update user's total credits
    user["total_credits"] = user.get("total_credits", 0) + credits_earned
    
    save_user(user_id, user)

    return jsonify({
        "success":        True,
        "log_id":         log_entry["id"],
        "total_co2":      result["total_co2"],
        "breakdown":      result["breakdown"],
        "comparison":     result["comparison"],
        "nudges":         nudges,
        "streak":         user["streak"],
        "credits_earned": credits_earned,
        "co2_saved":      co2_saved,
        "total_credits":  user["total_credits"]
    }), 201


# ── GET /api/nudges/<user_id> ─────────────────────────────────────────────────
@app.route("/api/nudges/<ignored_user_id>", methods=["GET"])
@require_auth
def get_nudges(user_id, ignored_user_id=None):
    """Return top 3 nudges based on the user's latest log."""
    user = get_user(user_id)

    if not user["logs"]:
        return jsonify({"error": "No logs found. Please log an activity first."}), 404

    latest = user["logs"][-1]
    nudges = generate_nudges(
        latest["breakdown"],
        latest["transport_mode"],
        latest["meal_type"],
        latest["distance_km"],
        latest["energy_kwh"]
    )

    # Calculate total saveable
    total_saveable = round(sum(n["saving_kg"] for n in nudges), 2)

    # Monthly savings (sum of all logs this month)
    this_month = date.today().strftime("%Y-%m")
    monthly_saved = round(sum(
        FACTORS["comparisons"]["city_daily_avg_kg"] - log["total_co2"]
        for log in user["logs"]
        if log["date"].startswith(this_month)
    ), 2)

    return jsonify({
        "nudges":          nudges,
        "total_saveable":  total_saveable,
        "monthly_saved":   max(monthly_saved, 0),
        "yearly_pace_kg":  round(latest["total_co2"] * 365, 1)
    })


# ── GET /api/history/<user_id> ────────────────────────────────────────────────
@app.route("/api/history/<ignored_user_id>", methods=["GET"])
@require_auth
def get_history(user_id, ignored_user_id=None):
    """Return last 30 days of logs for the progress chart."""
    user = get_user(user_id)
    logs = user["logs"]

    # Last 30 days
    cutoff = (date.today() - timedelta(days=30)).isoformat()
    recent_logs = [log for log in logs if log["date"] >= cutoff]

    # Weekly summary (last 7 days)
    weekly = []
    for i in range(6, -1, -1):
        day = (date.today() - timedelta(days=i)).isoformat()
        day_logs = [l for l in logs if l["date"] == day]
        total = round(sum(l["total_co2"] for l in day_logs), 2) if day_logs else 0
        weekly.append({
            "date":     day,
            "day_label": (date.today() - timedelta(days=i)).strftime("%a"),
            "total_co2": total,
            "logged":    len(day_logs) > 0
        })

    # Monthly aggregate
    monthly_total = round(sum(l["total_co2"] for l in recent_logs), 2)
    monthly_avg   = round(monthly_total / max(len(set(l["date"] for l in recent_logs)), 1), 2)

    # Category breakdown for the month
    monthly_transport = round(sum(l["breakdown"]["transport"] for l in recent_logs), 2)
    monthly_food      = round(sum(l["breakdown"]["food"] for l in recent_logs), 2)
    monthly_energy    = round(sum(l["breakdown"]["energy"] for l in recent_logs), 2)

    return jsonify({
        "weekly":  weekly,
        "monthly": {
            "total_co2":  monthly_total,
            "avg_per_day": monthly_avg,
            "breakdown": {
                "transport": monthly_transport,
                "food":      monthly_food,
                "energy":    monthly_energy
            }
        },
        "logs": recent_logs,
        "credits": {
            "total_credits": user["total_credits"],
            "recent_credits": [
                {
                    "date": log["date"],
                    "credits_earned": log.get("credits_earned", 0),
                    "co2_saved": log.get("co2_saved", 0)
                }
                for log in recent_logs if log.get("credits_earned", 0) > 0
            ]
        }
    })


# ── GET /api/streak/<user_id> ─────────────────────────────────────────────────
@app.route("/api/streak/<ignored_user_id>", methods=["GET"])
@require_auth
def get_streak(user_id, ignored_user_id=None):
    """Return current and best streak."""
    user = get_user(user_id)
    return jsonify({
        "current_streak": user["streak"],
        "best_streak":    user["best_streak"],
        "last_log_date":  user["last_log_date"]
    })


# ── GET /api/factors ──────────────────────────────────────────────────────────
@app.route("/api/factors", methods=["GET"])
def get_factors():
    """Return all emission factors — used by the frontend for dropdowns."""
    return jsonify(FACTORS)


# ── GET /api/dashboard/<user_id> ─────────────────────────────────────────────
@app.route("/api/dashboard/<ignored_user_id>", methods=["GET"])
@require_auth
def get_dashboard(user_id, ignored_user_id=None):
    """One call to get everything the dashboard needs."""
    user = get_user(user_id)

    today_str  = date.today().isoformat()
    today_logs = [l for l in user["logs"] if l["date"] == today_str]

    if not today_logs:
        return jsonify({
            "logged_today": False,
            "streak":       user["streak"],
            "message":      "No log yet today. Go log your activities!",
            "company_id":   user.get("company_id"),
            "role":         user.get("role", "employee"),
            "account_type": user.get("account_type", "individual"),
        })

    total_co2 = round(sum(log["total_co2"] for log in today_logs), 2)
    breakdown = {
        "transport": round(sum(log["breakdown"]["transport"] for log in today_logs), 2),
        "food": round(sum(log["breakdown"]["food"] for log in today_logs), 2),
        "energy": round(sum(log["breakdown"]["energy"] for log in today_logs), 2),
    }
    city_avg   = FACTORS["comparisons"]["city_daily_avg_kg"]
    pct_vs_avg = round((1 - total_co2 / city_avg) * 100, 1)

    return jsonify({
        "logged_today":   True,
        "total_co2":      total_co2,
        "breakdown":      breakdown,
        "comparison": {
            "pct_vs_city_avg":       pct_vs_avg,
            "equivalent_driving_km": round(total_co2 * 7.6, 1),
            "city_avg_kg":           city_avg
        },
        "streak":         user["streak"],
        "best_streak":    user["best_streak"],
        "yearly_pace_tonnes": round(total_co2 * 365 / 1000, 2),
        "company_id":     user.get("company_id"),
        "role":           user.get("role", "employee"),
        "account_type":   user.get("account_type", "individual"),
    })


# ── GET / ─────────────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "CarbonIQ API is running. See /health for status."})


# ── GET /health ───────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "CarbonIQ API", "version": "1.0.0"})


# ── POST /api/company ──────────────────────────────────────────────────────────
@app.route("/api/company", methods=["POST"])
@require_auth
def create_company(user_id):
    """Create a new company (admin only)"""
    data = request.get_json()
    company_name = data.get('name')

    if not company_name:
        return jsonify({"error": "Company name required"}), 400

    # Check if user already has a company
    user = get_user(user_id)
    if user.get('company_id'):
        return jsonify({"error": "User already belongs to a company"}), 400

    # Create company
    company_id = str(uuid.uuid4())
    company_data = {
        "name": company_name,
        "admin_id": user_id,
        "employees": [],  # Only non-admin employees
        "created_at": datetime.now()
    }
    save_company(company_id, company_data)

    # Update user
    user['company_id'] = company_id
    user['role'] = 'admin'
    save_user(user_id, user)

    return jsonify({"company_id": company_id, "message": "Company created successfully"})


# ── POST /api/company/join ────────────────────────────────────────────────────
@app.route("/api/company/join", methods=["POST"])
@require_auth
def join_company(user_id):
    """Join a company using invite code"""
    data = request.get_json()
    company_id = data.get('company_id')

    if not company_id:
        return jsonify({"error": "Company ID required"}), 400

    # Check if user already has a company
    user = get_user(user_id)
    if user.get('company_id'):
        return jsonify({"error": "User already belongs to a company"}), 400

    # Check if company exists
    company = get_company(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    # Add user to company
    company['employees'].append(user_id)
    save_company(company_id, company)

    # Update user
    user['company_id'] = company_id
    user['role'] = 'employee'
    save_user(user_id, user)

    return jsonify({"message": "Successfully joined company"})


# ── GET /api/company/dashboard/<company_id> ───────────────────────────────────
@app.route("/api/company/dashboard/<company_id>", methods=["GET"])
@require_auth
def get_company_dashboard(user_id, company_id):
    """Get company dashboard data (admin only)"""
    user = get_user(user_id)

    # Check permissions - only admin can see company dashboard
    if user.get('company_id') != company_id or user.get('role') != 'admin':
        return jsonify({"error": "Only company admins can view the full dashboard"}), 403

    company = get_company(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    # Employee metrics should only include users who joined via company_id.
    employees_data = []
    total_company_co2 = 0
    active_employees = 0
    cutoff = (date.today() - timedelta(days=30)).isoformat()
    recent_logs = []

    # Add admin data first
    admin = get_user(company['admin_id'])
    today_str = date.today().isoformat()
    admin_today_logs = [l for l in admin["logs"] if l["date"] == today_str]
    monthly_logs = [l for l in admin["logs"] if l["date"] >= cutoff]

    admin_data = {
        "user_id": company['admin_id'],
        "name": "Admin",  # Admin identifier
        "role": "admin",
        "logged_today": len(admin_today_logs) > 0,
        "streak": admin["streak"],
        "best_streak": admin["best_streak"],
        "total_logs": len(admin["logs"]),
        "monthly_co2": round(sum(l["total_co2"] for l in monthly_logs), 2)
    }

    if admin_today_logs:
        today_total = round(sum(log["total_co2"] for log in admin_today_logs), 2)
        admin_data["today_co2"] = today_total
    else:
        admin_data["today_co2"] = 0

    for log in admin["logs"]:
        if log["date"] >= cutoff:
            recent_logs.append({
                "user_id": company['admin_id'],
                "name": "Admin",
                "role": "admin",
                "date": log["date"],
                "total_co2": log["total_co2"],
                "breakdown": log.get("breakdown", {}),
            })
    # Add regular employees
    for emp_id in company['employees']:
        emp = get_user(emp_id)
        today_logs = [l for l in emp["logs"] if l["date"] == today_str]
        monthly_logs = [l for l in emp["logs"] if l["date"] >= cutoff]

        emp_data = {
            "user_id": emp_id,
            "name": f"Employee {emp_id[:8]}",  # Placeholder name
            "role": emp.get('role', 'employee'),
            "logged_today": len(today_logs) > 0,
            "streak": emp["streak"],
            "best_streak": emp["best_streak"],
            "total_logs": len(emp["logs"]),
            "monthly_co2": round(sum(l["total_co2"] for l in monthly_logs), 2)
        }

        if today_logs:
            today_total = round(sum(log["total_co2"] for log in today_logs), 2)
            emp_data["today_co2"] = today_total
            total_company_co2 += today_total
            active_employees += 1
        else:
            emp_data["today_co2"] = 0

        for log in emp["logs"]:
            if log["date"] >= cutoff:
                recent_logs.append({
                    "user_id": emp_id,
                    "name": emp_data["name"],
                    "role": emp_data["role"],
                    "date": log["date"],
                    "total_co2": log["total_co2"],
                    "breakdown": log.get("breakdown", {}),
                })

        employees_data.append(emp_data)

    # Sort by carbon footprint (lowest first = best)
    employees_data.sort(key=lambda x: x["today_co2"])

    recent_logs.sort(key=lambda log: (log["date"], log["total_co2"]), reverse=True)

    return jsonify({
        "company_id": company_id,
        "company_name": company["name"],
        "admin": admin_data,
        "total_employees": len(company["employees"]),
        "active_today": active_employees,
        "total_company_co2": round(total_company_co2, 2),
        "avg_co2_per_employee": round(total_company_co2 / max(active_employees, 1), 2),
        "total_logs_month": sum(len([l for l in get_user(emp_id)["logs"] if l["date"] >= cutoff]) for emp_id in company['employees']),
        "employees": employees_data,
        "leaderboard": employees_data[:5],  # Top 5 lowest emitters
        "recent_logs": recent_logs[:40],
    })


# ── GET /api/company/employees/<company_id> ───────────────────────────────────
@app.route("/api/company/employees/<company_id>", methods=["GET"])
@require_auth
def get_company_employees(user_id, company_id):
    """Get company employees list for users in the company."""
    user = get_user(user_id)

    if user.get('company_id') != company_id:
        return jsonify({"error": "Unauthorized"}), 403

    company = get_company(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    employees = []
    for emp_id in company['employees']:
        emp = get_user(emp_id)
        employees.append({
            "user_id": emp_id,
            "role": emp.get('role', 'employee'),
            "joined_at": emp.get('last_log_date'),  # Placeholder
            "total_logs": len(emp.get('logs', [])),
            "current_streak": emp.get('streak', 0)
        })

    return jsonify({"employees": employees})


# ── GET /api/company/info/<company_id> ─────────────────────────────────────
@app.route("/api/company/info/<company_id>", methods=["GET"])
def get_company_info(company_id):
    """Get basic company info (public endpoint for joining)"""
    company = get_company(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404

    return jsonify({
        "name": company["name"],
        "employee_count": len(company.get("employees", [])),
        "created_at": company.get("created_at")
    })


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n🌿 CarbonIQ API running at http://localhost:{port}\n")
    app.run(debug=False, host="0.0.0.0", port=port)
