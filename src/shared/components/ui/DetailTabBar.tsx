import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors, spacing, MAX_CHROME_FONT_SCALE } from '@/src/core/theme';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';

export type DetailTab<T extends string> = {
  value: T;
  label: string;
};

type DetailTabBarProps<T extends string> = {
  tabs: readonly DetailTab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Tour anchor for the whole bar. */
  anchorId?: string;
};

/**
 * The tab row under a detail screen's header (property, renter).
 *
 * Tabs are sized to their labels with a fixed gap, not equal columns. Equal columns gave
 * "Info" as much room as "Transactions", so on a 360dp phone the long labels nearly touched
 * while the short ones floated in space. The row centres while it fits and scrolls
 * sideways when it does not (narrow phones, large system text) instead of squeezing.
 *
 * No fill: it sits on the screen background with the header above it, and a hairline
 * underneath is the one boundary between header and content.
 */
function DetailTabBarInner<T extends string>({
  tabs,
  value,
  onChange,
  anchorId,
}: DetailTabBarProps<T>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <TourAnchor id={anchorId} style={[styles.bar, { borderBottomColor: colors.outline }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab) => {
          const isActive = value === tab.value;
          return (
            <Pressable
              key={tab.value}
              style={[styles.tab, isActive && { borderBottomColor: colors.primary }]}
              hitSlop={{ left: spacing.md, right: spacing.md }}
              onPress={() => onChange(tab.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                variant="labelLarge"
                maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: isActive ? colors.primary : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </TourAnchor>
  );
}

export const DetailTabBar = React.memo(DetailTabBarInner) as typeof DetailTabBarInner;

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: 1,
  },
  // flexGrow lets the content fill the viewport so it can centre; once it is wider than
  // the screen it scrolls instead.
  row: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  // The indicator spans the label, not a column, so it sits under the word it marks.
  tab: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  label: {
    fontWeight: '600',
  },
});
