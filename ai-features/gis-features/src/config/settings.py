import os
from dotenv import load_dotenv

load_dotenv()

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# print (GEMINI_API_KEY)
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing in .env")

# Free APIs
OPEN_METEO_BASE_URL = os.getenv(
    "OPEN_METEO_BASE_URL",
    "https://api.open-meteo.com/v1/forecast"
)
OSM_NOMINATIM_BASE_URL = os.getenv(
    "OSM_NOMINATIM_BASE_URL",
    "https://nominatim.openstreetmap.org/search"
)
