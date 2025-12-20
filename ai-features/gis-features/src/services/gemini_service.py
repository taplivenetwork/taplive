from config.settings import GEMINI_API_KEY

# -------------------------------
# SAFE DEFAULTS
# -------------------------------
client = None
MODEL_NAME = "models/gemini-flash-lite-latest"


# -------------------------------
# TRY TO INITIALIZE GEMINI
# -------------------------------
if GEMINI_API_KEY:
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Gemini init failed: {e}")
        client = None


# -------------------------------
# LIST AVAILABLE MODELS (DEBUG)
# -------------------------------
def list_available_models():
    """
    Lists available Gemini models.
    Safe to call manually for debugging.
    """
    if not client:
        print("Gemini client not initialized.")
        return []

    try:
        models = client.models.list()
        model_names = [m.name for m in models]
        print("Available Gemini Models:", model_names)
        return model_names
    except Exception as e:
        print(f"Model listing failed: {e}")
        return []


# -------------------------------
# MAIN GENERATION FUNCTION
# -------------------------------
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
        print(f"Gemini generation error: {e}")
        list_available_models()  # Debug model availability
        return (
            "Decision: Proceed with Caution\n"
            "Reason: AI service temporarily unavailable.\n"
            "Recommendation: Use standard safety protocols."
        )
