from services.gemini_service import generate_reasoning

def assess_risk(context: dict) -> str:
    """
    Accept structured context dict and return AI reasoning text.
    """
    prompt = f"""
Task: {context['task_context']['task']}
Time Window: {context['task_context']['time_window']}
GIS Area: {context['gis']['area_type']} - {context['gis']['risk_notes']}
Weather: Temp {context['weather']['temperature']}°C, Wind {context['weather']['wind_speed']} km/h, Rain {context['weather']['rain_risk']}
User Preferences: Risk {context['user_preferences']['risk_tolerance']}, Criticality {context['user_preferences']['mission_criticality']}, Sensitivity {context['user_preferences']['asset_sensitivity']}
"""

    return generate_reasoning(prompt)
