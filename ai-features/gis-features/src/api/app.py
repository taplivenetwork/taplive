from fastapi import FastAPI, HTTPException, Query
from core.engine import run_risk_engine

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
    time_window: str = Query("Next 2 hours"),
    risk_tolerance: str = Query("medium"),
    mission_criticality: str = Query("routine"),
    asset_sensitivity: str = Query("medium")
):
    try:
        return run_risk_engine(
            location, lat, lon, task, time_window,
            risk_tolerance, mission_criticality, asset_sensitivity
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
