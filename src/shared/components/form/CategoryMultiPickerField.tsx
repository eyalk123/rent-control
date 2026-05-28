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
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Button,
  Dialog,
  Menu,
  Portal,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

const MENU_MAX_HEIGHT = 280;

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
  const { isRtl } = useLanguageContext();

  const { categories, loading, refreshCategories } = useExpenseCategories();

  const [menuVisible, setMenuVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [anchorWidth, setAnchorWidth] = useState(0);

  const selectedCategories = value
    .map((id) => categories.find((c) => c.id === id))
    .filter((c) => c != null);

  const displayText =
    selectedCategories.length > 0
      ? selectedCategories.map((c) => getCategoryDisplayName(c!, t)).join(', ')
      : null;

  const handleToggle = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((cid) => cid !== id));
    } else {
      onChange([...value, id]);
    }
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
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Pressable
            onPress={() => setMenuVisible(true)}
            onLayout={(e) => setAnchorWidth(e.nativeEvent.layout.width)}
            style={[
              styles.dropdown,
              {
                backgroundColor: colors.inputFilledBackground,
                borderColor: error ? colors.error : colors.outline,
              },
            ]}
          >
              <Text
                style={[
                  styles.valueText,
                  rtlInputStyle,
                  {
                    color: displayText ? colors.textPrimary : colors.placeholder,
                    textAlign: isRtl ? 'right' : 'left',
                    flex: 1,
                  },
                ]}
                numberOfLines={1}
              >
                {displayText || t('common.selectItem')}
              </Text>
              <View style={isRtl ? styles.iconRtl : styles.iconLtr}>
                <Icon name="chevron-down" size={20} color={colors.placeholder} />
              </View>
            </Pressable>
          }
          anchorPosition="bottom"
          contentStyle={[
            styles.menuContent,
            {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.outline,
              width: anchorWidth,
            },
          ]}
        >
          <ScrollView
            style={styles.menuScroll}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <Text style={{ color: colors.textSecondary }}>
                  {t('common.loading', { defaultValue: 'Loading…' })}
                </Text>
              </View>
            ) : (
              categories.map((cat) => {
                const selected = value.includes(cat.id);
                return (
                  <TouchableRipple
                    key={cat.id}
                    onPress={() => handleToggle(cat.id)}
                    style={[styles.itemContainer, { backgroundColor: colors.surface }]}
                  >
                    <View style={styles.itemRow}>
                      <View style={isRtl ? styles.checkIconRtl : styles.checkIconLtr}>
                        <Icon
                          name={selected ? 'check-square' : 'square'}
                          size={18}
                          color={selected ? colors.primary : colors.placeholder}
                        />
                      </View>
                      <Text
                        style={[
                          styles.itemText,
                          {
                            color: colors.textPrimary,
                            flex: 1,
                            textAlign: isRtl ? 'right' : 'left',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {getCategoryDisplayName(cat, t)}
                      </Text>
                    </View>
                  </TouchableRipple>
                );
              })
            )}
            <TouchableRipple
              onPress={() => {
                setMenuVisible(false);
                setCreateModalVisible(true);
              }}
              style={[
                styles.itemContainer,
                styles.createItem,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.itemRow}>
                <View style={isRtl ? styles.checkIconRtl : styles.checkIconLtr}>
                  <Icon name="plus" size={16} color={colors.primary} />
                </View>
                <Text
                  style={[
                    styles.itemText,
                    { color: colors.primary, flex: 1, textAlign: isRtl ? 'right' : 'left' },
                  ]}
                >
                  {t('suppliers.createNewCategory', { defaultValue: 'Create new category...' })}
                </Text>
              </View>
            </TouchableRipple>
          </ScrollView>
        </Menu>
      </View>

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

const styles = StyleSheet.create({
  inputWrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 4,
    fontWeight: '500',
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
  },
  iconLtr: {
    marginLeft: 4,
  },
  iconRtl: {
    marginRight: 4,
  },
  menuContent: {
    paddingVertical: 0,
    borderRadius: 4,
    overflow: 'hidden',
  },
  menuScroll: {
    maxHeight: MENU_MAX_HEIGHT,
  },
  itemContainer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIconLtr: {
    marginRight: 8,
  },
  checkIconRtl: {
    marginLeft: 8,
  },
  itemText: {
    fontSize: 16,
  },
  createItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  loadingRow: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 4,
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
