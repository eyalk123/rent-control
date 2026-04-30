import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
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
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui';

export interface FilterOption {
  id: string | number;
  label: string;
}

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
  const [search, setSearch] = useState('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 50) handleDismiss();
      },
    }),
  ).current;

  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase().trim()),
      )
    : options;

  const handleSelect = (id: string | number | null) => {
    onSelect(id);
    setSearch('');
    onDismiss();
  };

  const handleDismiss = () => {
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
      {/* Backdrop — full screen tap to dismiss */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />

      {/* KeyboardAvoidingView pushes the sheet up when keyboard is shown */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavContainer}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          {/* Drag handle — swipe down to dismiss */}
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
            <Pressable onPress={handleDismiss} hitSlop={8}>
              <Icon name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.searchWrapper}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('search.placeholder', { defaultValue: 'Search...' })}
              mode="outlined"
              dense
              left={
                <TextInput.Icon
                  icon={() => (
                    <Icon name="search" size={18} color={colors.placeholder} />
                  )}
                />
              }
              style={[styles.searchInput, { backgroundColor: colors.inputFilledBackground }]}
              outlineStyle={{ borderColor: colors.outline, borderRadius: 10 }}
              textColor={colors.textPrimary}
              placeholderTextColor={colors.placeholder}
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              selectedId !== null ? (
                <TouchableRipple
                  onPress={() => handleSelect(null)}
                  style={styles.row}
                >
                  <View style={styles.rowInner}>
                    <Text style={[styles.rowLabel, { color: colors.error }]}>
                      {t('filters.clear', { defaultValue: 'Clear filter' })}
                    </Text>
                    <Icon name="x" size={16} color={colors.error} />
                  </View>
                </TouchableRipple>
              ) : null
            }
            renderItem={({ item }) => {
              const active = item.id === selectedId;
              return (
                <TouchableRipple
                  onPress={() => handleSelect(item.id)}
                  style={styles.row}
                >
                  <View style={styles.rowInner}>
                    <Text
                      style={[
                        styles.rowLabel,
                        {
                          color: active ? colors.primary : colors.textPrimary,
                          fontWeight: active ? '700' : '400',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {active && (
                      <Icon name="check" size={16} color={colors.primary} />
                    )}
                  </View>
                </TouchableRipple>
              );
            }}
            ItemSeparatorComponent={() => (
              <View
                style={[styles.separator, { backgroundColor: colors.outline }]}
              />
            )}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kavContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: spacing.xs,
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
    paddingBottom: spacing.sm,
  },
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    fontSize: 14,
  },
  list: {
    maxHeight: 340,
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 15,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },
});
