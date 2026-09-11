import * as Haptics from 'expo-haptics';
import React, { useCallback, useImperativeHandle, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguageContext } from '@/src/core/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui/Icon';

export interface FilterChip {
  key: string;
  label: string;
  selectedLabel: string | null;
  onPress: () => void;
  onClear: () => void;
}

export interface FilterChipsBarHandle {
  scrollToStart: () => void;
}

interface FilterChipsBarProps {
  chips: FilterChip[];
  ref?: React.Ref<FilterChipsBarHandle>;
}

/** Two or more active filters and it stops being obvious what is narrowing the list. */
const CLEAR_ALL_THRESHOLD = 2;

/**
 * The scroll hint at the trailing edge, as stacked steps.
 *
 * expo-linear-gradient is not a dependency and a 14px hint does not justify adding one, so
 * this approximates the ramp with four bands of the card colour. At this width the steps are
 * not resolvable; a single flat band would read as a rendering artifact over a chip.
 */
const FADE_STEPS = [0.15, 0.4, 0.7, 0.95];
const FADE_STEP_WIDTH = 4;

// React 19: ref is a plain prop — no forwardRef needed
export const FilterChipsBar = React.memo(function FilterChipsBar({ chips, ref }: FilterChipsBarProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isRtl } = useLanguageContext();
  const colors = theme.dark ? darkColors : lightColors;
  const scrollRef = useRef<ScrollView>(null);

  const scrollToStart = useCallback(() => {
    if (isRtl) {
      scrollRef.current?.scrollToEnd({ animated: false });
    } else {
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [isRtl]);

  useImperativeHandle(ref, () => ({ scrollToStart }), [scrollToStart]);

  // Under RTL an overflowing horizontal ScrollView comes up resting at the wrong end, cutting
  // the first chip against the leading edge - and the first chip is usually the one just set.
  // LTR rests correctly on its own, and pinning it there would undo a deliberate scroll every
  // time a chip's label changed, so this only corrects the direction that is actually wrong.
  const handleContentSizeChange = useCallback(() => {
    if (isRtl) scrollToStart();
  }, [isRtl, scrollToStart]);

  const activeChips = chips.filter((c) => c.selectedLabel !== null);

  // An active chip is tinted rather than filled: it now carries a whole address or name, and
  // a solid navy band that wide outweighs everything else on the screen.
  //
  // The label and outline are textPrimary, not primary. Dark-mode primary (#3E6FA8) over this
  // tint measures 2.64:1 for the label and 2.78:1 for the outline - under the 4.5:1 text floor
  // and the 3:1 floor for a control. textPrimary gives 12.1:1 light and 11.6:1 dark, and the
  // tint keeps the navy without depending on it to be legible.
  const activeBg = colors.primary + '14';

  const chipElements = chips.map((chip) => {
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
  });

  const showClearAll = activeChips.length >= CLEAR_ALL_THRESHOLD;

  return (
    <View style={styles.row}>
      <View style={styles.scrollWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.content}
          style={styles.scroll}
          onContentSizeChange={handleContentSizeChange}
        >
          {chipElements}
        </ScrollView>
        {/* The scroll hint. The last chip used to be clipped mid-word against the card edge
            with nothing to say the row continued - which is how the Supplier chip stayed
            hidden on Transactions. */}
        <View pointerEvents="none" style={styles.edgeFade}>
          {FADE_STEPS.map((opacity, i) => (
            <View
              key={i}
              style={{ width: FADE_STEP_WIDTH, backgroundColor: colors.surface, opacity }}
            />
          ))}
        </View>
      </View>
      {/* Outside the ScrollView, so it takes its own space rather than covering a chip, and
          so it cannot scroll out of reach the way a trailing chip can. */}
      {showClearAll ? (
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollWrap: {
    flex: 1,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingEnd: spacing.md,
    alignItems: 'center',
  },
  edgeFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    end: 0,
    flexDirection: 'row',
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
    maxWidth: 200,
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
    justifyContent: 'center',
    minHeight: 36,
    paddingStart: spacing.xs,
    paddingEnd: spacing.xs,
  },
  clearAllLabel: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
