import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput, TouchableRipple, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLanguageContext } from '@/src/core/context';
import { darkColors, lightColors, radii, spacing, MAX_CHROME_FONT_SCALE } from '@/src/core/theme';
import { Icon, type IconName } from '@/src/shared/components/ui/Icon';
import { sortOptions } from '@/src/shared/utils/sortOptions';

export interface FilterOption {
  id: string | number;
  label: string;
  /** Sentinel rows ("All", "Unassigned") stay above the sorted options. */
  pinned?: boolean;
  /** A glyph shown in a tile before the label - the property type, a person, an owner. */
  icon?: IconName;
}

/** Below this many options the list is faster to read than to search. */
const SEARCH_THRESHOLD = 8;

interface FilterBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  options: FilterOption[];
  selectedId: string | number | null;
  onSelect: (id: string | number | null) => void;
}

export function FilterBottomSheet({
  visible,
  onDismiss,
  title,
  options,
  selectedId,
  onSelect,
}: FilterBottomSheetProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { language } = useLanguageContext();
  const [search, setSearch] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardOffset(0);
      return;
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardOffset(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 50) handleDismiss();
      },
    }),
  ).current;

  const sorted = useMemo(() => sortOptions(options, language), [options, language]);

  // A search field over four rows is furniture. It earns its place once the list is long
  // enough that scanning it stops being instant.
  const showSearch = sorted.length >= SEARCH_THRESHOLD;

  const filtered = showSearch && search.trim()
    ? sorted.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase().trim()),
      )
    : sorted;

  const handleSelect = (id: string | number | null) => {
    onSelect(id);
    setSearch('');
    onDismiss();
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    setSearch('');
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />

      <View
        style={[styles.container, { marginBottom: keyboardOffset }]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.sheet,
            {
              // Dark mode has no visible shadow, so the sheet steps up a surface instead;
              // at plain surface it was the same colour as the cards behind it.
              backgroundColor: theme.dark ? darkColors.surfaceElevated : colors.surface,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.outline }]} />
          </View>

          <View style={styles.header}>
            <Text
              variant="titleMedium"
              style={{ color: colors.textPrimary, fontWeight: '700' }}
            >
              {title}
            </Text>
            <View style={styles.headerActions}>
              {/* Clearing lives up here rather than as a red first row: it is an action on
                  the sheet, not one of the options, and in red it read like an error. */}
              {selectedId !== null ? (
                <Pressable
                  onPress={() => handleSelect(null)}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text
                    maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
                    style={[styles.clearLabel, { color: colors.primary }]}
                  >
                    {t('filters.clear', { defaultValue: 'Clear filter' })}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleDismiss}
                hitSlop={8}
                accessibilityRole="button"
                style={[styles.closeBtn, { backgroundColor: colors.controlFill }]}
              >
                <Icon name="x" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {showSearch ? (
          <View style={styles.searchWrapper}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('filters.searchIn', { name: title })}
              mode="outlined"
              dense
              left={
                <TextInput.Icon
                  icon={() => (
                    <Icon name="search" size={18} color={colors.placeholder} />
                  )}
                />
              }
              // Filled, no resting outline, to match the chips that opened this sheet. The
              // outline comes back on focus so the field still shows it has the keyboard.
              style={[styles.searchInput, { backgroundColor: colors.controlFill }]}
              outlineColor="transparent"
              activeOutlineColor={colors.primary}
              outlineStyle={{ borderRadius: radii.md }}
              textColor={colors.textPrimary}
              placeholderTextColor={colors.placeholder}
              autoCorrect={false}
            />
          </View>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const active = item.id === selectedId;
              return (
                <TouchableRipple
                  onPress={() => handleSelect(item.id)}
                  borderless
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.row, active && { backgroundColor: colors.primaryBg }]}
                >
                  <View style={styles.rowInner}>
                    {item.icon ? (
                      <View
                        style={[
                          styles.rowIcon,
                          { backgroundColor: active ? colors.surface : colors.primaryBg },
                        ]}
                      >
                        <Icon name={item.icon} size={16} color={colors.primary} />
                      </View>
                    ) : null}
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.rowLabel,
                        {
                          color: colors.textPrimary,
                          fontWeight: active ? '600' : '400',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {active && (
                      <View style={styles.check}>
                        <Icon name="check" size={18} color={colors.primary} />
                      </View>
                    )}
                  </View>
                </TouchableRipple>
              );
            }}
            // No separators: the rows are tall enough to read as rows on their own, and the
            // selected one is marked by its fill rather than by being the odd line out.
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  sheet: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    maxHeight: '70%',
    paddingTop: spacing.xs,
    // White on the white cards behind it, so the edge needs a shadow to exist at all.
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  clearLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    fontSize: 14,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
  },
  row: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Content-sized rather than flex: 1. A flexed Text on Android aligns by its own script, so
  // an English address in the Hebrew layout would jump to the wrong edge.
  rowLabel: {
    flexShrink: 1,
    fontSize: 15,
  },
  check: {
    marginStart: 'auto',
  },
});
