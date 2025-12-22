def format_context(context: dict) -> str:
    """
    Convert structured context dict into a plain-text string for AI.
    """
    return f"""
Task Context:
- Task: {context['task_context']['task']}
- Time Window: {context['task_context']['time_window']}

GIS Analysis:
- Area Type: {context['gis']['area_type']}
- Notes: {context['gis']['risk_notes']}

Weather Analysis:
- Temperature: {context['weather']['temperature']}°C
- Wind Speed: {context['weather']['wind_speed']} km/h
- Rain Risk: {context['weather']['rain_risk']}
"""
