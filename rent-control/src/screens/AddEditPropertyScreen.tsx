import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  createProperty,
  updateProperty,
  uploadPropertyImage,
  getPropertyById,
} from '@/src/api/properties';
import { usePropertyContext } from '@/src/context';
import type { Property } from '@/src/types';

export function AddEditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { refreshProperties } = usePropertyContext();
  const isEdit = Boolean(id);

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [type, setType] = useState('');
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
          setType(prop.type);
          setSqFt(prop.sq_ft.toString());
          setPurchasePrice(prop.purchase_price.toString());
        });
      }
    }
  }, [isEdit, id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please grant photo library access to upload images.'
      );
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
      Alert.alert('Validation', 'Address is required.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Validation', 'City is required.');
      return;
    }
    if (!zipCode.trim()) {
      Alert.alert('Validation', 'Zip code is required.');
      return;
    }
    if (!type.trim()) {
      Alert.alert('Validation', 'Property type is required.');
      return;
    }
    if (isNaN(sqFtNum) || sqFtNum <= 0) {
      Alert.alert('Validation', 'Valid square footage is required.');
      return;
    }
    if (isNaN(purchasePriceNum) || purchasePriceNum < 0) {
      Alert.alert('Validation', 'Valid purchase price is required.');
      return;
    }

    setLoading(true);
    try {
      const data: Partial<Property> = {
        address: address.trim(),
        city: city.trim(),
        zip_code: zipCode.trim(),
        type: type.trim(),
        sq_ft: sqFtNum,
        purchase_price: purchasePriceNum,
      };

      if (isEdit && id) {
        const numericId = Number(id);
        await updateProperty(numericId, data);
        if (imageUri) {
          const formData = new FormData();
          formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'property.jpg',
          } as unknown as Blob);
          await uploadPropertyImage(numericId, formData);
        }
      } else {
        const created = await createProperty(data);
        if (imageUri) {
          const formData = new FormData();
          formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'property.jpg',
          } as unknown as Blob);
          await uploadPropertyImage(created.id, formData);
        }
      }

      await refreshProperties();
      router.back();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save property'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label="Address"
        value={address}
        onChangeText={setAddress}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="City"
        value={city}
        onChangeText={setCity}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Zip Code"
        value={zipCode}
        onChangeText={setZipCode}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Property Type"
        value={type}
        onChangeText={setType}
        mode="outlined"
        placeholder="e.g. Apartment, House"
        style={styles.input}
      />
      <TextInput
        label="Square Feet"
        value={sqFt}
        onChangeText={setSqFt}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Purchase Price"
        value={purchasePrice}
        onChangeText={setPurchasePrice}
        mode="outlined"
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Button
        mode="outlined"
        onPress={pickImage}
        style={styles.imageButton}
        icon="image"
      >
        {imageUri ? 'Change Image' : 'Select Image'}
      </Button>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
      >
        {isEdit ? 'Update Property' : 'Add Property'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  input: {
    marginBottom: 12,
  },
  imageButton: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});
