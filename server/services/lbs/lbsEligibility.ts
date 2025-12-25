// server/services/lbs/lbsEligibility.ts

type Location = {
  lat: number;
  lng: number;
};

export function checkLbsEligibility(
  customerLocation: Location,
  providerLocation: Location,
  maxDistanceKm: number
) {
  // 1. Basic validation
  if (!customerLocation || !providerLocation) {
    return { eligible: false, reason: "missing_location" };
  }

  // 2. Distance calculation
  const distanceKm = calculateDistance(
    customerLocation.lat,
    customerLocation.lng,
    providerLocation.lat,
    providerLocation.lng
  );

  // 3. Eligibility check
  if (distanceKm <= maxDistanceKm) {
    return { eligible: true, distanceKm };
  }

  return { eligible: false, distanceKm, reason: "out_of_range" };
}

// --- Helper functions ---

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Earth radius in KM
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
