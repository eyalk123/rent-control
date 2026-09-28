import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  getAuth,
  getIdToken,
  signInWithCredential,
  reauthenticateWithCredential,
  updateProfile,
  signInWithPopup,
  reauthenticateWithPopup,
  AppleAuthProvider,
  OAuthProvider,
} from '@react-native-firebase/auth';
import * as Sentry from '@sentry/react-native';

/**
 * Sign in with Apple.
 *
 * iOS uses Apple's native sheet — App Store Guideline 4.8: an app that offers a third-party
 * login (Google, here) must also offer an equivalent privacy-preserving one. Android has no
 * native Apple sign-in, so it uses Firebase's browser flow, which depends on the Services ID
 * and key configured for the Apple provider in the Firebase console. The web app has the same
 * button, so an Apple account — which has no password — can sign in everywhere.
 */

const APPLE_PROVIDER_ID = 'apple.com';

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS === 'android') return true;
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

// iOS sheet dismissed / Android browser tab closed.
const CANCEL_CODES = new Set(['ERR_REQUEST_CANCELED', 'auth/web-context-canceled', 'auth/web-context-cancelled']);

export function isAppleCancel(err: any): boolean {
  return CANCEL_CODES.has(err?.code);
}

function isCancel(err: any): boolean {
  return isAppleCancel(err);
}

function androidAppleProvider(language: string) {
  return new OAuthProvider(APPLE_PROVIDER_ID)
    .addScope('email')
    .addScope('name')
    // Apple's page in the app's language rather than the browser's.
    .setCustomParameters({ locale: language === 'he' ? 'he_IL' : 'en_US' });
}

/**
 * Runs the Apple sheet and turns the result into a Firebase credential. Firebase requires a
 * nonce: Apple receives its SHA-256 and signs it into the identity token, Firebase receives
 * the raw value and checks the two match, which stops a captured token being replayed.
 * Returns null when the user dismisses the sheet.
 */
async function requestAppleCredential() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let result: AppleAuthentication.AppleAuthenticationCredential;
  try {
    result = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (err) {
    if (isCancel(err)) return null;
    throw err;
  }
  if (!result.identityToken) throw new Error('Apple returned no identity token');
  return {
    credential: AppleAuthProvider.credential(result.identityToken, rawNonce),
    authorizationCode: result.authorizationCode,
    fullName: result.fullName,
  };
}

/** Returns false when the user cancelled, true once signed in. */
export async function signInWithApple(language: string): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      await signInWithPopup(getAuth(), androidAppleProvider(language));
      return true;
    } catch (err) {
      if (isCancel(err)) return false;
      throw err;
    }
  }
  const apple = await requestAppleCredential();
  if (!apple) return false;
  const { user } = await signInWithCredential(getAuth(), apple.credential);

  // Apple hands over the name only on the very first authorisation, and never puts it in the
  // identity token, so Firebase would otherwise leave displayName empty for good. Saved to
  // the profile and then the token refreshed, because the backend reads the name from the
  // token's `name` claim. Best-effort: a missing name must not fail the sign-in.
  const name = [apple.fullName?.givenName, apple.fullName?.familyName].filter(Boolean).join(' ');
  if (name && !user.displayName) {
    try {
      await updateProfile(user, { displayName: name });
      await getIdToken(user, true);
    } catch (err) {
      Sentry.captureException(err);
    }
  }
  return true;
}

/**
 * Account deletion, step one, for an account that signs in with Apple. Apple requires the
 * app to revoke its tokens when the account is deleted (Guideline 5.1.1(v)), and revoking
 * needs a fresh authorization code, which only the Apple sheet can give. The same sheet also
 * satisfies Firebase's recent-login check for `user.delete()`.
 *
 * Runs before anything is deleted, so dismissing the sheet leaves the account intact.
 * Returns the code to pass to `revokeAppleToken`, null for accounts that don't use Apple, and
 * throws `{ code: 'ERR_REQUEST_CANCELED' }` when the user cancels.
 */
export async function reauthenticateAppleForDeletion(language: string): Promise<string | null> {
  const user = getAuth().currentUser;
  if (!user || !user.providerData.some((p) => p.providerId === APPLE_PROVIDER_ID)) return null;
  if (Platform.OS === 'android') {
    // Satisfies Firebase's recent-login check only. Firebase's Android SDK has no Apple token
    // revocation; Apple's revocation rule is an App Store one, and iOS and web both revoke.
    await reauthenticateWithPopup(user, androidAppleProvider(language));
    return null;
  }
  const apple = await requestAppleCredential();
  if (!apple) throw Object.assign(new Error('cancelled'), { code: 'ERR_REQUEST_CANCELED' });
  await reauthenticateWithCredential(user, apple.credential);
  return apple.authorizationCode;
}

/**
 * Best-effort: the account's data is already gone by the time this runs, and a failed
 * revocation must not stop the Firebase account from being deleted too. Reported to Sentry
 * so a misconfigured Apple provider in Firebase does not fail silently.
 */
export async function revokeAppleToken(authorizationCode: string | null): Promise<void> {
  if (!authorizationCode) return;
  try {
    await getAuth().revokeToken(authorizationCode);
  } catch (err) {
    Sentry.captureException(err);
  }
}
