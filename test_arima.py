import requests
import json

url = "http://127.0.0.1:8000/arima"
data = {
    "data": {"values": [10, 12, 13, 15, 14, 16, 18, 17, 19, 21]},
    "p": 1,
    "d": 1,
    "q": 1,
    "forecast_steps": 5
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
