import type { ImageSourcePropType } from 'react-native';

export interface HouseImagePreset {
  key: string;
  label: string;
  source: ImageSourcePropType;
}

const PREFIX = 'rc-house:';

export const HOUSE_IMAGE_PRESETS: HouseImagePreset[] = [
  {
    key: 'classic_suburban',
    label: 'Classic Suburban',
    source: require('@/assets/images/rent-control-houses/Classic Suburban.png'),
  },
  {
    key: 'cozy_bungalow',
    label: 'Cozy Bungalow',
    source: require('@/assets/images/rent-control-houses/Cozy Bungalow.png'),
  },
  {
    key: 'duplex',
    label: 'Duplex',
    source: require('@/assets/images/rent-control-houses/Duplex.png'),
  },
  {
    key: 'high_rise_condo',
    label: 'High-Rise Condo',
    source: require('@/assets/images/rent-control-houses/High-Rise Condo.png'),
  },
  {
    key: 'manufactured_home',
    label: 'Manufactured Home',
    source: require('@/assets/images/rent-control-houses/Manufactured Home.png'),
  },
  {
    key: 'mid_rise_apartment',
    label: 'Mid-Rise Apartment',
    source: require('@/assets/images/rent-control-houses/Mid-Rise Apartment.png'),
  },
  {
    key: 'mixed_use_building',
    label: 'Mixed-Use Building',
    source: require('@/assets/images/rent-control-houses/Mixed-Use Building.png'),
  },
  {
    key: 'modern_minimalist',
    label: 'Modern Minimalist',
    source: require('@/assets/images/rent-control-houses/Modern Minimalist.png'),
  },
  {
    key: 'rural_farmhouse',
    label: 'Rural Farmhouse',
    source: require('@/assets/images/rent-control-houses/Rural Farmhouse.png'),
  },
  {
    key: 'townhouse',
    label: 'Townhouse',
    source: require('@/assets/images/rent-control-houses/Townhouse.png'),
  },
  {
    key: 'vacation_a_frame',
    label: 'Vacation A-Frame',
    source: require('@/assets/images/rent-control-houses/Vacation A-Frame.png'),
  },
  {
    key: 'walk_up_apartment',
    label: 'Walk-Up Apartment',
    source: require('@/assets/images/rent-control-houses/Walk-Up Apartment.png'),
  },
];

const presetsByKey = new Map(
  HOUSE_IMAGE_PRESETS.map((p) => [p.key, p]),
);

export function toImageUrlKey(key: string): string {
  return `${PREFIX}${key}`;
}

export function parseImageUrlKey(imageUrl: string): string | null {
  if (imageUrl.startsWith(PREFIX)) {
    return imageUrl.slice(PREFIX.length);
  }
  return null;
}

export function getPresetByKey(key: string): HouseImagePreset | undefined {
  return presetsByKey.get(key);
}
