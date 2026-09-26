/**
 * Corner radii and the card shadow, in one place.
 *
 * The list screens had picked their own: 10 on the rows, 16 on the filter card, 20 on the
 * sheet, 8 on the segments, 12 on the badges. Side by side they read as two design systems.
 * Radius now follows the size of the thing: small controls round less, surfaces more, and
 * anything pill-shaped is fully round.
 */
export const radii = {
  /** A segment inside a segmented control. */
  sm: 9,
  /** Icon tiles, avatars, text fields, selected rows in a sheet. */
  md: 12,
  /** Cards and card-like surfaces on a list screen. */
  lg: 14,
  /** The top corners of a bottom sheet. */
  sheet: 24,
  pill: 999,
} as const;

/**
 * The soft shadow under a card on the cream background. Navy-cast rather than black, so it
 * reads as depth and not as dirt; invisible in dark mode, where the surface step does the job.
 */
export const cardShadow = {
  shadowColor: '#1E3A5F',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 2,
} as const;
