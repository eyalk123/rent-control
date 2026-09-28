/**
 * Consent to send data to Anthropic, the AI provider behind lease scanning and Ask RentVance.
 *
 * App Store Guideline 5.1.2(i): an app must name the third-party AI it shares personal data
 * with and get explicit permission *before* the first transmission. Asked the first time a
 * user scans a lease or sends the assistant a message — not at sign-up, where it would be one
 * more thing to tick without reading — and recorded on the account (legal_acceptances,
 * document `ai_processing`), so it is asked once per person rather than once per device.
 *
 * The wording lives in i18n under `aiConsent.*`. Changing what it says about the data sent,
 * the provider or the retention means bumping this version, which asks everyone again.
 */
export const AI_CONSENT_VERSION = '2026-09-27';
