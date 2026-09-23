import * as FileSystem from 'expo-file-system/legacy';

/** The merged PDF's folder, created on demand. Cleared at launch with the other local
 *  copies — see `clearLocalFileCaches`. */
export async function scanCacheDir(): Promise<string> {
  const dir = `${FileSystem.cacheDirectory}scan/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
}
