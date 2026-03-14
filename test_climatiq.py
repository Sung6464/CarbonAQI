import os
import requests
from dotenv import load_dotenv

# Load the API key from the .env file
load_dotenv()
API_KEY = os.getenv("CLIMATIQ_API_KEY")

if not API_KEY:
    print("Error: CLIMATIQ_API_KEY not found in .env file!")
    exit()

# Set up the request headers
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Example: Calculating the CO2 for a 15km drive in an average petrol car
url = "https://beta4.api.climatiq.io/estimate"

payload = {
    "emission_factor": {
        "activity_id": "passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "data_version": "^5"
    },
    "parameters": {
        "distance": 15,
        "distance_unit": "km"
    }
}

print("Sending request to Climatiq...")
response = requests.post(url, headers=headers, json=payload)

if response.status_code == 200:
    
    data = response.json()
    print("\n✅ Success!")
    print(f"Total CO2: {data['co2e']} kg")
else:
    print(f"\n❌ Error {response.status_code}")
    print(response.json())
