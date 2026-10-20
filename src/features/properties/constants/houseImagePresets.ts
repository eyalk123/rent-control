import type { ImageSourcePropType } from 'react-native';

export interface HouseImagePreset {
  key: string;
  source: ImageSourcePropType;
}

const PREFIX = 'rc-house:';

// Keys are stored on properties as `rc-house:<key>`, so they never change: a redrawn
// illustration keeps the key of the one it replaced (classic_suburban now shows the
// Classic House drawing). Names are translated under `property.houseImages.<key>`.
// Mirrored in rent-control-web's houseImagePresets.ts.
export const HOUSE_IMAGE_PRESETS: HouseImagePreset[] = [
  {
    key: 'apartment_on_pillars',
    source: require('@/assets/images/rent-control-houses/Apartment on Pillars.png'),
  },
  {
    key: 'jerusalem_stone_building',
    source: require('@/assets/images/rent-control-houses/Jerusalem Stone Building.png'),
  },
  {
    key: 'walk_up_apartment',
    source: require('@/assets/images/rent-control-houses/Walk-Up Apartment.png'),
  },
  {
    key: 'mid_rise_apartment',
    source: require('@/assets/images/rent-control-houses/Mid-Rise Apartment.png'),
  },
  {
    key: 'high_rise_condo',
    source: require('@/assets/images/rent-control-houses/High-Rise Tower.png'),
  },
  {
    key: 'garden_apartment',
    source: require('@/assets/images/rent-control-houses/Garden Apartment.png'),
  },
  {
    key: 'duplex',
    source: require('@/assets/images/rent-control-houses/Semi-Detached House.png'),
  },
  {
    key: 'townhouse',
    source: require('@/assets/images/rent-control-houses/Townhouse.png'),
  },
  {
    key: 'modern_minimalist',
    source: require('@/assets/images/rent-control-houses/Modern House.png'),
  },
  {
    key: 'classic_suburban',
    source: require('@/assets/images/rent-control-houses/Classic House.png'),
  },
  {
    key: 'cozy_bungalow',
    source: require('@/assets/images/rent-control-houses/Single-Floor House.png'),
  },
  {
    key: 'mixed_use_building',
    source: require('@/assets/images/rent-control-houses/Mixed-Use Building.png'),
  },
];

// No longer offered in the picker, but properties that already chose one still show it.
const RETIRED_HOUSE_IMAGE_PRESETS: HouseImagePreset[] = [
  {
    key: 'manufactured_home',
    source: require('@/assets/images/rent-control-houses/Manufactured Home.png'),
  },
  {
    key: 'rural_farmhouse',
    source: require('@/assets/images/rent-control-houses/Rural Farmhouse.png'),
  },
  {
    key: 'vacation_a_frame',
    source: require('@/assets/images/rent-control-houses/Vacation A-Frame.png'),
  },
];

const presetsByKey = new Map(
  [...HOUSE_IMAGE_PRESETS, ...RETIRED_HOUSE_IMAGE_PRESETS].map((p) => [p.key, p]),
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
