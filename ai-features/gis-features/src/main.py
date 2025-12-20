from api.app import risk_assessment

if __name__ == "__main__":
    result = risk_assessment(
        location="Karachi",
        lat=24.8607,
        lon=67.0011,
        task="Outdoor drone inspection",
        time_window="Next 2 hours"
    )
    print("\n=== AI Weather + GIS Risk Advisor ===\n")
    print(result)
