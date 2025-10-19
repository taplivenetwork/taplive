// Geographic Safety and Risk Management System

// No imports needed for this utility module

// Risk Assessment Interfaces
export interface GeoRiskAssessment {
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'extreme' | 'forbidden';
  reasons: string[];
  restrictions: string[];
  canProceed: boolean;
}

export interface WeatherRiskData {
  current: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    visibility: number;
  };
  alerts: WeatherAlert[];
  forecast: WeatherForecast[];
}

export interface WeatherAlert {
  type: 'storm' | 'flood' | 'earthquake' | 'tornado' | 'avalanche' | 'tsunami' | 'extreme_heat' | 'extreme_cold';
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  message: string;
  startTime: Date;
  endTime?: Date;
}

export interface WeatherForecast {
  time: Date;
  condition: string;
  riskLevel: number; // 0-10 scale
  precipitation: number;
  temperature: number;
}

// Geo-fence definitions
export const FORBIDDEN_ZONES = {
  MILITARY_BASES: [
    {
      name: "Pentagon",
      coordinates: { lat: 38.8719, lng: -77.0563 },
      radius: 5000 // meters
    },
    {
      name: "Area 51",
      coordinates: { lat: 37.2431, lng: -115.7930 },
      radius: 50000
    }
  ],
  HIGH_RISK_AREAS: [
    {
      name: "Death Valley",
      coordinates: { lat: 36.5054, lng: -117.0794 },
      radius: 100000,
      reasons: ["extreme_heat", "remote_location", "limited_rescue_access"]
    },
    {
      name: "Mount Everest Base Camp",
      coordinates: { lat: 28.0026, lng: 86.8528 },
      radius: 50000,
      reasons: ["extreme_altitude", "weather_risk", "avalanche_danger"]
    }
  ]
};

// Content Safety Keywords
export const PROHIBITED_KEYWORDS = {
  ILLEGAL_ACTIVITIES: [
    "drug dealing", "weapon trafficking", "human trafficking", "money laundering",
    "assassination", "terrorism", "bomb making", "illegal surveillance"
  ],
  INAPPROPRIATE_CONTENT: [
    "spy cam", "hidden camera", "upskirt", "voyeur", "peeping",
    "nude without consent", "revenge porn", "blackmail"
  ],
  VIOLENCE: [
    "murder", "assault", "kidnapping", "torture", "rape",
    "domestic violence", "child abuse", "gang violence"
  ],
  FRAUD: [
    "credit card fraud", "identity theft", "insurance scam", "tax evasion",
    "fake documents", "counterfeit", "pyramid scheme"
  ]
};

// Voice monitoring keywords (for live streaming)
export const VOICE_ALERT_KEYWORDS = [
  ...PROHIBITED_KEYWORDS.ILLEGAL_ACTIVITIES,
  ...PROHIBITED_KEYWORDS.INAPPROPRIATE_CONTENT,
  ...PROHIBITED_KEYWORDS.VIOLENCE,
  ...PROHIBITED_KEYWORDS.FRAUD,
  "help me", "call police", "emergency", "kidnapped", "being forced"
];

// Geographic Risk Assessment Functions
export function assessGeoRisk(latitude: number, longitude: number): GeoRiskAssessment {
  const assessment: GeoRiskAssessment = {
    riskLevel: 'safe',
    reasons: [],
    restrictions: [],
    canProceed: true
  };

  // Check military zones
  const militaryRisk = checkMilitaryZones(latitude, longitude);
  if (militaryRisk.isRestricted) {
    assessment.riskLevel = 'forbidden';
    assessment.reasons.push(...militaryRisk.reasons);
    assessment.restrictions.push(...militaryRisk.restrictions);
    assessment.canProceed = false;
  }

  // Check extreme environments
  const environmentRisk = checkExtremeEnvironments(latitude, longitude);
  if (environmentRisk.riskLevel === 'extreme') {
    assessment.riskLevel = 'extreme';
    assessment.reasons.push(...environmentRisk.reasons);
    assessment.restrictions.push(...environmentRisk.restrictions);
    assessment.canProceed = false;
  }

  // Check remote areas
  const remoteRisk = checkRemoteAreas(latitude, longitude);
  const riskLevels = ['safe', 'low', 'medium', 'high', 'extreme', 'forbidden'];
  const currentIndex = riskLevels.indexOf(assessment.riskLevel);
  const remoteIndex = riskLevels.indexOf(remoteRisk.riskLevel);
  
  if (remoteIndex > currentIndex) {
    assessment.riskLevel = remoteRisk.riskLevel;
    assessment.reasons.push(...remoteRisk.reasons);
    assessment.restrictions.push(...remoteRisk.restrictions);
  }

  return assessment;
}

function checkMilitaryZones(lat: number, lng: number) {
  const result = {
    isRestricted: false,
    reasons: [] as string[],
    restrictions: [] as string[]
  };

  for (const zone of FORBIDDEN_ZONES.MILITARY_BASES) {
    const distance = calculateDistance(lat, lng, zone.coordinates.lat, zone.coordinates.lng);
    if (distance <= zone.radius) {
      result.isRestricted = true;
      result.reasons.push(`Location within restricted military zone: ${zone.name}`);
      result.restrictions.push("No filming allowed in military installations");
      result.restrictions.push("Violation may result in legal action");
    }
  }

  return result;
}

function checkExtremeEnvironments(lat: number, lng: number): {
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'extreme' | 'forbidden';
  reasons: string[];
  restrictions: string[];
} {
  let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'extreme' | 'forbidden' = 'safe';
  const reasons: string[] = [];
  const restrictions: string[] = [];

  // Arctic/Antarctic regions (extreme cold)
  if (lat > 70 || lat < -60) {
    riskLevel = 'extreme';
    reasons.push("Extreme cold environment");
    restrictions.push("Special equipment required");
    restrictions.push("Emergency rescue may not be available");
  }

  // Desert regions (extreme heat)
  for (const zone of FORBIDDEN_ZONES.HIGH_RISK_AREAS) {
    const distance = calculateDistance(lat, lng, zone.coordinates.lat, zone.coordinates.lng);
    if (distance <= zone.radius) {
      riskLevel = 'extreme';
      reasons.push(...zone.reasons);
      restrictions.push("Extreme weather conditions");
      restrictions.push("Limited rescue access");
    }
  }

  return { riskLevel, reasons, restrictions };
}

function checkRemoteAreas(lat: number, lng: number): {
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'extreme' | 'forbidden';
  reasons: string[];
  restrictions: string[];
} {
  // Simplified check for ocean areas (no land nearby)
  const isOcean = checkIfOceanLocation(lat, lng);
  
  if (isOcean) {
    return {
      riskLevel: 'high',
      reasons: ["Remote ocean location"],
      restrictions: ["No emergency services available", "Weather dependent"]
    };
  }

  return {
    riskLevel: 'safe',
    reasons: [],
    restrictions: []
  };
}

function checkIfOceanLocation(lat: number, lng: number): boolean {
  // Simplified ocean check - in real implementation, use proper GIS data
  // For now, check major ocean areas
  const oceanAreas = [
    { name: "Pacific", bounds: { north: 60, south: -60, east: 180, west: -180 } },
    { name: "Atlantic", bounds: { north: 80, south: -60, east: 20, west: -80 } }
  ];

  for (const ocean of oceanAreas) {
    if (lat <= ocean.bounds.north && lat >= ocean.bounds.south &&
        lng <= ocean.bounds.east && lng >= ocean.bounds.west) {
      // Additional checks could verify if it's actually water vs land
      return true;
    }
  }

  return false;
}

// Weather Risk Assessment
export async function assessWeatherRisk(latitude: number, longitude: number): Promise<WeatherRiskData> {
  // In real implementation, integrate with weather APIs like OpenWeatherMap
  // For demo, return mock data
  return {
    current: {
      condition: "clear",
      temperature: 22,
      humidity: 65,
      windSpeed: 5,
      visibility: 10
    },
    alerts: [],
    forecast: []
  };
}

// Content Safety Functions
export function checkContentViolations(content: string): {
  violations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
} {
  const violations: string[] = [];
  let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Check for prohibited keywords
  const lowerContent = content.toLowerCase();
  
  for (const category in PROHIBITED_KEYWORDS) {
    const keywords = PROHIBITED_KEYWORDS[category as keyof typeof PROHIBITED_KEYWORDS];
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        violations.push(`${category}: ${keyword}`);
        
        // Determine severity based on category
        if (category === 'ILLEGAL_ACTIVITIES' || category === 'VIOLENCE') {
          maxSeverity = 'critical';
        } else if (category === 'INAPPROPRIATE_CONTENT') {
          maxSeverity = maxSeverity === 'critical' ? 'critical' : 'high';
        } else if (category === 'FRAUD') {
          maxSeverity = maxSeverity === 'critical' || maxSeverity === 'high' ? maxSeverity : 'medium';
        }
      }
    }
  }

  return {
    violations,
    severity: maxSeverity,
    confidence: violations.length > 0 ? 0.85 : 0.0
  };
}

export function checkVoiceContent(transcribedText: string): {
  alerts: string[];
  shouldTerminate: boolean;
  emergencyDetected: boolean;
} {
  const alerts: string[] = [];
  let shouldTerminate = false;
  let emergencyDetected = false;

  const lowerText = transcribedText.toLowerCase();

  // Check for emergency situations
  const emergencyPhrases = ["help me", "call police", "emergency", "kidnapped", "being forced", "can't escape"];
  for (const phrase of emergencyPhrases) {
    if (lowerText.includes(phrase)) {
      emergencyDetected = true;
      alerts.push(`Emergency phrase detected: "${phrase}"`);
    }
  }

  // Check for voice alert keywords
  for (const keyword of VOICE_ALERT_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      alerts.push(`Prohibited content: "${keyword}"`);
      shouldTerminate = true;
    }
  }

  return {
    alerts,
    shouldTerminate,
    emergencyDetected
  };
}

// Utility Functions
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export function formatRiskLevel(riskLevel: string): { color: string; label: string; icon: string } {
  switch (riskLevel) {
    case 'safe':
      return { color: 'green', label: '安全区域', icon: '✅' };
    case 'low':
      return { color: 'blue', label: '低风险', icon: 'ℹ️' };
    case 'medium':
      return { color: 'yellow', label: '中等风险', icon: '⚠️' };
    case 'high':
      return { color: 'orange', label: '高风险', icon: '🚨' };
    case 'extreme':
      return { color: 'red', label: '极端风险', icon: '❌' };
    case 'forbidden':
      return { color: 'darkred', label: '禁止区域', icon: '🚫' };
    default:
      return { color: 'gray', label: '未知', icon: '❓' };
  }
}