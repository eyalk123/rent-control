import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useController, type Control, type FieldValues } from 'react-hook-form';
import { ActivityIndicator, Button, Chip, Text, useTheme } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import type { TFunction } from 'i18next';
import { spacing, lightColors, darkColors } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import { Icon } from '@/src/shared/components/ui';
import type { PendingFile, PropertyFile } from '@/src/shared/types';

const MAX_FILES = 10;

type CustomFilesSectionProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  existingFiles: PropertyFile[];
  deletedFileIds: number[];
  onDeleteExistingToggle: (id: number) => void;
};

function CustomFilesSectionInner<TFieldValues extends FieldValues>({
  control,
  t,
  existingFiles,
  deletedFileIds,
  onDeleteExistingToggle,
}: CustomFilesSectionProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { appAlert } = useAlert();
  const [picking, setPicking] = React.useState(false);

  const { field } = useController({ control, name: 'pendingFiles' as any });
  const pending: PendingFile[] = (field.value as PendingFile[] | undefined) ?? [];

  const activeExistingCount = existingFiles.filter(
    (f) => !deletedFileIds.includes(f.id)
  ).length;
  const totalCount = activeExistingCount + pending.length;
  const atMax = totalCount >= MAX_FILES;

  const handleAdd = async () => {
    if (atMax) return;
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const newFile: PendingFile = {
        localUri: asset.uri,
        name: asset.name,
        label: '',
        mimeType: asset.mimeType ?? 'application/octet-stream',
      };
      field.onChange([...pending, newFile]);
    } catch {
      appAlert(t('error.title'), t('customFiles.uploadFailed'));
    } finally {
      setPicking(false);
    }
  };

  const handleRemovePending = (index: number) => {
    field.onChange(pending.filter((_, i) => i !== index));
  };

  const handleLabelChange = (index: number, value: string) => {
    const updated = pending.map((f, i) => (i === index ? { ...f, label: value } : f));
    field.onChange(updated);
  };

  return (
    <View style={styles.container}>
      <Text
        variant="bodySmall"
        style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        {t('customFiles.sectionTitle')}
      </Text>

      {existingFiles.map((file) => {
        const isDeleted = deletedFileIds.includes(file.id);
        return (
          <View
            key={file.id}
            style={[
              styles.row,
              isDeleted && styles.rowDeleted,
              { borderColor: colors.outline },
            ]}
          >
            <Icon name="file-text" size={18} color={isDeleted ? colors.textSecondary : colors.primary} />
            <Text
              variant="bodySmall"
              style={[
                styles.existingLabel,
                { color: isDeleted ? colors.textSecondary : colors.textPrimary },
                isDeleted && styles.strikethrough,
              ]}
              numberOfLines={1}
            >
              {file.label}
            </Text>
            <Button
              mode="text"
              compact
              onPress={() => onDeleteExistingToggle(file.id)}
              textColor={isDeleted ? colors.primary : colors.error}
              style={styles.rowAction}
            >
              {isDeleted ? t('common.undo') : t('common.remove')}
            </Button>
          </View>
        );
      })}

      {pending.map((file, index) => (
        <View key={index} style={[styles.row, { borderColor: colors.outline }]}>
          <Icon name="file-text" size={18} color={colors.primary} />
          <View style={styles.pendingInfo}>
            <TextInput
              value={file.label}
              onChangeText={(v) => handleLabelChange(index, v)}
              placeholder={t('customFiles.labelPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.labelInput,
                {
                  color: colors.textPrimary,
                  borderBottomColor: colors.outline,
                },
              ]}
            />
            <Text
              variant="labelSmall"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {file.name}
            </Text>
          </View>
          <Button
            mode="text"
            compact
            onPress={() => handleRemovePending(index)}
            textColor={colors.error}
            style={styles.rowAction}
          >
            {t('common.remove')}
          </Button>
        </View>
      ))}

      {picking ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <Button
          mode="outlined"
          icon="file-plus"
          onPress={handleAdd}
          disabled={atMax}
          compact
          style={styles.addButton}
        >
          {atMax ? t('customFiles.maxFilesReached') : t('customFiles.addFile')}
        </Button>
      )}
    </View>
  );
}

export const CustomFilesSection = React.memo(
  CustomFilesSectionInner
) as typeof CustomFilesSectionInner;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  rowDeleted: {
    opacity: 0.5,
  },
  existingLabel: {
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  rowAction: {
    marginLeft: 'auto',
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
