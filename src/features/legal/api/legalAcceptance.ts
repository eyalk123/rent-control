import { Platform } from 'react-native';
import i18n from 'i18next';
import apiClient from '@/src/core/api/client';
import { USE_MOCK_API } from '@/src/core/api/mock';
import { PRIVACY_VERSION, TERMS_VERSION } from '../legalContent';

export type LegalDocument = 'terms' | 'privacy';

export interface LegalAcceptance {
  document: LegalDocument;
  version: string;
  locale: string;
  acceptedAt: string;
}

export interface LegalStatus {
  terms: LegalAcceptance | null;
  privacy: LegalAcceptance | null;
}

interface LegalAcceptanceDto {
  document: LegalDocument;
  version: string;
  locale: string;
  accepted_at: string;
}

interface LegalStatusDto {
  terms: LegalAcceptanceDto | null;
  privacy: LegalAcceptanceDto | null;
}

export const EMPTY_LEGAL_STATUS: LegalStatus = { terms: null, privacy: null };

function fromDto(dto: LegalStatusDto): LegalStatus {
  const one = (d: LegalAcceptanceDto | null): LegalAcceptance | null =>
    d
      ? { document: d.document, version: d.version, locale: d.locale, acceptedAt: d.accepted_at }
      : null;
  return { terms: one(dto.terms), privacy: one(dto.privacy) };
}

/** The version this build displays for each document — what the gate compares against. */
export const REQUIRED_VERSIONS: Record<LegalDocument, string> = {
  terms: TERMS_VERSION,
  privacy: PRIVACY_VERSION,
};

/**
 * Which documents this user still has to accept.
 *
 * Compared against the versions *this build* bundles, never against the server's
 * `required_*_version` — see the note on TERMS_VERSION in legalContent.ts. It matters more
 * here than on web: an app-store build can lag the server by however long review takes,
 * and asking for wording it cannot render would lock its users out of their own portfolio.
 */
export function outstandingDocuments(status: LegalStatus): LegalDocument[] {
  return (['terms', 'privacy'] as const).filter(
    (doc) => status[doc]?.version !== REQUIRED_VERSIONS[doc],
  );
}

/** Mock mode has no server; an offline UI session should not meet the consent gate. */
function mockStatus(): LegalStatus {
  const now = new Date().toISOString();
  return {
    terms: { document: 'terms', version: TERMS_VERSION, locale: 'en', acceptedAt: now },
    privacy: { document: 'privacy', version: PRIVACY_VERSION, locale: 'en', acceptedAt: now },
  };
}

export async function getLegalStatus(): Promise<LegalStatus> {
  if (USE_MOCK_API) return mockStatus();
  const response = await apiClient.get<LegalStatusDto>('/users/me/legal');
  return fromDto(response.data);
}

/**
 * Records acceptance of the given documents.
 *
 * `locale` is the language the documents were actually rendered in, not a preference: the
 * two texts differ, and which one was on screen is half of what makes the record mean
 * anything.
 */
export async function postLegalAcceptance(
  documents: LegalDocument[],
): Promise<LegalStatus | null> {
  if (USE_MOCK_API) return mockStatus();

  const locale = i18n.language?.startsWith('he') ? 'he' : 'en';
  const response = await apiClient.post<LegalStatusDto>('/users/me/legal', {
    // 'ios' | 'android'. The same read device-token registration already uses.
    platform: Platform.OS,
    acceptances: documents.map((document) => ({
      document,
      version: REQUIRED_VERSIONS[document],
      locale,
    })),
  });
  return fromDto(response.data);
}
