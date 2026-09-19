import { z } from 'zod';

export const FEEDBACK_TYPES = ['bug', 'question', 'suggestion'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

/** Matches the API's own cap, so an over-long message never makes the round-trip. */
export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_SCREENSHOTS = 3;

export const feedbackFormSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  // Error messages are i18n keys, not sentences: FormField renders
  // `t(error.message, { defaultValue: error.message })`.
  message: z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, { message: 'common.required' })
    .refine((v) => v.length <= MAX_MESSAGE_LENGTH, { message: 'feedback.messageTooLong' }),
});

export type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;
