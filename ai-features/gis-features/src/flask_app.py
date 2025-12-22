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

        result = run_risk_engine(
            location, lat, lon, task, time_window,
            risk_tolerance, mission_criticality, asset_sensitivity
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
