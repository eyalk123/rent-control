import type { ImageSourcePropType } from 'react-native';
import { getPropertyImageSource } from '@/src/features/properties/utils/propertyImageSource';
import { useStoredFileUri } from '@/src/shared/hooks/useStoredFile';

/** `getPropertyImageSource`, with an uploaded photo read as the signed-in user. A preset is
 *  a bundled asset and resolves at once; a photo is null while its local copy is fetched. */
export function usePropertyImageSource(
  imageUrl: string | null | undefined,
): ImageSourcePropType | null {
  const source = getPropertyImageSource(imageUrl);
  const remote = source && typeof source === 'object' && 'uri' in source ? source.uri : null;
  const uri = useStoredFileUri(remote);
  if (!remote) return source;
  return uri ? { uri } : null;
}
