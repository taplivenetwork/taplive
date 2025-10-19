import type { User, Order } from "./schema";

// Weights for different factors in dispatch algorithm (total should equal 1.0)
export const DISPATCH_WEIGHTS = {
  distance: 0.35,      // 35% - proximity is most important
  trustScore: 0.25,    // 25% - reputation matters a lot
  networkSpeed: 0.20,  // 20% - essential for streaming quality
  devicePerformance: 0.10, // 10% - device capability
  responseTime: 0.10,  // 10% - how quickly they respond
} as const;

export interface ProviderRanking {
  userId: string;
  user: User;
  dispatchScore: number;
  factors: {
    distanceScore: number;
    trustScore: number;
    networkScore: number;
    deviceScore: number;
    responseScore: number;
    distance: number; // actual distance in km
  };
  rank: number;
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Convert distance to score (0-100, closer = higher score)
 */
export function distanceToScore(distance: number): number {
  // Exponential decay: score decreases rapidly with distance
  // Max useful distance: 50km, beyond that score approaches 0
  const maxDistance = 50;
  if (distance >= maxDistance) return 0;
  return Math.max(0, 100 * Math.exp(-distance / 10));
}

/**
 * Convert network speed to score (0-100)
 */
export function networkSpeedToScore(speedMbps: number): number {
  // Minimum 5 Mbps for basic streaming, 50+ Mbps for perfect score
  const minSpeed = 5;
  const maxSpeed = 50;
  if (speedMbps <= 0) return 0;
  if (speedMbps < minSpeed) return (speedMbps / minSpeed) * 30; // 0-30 for below minimum
  if (speedMbps >= maxSpeed) return 100;
  return 30 + ((speedMbps - minSpeed) / (maxSpeed - minSpeed)) * 70; // 30-100 for above minimum
}

/**
 * Convert response time to score (0-100, faster = higher score)
 */
export function responseTimeToScore(responseTimeMinutes: number): number {
  // 0-5 minutes = 100 points, decreases exponentially
  if (responseTimeMinutes <= 0) return 100;
  if (responseTimeMinutes >= 60) return 0; // 1 hour+ = 0 points
  return Math.max(0, 100 * Math.exp(-responseTimeMinutes / 15));
}

/**
 * Convert trust score to normalized score (0-100)
 */
export function trustScoreToScore(trustScore: number): number {
  return Math.min(100, (trustScore / 5.0) * 100);
}

/**
 * Convert device performance to score (already 0-100)
 */
export function devicePerformanceToScore(deviceScore: number): number {
  return Math.max(0, Math.min(100, deviceScore));
}

/**
 * Calculate overall dispatch score for a provider
 */
export function calculateDispatchScore(
  order: Order, 
  provider: User
): { score: number; factors: ProviderRanking['factors'] } {
  
  // Check if provider has required location data
  if (!provider.currentLatitude || !provider.currentLongitude) {
    return {
      score: 0,
      factors: {
        distanceScore: 0,
        trustScore: 0,
        networkScore: 0,
        deviceScore: 0,
        responseScore: 0,
        distance: Infinity,
      }
    };
  }

  // Calculate distance
  const distance = calculateDistance(
    parseFloat(order.latitude),
    parseFloat(order.longitude),
    parseFloat(provider.currentLatitude),
    parseFloat(provider.currentLongitude)
  );

  // Calculate individual factor scores
  const distanceScore = distanceToScore(distance);
  const trustScore = trustScoreToScore(parseFloat(provider.trustScore || '0'));
  const networkScore = networkSpeedToScore(parseFloat(provider.networkSpeed || '0'));
  const deviceScore = devicePerformanceToScore(parseFloat(provider.devicePerformance || '0'));
  const responseScore = responseTimeToScore(provider.responseTime || 0);

  // Calculate weighted overall score
  const overallScore = 
    (distanceScore * DISPATCH_WEIGHTS.distance) +
    (trustScore * DISPATCH_WEIGHTS.trustScore) +
    (networkScore * DISPATCH_WEIGHTS.networkSpeed) +
    (deviceScore * DISPATCH_WEIGHTS.devicePerformance) +
    (responseScore * DISPATCH_WEIGHTS.responseTime);

  return {
    score: Math.round(overallScore * 100) / 100, // Round to 2 decimal places
    factors: {
      distanceScore,
      trustScore,
      networkScore,
      deviceScore,
      responseScore,
      distance,
    }
  };
}

/**
 * Rank available providers for an order
 */
export function rankProvidersForOrder(
  order: Order, 
  availableProviders: User[]
): ProviderRanking[] {
  
  const rankings: ProviderRanking[] = availableProviders
    .filter(provider => 
      provider.availability && 
      provider.role === 'provider' &&
      provider.currentLatitude && 
      provider.currentLongitude
    )
    .map(provider => {
      const { score, factors } = calculateDispatchScore(order, provider);
      return {
        userId: provider.id,
        user: provider,
        dispatchScore: score,
        factors,
        rank: 0, // Will be set after sorting
      };
    })
    .sort((a, b) => b.dispatchScore - a.dispatchScore) // Sort by score descending
    .map((ranking, index) => ({
      ...ranking,
      rank: index + 1,
    }));

  return rankings;
}

/**
 * Get the best provider for an order (top ranked)
 */
export function getBestProviderForOrder(
  order: Order, 
  availableProviders: User[]
): ProviderRanking | null {
  const rankings = rankProvidersForOrder(order, availableProviders);
  return rankings.length > 0 ? rankings[0] : null;
}

/**
 * Update user's dispatch score based on current metrics
 */
export function updateUserDispatchScore(user: User): number {
  // Calculate a general dispatch score without specific order context
  // This uses average conditions for distance (assume 10km average)
  const averageDistance = 10;
  
  const distanceScore = distanceToScore(averageDistance);
  const trustScore = trustScoreToScore(parseFloat(user.trustScore || '0'));
  const networkScore = networkSpeedToScore(parseFloat(user.networkSpeed || '0'));
  const deviceScore = devicePerformanceToScore(parseFloat(user.devicePerformance || '0'));
  const responseScore = responseTimeToScore(user.responseTime || 0);

  const overallScore = 
    (distanceScore * DISPATCH_WEIGHTS.distance) +
    (trustScore * DISPATCH_WEIGHTS.trustScore) +
    (networkScore * DISPATCH_WEIGHTS.networkSpeed) +
    (deviceScore * DISPATCH_WEIGHTS.devicePerformance) +
    (responseScore * DISPATCH_WEIGHTS.responseTime);

  return Math.round(overallScore * 100) / 100;
}