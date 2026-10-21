import { useTheme } from 'react-native-paper';
import {
  ENTITY_COLOR_KEYS,
  darkColors,
  darkEntityColors,
  lightColors,
  lightEntityColors,
  type EntityColor,
  type EntityColorKey,
} from './colors';

/**
 * The color a new item gets: the least-used among the existing ones, ties going to the earlier
 * key. The server owns this rule (`app/entity_colors.py`); the forms use it to show a new item's
 * color before it is saved, and the mock API to assign one.
 */
export function leastUsedEntityColor(used: readonly (string | null | undefined)[]): EntityColorKey {
  const counts = new Map<string, number>();
  for (const c of used) if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  return ENTITY_COLOR_KEYS.reduce((best, key) =>
    (counts.get(key) ?? 0) < (counts.get(best) ?? 0) ? key : best,
  );
}

export function isEntityColorKey(value: unknown): value is EntityColorKey {
  return typeof value === 'string' && (ENTITY_COLOR_KEYS as readonly string[]).includes(value);
}

/**
 * The shades for an item's stored `color`, in the current theme.
 *
 * Anything that is not one of the six keys - an item saved before colors existed, or a key a
 * newer server knows and this build does not - falls back to the neutral avatar colors, so it
 * still renders, just uncolored.
 */
export function useEntityColor(color: string | null | undefined): EntityColor {
  const theme = useTheme();
  if (isEntityColorKey(color)) {
    return (theme.dark ? darkEntityColors : lightEntityColors)[color];
  }
  const colors = theme.dark ? darkColors : lightColors;
  return { fg: colors.avatarText, bg: colors.avatarBackground };
}
