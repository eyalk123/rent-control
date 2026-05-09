import { StyleSheet, View } from 'react-native';
import { Checkbox, IconButton, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { spacing } from '@/src/core/theme';

interface SelectionHeaderProps {
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
  onToggleAll: () => void;
  onCancel: () => void;
}

export function SelectionHeader({
  allSelected,
  someSelected,
  selectedCount,
  onToggleAll,
  onCancel,
}: SelectionHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.titleRow}>
      <View style={styles.selectionHeader}>
        <Checkbox
          status={allSelected ? 'checked' : someSelected ? 'indeterminate' : 'unchecked'}
          onPress={onToggleAll}
        />
        <Text variant="headlineMedium" style={styles.heroTitle}>
          {t('bulkDelete.selected', { count: selectedCount })}
        </Text>
        <IconButton icon="close" onPress={onCancel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    paddingHorizontal: spacing.lg,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  heroTitle: {
    fontWeight: '700',
    fontSize: 28,
    flex: 1,
  },
});
