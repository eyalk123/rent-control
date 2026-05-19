import React from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import { ActivityIndicator, Button, Chip, Text, useTheme } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { TFunction } from 'i18next';
import { spacing, lightColors, darkColors } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import { useFirebaseUpload } from '@/src/shared/hooks/useFirebaseUpload';
import { Icon } from '@/src/shared/components/ui';

type EntityType = 'properties' | 'renters' | 'transactions';

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
  const { appAlert } = useAlert();
  const colors = theme.dark ? darkColors : lightColors;
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
          appAlert(t('permission.title'), t('permission.photoLibrary'));
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
      appAlert(t('error.title'), t('documents.uploadFailed'));
    }
  };

  const handleOpen = () => {
    if (url) Linking.openURL(url);
  };

  const handleClear = () => {
    field.onChange(null);
  };

  if (accept === 'image') {
    return (
      <View style={styles.container}>
        <Text style={[styles.photoLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        {uploading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" />
          </View>
        ) : url ? (
          <View>
            <Image source={{ uri: url }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.previewActions}>
              <Button mode="outlined" onPress={handlePick} icon="image-edit" compact style={styles.actionBtn}>
                {t('property.changeImage')}
              </Button>
              <Button mode="outlined" onPress={handleClear} icon="close" compact style={styles.actionBtn}>
                {t('property.removePhoto')}
              </Button>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={handlePick}
            style={[styles.dropzone, { backgroundColor: colors.inputFilledBackground }]}
          >
            <Icon name="image" size={22} color={colors.textSecondary} />
            <Text style={[styles.dropzonePrimary, { color: colors.textPrimary }]}>
              {t('property.addAPhoto')}
            </Text>
            <Text style={[styles.dropzoneHelper, { color: colors.textSecondary }]}>
              {t('documents.uploadFromGallery')}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

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
          icon="file-document"
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
          icon="file-upload"
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
  photoLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loadingWrap: {
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
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
});
