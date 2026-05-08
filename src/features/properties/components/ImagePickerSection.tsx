import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { spacing, lightColors, darkColors } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import type { TFunction } from 'i18next';
import { useFirebaseUpload } from '@/src/shared/hooks/useFirebaseUpload';

type ImagePickerSectionProps = {
  imageUri: string | null;
  setImageUri: (uri: string | null) => void;
  t: TFunction;
  ownerId: string;
};

export function ImagePickerSection({ imageUri, setImageUri, t, ownerId }: ImagePickerSectionProps) {
  const theme = useTheme();
  const { appAlert } = useAlert();
  const colors = theme.dark ? darkColors : lightColors;
  const { uploadFile, uploading } = useFirebaseUpload('properties', ownerId);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      appAlert(t('permission.title'), t('permission.photoLibrary'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() ?? 'image.jpg';
      const mimeType = asset.mimeType ?? 'image/jpeg';
      try {
        const url = await uploadFile(asset.uri, filename, mimeType);
        setImageUri(url);
      } catch {
        appAlert(t('error.title'), t('documents.uploadFailed'));
      }
    }
  };

  return (
    <View style={styles.centerWrap}>
      {uploading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" />
        </View>
      ) : imageUri ? (
        <View style={styles.imagePreview}>
          <Image
            source={{ uri: imageUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <View style={styles.imageActions}>
            <Button
              mode="outlined"
              onPress={pickImage}
              style={styles.changeImageBtn}
              icon="camera"
              compact
            >
              {t('property.changeImage')}
            </Button>
            <Button
              mode="outlined"
              onPress={() => setImageUri(null)}
              style={styles.changeImageBtn}
              icon="close"
              compact
            >
              {t('property.removePhoto')}
            </Button>
          </View>
        </View>
      ) : (
        <Button
          mode="outlined"
          onPress={pickImage}
          style={[styles.imageButton, { backgroundColor: colors.inputFilledBackground }]}
          icon="camera"
          compact
        >
          {t('property.selectImage')}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    width: '100%',
    alignItems: 'center',
  },
  loadingWrap: {
    marginBottom: spacing.md,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageButton: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  imagePreview: {
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  imageActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  changeImageBtn: {
    alignSelf: 'flex-start',
  },
});
