import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { ActivityIndicator, Button, IconButton, Text, useTheme } from 'react-native-paper';
import { Icon } from '@/src/shared/components/ui';
import * as ImagePicker from 'expo-image-picker';
import { spacing, lightColors, darkColors } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import {
  HOUSE_IMAGE_PRESETS,
  toImageUrlKey,
  parseImageUrlKey,
  getPresetByKey,
  type HouseImagePreset,
} from '@/src/features/properties/constants/houseImagePresets';
import type { TFunction } from 'i18next';
import { useFirebaseUpload } from '@/src/shared/hooks/useFirebaseUpload';

type Props = {
  imageUrl: string | null;
  onChangeImageUrl: (url: string | null) => void;
  t: TFunction;
  ownerId: string;
};

const NUM_COLUMNS = 3;
const GRID_GAP = spacing.sm;

export function PropertyHouseImageField({ imageUrl, onChangeImageUrl, t, ownerId }: Props) {
  const theme = useTheme();
  const { appAlert } = useAlert();
  const colors = theme.dark ? darkColors : lightColors;
  const [modalVisible, setModalVisible] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const { uploadFile, uploading } = useFirebaseUpload('properties', ownerId);

  const selectedKey = imageUrl ? parseImageUrlKey(imageUrl) : null;
  const selectedPreset = selectedKey ? getPresetByKey(selectedKey) : null;
  const isCustomPhoto = imageUrl && !selectedKey;

  const tileSize =
    (screenWidth - spacing.lg * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const handleSelect = (preset: HouseImagePreset) => {
    onChangeImageUrl(toImageUrlKey(preset.key));
    setModalVisible(false);
  };

  const handleUploadFromGallery = async () => {
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
      setModalVisible(false);
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop() ?? 'property.jpg';
      const mimeType = asset.mimeType ?? 'image/jpeg';
      try {
        const url = await uploadFile(asset.uri, filename, mimeType);
        onChangeImageUrl(url);
      } catch {
        appAlert(t('error.title'), t('documents.uploadFailed'));
      }
    }
  };

  const renderGridItem = ({ item }: { item: HouseImagePreset }) => {
    const isSelected = item.key === selectedKey;
    return (
      <Pressable
        onPress={() => handleSelect(item)}
        style={[
          styles.gridItem,
          {
            width: tileSize,
            height: tileSize,
            borderColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
      >
        <Image
          source={item.source}
          style={styles.gridImage}
          resizeMode="cover"
        />
        <Text
          variant="labelSmall"
          numberOfLines={1}
          style={[styles.gridLabel, { color: colors.textPrimary }]}
        >
          {item.label}
        </Text>
        {isSelected && (
          <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
            <Icon name="check" size={14} color={colors.onPrimary} strokeWidth={3} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.wrapper}>
      {uploading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" />
        </View>
      ) : selectedPreset ? (
        <View style={styles.previewContainer}>
          <Image
            source={selectedPreset.source}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <View style={styles.previewActions}>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(true)}
              style={styles.actionBtn}
              icon="image-edit"
              compact
            >
              {t('property.changeImage')}
            </Button>
            <Button
              mode="outlined"
              onPress={() => onChangeImageUrl(null)}
              style={styles.actionBtn}
              icon="close"
              compact
            >
              {t('property.removePhoto')}
            </Button>
          </View>
        </View>
      ) : isCustomPhoto ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: imageUrl! }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <View style={styles.previewActions}>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(true)}
              style={styles.actionBtn}
              icon="image-edit"
              compact
            >
              {t('property.changeImage')}
            </Button>
            <Button
              mode="outlined"
              onPress={() => onChangeImageUrl(null)}
              style={styles.actionBtn}
              icon="close"
              compact
            >
              {t('property.removePhoto')}
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.photoWrap}>
          <Text style={[styles.photoLabel, { color: colors.textSecondary }]}>
            {t('property.photo')}
          </Text>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={[
              styles.dropzone,
              {
                backgroundColor: colors.inputFilledBackground,
              },
            ]}
          >
            <Icon name="image" size={22} color={colors.textSecondary} />
            <Text style={[styles.dropzonePrimary, { color: colors.textPrimary }]}>
              {t('property.addAPhoto')}
            </Text>
            <Text style={[styles.dropzoneHelper, { color: colors.textSecondary }]}>
              {t('property.photoHelper')}
            </Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={{ color: colors.textPrimary }}>
                {t('property.choosePresetImage')}
              </Text>
              <IconButton
                icon="close"
                size={22}
                onPress={() => setModalVisible(false)}
                accessibilityLabel={t('common.cancel')}
              />
            </View>

            <Button
              mode="outlined"
              icon="image-plus"
              onPress={handleUploadFromGallery}
              style={styles.galleryButton}
              compact
            >
              {t('documents.uploadFromGallery')}
            </Button>
            <FlatList
              data={HOUSE_IMAGE_PRESETS}
              keyExtractor={(item) => item.key}
              numColumns={NUM_COLUMNS}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContainer}
              renderItem={renderGridItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  photoWrap: {
    width: '100%',
    marginBottom: spacing.md,
  },
  photoLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  dropzone: {
    width: '100%',
    height: 88,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(26,45,74,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dropzonePrimary: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropzoneHelper: {
    fontSize: 11,
    fontWeight: '400',
  },
  previewContainer: {
    marginBottom: spacing.md,
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionBtn: {
    alignSelf: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  loadingWrap: {
    marginBottom: spacing.md,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  galleryButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  gridContainer: {
    padding: spacing.lg,
    gap: GRID_GAP,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  gridItem: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 3,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    flex: 1,
    borderRadius: 7,
  },
  gridLabel: {
    textAlign: 'center',
    paddingVertical: 2,
    fontSize: 10,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
