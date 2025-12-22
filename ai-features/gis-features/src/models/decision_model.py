class Decision:
    """
    Structured AI decision model.
    """
    def __init__(self, decision: str, reasoning: str, recommendation: str):
        self.decision = decision
        self.reasoning = reasoning
        self.recommendation = recommendation

    def to_dict(self):
        return {
            "decision": self.decision,
            "reasoning": self.reasoning,
            "recommendation": self.recommendation
        }
