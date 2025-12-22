from config.settings import GEMINI_API_KEY

client = None
MODEL_NAME = "models/gemini-flash-lite-latest"

if GEMINI_API_KEY:
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        client = None


def generate_reasoning(prompt: str) -> str:
    if not client:
        return (
            "Decision: PROCEED WITH CAUTION\n"
            "Reason: Environmental or mission uncertainty detected.\n"
            "Mitigation: Increase monitoring.\n"
            "What-if: With lower risk tolerance, the mission would be paused."
        )

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Gemini generation error: {e}")
        return (
            "Decision: PROCEED WITH CAUTION\n"
            "Reason: AI quota temporarily exhausted.\n"
            "Mitigation: Use standard safety checks.\n"
            "What-if: Lower risk tolerance would require postponement."
        )
