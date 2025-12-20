from config.settings import GEMINI_API_KEY

# -------------------------------
# SAFE DEFAULT
# -------------------------------
client = None
MODEL_NAME = "models/gemini-1.5-flash"  # currently supported free-tier model

# -------------------------------
# TRY TO INITIALIZE GEMINI
# -------------------------------
if GEMINI_API_KEY:
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        client = None


def generate_reasoning(prompt: str) -> str:
    """
    Generate AI reasoning using Gemini.
    Falls back to mock response if Gemini is unavailable or fails.
    """

    # --------------------
    # MOCK FALLBACK
    # --------------------
    if not client:
        return (
            "Decision: Proceed with Caution\n"
            "Reason: Moderate wind and urban operational risks detected.\n"
            "Recommendation: Proceed carefully and monitor weather updates."
        )

    # --------------------
    # REAL GEMINI CALL
    # --------------------
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        return response.text.strip()

    except Exception as e:
        # Absolute safety net
        return (
            "Decision: Proceed with Caution\n"
            "Reason: AI service temporarily unavailable.\n"
            "Recommendation: Use standard safety protocols."
        )
