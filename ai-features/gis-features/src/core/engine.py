from inputs.user_input import normalize_user_input
from services.gis_service import get_gis_context
from services.weather_service import get_weather_context
from context.context_builder import build_context
from context.context_formatter import format_context
from reasoning.risk_assessor import assess_risk

def run_risk_engine(
    location: str,
    lat: float,
    lon: float,
    task: str,
    time_window: str,
    risk_tolerance: str,
    mission_criticality: str,
    asset_sensitivity: str
):
    # Normalize user input
    user = normalize_user_input(location, task, time_window)
    
    # Fetch GIS & Weather
    gis = get_gis_context(location)
    weather = get_weather_context(lat, lon)

    # Build structured context
    context = build_context(user, gis, weather)
    context["user_preferences"] = {
        "risk_tolerance": risk_tolerance,
        "mission_criticality": mission_criticality,
        "asset_sensitivity": asset_sensitivity
    }

    # Generate AI decision
    decision = assess_risk(context)

    # Format for display
    formatted_context = format_context(context)

    return {
        "context": context,
        "formatted_context": formatted_context,
        "ai_decision": decision
    }
