import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { ScreenContainer } from '@/src/shared/components/ui';
import { FormScrollView } from '@/src/shared/components/form';
import { FeedbackForm } from '../components/FeedbackForm';
import { useFeedbackForm } from '../hooks/useFeedbackForm';
import type { FeedbackType } from '../validation/feedbackValidation';

/**
 * "Send us a message" — a bug report, a question or a suggestion.
 *
 * There is no in-app inbox: the submission is emailed to the product owner, who
 * replies to the address on the account. That is why the form says who it will
 * reply to and then gets out of the way.
 *
 * No header of its own — `app/settings/_layout.tsx` gives this route a native
 * one, unlike the add/edit screens that live outside a titled Stack.
 */
export function FeedbackScreen() {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAppAuth();

  const { formMethods, onSubmit, isSubmitting, screenshots, setScreenshots } =
    useFeedbackForm({ t, onSuccess: () => router.back() });

  const { control, formState, setValue, watch } = formMethods;
  const type = watch('type') as FeedbackType;

  React.useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!formState.isDirty && screenshots.length === 0) return;
      e.preventDefault();
      appAlert(t('common.discardChanges'), t('common.discardChangesMessage'), [
        { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
        {
          text: t('common.discard'),
          style: 'destructive',
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });
    return unsub;
  }, [navigation, formState.isDirty, screenshots.length, t, appAlert]);

  const onPressSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit();
  };

  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        <FormScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <FeedbackForm
            control={control}
            type={type}
            onTypeChange={(next) => setValue('type', next, { shouldDirty: true })}
            screenshots={screenshots}
            onScreenshotsChange={setScreenshots}
            isSubmitting={isSubmitting}
            replyEmail={user?.email}
          />
        </FormScrollView>
        <View style={styles.fixedButtonBar}>
          <Button
            mode="contained"
            onPress={onPressSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            {t('feedback.submit')}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.formPaddingHorizontal,
    paddingBottom: 24,
  },
  fixedButtonBar: {
    marginTop: 'auto',
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.sm,
  },
  submitButton: {
    borderRadius: 12,
  },
  submitButtonContent: {
    minHeight: 48,
  },
});
