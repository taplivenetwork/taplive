def build_context(user: dict, gis: dict, weather: dict) -> str:
    """
    Build a plain-language context string for AI reasoning.
    """
    return f"""
Task Context:
- Task: {user['task']}
- Time Window: {user['time_window']}

GIS Analysis:
- Area Type: {gis['area_type']}
- Notes: {gis['risk_notes']}

Weather Analysis:
- Temperature: {weather['temperature']}°C
- Wind Speed: {weather['wind_speed']} km/h
- Rain Risk: {weather['rain_risk']}
"""
