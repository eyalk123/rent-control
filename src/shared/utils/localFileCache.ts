import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/** Folders under the cache directory that can hold a copy of a lease, an ID or a receipt:
 *  stored files opened in the app (`stored/`, see storedFile.ts), the merged PDF of a scan
 *  (`scan/`), and the picker copies of photos and files chosen for upload. The OS may evict
 *  the cache but promises nothing, so without a sweep they stay on the phone indefinitely. */
const LOCAL_CACHE_DIRS = ['stored/', 'scan/', 'ImagePicker/', 'DocumentPicker/'];

/** Delete every local copy. Runs at app launch: a copy is in use for as long as a screen shows
 *  it or a scan is carried across several screens — either can be abandoned anywhere, so there
 *  is no single "done" moment — but at a cold start nothing is in flight. Best-effort: a
 *  failure here must never block startup. */
export function clearLocalFileCaches(): Promise<void> {
  if (Platform.OS === 'web' || !FileSystem.cacheDirectory) return Promise.resolve();
  sweep = Promise.all(
    LOCAL_CACHE_DIRS.map((d) =>
      FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${d}`, { idempotent: true }).catch(() => {}),
    ),
  ).then(() => {});
  return sweep;
}

let sweep: Promise<void> = Promise.resolve();

/** Resolves once the launch sweep is over. A copy written before then could be deleted
 *  underneath the screen that just fetched it. */
export function localCachesReady(): Promise<void> {
  return sweep;
}
