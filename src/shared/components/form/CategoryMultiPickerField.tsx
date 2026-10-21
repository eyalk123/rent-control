import { useLanguageContext, useRtlInputStyle } from '@/src/core/context';
import { getApiErrorMessage } from '@/src/core/api/client';
import { darkColors, lightColors, spacing, useEntityColor } from '@/src/core/theme';
import { ColorDot, Icon } from '@/src/shared/components/ui';
import { createExpenseCategory } from '@/src/features/transactions/api/transactions';
import { useExpenseCategories } from '@/src/features/transactions/hooks/useTransactions';
import { getCategoryDisplayName } from '@/src/features/transactions/utils/categoryUtils';
import { sortOptions } from '@/src/shared/utils/sortOptions';
import { FormField } from './FormField';
import { dropdownListStyle, dropdownPlacement } from './dropdownPlacement';
import { useDropdownSearch } from './dropdownSearch';
import { useFieldSurface } from './fieldSurface';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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

interface CategoryMultiPickerFieldProps {
  value: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  error?: { message?: string };
  inputStyle?: StyleProp<ViewStyle>;
  required?: boolean;
}

export function CategoryMultiPickerField({
  value,
  onChange,
  label,
  error,
  inputStyle,
  required,
}: CategoryMultiPickerFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { isRtl, language } = useLanguageContext();
  const surface = useFieldSurface({ error: !!error });

  const { categories, loading, refreshCategories } = useExpenseCategories();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const stringValue = useMemo(() => value.map((v) => String(v)), [value]);

  // Every category, alphabetically by its translated name (the backend's `sort_order` is a
  // curated order over keys, unrelated to what is displayed here). Selected ones stay in the
  // list with a check, so the open list shows what is already chosen.
  const options = useMemo(
    () => sortOptions(
      categories.map((cat) => ({
        label: getCategoryDisplayName(cat, t),
        value: String(cat.id),
        color: cat.color ?? null,
      })),
      language,
    ),
    [categories, t, language],
  );
  const search = useDropdownSearch(options);

  // Chips follow the same alphabetical order as the list, not selection order.
  const selectedCategories = useMemo(
    () => sortOptions(
      categories
        .filter((cat) => stringValue.includes(String(cat.id)))
        .map((cat) => ({ id: cat.id, label: getCategoryDisplayName(cat, t), color: cat.color ?? null })),
      language,
    ),
    [categories, stringValue, t, language],
  );

  // The library hands back the whole selection with the tapped row toggled.
  const handleChange = (strings: string[]) => {
    onChange(
      categories
        .filter((cat) => strings.includes(String(cat.id)))
        .map((cat) => cat.id),
    );
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
    (item: { label: string; value: string; color: string | null }, selected?: boolean) => (
      <View
        accessibilityState={{ selected: !!selected }}
        style={[
          styles.itemContainer,
          // The wrapper is forced LTR for the library, so RTL is laid out by hand here.
          { flexDirection: isRtl ? 'row-reverse' : 'row' },
          // A selected row shows the library's `activeColor` behind it.
          { backgroundColor: selected ? 'transparent' : colors.surface },
        ]}
      >
        {/* Each category's own color, as on its chip once chosen. */}
        <ColorDot color={item.color} size={10} />
        <Text
          style={[
            styles.itemText,
            rtlInputStyle,
            {
              textAlign: isRtl ? 'right' : 'left',
              color: colors.textPrimary,
              fontWeight: selected ? '600' : '400',
            },
          ]}
        >
          {item.label}
        </Text>
        {selected ? <Icon name="check" size={18} color={colors.primary} /> : null}
      </View>
    ),
    [colors.surface, colors.primary, colors.textPrimary, isRtl, rtlInputStyle],
  );

  return (
    <FormField label={label} required={required} error={error} style={inputStyle}>
      <View style={{ direction: 'ltr' }}>
        <MultiSelect
          data={options}
          labelField="label"
          valueField="value"
          value={stringValue}
          placeholder={
            loading
              ? t('common.loading', { defaultValue: 'Loading…' })
              : label
                ? t('common.selectNamed', { name: label })
                : t('common.selectItem')
          }
          // Without a name the library hides the options from VoiceOver (see DropdownField).
          accessibilityLabel={label ?? t('common.selectItem')}
          flatListProps={{ accessibilityLabel: label ?? t('common.selectItem') }}
          {...dropdownPlacement}
          {...search.props}
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
          style={surface}
          containerStyle={[
            styles.dropdownContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            },
            dropdownListStyle,
            search.listStyle,
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
            <CategoryChip
              key={String(cat.id)}
              label={cat.label}
              color={cat.color}
              onClose={() => handleUnselect(cat.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      {/* Same "+ New …" link as the supplier and owner pickers, but it opens a small dialog:
          a category is only a name, so it does not need a screen of its own. */}
      <TouchableOpacity
        style={styles.addLink}
        onPress={() => setCreateModalVisible(true)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
      >
        <Icon name="plus" size={16} color={colors.primary} />
        <Text variant="labelLarge" style={{ color: colors.primary }}>
          {t('suppliers.newCategory')}
        </Text>
      </TouchableOpacity>

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
    </FormField>
  );
}

const CHIP_ROW_HEIGHT = 36;
const CHIP_GAP = 6;
const MAX_CHIP_ROWS = 3;

/** A chosen category, in its own color - the same chip the transaction screen shows it as. */
function CategoryChip({
  label,
  color,
  onClose,
}: {
  label: string;
  color: string | null;
  onClose: () => void;
}) {
  const { fg, bg } = useEntityColor(color);
  return (
    <Chip
      mode="outlined"
      onClose={onClose}
      closeIcon={({ size }) => <Icon name="x" size={size} color={fg} />}
      style={[styles.chip, { backgroundColor: bg, borderColor: fg }]}
      textStyle={{ color: fg, fontWeight: '600' }}
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  errorText: {
    marginTop: 4,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  placeholder: {
    fontSize: 16,
  },
  selectedText: {
    fontSize: 16,
  },
  itemContainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingTop: 6,
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
    borderRadius: 999,
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
