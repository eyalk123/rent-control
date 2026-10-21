import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import {
  ENTITY_COLOR_KEYS,
  darkColors,
  darkEntityColors,
  lightColors,
  lightEntityColors,
  type EntityColorKey,
} from '@/src/core/theme';
import { Icon } from './Icon';

type ColorPickerProps = {
  value: string | null | undefined;
  onChange: (color: EntityColorKey) => void;
};

const SWATCH = 28;
// 44pt touch target around a 28pt swatch.
const HIT = 44;

/**
 * The six item colors as a row of swatches, one selected. Used in the property and renter
 * forms - never on an avatar or a detail header, where a stray tap would recolor something.
 *
 * Swatches show the strong shade in both themes; the dark theme's neutral fill would make
 * every swatch look the same.
 */
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const palette = theme.dark ? darkEntityColors : lightEntityColors;
  // The check sits on the strong shade: white on the deep light-theme shades, the page
  // charcoal on the pale dark-theme ones.
  const checkColor = theme.dark ? darkColors.background : lightColors.surface;

  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={t('entityColors.label')}>
      {ENTITY_COLOR_KEYS.map((key) => {
        const selected = key === value;
        const { fg } = palette[key];
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={styles.hit}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={t(`entityColors.${key}`)}
          >
            <View
              style={[
                styles.ring,
                { borderColor: selected ? fg : 'transparent' },
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: fg }]}>
                {selected && (
                  <Icon name="check" size={16} color={checkColor} strokeWidth={3} />
                )}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    // Not row-reverse under RTL: the order is a palette, not a reading sequence.
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hit: {
    width: HIT,
    height: HIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: SWATCH + 8,
    height: SWATCH + 8,
    borderRadius: (SWATCH + 8) / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
