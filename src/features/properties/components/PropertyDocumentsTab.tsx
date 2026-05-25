import React from 'react';
import { Linking, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text, useTheme } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useAlert } from '@/src/core/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { DocumentsCard, Icon } from '@/src/shared/components/ui';
import { useFirebaseUpload } from '@/src/shared/hooks/useFirebaseUpload';
import type { PendingFile, Property, PropertyFile } from '@/src/shared/types';
import {
  bulkCreatePropertyFiles,
  deletePropertyFile,
  getPropertyFiles,
} from '@/src/features/properties/api/propertyFilesApi';

interface PropertyDocumentsTabProps {
  property: Property;
}

export function PropertyDocumentsTab({ property }: PropertyDocumentsTabProps) {
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

  React.useEffect(() => {
    getPropertyFiles(property.id)
      .then(setFiles)
      .catch(() => {})
      .finally(() => setLoadingFiles(false));
  }, [property.id]);

  const documents = [
    property.basic_contract_url
      ? { label: t('documents.basicContract'), url: property.basic_contract_url, icon: 'file-text' as const }
      : null,
    property.land_registry_url
      ? { label: t('documents.landRegistry'), url: property.land_registry_url, icon: 'bank' as const }
      : null,
  ].filter(Boolean) as { label: string; url: string; icon: 'file-text' | 'bank' }[];

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
      <DocumentsCard documents={documents} />

      <Card style={styles.card} mode="outlined">
        <View style={[styles.sectionHeader, { backgroundColor: colors.sectionAccent }]}>
          <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: colors.onPrimary }]}>
            {t('customFiles.sectionTitle')}
          </Text>
        </View>
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
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  addButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    marginTop: spacing.xs,
  },
});
