/**
 * Product Matcher
 * Calculates similarity scores between original products and provider results
 */

import type { ProductQuery, ProviderResult, SearchCriteria } from "./providers/base";

/**
 * Calculate similarity score between original product and provider result
 * Returns score from 0-100
 */
export function calculateMatchScore(
  original: ProductQuery,
  result: ProviderResult,
  criteria: SearchCriteria
): number {
  let score = 0;

  // Title similarity (40% weight) - enhanced with keyword coverage and position weighting
  const titleScore = calculateTitleScore(original.name, result.title);
  score += titleScore * 0.4;

  // Price proximity (20% weight)
  if (original.price && result.price && original.price > 0) {
    const priceDiff = Math.abs(original.price - result.price) / original.price;
    const priceScore = Math.max(0, 1 - priceDiff * 2); // Penalize more for larger differences
    score += priceScore * 0.2;
  }

  // Specs overlap (20% weight)
  if (original.specs && result.specs) {
    const specsScore = calculateSpecsOverlap(original.specs, result.specs);
    score += specsScore * 0.2;
  }

  // Criteria match (20% weight)
  const criteriaScore = evaluateCriteria(result, criteria);
  score += criteriaScore * 0.2;

  return Math.round(score * 100); // Return 0-100
}

/**
 * Calculate title similarity score with keyword coverage and position weighting
 */
function calculateTitleScore(originalName: string, resultTitle: string): number {
  const originalLower = originalName.toLowerCase().trim();
  const resultLower = resultTitle.toLowerCase().trim();

  // Exact match
  if (originalLower === resultLower) {
    return 1.0;
  }

  // Exact phrase match (boost)
  if (resultLower.includes(originalLower) || originalLower.includes(resultLower)) {
    return 0.95;
  }

  // Keyword coverage
  const originalWords = new Set(originalLower.split(/\s+/).filter((w) => w.length > 2));
  const resultWords = new Set(resultLower.split(/\s+/).filter((w) => w.length > 2));
  const commonWords = new Set([...originalWords].filter((w) => resultWords.has(w)));
  const coverage = originalWords.size > 0 ? commonWords.size / originalWords.size : 0;

  // Position weighting (keywords at start get higher score)
  let positionScore = 0.5;
  const resultWordsArray = resultLower.split(/\s+/);
  const wordsInFirst30Percent = Math.floor(resultWordsArray.length * 0.3);
  
  for (const word of originalWords) {
    const wordIndex = resultWordsArray.findIndex((w) => w === word);
    if (wordIndex !== -1 && wordIndex < wordsInFirst30Percent) {
      positionScore += 0.3 / originalWords.size; // Distribute bonus
    }
  }
  positionScore = Math.min(1.0, positionScore);

  // Combined score
  let score = (coverage * 0.7) + (positionScore * 0.3);

  // Bonus for all keywords matching
  if (commonWords.size === originalWords.size && originalWords.size > 0) {
    score *= 1.2;
  }

  // Penalty for low coverage
  if (coverage < 0.5) {
    score *= 0.5;
  }

  return Math.min(1.0, Math.max(0, score));
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns value between 0 and 1
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) {
    return 1.0;
  }

  if (s1.length === 0 || s2.length === 0) {
    return 0.0;
  }

  // Use Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  let similarity = 1 - distance / maxLength;

  // Check for exact phrase match (boost score)
  if (s1.includes(s2) || s2.includes(s1)) {
    similarity = Math.max(similarity, 0.7); // Boost score if substring match
  }

  // Check for keyword coverage
  const s1Words = new Set(s1.split(/\s+/));
  const s2Words = new Set(s2.split(/\s+/));
  const commonWords = new Set([...s1Words].filter((w) => s2Words.has(w)));
  const coverage = commonWords.size / Math.max(s1Words.size, s2Words.size);
  
  // Combine similarity with coverage
  similarity = (similarity * 0.7) + (coverage * 0.3);

  return Math.max(0, similarity);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate specs overlap score
 * Returns value between 0 and 1
 */
function calculateSpecsOverlap(
  originalSpecs: Record<string, string>,
  resultSpecs: Record<string, string>
): number {
  if (Object.keys(originalSpecs).length === 0) {
    return 0.5; // Neutral score if no original specs
  }

  let matches = 0;
  let total = 0;

  for (const [key, value] of Object.entries(originalSpecs)) {
    total++;
    const normalizedKey = key.toLowerCase().trim();
    const normalizedValue = value.toLowerCase().trim();

    // Check if key exists in result specs
    const resultValue = Object.entries(resultSpecs).find(
      ([k]) => k.toLowerCase().trim() === normalizedKey
    )?.[1];

    if (resultValue) {
      const normalizedResultValue = resultValue.toLowerCase().trim();
      // Check if values match (exact or similarity)
      if (normalizedValue === normalizedResultValue) {
        matches++;
      } else {
        // Check similarity
        const valueSimilarity = stringSimilarity(
          normalizedValue,
          normalizedResultValue
        );
        if (valueSimilarity > 0.7) {
          matches += valueSimilarity;
        }
      }
    }
  }

  return total > 0 ? matches / total : 0;
}

/**
 * Evaluate how well result matches search criteria
 * Returns value between 0 and 1
 */
function evaluateCriteria(
  result: ProviderResult,
  criteria: SearchCriteria
): number {
  let score = 0;
  let factors = 0;

  // Shipping origin match
  if (criteria.shippingOrigin && criteria.shippingOrigin.length > 0) {
    factors++;
    if (criteria.shippingOrigin.includes(result.shippingOrigin)) {
      score += 1.0;
    } else {
      score += 0.3; // Partial score if doesn't match
    }
  }

  // Delivery days match
  if (criteria.maxDeliveryDays !== undefined) {
    factors++;
    if (
      result.estimatedDeliveryDays !== undefined &&
      result.estimatedDeliveryDays <= criteria.maxDeliveryDays
    ) {
      score += 1.0;
    } else if (result.estimatedDeliveryDays === undefined) {
      score += 0.5; // Neutral if not provided
    } else {
      score += 0.2; // Low score if exceeds max
    }
  }

  // Price range match (already filtered, but give bonus for being in range)
  if (criteria.priceRange) {
    factors++;
    if (
      (criteria.priceRange.min === undefined ||
        result.price >= criteria.priceRange.min) &&
      (criteria.priceRange.max === undefined ||
        result.price <= criteria.priceRange.max)
    ) {
      score += 1.0;
    } else {
      score += 0.3; // Partial score
    }
  }

  return factors > 0 ? score / factors : 1.0; // Default to perfect if no criteria
}

/**
 * Find best match from array of results
 * Returns the result with highest score
 */
export function findBestMatch(
  matches: Array<ProviderResult & { matchScore: number }>
): ProviderResult & { matchScore: number } | null {
  if (matches.length === 0) {
    return null;
  }

  // Sort by match score descending
  const sorted = [...matches].sort((a, b) => b.matchScore - a.matchScore);
  return sorted[0];
}

/**
 * Rank matches by score
 */
export function rankMatches(
  matches: Array<ProviderResult & { matchScore: number }>
): Array<ProviderResult & { matchScore: number }> {
  return [...matches].sort((a, b) => b.matchScore - a.matchScore);
}

