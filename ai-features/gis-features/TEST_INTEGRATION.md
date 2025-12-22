# Test GIS Risk Assessment Integration

# 1. Start the Python GIS service (in one terminal)
cd ai-features/gis-features/src
python flask_app.py

# 2. In another terminal, test the Node.js API endpoint
curl "http://localhost:5000/api/gis-risk-assessment?location=Karachi&lat=24.8607&lon=67.0011&task=Drone%20inspection&timeWindow=Next%202%20hours"

# Expected response:
# {
#   "success": true,
#   "data": {
#     "context": {...},
#     "ai_decision": "...",
#     "formatted_context": "..."
#   }
# }

# 3. Test from your frontend (React)
# In your React component:
const assessRisk = async () => {
  const response = await fetch('/api/gis-risk-assessment?location=Karachi&lat=24.8607&lon=67.0011&task=Drone inspection&timeWindow=Next 2 hours');
  const result = await response.json();
  console.log(result);
};