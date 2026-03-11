import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { spacing, lightColors, darkColors } from '@/src/theme';
import type { TFunction } from 'i18next';

type ImagePickerSectionProps = {
  imageUri: string | null;
  setImageUri: (uri: string | null) => void;
  t: TFunction;
};

export function ImagePickerSection({ imageUri, setImageUri, t }: ImagePickerSectionProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      // permission text handled by caller via Alert previously; keep silent here
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  return imageUri ? (
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
  );
}

const styles = StyleSheet.create({
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

