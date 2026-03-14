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
import uuid
import requests
from dotenv import load_dotenv
from functools import wraps

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import auth

load_dotenv()
CLIMATIQ_API_KEY = os.getenv("CLIMATIQ_API_KEY")

# Initialize Firebase Admin
try:
    cred = credentials.Certificate('firebase_key.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Successfully connected to Firebase Firestore!")
except Exception as e:
    print(f"❌ Failed to connect to Firebase: {e}")
    db = None

CLIMATIQ_API_KEY = os.getenv("CLIMATIQ_API_KEY")

app = Flask(__name__)
CORS(app)  # allow React frontend to call this API

# ── Load emission factors ────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE_DIR, "emission_factors.json")) as f:
    FACTORS = json.load(f)

# ── Firestore DB (Replaces in-memory DB) ────────────
# Collection: "users" 
# Document structure: { "logs": [...], "streak": int, "best_streak": int, "last_log_date": str }

def get_user(user_id):
    if not db:
        return {"logs": [], "streak": 0, "best_streak": 0, "last_log_date": None}
        
    try:
        user_ref = db.collection('users').document(user_id)
        doc = user_ref.get()
        
        if doc.exists:
            return doc.to_dict()
        else:
            # Create default user profile
            new_user = {"logs": [], "streak": 0, "best_streak": 0, "last_log_date": None}
            user_ref.set(new_user)
            return new_user
    except Exception as e:
        import traceback
        print("FIREBASE GET_USER ERROR:", e)
        traceback.print_exc()
        return {"logs": [], "streak": 0, "best_streak": 0, "last_log_date": None}

def save_user(user_id, user_data):
    if not db:
        return
    try:
        db.collection('users').document(user_id).set(user_data)
    except Exception as e:
        import traceback
        print("FIREBASE SAVE_USER ERROR:", e)
        traceback.print_exc()


import requests
from dotenv import load_dotenv

load_dotenv()
CLIMATIQ_API_KEY = os.getenv("CLIMATIQ_API_KEY")

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
            # Verify the Firebase ID token
            decoded_token = auth.verify_id_token(token)
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
    data = request.get_json()

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
    result   = calculate_co2(transport_mode, distance_km, meal_type, energy_kwh)
    nudges   = generate_nudges(result["breakdown"], transport_mode, meal_type, distance_km, energy_kwh)

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
        **result
    }
    user["logs"].append(log_entry)
    update_streak(user)
    
    save_user(user_id, user)

    return jsonify({
        "success":    True,
        "log_id":     log_entry["id"],
        "total_co2":  result["total_co2"],
        "breakdown":  result["breakdown"],
        "comparison": result["comparison"],
        "nudges":     nudges,
        "streak":     user["streak"]
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
        "logs": recent_logs
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
            "message":      "No log yet today. Go log your activities!"
        })

    latest     = today_logs[-1]
    city_avg   = FACTORS["comparisons"]["city_daily_avg_kg"]
    pct_vs_avg = round((1 - latest["total_co2"] / city_avg) * 100, 1)

    return jsonify({
        "logged_today":   True,
        "total_co2":      latest["total_co2"],
        "breakdown":      latest["breakdown"],
        "comparison": {
            "pct_vs_city_avg":       pct_vs_avg,
            "equivalent_driving_km": round(latest["total_co2"] * 7.6, 1),
            "city_avg_kg":           city_avg
        },
        "streak":         user["streak"],
        "best_streak":    user["best_streak"],
        "yearly_pace_tonnes": round(latest["total_co2"] * 365 / 1000, 2)
    })


# ── GET / ─────────────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "CarbonIQ API is running. See /health for status."})


# ── GET /health ───────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "CarbonIQ API", "version": "1.0.0"})


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🌿 CarbonIQ API running at http://localhost:5000\n")
    app.run(debug=True, port=5000)
