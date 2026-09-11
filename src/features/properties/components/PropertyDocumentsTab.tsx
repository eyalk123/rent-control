import React from 'react';
import { Linking, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Text, useTheme } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useAlert } from '@/src/core/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { Icon, SectionLabel } from '@/src/shared/components/ui';
import { useFirebaseUpload } from '@/src/shared/hooks/useFirebaseUpload';
import type { PendingFile, Property, PropertyFile } from '@/src/shared/types';
import {
  bulkCreatePropertyFiles,
  deletePropertyFile,
  getPropertyFiles,
} from '@/src/features/properties/api/propertyFilesApi';
import { updateProperty } from '@/src/features/properties/api/properties';
import { fileNameFromUrl } from '@/src/shared/utils/fileName';

/**
 * The two documents the property record has a dedicated column for. They used to appear
 * here only once they had a URL - `DocumentsCard` renders nothing for an empty list - so a
 * property with neither showed only the generic custom-files uploader, and the sole way to
 * attach a lease was to open the edit form. The slots are always rendered now, in the same
 * shape `FormSingleFileField` gives them there: a chip once set, an upload button until then.
 */
const TYPED_DOCS = [
  { field: 'basic_contract_url', labelKey: 'documents.basicContract' },
  { field: 'land_registry_url', labelKey: 'documents.landRegistry' },
] as const;

type TypedDocField = (typeof TYPED_DOCS)[number]['field'];

interface PropertyDocumentsTabProps {
  property: Property;
  /** Lets the detail screen hold the updated record after a typed document is set or cleared. */
  onPropertyChange?: (property: Property) => void;
}

export function PropertyDocumentsTab({ property, onPropertyChange }: PropertyDocumentsTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { appAlert } = useAlert();
  const { user } = useAppAuth();
  const { uploadFile, uploading } = useFirebaseUpload('properties', user?.uid ?? '');

  const [files, setFiles] = React.useState<PropertyFile[]>([]);
  const [loadingFiles, setLoadingFiles] = React.useState(true);
  const [pending, setPending] = React.useState<PendingFile | null>(null);
  const [picking, setPicking] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  // Which typed slot is mid-flight, so only that row shows a spinner.
  const [busyDoc, setBusyDoc] = React.useState<TypedDocField | null>(null);

  React.useEffect(() => {
    getPropertyFiles(property.id)
      .then(setFiles)
      .catch(() => {})
      .finally(() => setLoadingFiles(false));
  }, [property.id]);

  const setTypedDoc = async (field: TypedDocField, url: string | null) => {
    setBusyDoc(field);
    try {
      const updated = await updateProperty(property.id, { [field]: url });
      onPropertyChange?.(updated);
    } catch {
      appAlert(t('error.title'), t('documents.uploadFailed'));
    } finally {
      setBusyDoc(null);
    }
  };

  const handlePickTypedDoc = async (field: TypedDocField) => {
    let asset;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      asset = result.assets[0];
    } catch {
      appAlert(t('error.title'), t('documents.uploadFailed'));
      return;
    }
    setBusyDoc(field);
    try {
      const url = await uploadFile(
        asset.uri,
        asset.name,
        asset.mimeType ?? 'application/octet-stream',
      );
      const updated = await updateProperty(property.id, { [field]: url });
      onPropertyChange?.(updated);
    } catch {
      appAlert(t('error.title'), t('documents.uploadFailed'));
    } finally {
      setBusyDoc(null);
    }
  };

  const handlePickFile = async () => {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setPending({
        localUri: asset.uri,
        name: asset.name,
        label: '',
        mimeType: asset.mimeType ?? 'application/octet-stream',
      });
    } catch {
      appAlert(t('error.title'), t('customFiles.uploadFailed'));
    } finally {
      setPicking(false);
    }
  };

  const handleSave = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      const url = await uploadFile(pending.localUri, pending.name, pending.mimeType ?? 'application/octet-stream');
      const created = await bulkCreatePropertyFiles(property.id, [{ url, label: pending.label || pending.name }]);
      setFiles((prev) => [...created, ...prev]);
      setPending(null);
    } catch {
      appAlert(t('error.title'), t('customFiles.uploadFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    try {
      await deletePropertyFile(property.id, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch {
      appAlert(t('error.title'), t('error.saveFailed'));
    }
  };

  const isBusy = saving || uploading;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SectionLabel title={t('documents.title')} />
      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.cardContent}>
          {TYPED_DOCS.map(({ field, labelKey }) => {
            const url = property[field] ?? null;
            return (
              <View key={field} style={styles.typedDoc}>
                <Text variant="bodySmall" style={{ color: colors.fieldLabel }}>
                  {t(labelKey)}
                </Text>
                {busyDoc === field ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" />
                    <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                      {t('documents.uploading')}
                    </Text>
                  </View>
                ) : url ? (
                  <Chip
                    icon="file-document"
                    onPress={() => Linking.openURL(url)}
                    onClose={() => setTypedDoc(field, null)}
                    style={styles.typedChip}
                    ellipsizeMode="middle"
                  >
                    {fileNameFromUrl(url)}
                  </Chip>
                ) : (
                  <Button
                    mode="outlined"
                    icon="file-upload"
                    onPress={() => handlePickTypedDoc(field)}
                    compact
                    style={styles.addButton}
                  >
                    {t('documents.upload')}
                  </Button>
                )}
              </View>
            );
          })}
        </Card.Content>
      </Card>


      <SectionLabel title={t('customFiles.sectionTitle')} />
      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.cardContent}>
          {loadingFiles ? (
            <ActivityIndicator size="small" style={styles.loader} />
          ) : (
            <>
              {files.map((file) => (
                <View key={file.id} style={[styles.fileRow, { borderColor: colors.outline }]}>
                  <TouchableOpacity
                    style={styles.fileRowLeft}
                    onPress={() => Linking.openURL(file.url)}
                    activeOpacity={0.7}
                  >
                    <Icon name="file-text" size={18} color={colors.sectionAccent} />
                    <Text variant="bodyMedium" style={[styles.fileLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                      {file.label}
                    </Text>
                    <Icon name="external-link" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <Button
                    mode="text"
                    compact
                    onPress={() => handleDelete(file.id)}
                    textColor={colors.error}
                    style={styles.removeButton}
                  >
                    {t('common.remove')}
                  </Button>
                </View>
              ))}

              {pending ? (
                <View style={[styles.pendingRow, { borderColor: colors.outline }]}>
                  <Icon name="file-text" size={18} color={colors.primary} />
                  <View style={styles.pendingInfo}>
                    <TextInput
                      value={pending.label}
                      onChangeText={(v) => setPending((p) => p && { ...p, label: v })}
                      placeholder={t('customFiles.labelPlaceholder')}
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.labelInput, { color: colors.textPrimary, borderBottomColor: colors.outline }]}
                    />
                    <Text variant="labelSmall" style={{ color: colors.textSecondary }} numberOfLines={1}>
                      {pending.name}
                    </Text>
                  </View>
                  <View style={styles.pendingActions}>
                    <Button
                      mode="contained"
                      compact
                      onPress={handleSave}
                      disabled={isBusy}
                      loading={isBusy}
                      style={styles.saveButton}
                    >
                      {t('common.save')}
                    </Button>
                    <Button
                      mode="text"
                      compact
                      onPress={() => setPending(null)}
                      disabled={isBusy}
                      textColor={colors.error}
                    >
                      {t('common.cancel')}
                    </Button>
                  </View>
                </View>
              ) : picking ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" />
                </View>
              ) : (
                <Button
                  mode="outlined"
                  icon="file-plus"
                  onPress={handlePickFile}
                  compact
                  style={styles.addButton}
                >
                  {t('customFiles.addFile')}
                </Button>
              )}
            </>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionHeaderText: {
    fontWeight: '600',
  },
  cardContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  loader: {
    paddingVertical: spacing.sm,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  fileRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fileLabel: {
    flex: 1,
  },
  removeButton: {
    marginLeft: spacing.xs,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  pendingInfo: {
    flex: 1,
    gap: 2,
  },
  labelInput: {
    fontSize: 14,
    paddingVertical: 2,
    borderBottomWidth: 1,
  },
  pendingActions: {
    alignItems: 'flex-end',
    gap: 2,
  },
  saveButton: {
    borderRadius: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  typedDoc: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typedChip: {
    alignSelf: 'flex-start',
  },
  addButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    marginTop: spacing.xs,
  },
});
