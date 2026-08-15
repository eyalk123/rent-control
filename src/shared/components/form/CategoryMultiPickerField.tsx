import {
  useLanguageContext,
  useRtlInputStyle,
  useRtlLabelStyle,
} from '@/src/core/context';
import { getApiErrorMessage } from '@/src/core/api/client';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui';
import { createExpenseCategory } from '@/src/features/transactions/api/transactions';
import { useExpenseCategories } from '@/src/features/transactions/hooks/useTransactions';
import { getCategoryDisplayName } from '@/src/features/transactions/utils/categoryUtils';
import { sortOptions } from '@/src/shared/utils/sortOptions';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Button,
  Chip,
  Dialog,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { MultiSelect } from 'react-native-element-dropdown';

const CREATE_NEW_VALUE = '__create_new__';

interface CategoryMultiPickerFieldProps {
  value: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  error?: { message?: string };
  inputStyle?: StyleProp<ViewStyle>;
}

export function CategoryMultiPickerField({
  value,
  onChange,
  label,
  error,
  inputStyle,
}: CategoryMultiPickerFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const rtlLabelStyle = useRtlLabelStyle();
  const { isRtl, language } = useLanguageContext();

  const { categories, loading, refreshCategories } = useExpenseCategories();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const stringValue = useMemo(() => value.map((v) => String(v)), [value]);

  // Only show unselected categories, alphabetically by their translated name (the backend's
  // `sort_order` is a curated order over keys, unrelated to what is displayed here); always
  // append the "Create new" action row.
  const availableData = useMemo(() => {
    const unselected = sortOptions(
      categories
        .filter((cat) => !stringValue.includes(String(cat.id)))
        .map((cat) => ({
          label: getCategoryDisplayName(cat, t),
          value: String(cat.id),
        })),
      language,
    );
    return [
      ...unselected,
      {
        label: t('suppliers.createNewCategory', {
          defaultValue: 'Create new category...',
        }),
        value: CREATE_NEW_VALUE,
      },
    ];
  }, [categories, stringValue, t, language]);

  // Chips follow the same alphabetical order as the list, not selection order.
  const selectedCategories = useMemo(
    () => sortOptions(
      categories
        .filter((cat) => stringValue.includes(String(cat.id)))
        .map((cat) => ({ id: cat.id, label: getCategoryDisplayName(cat, t) })),
      language,
    ),
    [categories, stringValue, t, language],
  );

  const handleChange = (strings: string[]) => {
    if (strings.includes(CREATE_NEW_VALUE)) {
      setCreateModalVisible(true);
      return;
    }
    const newIds = categories
      .filter((cat) => strings.includes(String(cat.id)))
      .map((cat) => cat.id);
    onChange([...value, ...newIds]);
  };

  const handleUnselect = (id: number) => {
    onChange(value.filter((cid) => cid !== id));
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
      setCreateModalVisible(false);
    } catch (err) {
      setCreateError(getApiErrorMessage(err, t('error.createCategoryFailed')));
    } finally {
      setCreateLoading(false);
    }
  };

  const closeCreate = () => {
    setCreateModalVisible(false);
    setCreateName('');
    setCreateError(null);
  };

  const renderItem = useCallback(
    (item: { label: string; value: string }) => {
      const isCreate = item.value === CREATE_NEW_VALUE;
      return (
        <View
          style={[
            styles.itemContainer,
            isCreate && styles.createItem,
            { backgroundColor: colors.surface },
          ]}
        >
          {isCreate ? (
            <View
              style={[
                styles.itemRow,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <Icon name="plus" size={16} color={colors.primary} />
              <Text
                style={[
                  styles.itemText,
                  rtlInputStyle,
                  {
                    textAlign: isRtl ? 'right' : 'left',
                    color: colors.primary,
                    fontWeight: '600',
                    marginHorizontal: 8,
                  },
                ]}
              >
                {item.label}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.itemText,
                rtlInputStyle,
                {
                  textAlign: isRtl ? 'right' : 'left',
                  width: '100%',
                  color: colors.textPrimary,
                },
              ]}
            >
              {item.label}
            </Text>
          )}
        </View>
      );
    },
    [colors.surface, colors.primary, colors.textPrimary, isRtl, rtlInputStyle],
  );

  return (
    <View style={[styles.inputWrap, inputStyle]}>
      {label ? (
        <Text
          variant="bodyMedium"
          style={[
            styles.label,
            rtlLabelStyle,
            { color: error ? colors.error : colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : null}

      <View style={{ direction: 'ltr' }}>
        <MultiSelect
          data={availableData}
          labelField="label"
          valueField="value"
          value={[]}
          placeholder={loading ? t('common.loading', { defaultValue: 'Loading…' }) : t('common.selectItem')}
          renderRightIcon={isRtl ? () => null : undefined}
          renderLeftIcon={
            isRtl
              ? () => (
                  <Icon
                    name="chevron-down"
                    size={20}
                    color={colors.placeholder}
                  />
                )
              : undefined
          }
          placeholderStyle={[
            styles.placeholder,
            rtlInputStyle,
            {
              color: colors.placeholder,
              textAlign: isRtl ? 'right' : 'left',
            },
          ]}
          selectedTextStyle={[
            styles.selectedText,
            rtlInputStyle,
            {
              textAlign: isRtl ? 'right' : 'left',
              color: colors.textPrimary,
            },
          ]}
          itemTextStyle={[rtlInputStyle, { color: colors.textPrimary }]}
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.inputFilledBackground,
              borderColor: error ? colors.error : colors.outline,
            },
          ]}
          containerStyle={[
            styles.dropdownContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            },
          ]}
          activeColor={colors.inputFilledBackground}
          onChange={handleChange}
          renderItem={renderItem}
          renderSelectedItem={() => null}
          visibleSelectedItem={false}
        />
      </View>

      {value.length > 0 ? (
        <ScrollView
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {selectedCategories.map((cat) => (
            <Chip
              key={String(cat.id)}
              mode="outlined"
              onClose={() => handleUnselect(cat.id)}
              style={styles.chip}
              textStyle={{ color: colors.textPrimary }}
            >
              {cat.label}
            </Chip>
          ))}
        </ScrollView>
      ) : null}

      {error?.message ? (
        <Text variant="bodySmall" style={[styles.errorText, { color: colors.error }]}>
          {t(error.message, { defaultValue: error.message })}
        </Text>
      ) : null}

      <Portal>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
          pointerEvents="box-none"
        >
          <Dialog
            visible={createModalVisible}
            onDismiss={closeCreate}
            style={[
              styles.dialog,
              {
                backgroundColor: theme.dark
                  ? darkColors.surfaceElevated
                  : lightColors.surface,
              },
            ]}
          >
            <Dialog.Title
              style={[
                styles.dialogTitle,
                { textAlign: isRtl ? 'right' : 'left', color: colors.textPrimary },
              ]}
            >
              {t('suppliers.createCategoryTitle', { defaultValue: 'Create new category' })}
            </Dialog.Title>
            <Dialog.Content>
              <TextInput
                value={createName}
                onChangeText={setCreateName}
                placeholder={t('suppliers.createCategory', { defaultValue: 'Category name' })}
                mode="outlined"
                dense
                style={[
                  styles.dialogInput,
                  rtlInputStyle,
                  {
                    backgroundColor: theme.dark
                      ? darkColors.inputFilledBackground
                      : lightColors.inputBackground,
                  },
                ]}
                contentStyle={rtlInputStyle}
                textColor={colors.textPrimary}
                autoFocus
                editable={!createLoading}
                onSubmitEditing={handleCreateCategory}
                returnKeyType="done"
              />
              {createError ? (
                <Text variant="bodySmall" style={[styles.errorText, { color: colors.error }]}>
                  {createError}
                </Text>
              ) : null}
            </Dialog.Content>
            <Dialog.Actions style={styles.dialogActions}>
              <Button onPress={closeCreate} textColor={colors.textSecondary}>
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateCategory}
                loading={createLoading}
                disabled={!createName.trim() || createLoading}
                style={isRtl ? { marginRight: spacing.sm } : { marginLeft: spacing.sm }}
              >
                {t('common.create', { defaultValue: 'Create' })}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </KeyboardAvoidingView>
      </Portal>
    </View>
  );
}

const CHIP_ROW_HEIGHT = 36;
const CHIP_GAP = 6;
const MAX_CHIP_ROWS = 3;

const styles = StyleSheet.create({
  inputWrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 4,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 4,
  },
  placeholder: {
    fontSize: 16,
  },
  selectedText: {
    fontSize: 16,
  },
  itemContainer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  itemRow: {
    alignItems: 'center',
  },
  createItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  itemText: {
    fontSize: 16,
  },
  chipsScroll: {
    maxHeight: CHIP_ROW_HEIGHT * MAX_CHIP_ROWS + CHIP_GAP * (MAX_CHIP_ROWS - 1),
    marginTop: 8,
  },
  chipsContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CHIP_GAP,
  },
  chip: {
    borderRadius: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  dialog: {
    borderRadius: 16,
    marginBottom: 100,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  dialogInput: {
    marginTop: spacing.xs,
  },
  dialogActions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
});
