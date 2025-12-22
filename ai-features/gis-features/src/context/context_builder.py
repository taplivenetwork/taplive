def build_context(user: dict, gis: dict, weather: dict) -> dict:
    """
    Build a structured context dict for AI reasoning.
    """
    return {
        "task_context": {
            "task": user["task"],
            "time_window": user["time_window"]
        },
        "location": user["location"],
        "gis": {
            "area_type": gis["area_type"],
            "risk_notes": gis["risk_notes"]
        },
        "weather": {
            "temperature": weather["temperature"],
            "wind_speed": weather["wind_speed"],
            "rain_risk": weather["rain_risk"]
        }
    }

