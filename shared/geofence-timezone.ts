d geofence configuration'
    };
  }

  let isInside = false;

  switch (geofence.type) {
    case 'polygon':
      if (coordinates.polygon) {
        isInside = isPointInPolygon(point, coordinates.polygon);
      }
      break;
    case 'circle':
      if (coordinates.circle) {
        isInside = isPointInCircle(point, coordinates.circle);
      }
      break;
    case 'rectangle':
      if (coordinates.rectangle) {
        isInside = isPointInRectangle(point, coordinates.rectangle);
      }
      break;
  }

  return {
    isInside,
    geofenceId: geofence.id,
    geofenceName: geofence.name,
    action: geofence.action as 'block' | 'warn' | 'allow' | 'restrict_time',
    priority: geofence.priority,
    timeRestriction
  };
}

// Timezone utilities
export function detectTimezone(lat: number, lng: number): string {
  // Simplified timezone detection based on longitude
  // In a real implementation, you would use a proper timezone lookup service
  const offset = Math.round(lng / 15);
  const timezones = [
    'Pacific/Midway',     // UTC-11
    'Pacific/Honolulu',   // UTC-10
    'America/Anchorage',  // UTC-9
    'America/Los_Angeles', // UTC-8
    'America/Denver',     // UTC-7
    'America/Chicago',    // UTC-6
    'America/New_York',   // UTC-5
    'America/Caracas',    // UTC-4
    'America/Sao_Paulo',  // UTC-3
    'Atlantic/South_Georgia', // UTC-2
    'Atlantic/Azores',    // UTC-1
    'UTC',                // UTC+0
    'Europe/London',      // UTC+0
    'Europe/Paris',       // UTC+1
    'Europe/Helsinki',    // UTC+2
    'Europe/Moscow',      // UTC+3
    'Asia/Dubai',         // UTC+4
    'Asia/Karachi',       // UTC+5
    'Asia/Dhaka',         // UTC+6
    'Asia/Bangkok',       // UTC+7
    'Asia/Shanghai',      // UTC+8
    'Asia/Tokyo',         // UTC+9
    'Australia/Sydney',   // UTC+10
    'Pacific/Noumea',     // UTC+11
    'Pacific/Auckland'    // UTC+12
  ];

  const index = Math.max(0, Math.min(offset + 11, timezones.length - 1));
  return timezones[index];
}

export function getTimezoneInfo(timezone: string, timestamp?: Date): TimezoneInfo {
  const now = timestamp || new Date();
  
  try {
    // Create a date in the target timezone
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(now);
    const localDate = new Date(
      parseInt(parts.find(p => p.type === 'year')?.value || '0'),
      parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1,
      parseInt(parts.find(p => p.type === 'day')?.value || '1'),
      parseInt(parts.find(p => p.type === 'hour')?.value || '0'),
      parseInt(parts.find(p => p.type === 'minute')?.value || '0'),
      parseInt(parts.find(p => p.type === 'second')?.value || '0')
    );

    const utcTime = now.getTime();
    const localTime = localDate.getTime();
    const utcOffset = Math.round((localTime - utcTime) / (1000 * 60));

    // Simple DST detection (this would need more sophisticated logic in production)
    const isDst = isDateInDSTRange(localDate);

    return {
      timezone,
      utcOffset,
      isDst,
      localTime: localDate,
      isAllowedTime: true, // Will be determined by time restrictions
    };
  } catch (error) {
    // Fallback for invalid timezone
    return {
      timezone: 'UTC',
      utcOffset: 0,
      isDst: false,
      localTime: now,
      isAllowedTime: true,
    };
  }
}

function isDateInDSTRange(date: Date): boolean {
  // Simplified DST detection for Northern Hemisphere
  const month = date.getMonth();
  return month >= 2 && month <= 9; // March to October (rough approximation)
}

export function checkTimeRestrictions(
  timezoneInfo: TimezoneInfo,
  restrictions?: TimeRestriction
): { isAllowed: boolean; reason?: string } {
  if (!restrictions) {
    return { isAllowed: true };
  }

  const localTime = timezoneInfo.localTime;
  const currentHour = localTime.getHours();
  const currentDay = localTime.getDay(); // 0=Sunday, 1=Monday, etc.

  // Check restricted days
  if (restrictions.restrictedDays && restrictions.restrictedDays.includes(currentDay)) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return { 
      isAllowed: false, 
      reason: `Orders not allowed on ${dayNames[currentDay]} in this timezone` 
    };
  }

  // Check allowed hours
  if (restrictions.allowedHours && restrictions.allowedHours.length > 0) {
    const isInAllowedHours = restrictions.allowedHours.some(range => {
      return currentHour >= range.start && currentHour <= range.end;
    });

    if (!isInAllowedHours) {
      const allowedRanges = restrictions.allowedHours
        .map(range => `${range.start}:00-${range.end}:00`)
        .join(', ');
      return { 
        isAllowed: false, 
        reason: `Orders only allowed during: ${allowedRanges} (local time)` 
      };
    }
  }

  return { isAllowed: true };
}

// Get comprehensive location check
export function checkLocationWithTimezone(
  lat: number,
  lng: number,
  geofences: any[],
  timezoneRules: any[] = [],
  timestamp?: Date
): {
  geofenceResults: GeofenceCheckResult[];
  timezoneInfo: TimezoneInfo;
  finalDecision: 'allow' | 'block' | 'warn' | 'restrict_time';
  messages: string[];
} {
  const point = { lat, lng };
  const detectedTz = detectTimezone(lat, lng);
  const timezoneInfo = getTimezoneInfo(detectedTz, timestamp);

  // Check geofences
  const geofenceResults = geofences
    .filter(gf => gf.isActive)
    .map(gf => checkGeofence(point, gf))
    .filter(result => result.isInside)
    .sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)

  // Check timezone rules
  const applicableRules = timezoneRules.filter(rule => {
    return rule.isActive && (
      rule.region === 'global' || 
      timezoneInfo.timezone.includes(rule.region)
    );
  });

  const messages: string[] = [];
  let finalDecision: 'allow' | 'block' | 'warn' | 'restrict_time' = 'allow';

  // Process geofence results (highest priority first)
  if (geofenceResults.length > 0) {
    const topResult = geofenceResults[0];
    finalDecision = topResult.action;
    messages.push(`Geofence "${topResult.geofenceName}" triggered: ${topResult.action}`);

    // Check time restrictions for this geofence
    if (topResult.timeRestriction) {
      const timeCheck = checkTimeRestrictions(timezoneInfo, topResult.timeRestriction);
      timezoneInfo.isAllowedTime = timeCheck.isAllowed;
      if (!timeCheck.isAllowed) {
        timezoneInfo.restrictionReason = timeCheck.reason;
        finalDecision = 'restrict_time';
        messages.push(timeCheck.reason || 'Time restriction applied');
      }
    }
  }

  // Process timezone rules
  for (const rule of applicableRules) {
    try {
      const ruleRestrictions = JSON.parse(rule.allowedHours);
      const timeCheck = checkTimeRestrictions(timezoneInfo, {
        allowedHours: ruleRestrictions,
        restrictedDays: rule.restrictedDays ? JSON.parse(rule.restrictedDays) : undefined
      });

      if (!timeCheck.isAllowed) {
        timezoneInfo.isAllowedTime = false;
        timezoneInfo.restrictionReason = timeCheck.reason;
        if (finalDecision === 'allow') {
          finalDecision = 'restrict_time';
        }
        messages.push(timeCheck.reason || 'Regional time restriction applied');
      }
    } catch (error) {
      console.error('Error parsing timezone rule:', error);
    }
  }

  return {
    geofenceResults,
    timezoneInfo,
    finalDecision,
    messages
  };
}

// Predefined geofences for high-risk areas
export const DEFAULT_GEOFENCES = [
  {
    name: 'Pentagon (Military)',
    description: 'US Department of Defense headquarters',
    type: 'circle',
    coordinates: JSON.stringify({
      circle: { center: { lat: 38.8719, lng: -77.0563 }, radius: 1000 }
    }),
    action: 'block',
    priority: 100
  },
  {
    name: 'Area 51 (Restricted)',
    description: 'Classified US Air Force facility',
    type: 'rectangle',
    coordinates: JSON.stringify({
      rectangle: { 
        topLeft: { lat: 37.2700, lng: -115.8300 },
        bottomRight: { lat: 37.2000, lng: -115.7000 }
      }
    }),
    action: 'block',
    priority: 100
  },
  {
    name: 'North Korea Border',
    description: 'DMZ and border areas',
    type: 'polygon',
    coordinates: JSON.stringify({
      polygon: [
        { lat: 38.0, lng: 124.0 },
        { lat: 41.0, lng: 124.0 },
        { lat: 41.0, lng: 131.0 },
        { lat: 38.0, lng: 131.0 }
      ]
    }),
    action: 'block',
    priority: 90
  },
  {
    name: 'Antarctic Extreme Weather Zone',
    description: 'Extreme weather conditions',
    type: 'polygon',
    coordinates: JSON.stringify({
      polygon: [
        { lat: -60, lng: -180 },
        { lat: -60, lng: 180 },
        { lat: -90, lng: 180 },
        { lat: -90, lng: -180 }
      ]
    }),
    action: 'warn',
    priority: 50,
    timeRestrictions: JSON.stringify({
      allowedHours: [{ start: 10, end: 14 }], // Only midday hours
      restrictedDays: [0, 6] // No weekends
    })
  }
];

// Default timezone rules
export const DEFAULT_TIMEZONE_RULES = [
  {
    region: 'global',
    timezone: 'UTC',
    allowedHours: JSON.stringify([
      { start: 6, end: 22 } // 6 AM to 10 PM local time
    ]),
    restrictedDays: JSON.stringify([]), // No restricted days by default
  },
  {
    region: 'Asia/Shanghai',
    timezone: 'Asia/Shanghai',
    allowedHours: JSON.stringify([
      { start: 8, end: 20 } // 8 AM to 8 PM for China
    ]),
    restrictedDays: JSON.stringify([0]), // No Sunday orders
  },
  {
    region: 'America/New_York',
    timezone: 'America/New_York',
    allowedHours: JSON.stringify([
      { start: 7, end: 23 } // 7 AM to 11 PM for US East Coast
    ]),
    restrictedDays: JSON.stringify([]),
  }
];