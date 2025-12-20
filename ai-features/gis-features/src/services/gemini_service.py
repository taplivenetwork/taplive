from config.settings import GEMINI_API_KEY
import importlib

# ------------------------------------
# ALWAYS DEFINE MODEL FIRST
# ------------------------------------
model = None

# ------------------------------------
# TRY TO LOAD GEMINI SDK IF KEY EXISTS
# ------------------------------------
if GEMINI_API_KEY:
    try:
        genai = importlib.import_module("google.generativeai")
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-pro")
    except Exception:
        model = None


def generate_reasoning(prompt: str) -> str:
    """
    Generate AI reasoning using Gemini.
    Falls back to mock response if Gemini is unavailable.
    """

    # --------------------
    # MOCK FALLBACK
    # --------------------
    if not GEMINI_API_KEY or model is None:
        return (
            "Decision: Proceed with Caution\n"
            "Reason: Moderate wind conditions detected in an urban environment.\n"
            "Recommendation: Proceed carefully and continue monitoring weather updates."
        )

    # --------------------
    # REAL GEMINI RESPONSE
    # --------------------
    response = model.generate_content(prompt)
    return response.text.strip()
