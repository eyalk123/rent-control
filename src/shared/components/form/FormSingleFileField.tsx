import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import { ActivityIndicator, Button, Chip, Text, useTheme } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { TFunction } from 'i18next';
import { spacing, lightColors, darkColors } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import { useFirebaseUpload } from '@/src/shared/hooks/useFirebaseUpload';
import { useOpenStoredFile, useStoredFileUri } from '@/src/shared/hooks/useStoredFile';
import { Icon } from '@/src/shared/components/ui';
import { FormField } from './FormField';
import { fileNameFromUrl } from '@/src/shared/utils/fileName';

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
  const openFile = useOpenStoredFile();
  // Only an image field shows a preview; a document field must not download its file.
  const imageUri = useStoredFileUri(accept === 'image' ? url : null);

  const filename = url ? fileNameFromUrl(url) : null;

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
    if (url) openFile(url);
  };

  const handleClear = () => {
    field.onChange(null);
  };

  if (accept === 'image') {
    // Labelled and boxed like every other field: the label through FormField, and an empty
    // state the height and corner of an input with a dashed edge, where it used to be an
    // 88pt filled panel that looked like no other control in the form.
    return (
      <FormField label={label}>
        {uploading ? (
          <View style={[styles.photoBox, { borderColor: colors.inputBorder }]}>
            <ActivityIndicator size="small" />
          </View>
        ) : url ? (
          <View>
            <Image source={imageUri ? { uri: imageUri } : undefined} style={styles.previewImage} resizeMode="cover" />
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
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${t('property.addAPhoto')}`}
            style={[styles.photoBox, { borderColor: colors.inputBorder }]}
          >
            <Icon name="camera" size={20} color={colors.textSecondary} />
            <Text style={[styles.photoBoxText, { color: colors.textPrimary }]}>
              {t('property.addAPhoto')}
            </Text>
          </Pressable>
        )}
      </FormField>
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
          // Outlined for the same reason as the property Documents tab: a filled chip is
          // mustard here, and a file is content rather than the brand accent.
          mode="outlined"
          icon="file-document"
          onPress={handleOpen}
          onClose={handleClear}
          style={styles.chip}
          textStyle={{ color: colors.textPrimary }}
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
  // An input's box (fieldSurface: 48pt, radius 4), dashed to say "nothing here yet".
  photoBox: {
    minHeight: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: 14,
  },
  photoBoxText: {
    fontSize: 16,
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
