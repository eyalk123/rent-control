import React from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LoadingOverlay, ScreenContainer } from '@/src/shared/components/ui';
import { useLanguageContext } from '@/src/context';
import { useSupplierForm } from '@/src/features/suppliers/hooks/useSupplierForm';
import { useContactPicker } from '@/src/features/renters/hooks/useContactPicker';
import { SupplierForm } from '@/src/features/suppliers/components/SupplierForm';
import { useSuppliersList } from '@/src/features/suppliers/hooks/useSuppliersList';
import { darkColors, lightColors, spacing } from '@/src/core/theme';

export function AddEditSupplierScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { refreshSuppliers } = useSuppliersList();
  const isEdit = Boolean(id);
  const navigation = useNavigation();

  const { formMethods, onSubmit, isSubmitting, isFetching } = useSupplierForm({
    id,
    t,
    refreshSuppliers,
    onSuccess: () => router.back(),
  });

  const { formState, control, setValue } = formMethods;
  const { requestPermission, pickContact } = useContactPicker();

  const handlePickFromContacts = React.useCallback(async () => {
    const status = await requestPermission();
    if (status !== 'granted') {
      Alert.alert(
        t('error.title'),
        t('renter.contactsPermissionDenied'),
      );
      return;
    }
    const picked = await pickContact();
    if (picked) {
      const name = [picked.firstName, picked.lastName].filter(Boolean).join(' ').trim() || picked.firstName || picked.lastName || '';
      setValue('name', name, { shouldDirty: true });
      setValue('phone', picked.phone, { shouldDirty: true });
      setValue('email', picked.email, { shouldDirty: true });
    }
  }, [requestPermission, pickContact, setValue, t]);

  React.useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!formState.isDirty) return;
      e.preventDefault();
      Alert.alert(
        t('common.discardChanges'),
        t('common.discardChangesMessage'),
        [
          { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
          {
            text: t('common.discard'),
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
    return unsub;
  }, [navigation, formState.isDirty, t]);

  const handleHeaderBack = () => {
    router.back();
  };

  const onPressSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit();
  };

  if (isEdit && isFetching) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        <View
          style={[
            styles.header,
            { flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          <TouchableOpacity
            onPress={handleHeaderBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={isRtl ? 'chevron-right' : 'chevron-left'}
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isEdit
              ? t('suppliers.edit', { defaultValue: 'Edit Supplier' })
              : t('suppliers.add', { defaultValue: 'Add Supplier' })}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={spacing.keyboardExtraScrollHeight}
          bounces={false}
        >
          <SupplierForm
            control={control}
            isEdit={isEdit}
            onPickFromContacts={handlePickFromContacts}
          />
        </KeyboardAwareScrollView>
        <View style={styles.fixedButtonBar}>
          <Button
            mode="contained"
            onPress={onPressSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            {isEdit
              ? t('suppliers.updateSupplier', { defaultValue: 'Update Supplier' })
              : t('suppliers.saveSupplier', { defaultValue: 'Save Supplier' })}
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.formPaddingHorizontal,
    paddingBottom: 24,
  },
  fixedButtonBar: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 24,
  },
  saveButton: {
    borderRadius: 12,
  },
  saveButtonContent: {
    minHeight: 48,
  },
});
