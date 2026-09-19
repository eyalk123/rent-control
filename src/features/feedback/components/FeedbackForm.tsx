import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Control } from 'react-hook-form';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useRtlLabelStyle } from '@/src/core/context';
import { FormSectionCard } from '@/src/shared/components/form/FormSectionCard';
import { FormInput } from '@/src/shared/components/form/FormInput';
import { SegmentedControl } from '@/src/shared/components/ui/SegmentedControl';
import type { FeedbackScreenshot } from '../api/feedback';
import { ScreenshotPicker } from './ScreenshotPicker';
import {
  FEEDBACK_TYPES,
  type FeedbackFormValues,
  type FeedbackType,
} from '../validation/feedbackValidation';

type Props = {
  control: Control<FeedbackFormValues>;
  type: FeedbackType;
  onTypeChange: (next: FeedbackType) => void;
  screenshots: FeedbackScreenshot[];
  onScreenshotsChange: (next: FeedbackScreenshot[]) => void;
  isSubmitting: boolean;
  replyEmail?: string | null;
};

export function FeedbackForm({
  control,
  type,
  onTypeChange,
  screenshots,
  onScreenshotsChange,
  isSubmitting,
  replyEmail,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlLabelStyle = useRtlLabelStyle();

  const segments = FEEDBACK_TYPES.map((value) => ({
    value,
    label: t(`feedback.type_${value}`),
  }));

  return (
    <View>
      {/* The intro sits outside the card because the native header already says
          "Send us a message" — repeating it as the card title read as a stutter
          on the emulator. */}
      <Text style={[styles.intro, { color: colors.textSecondary }, rtlLabelStyle]}>
        {t('feedback.subtitle')}
      </Text>

      <FormSectionCard title={t('feedback.typeLabel')}>
        <SegmentedControl<FeedbackType>
          segments={segments}
          value={type}
          onChange={onTypeChange}
        />

        <FormInput
          control={control}
          name="message"
          label={t('feedback.messageLabel')}
          placeholder={t(`feedback.placeholder_${type}`)}
          multiline
          required
        />

        <Text style={[styles.label, { color: colors.textPrimary }, rtlLabelStyle]}>
          {t('feedback.screenshotsLabel')}
        </Text>
        <ScreenshotPicker
          value={screenshots}
          onChange={onScreenshotsChange}
          disabled={isSubmitting}
        />
      </FormSectionCard>

      {/* Sets the expectation the whole design rests on: the answer arrives by
          email, not in a second inbox inside the app. */}
      <Text style={[styles.replyNote, { color: colors.textSecondary }, rtlLabelStyle]}>
        {replyEmail
          ? t('feedback.replyTo', { email: replyEmail })
          : t('feedback.replyToGeneric')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 13,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  replyNote: {
    fontSize: 12,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
