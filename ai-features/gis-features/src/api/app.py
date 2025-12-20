from fastapi import FastAPI, HTTPException, Query
from typing import List
from inputs.user_input import normalize_user_input
from services.gis_service import get_gis_context
from services.weather_service import get_weather_context
from context.context_builder import build_context
from reasoning.risk_assessor import assess_risk

app = FastAPI(
    title="AI Weather + GIS Risk Advisor",
    description="VisaVerse Hackathon Module 3",
    version="1.0"
)

@app.get("/assess-risk")
def risk_assessment(
    location: str = Query(...),
    lat: float = Query(...),
    lon: float = Query(...),
    task: str = Query(...),
    time_window: str = Query(None)
):
    try:
        user = normalize_user_input(location, task, time_window)
        gis = get_gis_context(location)
        weather = get_weather_context(lat, lon)
        context = build_context(user, gis, weather)
        decision_text = assess_risk(context)
        return {"context": context, "ai_decision": decision_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assess-risk-multi")
def risk_assessment_multi(
    locations: List[str] = Query(...),
    latitudes: List[float] = Query(...),
    longitudes: List[float] = Query(...),
    tasks: List[str] = Query(...),
    time_windows: List[str] = Query(None)
):
    results = []
    for i, location in enumerate(locations):
        try:
            user = normalize_user_input(location, tasks[i], time_windows[i] if time_windows else None)
            gis = get_gis_context(location)
            weather = get_weather_context(latitudes[i], longitudes[i])
            context = build_context(user, gis, weather)
            decision_text = assess_risk(context)
            results.append({"location": location, "context": context, "ai_decision": decision_text})
        except Exception as e:
            results.append({"location": location, "error": str(e)})
    return {"results": results}
