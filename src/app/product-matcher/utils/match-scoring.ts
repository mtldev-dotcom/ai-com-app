/**
 * Match scoring utilities
 */

/**
 * Calculate match score color
 */
export function getMatchScoreColor(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Format match score as percentage
 */
export function formatMatchScore(score: number): string {
  return `${Math.round(score)}%`;
}

/**
 * Get match quality label
 */
export function getMatchQualityLabel(score: number): string {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Great Match";
  if (score >= 55) return "Good Match";
  if (score >= 40) return "Fair Match";
  if (score >= 20) return "Poor Match";
  return "Very Poor Match";
}

