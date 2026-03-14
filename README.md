# CarbonIQ — Python Flask Backend

## Setup & Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server
python app.py

# Server starts at http://localhost:5000
```

---

## API Endpoints

| Method | Endpoint                  | What it does                              |
|--------|---------------------------|-------------------------------------------|
| POST   | `/api/log`                | Log a day's activities, get CO₂ + nudges  |
| GET    | `/api/nudges/<user_id>`   | Get top 3 personalised swap suggestions   |
| GET    | `/api/dashboard/<user_id>`| All data the dashboard needs in one call  |
| GET    | `/api/history/<user_id>`  | Last 30 days of logs + weekly chart data  |
| GET    | `/api/streak/<user_id>`   | Current streak + best streak              |
| GET    | `/api/factors`            | All CO₂ emission factors (for dropdowns)  |
| GET    | `/health`                 | Health check                              |

---

## POST /api/log — Example

**Request:**
```json
{
  "user_id": "user_abc",
  "transport_mode": "car",
  "distance_km": 15,
  "meal_type": "chicken",
  "energy_kwh": 8
}
```

**Transport modes:** `walk` `bike` `metro` `bus` `car` `ev` `flight`

**Meal types:** `vegan` `veg` `fish` `chicken` `beef`

**Response:**
```json
{
  "success": true,
  "total_co2": 5.29,
  "breakdown": {
    "transport": 3.15,
    "food": 1.5,
    "energy": 0.64
  },
  "comparison": {
    "equivalent_driving_km": 40.2,
    "pct_vs_city_avg": 59.0,
    "city_avg_kg": 12.9
  },
  "nudges": [...],
  "streak": 3
}
```

---

## Connecting to React Frontend

In your React wireframe, replace the hardcoded values with API calls:

```js
// Log activity
const res = await fetch("http://localhost:5000/api/log", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: "user_abc",
    transport_mode: transport,
    distance_km: distance,
    meal_type: meal,
    energy_kwh: energy
  })
});
const data = await res.json();
// data.total_co2, data.breakdown, data.nudges, data.streak

// Get dashboard data
const dash = await fetch("http://localhost:5000/api/dashboard/user_abc");
const dashData = await dash.json();
```

---

## File Structure

```
carboniq-backend/
├── app.py               ← Main Flask app (all routes)
├── emission_factors.json← CO₂ data (no API dependency)
├── requirements.txt     ← flask + flask-cors
├── test_api.py          ← Run tests: python test_api.py
└── README.md
```

---

## Note on Database

The backend currently uses **in-memory storage** (a Python dict) — data resets when you restart the server. This is fine for a hackathon demo.

To persist data, swap the `DB` dict for **Firebase Firestore** or **SQLite**:

```python
# SQLite swap (one extra import + 3 lines)
import sqlite3
conn = sqlite3.connect("carboniq.db", check_same_thread=False)
```
