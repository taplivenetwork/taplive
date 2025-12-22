import requests
from config.settings import OSM_NOMINATIM_BASE_URL

def get_gis_context(location: str):
    """Fetch basic GIS context from OpenStreetMap."""
    params = {"q": location, "format": "json", "limit": 1}
    response = requests.get(
        OSM_NOMINATIM_BASE_URL,
        params=params,
        headers={"User-Agent": "VisaVerse-AI-Hackathon"}
    )
    data = response.json()
    if not data:
        return {"area_type": "Unknown", "risk_notes": "Location not found"}

    info = data[0]
    display_name = info.get("display_name", "")
    area_type = "Urban" if "city" in display_name.lower() else "Mixed"
    return {"area_type": area_type, "risk_notes": f"Identified as {area_type} area"}
