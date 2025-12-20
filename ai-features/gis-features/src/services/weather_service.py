import requests
from config.settings import OPEN_METEO_BASE_URL

def get_weather_context(lat: float, lon: float):
    """
    Fetch current weather from Open-Meteo.
    """
    params = {"latitude": lat, "longitude": lon, "current_weather": True}
    response = requests.get(OPEN_METEO_BASE_URL, params=params)
    data = response.json()
    weather = data.get("current_weather", {})
    wind_speed = weather.get("windspeed", 0)
    rain_risk = "High" if wind_speed > 25 else "Low"
    return {
        "temperature": weather.get("temperature", 0),
        "wind_speed": wind_speed,
        "rain_risk": rain_risk
    }
