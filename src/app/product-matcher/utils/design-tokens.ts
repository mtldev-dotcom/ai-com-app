/**
 * Design tokens for Product Matcher UI
 * Centralized colors, spacing, typography, and animation timing
 */

export const colors = {
  match: {
    high: {
      light: "rgb(34, 197, 94)", // green-500
      dark: "rgb(74, 222, 128)", // green-400
      bg: "rgb(240, 253, 244)", // green-50
      border: "rgb(187, 247, 208)", // green-200
    },
    medium: {
      light: "rgb(234, 179, 8)", // yellow-500
      dark: "rgb(250, 204, 21)", // yellow-400
      bg: "rgb(254, 252, 232)", // yellow-50
      border: "rgb(254, 240, 138)", // yellow-200
    },
    low: {
      light: "rgb(239, 68, 68)", // red-500
      dark: "rgb(248, 113, 113)", // red-400
      bg: "rgb(254, 242, 242)", // red-50
      border: "rgb(254, 202, 202)", // red-200
    },
  },
  status: {
    processing: "rgb(59, 130, 246)", // blue-500
    completed: "rgb(34, 197, 94)", // green-500
    failed: "rgb(239, 68, 68)", // red-500
    pending: "rgb(156, 163, 175)", // gray-400
  },
  provider: {
    cj: "rgb(99, 102, 241)", // indigo-500
    web: "rgb(107, 114, 128)", // gray-500
  },
} as const;

export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
} as const;

export const typography = {
  fontFamily: {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const animations = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },
  easing: {
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  },
  stagger: {
    delay: 50, // ms delay between staggered items
  },
} as const;

export const borderRadius = {
  sm: "0.125rem", // 2px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

/**
 * Get match score color based on score value
 */
export function getMatchScoreColor(score: number): keyof typeof colors.match {
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

