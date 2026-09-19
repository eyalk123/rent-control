import apiClient from '@/src/core/api/client';
import { USE_MOCK_API, mockFeedbackApi } from '@/src/core/api/mock';
import type { FeedbackType } from '../validation/feedbackValidation';

/** A screenshot on its way to becoming an email attachment. Never stored anywhere. */
export type FeedbackScreenshot = {
  filename: string;
  contentType: 'image/jpeg';
  /** Base64 payload only — no `data:` prefix. */
  data: string;
};

export type FeedbackSubmission = {
  type: FeedbackType;
  message: string;
  screenshots: FeedbackScreenshot[];
};

export type FeedbackReceipt = {
  id: number;
  type: FeedbackType;
  created_at: string;
};

/**
 * Send a support message. App, platform and version already travel on every
 * request as `X-Client-*` headers, so the body carries only what the transport
 * cannot tell the server.
 */
export async function submitFeedback(data: FeedbackSubmission): Promise<FeedbackReceipt> {
  if (USE_MOCK_API) {
    return mockFeedbackApi.submitFeedback(data);
  }

  const payload = {
    type: data.type,
    message: data.message,
    screenshots: data.screenshots.map((shot) => ({
      filename: shot.filename,
      content_type: shot.contentType,
      data: shot.data,
    })),
  };

  const response = await apiClient.post<FeedbackReceipt>('/support-messages', payload);
  return response.data;
}
