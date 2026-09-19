import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useAlert } from '@/src/core/context';
import { submitFeedback, type FeedbackScreenshot } from '../api/feedback';
import {
  feedbackFormSchema,
  type FeedbackFormValues,
} from '../validation/feedbackValidation';

type UseFeedbackFormParams = {
  t: TFunction;
  onSuccess: () => void;
};

export function useFeedbackForm({ t, onSuccess }: UseFeedbackFormParams) {
  const { appAlert } = useAlert();
  const [screenshots, setScreenshots] = React.useState<FeedbackScreenshot[]>([]);

  const formMethods = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema) as Resolver<FeedbackFormValues>,
    defaultValues: { type: 'bug', message: '' },
    mode: 'onBlur',
  });

  const { handleSubmit, reset, formState } = formMethods;

  const submit = handleSubmit(async (values) => {
    try {
      await submitFeedback({
        type: values.type,
        message: values.message,
        screenshots,
      });
      // Reset before leaving so the unsaved-changes guard on the way out has
      // nothing to ask about.
      reset({ type: 'bug', message: '' });
      setScreenshots([]);
      appAlert(t('feedback.successTitle'), t('feedback.successMessage'), [
        { text: t('common.ok', { defaultValue: 'OK' }), onPress: onSuccess },
      ]);
    } catch (err) {
      // The API answers 502 when it could not hand the message to the mail
      // provider, and says so rather than pretending: nobody is watching a
      // database table, so the sender is the only one who can retry.
      appAlert(t('error.title'), getApiErrorMessage(err, t('feedback.submitFailed')));
    }
  });

  return {
    formMethods,
    onSubmit: submit,
    isSubmitting: formState.isSubmitting,
    screenshots,
    setScreenshots,
  };
}
