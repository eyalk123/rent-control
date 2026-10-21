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
import { ColorPicker, Icon } from '@/src/shared/components/ui';
import * as ImagePicker from 'expo-image-picker';
import { spacing, lightColors, darkColors, useEntityColor, type EntityColorKey } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import { useStoredFileUri } from '@/src/shared/hooks/useStoredFile';
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
  /** The property's color: the thumbnail sits on it, and the swatches under it change it. */
  color: string | null | undefined;
  onChangeColor: (color: EntityColorKey) => void;
  t: TFunction;
  ownerId: string;
};

const NUM_COLUMNS = 3;
const GRID_GAP = spacing.sm;

export function PropertyHouseImageField({ imageUrl, onChangeImageUrl, color, onChangeColor, t, ownerId }: Props) {
  const theme = useTheme();
  const { appAlert } = useAlert();
  const colors = theme.dark ? darkColors : lightColors;
  const itemColor = useEntityColor(color);
  const [modalVisible, setModalVisible] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const { uploadFile, uploading } = useFirebaseUpload('properties', ownerId);

  const selectedKey = imageUrl ? parseImageUrlKey(imageUrl) : null;
  const selectedPreset = selectedKey ? getPresetByKey(selectedKey) : null;
  const isCustomPhoto = imageUrl && !selectedKey;
  const customPhotoUri = useStoredFileUri(isCustomPhoto ? imageUrl : null);

  const tileSize =
    (screenWidth - spacing.lg * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
  // Illustrations are drawn at 13:8; a tile that shape shows the whole building, uncropped.
  const tileImageWidth = tileSize - styles.gridItem.borderWidth * 2;

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
            borderColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
      >
        <Image
          source={item.source}
          style={[styles.gridImage, { width: tileImageWidth, height: tileImageWidth * (8 / 13) }]}
          resizeMode="contain"
        />
        <Text
          variant="labelSmall"
          numberOfLines={1}
          style={[styles.gridLabel, { color: colors.textPrimary }]}
        >
          {t(`property.houseImages.${item.key}`)}
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
      {/* Picture and color as one tile: the thumbnail shows the picture on the property's
          color, the way the list and the detail band will show it. Tapping it opens the
          picker. The swatches sit under it, not beside it: six 44pt targets do not fit next
          to the thumbnail on a 360dp phone. */}
      <View style={styles.tileRow}>
        <Pressable
          onPress={() => setModalVisible(true)}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel={imageUrl ? t('property.changeImage') : t('property.addAPhoto')}
          style={[styles.thumb, { backgroundColor: itemColor.bg }]}
        >
          {uploading ? (
            <ActivityIndicator size="small" />
          ) : selectedPreset ? (
            <Image source={selectedPreset.source} style={styles.thumbPreset} resizeMode="contain" />
          ) : isCustomPhoto ? (
            <Image
              source={customPhotoUri ? { uri: customPhotoUri } : undefined}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <Icon name="image" size={22} color={itemColor.fg} />
          )}
        </Pressable>
        <View style={styles.tileText}>
          <Text style={[styles.tileLabel, { color: colors.fieldLabel }]}>
            {t('property.pictureAndColor')}
          </Text>
          <Text style={[styles.tileHelper, { color: colors.textSecondary }]}>
            {imageUrl ? t('property.tapToChangePicture') : t('property.tapToAddPicture')}
          </Text>
        </View>
      </View>
      <ColorPicker value={color} onChange={onChangeColor} />

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

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                icon="image-plus"
                onPress={handleUploadFromGallery}
                style={styles.modalAction}
                compact
              >
                {t('documents.uploadFromGallery')}
              </Button>
              {/* Removing lives here since the form shows the picture as a small tile. */}
              {imageUrl ? (
                <Button
                  mode="outlined"
                  icon="close"
                  onPress={() => {
                    onChangeImageUrl(null);
                    setModalVisible(false);
                  }}
                  style={styles.modalAction}
                  compact
                >
                  {t('property.removePhoto')}
                </Button>
              ) : null}
            </View>
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
    marginBottom: spacing.md,
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  thumb: {
    width: 72,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Illustrations stand on the tile's bottom edge, as they do on the detail band.
  thumbPreset: {
    position: 'absolute',
    bottom: 0,
    width: 70,
    height: 70 * (8 / 13),
  },
  tileText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
  },
  tileHelper: {
    fontSize: 12,
    textAlign: 'left',
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
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalAction: {
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
