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
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, lightColors, darkColors } from '@/src/core/theme';
import {
  HOUSE_IMAGE_PRESETS,
  toImageUrlKey,
  parseImageUrlKey,
  getPresetByKey,
  type HouseImagePreset,
} from '@/src/features/properties/constants/houseImagePresets';
import type { TFunction } from 'i18next';

type Props = {
  imageUrl: string | null;
  onChangeImageUrl: (url: string | null) => void;
  t: TFunction;
};

const NUM_COLUMNS = 3;
const GRID_GAP = spacing.sm;

export function PropertyHouseImageField({ imageUrl, onChangeImageUrl, t }: Props) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const [modalVisible, setModalVisible] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  const selectedKey = imageUrl ? parseImageUrlKey(imageUrl) : null;
  const selectedPreset = selectedKey ? getPresetByKey(selectedKey) : null;

  const tileSize =
    (screenWidth - spacing.lg * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const handleSelect = (preset: HouseImagePreset) => {
    onChangeImageUrl(toImageUrlKey(preset.key));
    setModalVisible(false);
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
            <MaterialCommunityIcons name="check" size={14} color="#FFF" />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.wrapper}>
      {selectedPreset ? (
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
      ) : (
        <Button
          mode="outlined"
          onPress={() => setModalVisible(true)}
          style={[styles.selectButton, { backgroundColor: colors.inputFilledBackground }]}
          icon="image"
          compact
        >
          {t('property.selectImage')}
        </Button>
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
  selectButton: {
    marginBottom: spacing.md,
    borderRadius: 12,
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
