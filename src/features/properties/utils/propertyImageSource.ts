import type { ImageSourcePropType } from 'react-native';
import {
  parseImageUrlKey,
  getPresetByKey,
} from '@/src/features/properties/constants/houseImagePresets';

/**
 * Resolve a property's `image_url` to a React Native Image source.
 *
 * - `rc-house:<key>` → bundled asset require(...)
 * - http(s) or file URI → { uri: imageUrl }
 * - anything else / null → null (caller should show placeholder)
 */
export function getPropertyImageSource(
  imageUrl: string | null | undefined,
): ImageSourcePropType | null {
  if (!imageUrl) return null;

  const presetKey = parseImageUrlKey(imageUrl);
  if (presetKey) {
    const preset = getPresetByKey(presetKey);
    return preset?.source ?? null;
  }

  if (imageUrl.startsWith('http') || imageUrl.startsWith('file://')) {
    return { uri: imageUrl };
  }

  return null;
}
