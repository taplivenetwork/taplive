// Example: How to use GIS Risk Assessment in your React components

import { useState } from 'react';

interface GisRiskResult {
  success: boolean;
  data: {
    context: {
      task_context: { task: string; location: string; time_window: string };
      gis: { area_type: string; risk_notes: string };
      weather: { temperature: number; wind_speed: number; rain_risk: string };
      user_preferences: { risk_tolerance: string; mission_criticality: string; asset_sensitivity: string };
    };
    ai_decision: string;
  };
}

export function GisRiskExample() {
  const [result, setResult] = useState<GisRiskResult | null>(null);
  const [loading, setLoading] = useState(false);

  const assessRisk = async () => {
    setLoading(true);
    try {
      // Method 1: Using fetch directly
      const response = await fetch('/api/gis-risk-assessment?' + new URLSearchParams({
        location: 'Karachi',
        lat: '24.8607',
        lon: '67.0011',
        task: 'Drone inspection',
        timeWindow: 'Next 2 hours',
        riskTolerance: 'medium',
        missionCriticality: 'routine',
        assetSensitivity: 'medium'
      }));

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        console.error('GIS API error:', response.statusText);
      }

      // Method 2: Using authFetch (if authentication is needed)
      // import { authFetch } from '@/lib/api';
      // const response = await authFetch('/api/gis-risk-assessment?' + new URLSearchParams({...}));
      // const data = await response.json();

    } catch (error) {
      console.error('Failed to assess GIS risk:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={assessRisk}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Assessing...' : 'Assess GIS Risk'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">AI Decision:</h3>
          <p className="whitespace-pre-line">{result.data.ai_decision}</p>

          <h4 className="font-bold mt-4">Context:</h4>
          <pre className="text-sm bg-white p-2 rounded mt-2 overflow-auto">
            {JSON.stringify(result.data.context, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Usage in your components:
// 1. Import the GIS assessment function
// 2. Call it when you need risk assessment (e.g., before creating orders)
// 3. Display the AI decision to users
// 4. Use the decision to enable/disable features or show warnings

export default GisRiskExample;</content>
<parameter name="filePath">d:\tapliveproject\TapliveMvp\client\src\components\gis-risk-example.tsx