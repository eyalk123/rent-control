import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui/Icon';

export interface FilterChip {
  key: string;
  label: string;
  selectedLabel: string | null;
  onPress: () => void;
  onClear: () => void;
}

interface FilterChipsBarProps {
  chips: FilterChip[];
}

/** Two or more active filters and it stops being obvious what is narrowing the list. */
const CLEAR_ALL_THRESHOLD = 2;

/**
 * The filter chips, wrapping onto as many rows as they need.
 *
 * Deliberately not a horizontal scroller. A chip carries its value once it is set, so it grows
 * from a short field name to a whole address and shoves everything after it - which left the
 * last chip cut mid-word against the card edge, and on Transactions left the Supplier filter
 * permanently off screen. Wrapping means nothing is ever cut and nothing can scroll out of
 * reach; the cost is a taller card, which is visible and predictable.
 */
export const FilterChipsBar = React.memo(function FilterChipsBar({ chips }: FilterChipsBarProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colors = theme.dark ? darkColors : lightColors;

  const activeChips = chips.filter((c) => c.selectedLabel !== null);

  // An active chip is tinted rather than filled: it carries a whole address or name, and a
  // solid navy band that wide outweighs everything else on the screen.
  //
  // The label and outline are textPrimary, not primary. Dark-mode primary (#3E6FA8) over this
  // tint measures 2.64:1 for the label and 2.78:1 for the outline - under the 4.5:1 text floor
  // and the 3:1 floor for a control. textPrimary gives 12.1:1 light and 11.6:1 dark, and the
  // tint keeps the navy without depending on it to be legible.
  const activeBg = colors.primary + '14';

  return (
    <View style={styles.wrap}>
      {chips.map((chip) => {
        const active = chip.selectedLabel !== null;
        return (
          <Pressable
            key={chip.key}
            onPress={() => {
              Haptics.selectionAsync();
              chip.onPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={active ? `${chip.label}: ${chip.selectedLabel}` : chip.label}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? activeBg : 'transparent',
                borderColor: active ? colors.textPrimary : colors.outline,
                borderWidth: active ? 1.5 : 1,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {/* The value, not the field name: a chip reading "Property" cannot tell you which
                property, which is what the separate pill row used to be there to say. */}
            <Text
              style={[
                styles.chipLabel,
                active && styles.chipLabelActive,
                { color: active ? colors.textPrimary : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {active ? chip.selectedLabel : chip.label}
            </Text>
            {active ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.selectionAsync();
                  chip.onClear();
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('filters.clearOne', { name: chip.label })}
                style={styles.iconBtn}
              >
                <Icon name="x" size={13} color={colors.textPrimary} />
              </Pressable>
            ) : (
              <View style={styles.iconBtn}>
                <Icon name="chevron-down" size={13} color={colors.textSecondary} />
              </View>
            )}
          </Pressable>
        );
      })}
      {activeChips.length >= CLEAR_ALL_THRESHOLD ? (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            activeChips.forEach((c) => c.onClear());
          }}
          accessibilityRole="button"
          hitSlop={6}
          style={({ pressed }) => [styles.clearAll, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.clearAllLabel, { color: colors.textSecondary }]}>
            {t('filters.clearAll')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    paddingVertical: 7,
    paddingStart: 12,
    paddingEnd: 9,
    borderRadius: 999,
    gap: 5,
    // A value longer than the card still truncates rather than forcing a horizontal overflow.
    maxWidth: '100%',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  chipLabelActive: {
    fontWeight: '700',
  },
  iconBtn: {
    padding: 1,
  },
  clearAll: {
    minHeight: 36,
    justifyContent: 'center',
    // Auto margin takes the free space left on whatever row it lands on, so it sits at the far
    // end rather than butting up against the last chip.
    marginStart: 'auto',
    paddingHorizontal: spacing.xs,
  },
  clearAllLabel: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
