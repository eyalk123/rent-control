import React from 'react';
import { Alert, ScrollView, StyleSheet, View, Platform, KeyboardAvoidingView } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePropertyContext, useLanguageContext } from '@/src/context';
import { ScreenContainer, LoadingOverlay } from '@/src/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/src/theme';
import { lightColors, darkColors } from '@/src/theme';
import { usePropertyForm } from '@/src/hooks/usePropertyForm';
import { ImagePickerSection } from '@/src/screens/components/ImagePickerSection';
import { BasicInfoCard } from '@/src/screens/components/BasicInfoCard';
import { LeaseInfoCard } from '@/src/screens/components/LeaseInfoCard';

export function AddEditPropertyScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshProperties } = usePropertyContext();
  const isEdit = Boolean(id);
  const submitBarHeight = 72;
  const bottomPadding = submitBarHeight + insets.bottom + spacing.md;

  const navigation = useNavigation();

  const { formMethods, onSubmit, isSubmitting, isFetching, imageUri, setImageUri } = usePropertyForm({
    id,
    t,
    refreshProperties,
    onSuccess: () => router.back(),
  });

  const { formState, control } = formMethods;

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
        ]
      );
    });
    return unsub;
  }, [navigation, formState.isDirty, t]);

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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 56 : 0}
      >
        <ScrollView
          style={[styles.scroll, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomPadding, flexGrow: 1 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
        <ImagePickerSection imageUri={imageUri} setImageUri={setImageUri} t={t} />

        <BasicInfoCard control={control} t={t} />

        <LeaseInfoCard control={control} t={t} />
        </ScrollView>
        <View
          style={[
            styles.submitBar,
            {
              paddingBottom: insets.bottom + spacing.sm,
              backgroundColor: theme.colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.outline,
            },
          ]}
        >
          <Button
            mode="contained"
            onPress={onPressSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={[styles.submitButton, { minHeight: 48 }]}
            contentStyle={styles.submitButtonContent}
            accessibilityLabel={
              isEdit ? t('property.updateProperty') : t('property.addProperty')
            }
            accessibilityRole="button"
          >
            {isEdit ? t('property.updateProperty') : t('property.addProperty')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.lg,
  },
  submitBar: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.md,
  },
  submitButton: {
    borderRadius: 12,
  },
  submitButtonContent: {
    minHeight: 48,
  },
});
