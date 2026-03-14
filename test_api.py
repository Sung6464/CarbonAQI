"""
CarbonLoop — API Tests
Run: python test_api.py  (make sure app.py is running first)
"""

import requests
import json

BASE = "http://localhost:5000"
USER = "test_user_01"

def pretty(label, res):
    print(f"\n{'='*50}")
    print(f"  {label}  [{res.status_code}]")
    print('='*50)
    print(json.dumps(res.json(), indent=2))

# 1. Health check
pretty("GET /health", requests.get(f"{BASE}/health"))

# 2. Get emission factors
pretty("GET /api/factors", requests.get(f"{BASE}/api/factors"))

# 3. Log an activity (car + beef + high energy)
pretty("POST /api/log — car + beef + high energy", requests.post(f"{BASE}/api/log", json={
    "user_id":        USER,
    "transport_mode": "car",
    "distance_km":    15,
    "meal_type":      "beef",
    "energy_kwh":     12
}))

# 4. Log again (metro + veg + low energy) to build streak
pretty("POST /api/log — metro + veg + low energy", requests.post(f"{BASE}/api/log", json={
    "user_id":        USER,
    "transport_mode": "metro",
    "distance_km":    10,
    "meal_type":      "veg",
    "energy_kwh":     5
}))

# 5. Get nudges
pretty(f"GET /api/nudges/{USER}", requests.get(f"{BASE}/api/nudges/{USER}"))

# 6. Get dashboard
pretty(f"GET /api/dashboard/{USER}", requests.get(f"{BASE}/api/dashboard/{USER}"))

# 7. Get history
pretty(f"GET /api/history/{USER}", requests.get(f"{BASE}/api/history/{USER}"))

# 8. Get streak
pretty(f"GET /api/streak/{USER}", requests.get(f"{BASE}/api/streak/{USER}"))

# 9. Test validation error
pretty("POST /api/log — invalid transport", requests.post(f"{BASE}/api/log", json={
    "user_id":        USER,
    "transport_mode": "rocket",
    "distance_km":    10,
    "meal_type":      "veg",
    "energy_kwh":     5
}))

print("\n✅ All tests done!\n")
