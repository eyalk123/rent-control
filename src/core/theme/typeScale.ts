import { useWindowDimensions } from 'react-native';

/**
 * Dynamic Type policy. See MOBILE-DESIGN.md §3.
 *
 * The rule is *cap the chrome, let the content scale*. A property address, a renter's name, a
 * note — anything the user typed — scales without limit, because that is the text someone
 * turned the setting up to read. The furniture around it does not: a tab label, a segment, a
 * chip, a screen title and a month axis all live in boxes sized by the layout, and past a
 * point they stop being more readable and start being clipped. That trade is what
 * `maxFontSizeMultiplier` expresses, and it is the same trade Apple's
 * `UIFontMetrics.scaledFont(for:maximumPointSize:)` exists to make.
 */

/** Chrome: labels inside a box the layout controls. */
export const MAX_CHROME_FONT_SCALE = 1.4;

/** Tight chrome: a fixed-size tile or axis with no room to grow at all. */
export const MAX_TIGHT_FONT_SCALE = 1.2;

/**
 * Above this, side-by-side layouts stop fitting and should stack instead.
 *
 * 1.4 rather than something larger because that is where a two-column row on a 360dp screen
 * runs out of width, measured on the transaction list. Apple draws the same line with
 * `UIContentSizeCategory.isAccessibilityCategory`.
 */
export const REFLOW_FONT_SCALE = 1.4;

/**
 * `true` once text is large enough that horizontal layouts should become vertical.
 *
 * Reads from `useWindowDimensions` rather than `PixelRatio.getFontScale()` so a change to the
 * system setting re-renders; the PixelRatio value is captured once and goes stale.
 */
export function useIsLargeText(): boolean {
  const { fontScale } = useWindowDimensions();
  return fontScale >= REFLOW_FONT_SCALE;
}

/** The live font scale, for callers that need the number rather than the threshold. */
export function useFontScale(): number {
  return useWindowDimensions().fontScale;
}

/**
 * A `lineHeight` that grows with the text inside it.
 *
 * A style that pins both `fontSize` and `lineHeight` is a trap: React Native scales the first
 * and not the second, so at a large setting the glyphs overflow their own line box and paint
 * over whatever is above and below. The hero number on the Transactions tab (44/48) was
 * drawing straight through its eyebrow.
 *
 * Pass the same `cap` you pass to `maxFontSizeMultiplier` so the box and the glyphs stop
 * growing together.
 */
export function useScaledLineHeight(base: number, cap = MAX_CHROME_FONT_SCALE): number {
  const { fontScale } = useWindowDimensions();
  return Math.round(base * Math.min(fontScale, cap));
}
