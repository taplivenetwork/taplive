# AI GIS Risk Assessment Feature

This feature provides AI-powered risk assessment for tasks based on weather, GIS data, and user preferences.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Navigate to the feature directory:**
   ```bash
   cd ai-features/gis-features
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your GEMINI_API_KEY
   ```

### Running the Feature

#### Option 1: Run the Flask Backend (Port 5001)

```bash
cd src
python flask_app.py
```

The Flask API will start on `http://127.0.0.1:5001`

**API Endpoint:** `GET /assess-risk`

**Parameters:**
- `location` - Location name (e.g., "Karachi")
- `lat` - Latitude (e.g., 24.8607)
- `lon` - Longitude (e.g., 67.0011)
- `task` - Task description (e.g., "Outdoor drone inspection")
- `time_window` - Time window (e.g., "Next 2 hours")
- `risk_tolerance` - low/medium/high (optional, default: medium)
- `mission_criticality` - routine/important/emergency (optional, default: routine)
- `asset_sensitivity` - low/medium/high (optional, default: medium)

**Example Request:**
```bash
curl "http://127.0.0.1:5001/assess-risk?location=Karachi&lat=24.8607&lon=67.0011&task=Outdoor%20drone%20inspection&time_window=Next%202%20hours"
```

#### Option 2: Run the Interactive CLI Demo

```bash
cd src
python main.py
```

This will prompt you for inputs and display a formatted risk assessment.

## 🔗 Integration with Frontend/Backend

### Integration Steps:

1. **Start Flask Backend** (if not already running):
   ```bash
   cd ai-features/gis-features/src
   python flask_app.py
   ```

2. **Call from your main backend** (Node.js/Express):
   ```javascript
   // In your server/routes.ts or similar
   app.get('/api/gis-risk-assessment', async (req, res) => {
     const { location, lat, lon, task, timeWindow } = req.query;
     
     try {
       const response = await fetch(
         `http://127.0.0.1:5000/assess-risk?` +
         `location=${location}&lat=${lat}&lon=${lon}&task=${task}&time_window=${timeWindow}`
       );
       const data = await response.json();
       res.json(data);
     } catch (error) {
       res.status(500).json({ error: 'GIS service unavailable' });
     }
   });
   ```

3. **Call from your frontend** (React):
   ```typescript
   // In your React component
   const assessRisk = async () => {
     const response = await fetch(
       `/api/gis-risk-assessment?` +
       `location=Karachi&lat=24.8607&lon=67.0011&task=Drone inspection&timeWindow=Next 2 hours`
     );
     const result = await response.json();
     console.log(result);
   };
   ```

## 📊 Response Format

```json
{
  "context": {
    "task_context": {
      "task": "Outdoor drone inspection",
      "location": "Karachi",
      "time_window": "Next 2 hours"
    },
    "gis": {
      "area_type": "urban",
      "risk_notes": "High-density area"
    },
    "weather": {
      "temperature": 28,
      "wind_speed": 15,
      "rain_risk": "low"
    },
    "user_preferences": {
      "risk_tolerance": "medium",
      "mission_criticality": "routine",
      "asset_sensitivity": "medium"
    }
  },
  "ai_decision": "## Decision: PROCEED WITH CAUTION\n\n**Reasoning:**\n- Wind speed is moderate...\n- Area is urban with high density...\n\n**Recommendations:**\n1. Monitor wind conditions\n2. Ensure proper clearance..."
}
```

## 🛠️ Troubleshooting

### Issue: "GEMINI_API_KEY is missing"
**Solution:** Create a `.env` file in `ai-features/gis-features/` and add:
```
GEMINI_API_KEY=your_actual_key_here
```

### Issue: Port 5000 already in use
**Solution:** Change the port in `flask_app.py`:
```python
if __name__ == "__main__":
    app.run(debug=True, port=5001)  # Change to 5001 or any available port
```

### Issue: Module not found errors
**Solution:** Make sure you're in the correct directory and installed dependencies:
```bash
cd ai-features/gis-features
pip install -r requirements.txt
```

## 🏗️ Architecture

```
┌─────────────┐
│  Frontend   │ → Calls /api/gis-risk-assessment
└──────┬──────┘
       │
┌──────▼──────┐
│ Node.js     │ → Proxies to Python Flask service
│ Backend     │
│ (Port 5000) │
└──────┬──────┘
       │
┌──────▼──────┐
│ Flask API   │ → http://127.0.0.1:5001/assess-risk
│ (Python)    │
│ (Port 5001) │
└──────┬──────┘
       │
       ├─────► Weather API (Open-Meteo)
       ├─────► GIS API (OpenStreetMap)
       └─────► Gemini AI (Google)
```

## 📝 Notes

- The Flask service runs independently on port 5000
- Your main Node.js backend can proxy requests to it
- The service fetches real-time weather and GIS data
- AI decisions are generated using Google Gemini API
