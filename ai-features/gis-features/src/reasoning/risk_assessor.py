from services.gemini_service import generate_reasoning

def assess_risk(context: str) -> str:
    """
    Generate AI risk assessment based on context.
    """
    prompt = f"""
You are an AI Risk Control Assistant.

Based on the information below, decide if the task should:
- Proceed
- Proceed with Caution
- Pause

Provide:
1. Decision
2. Short reasoning
3. Actionable recommendation

Context:
{context}
"""
    return generate_reasoning(prompt)
