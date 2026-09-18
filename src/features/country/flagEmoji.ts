/**
 * A country's flag, **derived from its ISO code** rather than shipped as an asset.
 *
 * An alpha-2 code maps one-to-one onto a pair of Unicode regional indicator symbols, and
 * both mobile platforms compose that pair into the flag — Android through Noto Color Emoji,
 * iOS through Apple Color Emoji. So the whole table of ~250 flags costs no asset, no icon
 * package, no per-country request, and nothing to keep in step with the country table.
 *
 * The web app needs a feature test around the same idea, because desktop Windows ships the
 * regional indicators as lettered boxes and deliberately does not compose them. Phones are
 * not that platform, so this stays three lines — see `CountryFlag.tsx` on web for the
 * version that has to cope.
 *
 * Callers should still show the ISO code or the country name beside it: the glyph alone is
 * not an accessible label, and a device that ever fails to compose the pair still needs the
 * row to identify itself.
 */

/** The regional-indicator pair for an alpha-2 code. Empty for anything that is not one. */
export function flagEmoji(code: string | null | undefined): string {
  const value = (code ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) return '';
  return String.fromCodePoint(...[...value].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}
