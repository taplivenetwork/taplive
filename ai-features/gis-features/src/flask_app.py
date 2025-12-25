from flask import Flask, request, jsonify
from core.engine import run_risk_engine

app = Flask(__name__)

@app.route("/assess-risk", methods=["GET"])
def assess_risk():
    try:
        location = request.args.get("location")
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
        task = request.args.get("task")
        time_window = request.args.get("time_window", "Next 2 hours")
        risk_tolerance = request.args.get("risk_tolerance", "medium")
        mission_criticality = request.args.get("mission_criticality", "routine")
        asset_sensitivity = request.args.get("asset_sensitivity", "medium")

        print(f"🔍 [PYTHON BACKEND] Received GIS risk assessment request:")
        print(f"   Location: {location}, Lat: {lat}, Lon: {lon}")
        print(f"   Task: {task}, Time Window: {time_window}")
        print(f"   Risk Tolerance: {risk_tolerance}, Mission Criticality: {mission_criticality}, Asset Sensitivity: {asset_sensitivity}")

        result = run_risk_engine(
            location, lat, lon, task, time_window,
            risk_tolerance, mission_criticality, asset_sensitivity
        )

        print(f"✅ [PYTHON BACKEND] GIS risk assessment completed. Response:")
        print(f"   AI Decision: {result.get('ai_decision', 'N/A')}")
        print(f"   Full Response: {result}")

        return jsonify(result)
    except Exception as e:
        print(f"❌ [PYTHON BACKEND] Error in GIS risk assessment: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
