import React from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import { ActivityIndicator, Button, Chip, Text, useTheme } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { TFunction } from 'i18next';
import { spacing } from '@/src/core/theme';
import { useFirebaseUpload } from '@/src/shared/hooks/useFirebaseUpload';

type EntityType = 'properties' | 'renters';

type FormSingleFileFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  t: TFunction;
  entityType: EntityType;
  ownerId: string;
  accept: 'document' | 'image';
};

function FormSingleFileFieldInner<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  t,
  entityType,
  ownerId,
  accept,
}: FormSingleFileFieldProps<TFieldValues>) {
  const theme = useTheme();
  const { field } = useController({ control, name });
  const { uploadFile, uploading } = useFirebaseUpload(entityType, ownerId);
  const url: string | null = (field.value as string | null | undefined) ?? null;

  const filename = url
    ? (url.split('/').pop()?.split('?')[0] ?? url)
    : null;

  const handlePick = async () => {
    try {
      let uri = '';
      let name = '';
      let mimeType = '';

      if (accept === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          type: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
          copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets?.[0]) return;
        uri = result.assets[0].uri;
        name = result.assets[0].name;
        mimeType = result.assets[0].mimeType ?? 'application/octet-stream';
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(t('permission.title'), t('permission.photoLibrary'));
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (result.canceled || !result.assets?.[0]) return;
        uri = result.assets[0].uri;
        name = result.assets[0].uri.split('/').pop() ?? 'image.jpg';
        mimeType = result.assets[0].mimeType ?? 'image/jpeg';
      }

      const downloadUrl = await uploadFile(uri, name, mimeType);
      field.onChange(downloadUrl);
    } catch {
      Alert.alert(t('error.title'), t('documents.uploadFailed'));
    }
  };

  const handleOpen = () => {
    if (url) Linking.openURL(url);
  };

  const handleClear = () => {
    field.onChange(null);
  };

  return (
    <View style={styles.container}>
      <Text
        variant="bodySmall"
        style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
      >
        {label}
      </Text>
      {uploading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text
            variant="bodySmall"
            style={[styles.uploadingText, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('documents.uploading')}
          </Text>
        </View>
      ) : url ? (
        <Chip
          icon={accept === 'image' ? 'image' : 'file-document'}
          onPress={handleOpen}
          onClose={handleClear}
          style={styles.chip}
          ellipsizeMode="middle"
        >
          {filename}
        </Chip>
      ) : (
        <Button
          mode="outlined"
          icon={accept === 'image' ? 'image-plus' : 'file-upload'}
          onPress={handlePick}
          compact
          style={styles.button}
        >
          {t('documents.upload')}
        </Button>
      )}
    </View>
  );
}

export const FormSingleFileField = React.memo(
  FormSingleFileFieldInner,
) as typeof FormSingleFileFieldInner;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  uploadingText: {
    marginLeft: spacing.xs,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  button: {
    alignSelf: 'flex-start',
    borderRadius: 8,
  },
});
