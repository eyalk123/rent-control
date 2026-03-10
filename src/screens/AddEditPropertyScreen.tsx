import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Image, View } from 'react-native';
import { Button, Text, TextInput, Menu, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  createProperty,
  updateProperty,
  uploadPropertyImage,
  getPropertyById,
} from '@/src/api/properties';
import { getApiErrorMessage } from '@/src/api/client';
import { usePropertyContext, useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
import { ScreenContainer } from '@/src/components';
import type { PropertyCreate, PropertyUpdate, PropertyType } from '@/src/types';

const PROPERTY_TYPES: PropertyType[] = ['apartment', 'house', 'commercial'];
import { spacing } from '@/src/theme';
import { lightColors, darkColors } from '@/src/theme';

export function AddEditPropertyScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { refreshProperties } = usePropertyContext();
  const isEdit = Boolean(id);

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [type, setType] = useState<PropertyType | ''>('');
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [sqFt, setSqFt] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isEdit && id) {
      const numericId = Number(id);
      if (!isNaN(numericId)) {
        getPropertyById(numericId).then((prop) => {
          setAddress(prop.address);
          setCity(prop.city);
          setZipCode(prop.zip_code);
          setType(PROPERTY_TYPES.includes(prop.type as PropertyType) ? (prop.type as PropertyType) : '');
          setSqFt(prop.sq_ft.toString());
          setPurchasePrice(prop.purchase_price.toString());
        });
      }
    }
  }, [isEdit, id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permission.title'), t('permission.photoLibrary'));
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

  const handleSubmit = async () => {
    const sqFtNum = parseFloat(sqFt);
    const purchasePriceNum = parseFloat(purchasePrice);

    if (!address.trim()) {
      Alert.alert(t('validation.title'), t('validation.addressRequired'));
      return;
    }
    if (!city.trim()) {
      Alert.alert(t('validation.title'), t('validation.cityRequired'));
      return;
    }
    if (!zipCode.trim()) {
      Alert.alert(t('validation.title'), t('validation.zipRequired'));
      return;
    }
    if (!type || !PROPERTY_TYPES.includes(type)) {
      Alert.alert(t('validation.title'), t('validation.typeRequired'));
      return;
    }
    if (isNaN(sqFtNum) || sqFtNum <= 0) {
      Alert.alert(t('validation.title'), t('validation.sqFtRequired'));
      return;
    }
    if (isNaN(purchasePriceNum) || purchasePriceNum < 0) {
      Alert.alert(t('validation.title'), t('validation.priceRequired'));
      return;
    }

    setLoading(true);
    try {
      const createData: PropertyCreate = {
        address: address.trim(),
        city: city.trim(),
        zip_code: zipCode.trim(),
        type,
        sq_ft: sqFtNum,
        purchase_price: purchasePriceNum,
      };

      const updateData: PropertyUpdate = {
        address: address.trim(),
        city: city.trim(),
        zip_code: zipCode.trim(),
        type,
        sq_ft: sqFtNum,
        purchase_price: purchasePriceNum,
      };

      const formDataForImage = () => {
        const fd = new FormData();
        fd.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'property.jpg',
        } as unknown as Blob);
        return fd;
      };

      if (isEdit && id) {
        const numericId = Number(id);
        await updateProperty(numericId, updateData);
        if (imageUri) {
          await uploadPropertyImage(numericId, formDataForImage());
        }
      } else {
        const created = await createProperty(createData);
        if (imageUri) {
          await uploadPropertyImage(created.id, formDataForImage());
        }
      }

      await refreshProperties();
      router.back();
    } catch (err) {
      Alert.alert(
        t('error.title'),
        getApiErrorMessage(err, t('error.savePropertyFailed'))
      );
    } finally {
      setLoading(false);
    }
  };

  const onPressSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSubmit();
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        {imageUri ? (
          <View style={styles.imagePreview}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <Button
              mode="outlined"
              onPress={pickImage}
              style={styles.changeImageBtn}
              icon="camera"
              compact
            >
              {t('property.changeImage')}
            </Button>
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

        <Text variant="titleSmall" style={styles.sectionHeader}>
          {t('property.basicInfo')}
        </Text>
        <TextInput
          label={t('property.address')}
          value={address}
          onChangeText={setAddress}
          mode="outlined"
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />
        <TextInput
          label={t('property.city')}
          value={city}
          onChangeText={setCity}
          mode="outlined"
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />
        <TextInput
          label={t('property.zipCode')}
          value={zipCode}
          onChangeText={setZipCode}
          mode="outlined"
          keyboardType="numeric"
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />
        <Menu
          visible={typeMenuVisible}
          onDismiss={() => setTypeMenuVisible(false)}
          anchor={
            <TextInput
              label={t('property.type')}
              value={type ? t(`property.type${type.charAt(0).toUpperCase() + type.slice(1)}`) : ''}
              mode="outlined"
              placeholder={useRtlPlaceholder(t('property.typePlaceholder'))}
              dense
              editable={false}
              right={<TextInput.Icon icon="menu-down" onPress={() => setTypeMenuVisible(true)} />}
              onPressIn={() => setTypeMenuVisible(true)}
              style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
              contentStyle={rtlInputStyle}
            />
          }
        >
          {PROPERTY_TYPES.map((ty) => (
            <Menu.Item
              key={ty}
              onPress={() => {
                setType(ty);
                setTypeMenuVisible(false);
              }}
              title={t(`property.type${ty.charAt(0).toUpperCase() + ty.slice(1)}`)}
            />
          ))}
        </Menu>
        <TextInput
          label={t('property.sqFt')}
          value={sqFt}
          onChangeText={setSqFt}
          mode="outlined"
          keyboardType="numeric"
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />
        <TextInput
          label={t('property.purchasePrice')}
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          mode="outlined"
          keyboardType="decimal-pad"
          dense
          style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />

        <Button
          mode="contained"
          onPress={onPressSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          accessibilityLabel={
            isEdit ? t('property.updateProperty') : t('property.addProperty')
          }
          accessibilityRole="button"
        >
          {isEdit ? t('property.updateProperty') : t('property.addProperty')}
        </Button>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  input: {
    marginBottom: spacing.sm,
  },
  imageButton: {
    marginBottom: spacing.md,
    borderRadius: 10,
  },
  imagePreview: {
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  changeImageBtn: {
    alignSelf: 'flex-start',
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});
