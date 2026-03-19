import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { Chip, Menu, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRtlInputStyle, useRtlLabelStyle } from '@/src/context';
import { useExpenseCategories } from '@/src/features/transactions/hooks/useTransactions';
import { createExpenseCategory } from '@/src/features/transactions/api/transactions';
import { getCategoryDisplayName } from '@/src/features/transactions/utils/categoryUtils';
import type { ExpenseCategory } from '@/src/shared/types';
import { getApiErrorMessage } from '@/src/core/api/client';
import { spacing, lightColors, darkColors } from '@/src/core/theme';

interface CategoryTagPickerProps {
  value: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
}

export function CategoryTagPicker({
  value,
  onChange,
  label,
  inputStyle,
}: CategoryTagPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const rtlLabelStyle = useRtlLabelStyle();
  const { categories, loading, refreshCategories } = useExpenseCategories();
  const [menuVisible, setMenuVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedCategories = value
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is ExpenseCategory => c != null);
  const availableToAdd = categories.filter((c) => !value.includes(c.id));

  const handleRemove = (id: number) => {
    onChange(value.filter((cid) => cid !== id));
  };

  const handleAdd = (id: number) => {
    if (!value.includes(id)) {
      onChange([...value, id]);
    }
    setMenuVisible(false);
  };

  const handleCreateCategory = async () => {
    const trimmed = createName.trim();
    if (!trimmed || createLoading) return;

    setCreateLoading(true);
    setCreateError(null);
    try {
      const created = await createExpenseCategory(trimmed);
      await refreshCategories();
      onChange([...value, created.id]);
      setCreateName('');
      setCreateVisible(false);
      setMenuVisible(false);
    } catch (err) {
      setCreateError(getApiErrorMessage(err, 'Failed to create category'));
    } finally {
      setCreateLoading(false);
    }
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => {
    setMenuVisible(false);
    setCreateVisible(false);
    setCreateName('');
    setCreateError(null);
  };

  const showCreateInline = () => {
    setCreateVisible(true);
  };

  return (
    <View style={[styles.container, inputStyle]}>
      {label ? (
        <Text
          variant="bodyMedium"
          style={[styles.label, rtlLabelStyle]}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : null}

      <View style={styles.chipsRow}>
        {selectedCategories.map((cat) => (
          <Chip
            key={cat.id}
            mode="outlined"
            compact
            onClose={() => handleRemove(cat.id)}
            style={styles.chip}
            textStyle={styles.chipText}
          >
            {getCategoryDisplayName(cat, t)}
          </Chip>
        ))}
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <Chip
              mode="outlined"
              compact
              icon="plus"
              onPress={openMenu}
              style={[styles.chip, styles.addChip]}
              textStyle={styles.chipText}
            >
              {t('suppliers.addCategory', { defaultValue: 'Add category' })}
            </Chip>
          }
          anchorPosition="bottom"
          contentStyle={[styles.menuContent, { backgroundColor: colors.surface }]}
        >
        {createVisible ? (
          <View style={styles.createInline}>
            <TextInput
              value={createName}
              onChangeText={setCreateName}
              placeholder={t('suppliers.createCategory', {
                defaultValue: 'Category name',
              })}
              mode="outlined"
              dense
              style={[styles.createInput, rtlInputStyle]}
              contentStyle={rtlInputStyle}
              autoFocus
              editable={!createLoading}
            />
            {createError ? (
              <Text
                variant="bodySmall"
                style={[styles.errorText, { color: colors.error }]}
              >
                {createError}
              </Text>
            ) : null}
            <View style={styles.createActions}>
              <Menu.Item
                onPress={() => setCreateVisible(false)}
                title={t('common.cancel', { defaultValue: 'Cancel' })}
              />
              <Menu.Item
                onPress={handleCreateCategory}
                title={
                  createLoading
                    ? ''
                    : t('common.create', { defaultValue: 'Create' })
                }
                disabled={!createName.trim() || createLoading}
                leadingIcon={createLoading ? () => <ActivityIndicator size="small" /> : undefined}
              />
            </View>
          </View>
        ) : (
          <>
            {availableToAdd.map((cat) => (
              <Menu.Item
                key={cat.id}
                onPress={() => handleAdd(cat.id)}
                title={getCategoryDisplayName(cat, t)}
              />
            ))}
            <Menu.Item
              onPress={showCreateInline}
              title={t('suppliers.createNewCategory', {
                defaultValue: 'Create new category...',
              })}
              leadingIcon="plus"
            />
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" />
              </View>
            ) : null}
          </>
        )}
        </Menu>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginEnd: spacing.xs,
    marginBottom: spacing.xs,
  },
  addChip: {
    backgroundColor: 'transparent',
  },
  chipText: {
    fontSize: 14,
  },
  menuContent: {
    minWidth: 200,
    paddingVertical: spacing.xs,
  },
  createInline: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  createInput: {
    marginBottom: spacing.sm,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  errorText: {
    marginBottom: spacing.xs,
  },
  loadingRow: {
    padding: spacing.sm,
  },
});
