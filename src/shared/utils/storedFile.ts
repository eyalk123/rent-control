import { Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import * as Sentry from '@sentry/react-native';
import storage from '@react-native-firebase/storage';
import { localCachesReady } from '@/src/shared/utils/localFileCache';

/**
 * Stored files are read through the Firebase SDK as the signed-in user, so `storage.rules`
 * decides who may read them.
 *
 * The values in the database are Firebase *download URLs*: they carry a token that bypasses
 * those rules, never expires, and works for anyone holding the link. Reading through the SDK
 * is the step that lets the tokens be revoked and the columns hold bare storage paths
 * (PLATFORM.md §18), so both shapes are accepted here. The web app does the same in its own
 * `storedFile.ts`.
 *
 * The web build of this app (dev preview only) keeps using the value as-is: the native SDK's
 * `writeToFile` does not exist there.
 */

// Mirror of the upload path shape: `{entityType}/{ownerId}/{uuid}/{filename}`.
const STORAGE_PATH = /^(properties|renters|transactions)\/[^/]+\/[^/]+\/.+/;
// Parsed by pattern, not `new URL()`: React Native's URL implementation is partial.
const DOWNLOAD_URL = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?#]+)/;

/** The Storage path a stored value points at, or null when it is not one of our files
 *  (a house preset, a local `file://` preview, a mock-API URL). */
export function storagePathOf(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = DOWNLOAD_URL.exec(value);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return null;
    }
  }
  return STORAGE_PATH.test(value) ? value : null;
}

/** Whether this value is read through the SDK on this platform. */
export function readsThroughSdk(value: string | null | undefined): boolean {
  return Platform.OS !== 'web' && storagePathOf(value) !== null;
}

let fallbackReported = false;

/** While download tokens still exist, a failed SDK read falls back to the stored link so the
 *  file still opens. Reported once per session, because the fallback stops working the day
 *  the tokens are revoked. */
export function reportFallback(error: unknown): void {
  if (fallbackReported) return;
  fallbackReported = true;
  Sentry.captureMessage('Stored file read failed; fell back to its download link', {
    level: 'warning',
    // The error's code only — its message quotes the storage path, which names a file.
    extra: { code: (error as { code?: string })?.code ?? 'unknown' },
  });
}

export function canFallBack(value: string | null | undefined): value is string {
  return !!value && value.startsWith('https://');
}

const EXTENSION = /\.([a-z0-9]+)$/i;
const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  webp: 'image/webp',
  gif: 'image/gif',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function mimeTypeOf(path: string): string {
  const ext = EXTENSION.exec(path)?.[1]?.toLowerCase() ?? '';
  return MIME_TYPES[ext] ?? '*/*';
}

const inFlight = new Map<string, Promise<string>>();

/** A local `file://` copy of a stored file, fetched as the signed-in user. Kept under
 *  `stored/` in the cache, which is cleared at every launch (`clearLocalFileCaches`), and
 *  reused while the app stays open. Named `{uuid}.{ext}`: the uuid segment is unique per
 *  upload, and keeping the original file name — often Hebrew, often with spaces — out of the
 *  local URI avoids encoding trouble in the image and intent layers. */
export function localCopyOf(path: string): Promise<string> {
  let pending = inFlight.get(path);
  if (!pending) {
    pending = (async () => {
      await localCachesReady();
      const dir = `${FileSystem.cacheDirectory}stored/`;
      const ext = EXTENSION.exec(path)?.[0] ?? '';
      const target = `${dir}${path.split('/')[2]}${ext}`;
      if ((await FileSystem.getInfoAsync(target)).exists) return target;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      // The native SDK takes a plain filesystem path, not a file:// URI.
      await storage().ref(path).writeToFile(target.replace(/^file:\/\//, ''));
      return target;
    })();
    // A failure is not cached: the next attempt tries again.
    pending.catch(() => inFlight.delete(path));
    inFlight.set(path, pending);
  }
  return pending;
}

/** Open a stored file for the signed-in user: in the phone's viewer on Android (the same
 *  place the browser used to hand a PDF), through the share sheet on iOS, which previews it.
 *  Anything that is not one of our files opens as a link, as before. */
export async function openStoredFile(value: string): Promise<void> {
  if (!readsThroughSdk(value)) {
    await Linking.openURL(value);
    return;
  }
  const path = storagePathOf(value)!;
  let uri: string;
  try {
    uri = await localCopyOf(path);
  } catch (error) {
    if (!canFallBack(value)) throw error;
    reportFallback(error);
    await Linking.openURL(value);
    return;
  }
  const mimeType = mimeTypeOf(path);
  if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: await FileSystem.getContentUriAsync(uri),
        type: mimeType,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION — the viewer reads our cache through it
      });
      return;
    } catch {
      // No app on the phone opens this type (a Word document, often): offer to share it.
    }
  }
  await Sharing.shareAsync(uri, { mimeType });
}
