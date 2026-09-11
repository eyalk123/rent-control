import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors, spacing } from '@/src/core/theme';

interface SectionLabelProps {
  title: string;
  /** Optional trailing content on the label row (a count, a link). */
  action?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * The quiet label that sits above a group.
 *
 * Exported so screens whose group body is too interactive to express as `DetailRow`s (the
 * custom-files lists, which hold inputs and per-row buttons) can drop the old painted bar
 * and still get the exact same label, rather than a copy of its styling that drifts.
 */
export function SectionLabel({ title, action, style }: SectionLabelProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <View style={[styles.header, style]}>
      <Text
        variant="labelSmall"
        style={[styles.title, { color: colors.textSecondary }]}
        maxFontSizeMultiplier={1.4}
      >
        {title}
      </Text>
      {action}
    </View>
  );
}

interface DetailSectionProps {
  /** Section label. Rendered above the group, not inside a painted bar. */
  title: string;
  children: React.ReactNode;
  /** Optional trailing content for the header row (a count, a link). */
  action?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * A grouped list: a quiet label sitting on the page background, above a surface
 * container whose rows are divided by hairlines.
 *
 * This replaces the older pattern of a `Card` with a saturated full-bleed title bar
 * (`backgroundColor: colors.primary` / `colors.sectionAccent` + white text). That bar
 * carried no meaning — the colour varied per card for decoration only — and it is the
 * single thing that dated the detail screens most. Hierarchy here comes from type and
 * whitespace instead, matching the hairline-separated sections already used on Home.
 *
 * Separators are injected between children rather than drawn by each row, so a row does
 * not need to know whether it is last, and conditionally-rendered rows (`{cond && <Row/>}`,
 * which yield `false`) never leave a dangling line.
 */
export function DetailSection({ title, children, action, style }: DetailSectionProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const rows = React.Children.toArray(children).filter(Boolean);
  if (rows.length === 0) return null;

  return (
    <View style={[styles.wrapper, style]}>
      <SectionLabel title={title} action={action} />

      <View
        style={[
          styles.group,
          { backgroundColor: colors.surface, borderColor: colors.outline },
        ]}
      >
        {rows.map((row, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <View style={[styles.separator, { backgroundColor: colors.outline }]} />
            )}
            {row}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  group: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    // Inset so the line starts where the label does, not at the card edge.
    marginStart: spacing.lg,
  },
});
