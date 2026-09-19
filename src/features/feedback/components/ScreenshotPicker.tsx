import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useAlert, useRtlLabelStyle } from '@/src/core/context';
import { Icon } from '@/src/shared/components/ui';
import type { FeedbackScreenshot } from '../api/feedback';
import { MAX_SCREENSHOTS } from '../validation/feedbackValidation';

type Props = {
  value: FeedbackScreenshot[];
  onChange: (next: FeedbackScreenshot[]) => void;
  disabled?: boolean;
};

const THUMB = 84;

/**
 * Up to three screenshots, straight from the photo library as base64.
 *
 * The picker is asked for `base64: true` so nothing is uploaded and no file is
 * copied: the bytes go into the request body, out as an email attachment, and
 * are never persisted anywhere. `quality` does the compressing, which is why
 * this needs no image-manipulation dependency.
 */
export function ScreenshotPicker({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlLabelStyle = useRtlLabelStyle();

  const full = value.length >= MAX_SCREENSHOTS;

  const pick = async () => {
    if (full) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      appAlert(t('permission.title'), t('permission.photoLibrary'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // No allowsEditing: cropping a screenshot is the opposite of what a bug
      // report wants — the surrounding screen is usually the evidence.
      quality: 0.6,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset?.base64) {
      appAlert(t('error.title'), t('feedback.screenshotFailed'));
      return;
    }

    const filename = (asset.fileName ?? asset.uri.split('/').pop() ?? 'screenshot.jpg')
      .replace(/\.[^.]+$/, '')
      .concat('.jpg');

    onChange([
      ...value,
      { filename, contentType: 'image/jpeg', data: asset.base64 },
    ]);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <View>
      <View style={styles.row}>
        {value.map((shot, index) => (
          <View
            key={`${shot.filename}-${index}`}
            style={[styles.thumb, { borderColor: colors.outline }]}
          >
            <Image
              source={{ uri: `data:${shot.contentType};base64,${shot.data}` }}
              style={styles.thumbImage}
            />
            <Pressable
              onPress={() => remove(index)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={t('feedback.removeScreenshot')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.removeButton,
                { backgroundColor: colors.surface, borderColor: colors.outline },
              ]}
            >
              <Icon name="x" size={12} color={colors.textSecondary} />
            </Pressable>
          </View>
        ))}

        {!full && (
          <Pressable
            onPress={pick}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={t('feedback.addScreenshot')}
            style={[
              styles.thumb,
              styles.addButton,
              { borderColor: colors.outline, backgroundColor: colors.surface },
            ]}
          >
            <Icon name="image" size={18} color={colors.textSecondary} />
            <Text style={[styles.addLabel, { color: colors.textSecondary }]}>
              {t('feedback.addScreenshot')}
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.hint, { color: colors.textSecondary }, rtlLabelStyle]}>
        {t('feedback.screenshotHint', { max: MAX_SCREENSHOTS })}
      </Text>
      {/* They are about to send us their renters' names, addresses and rent
          amounts. Saying so is the least we can do. */}
      <Text style={[styles.hint, { color: colors.textSecondary }, rtlLabelStyle]}>
        {t('feedback.screenshotPrivacy')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    gap: 4,
  },
  addLabel: {
    fontSize: 11,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 999,
    borderWidth: 1,
    padding: 3,
  },
  hint: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
