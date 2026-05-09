import { useTranslation } from 'react-i18next';
import { AppFab } from '@/src/shared/components/ui';

interface TransactionListFABsProps {
  isSelectMode: boolean;
  selectedCount: number;
  onDelete: () => void;
  onAdd: () => void;
  bottomInset: number;
}

export function TransactionListFABs({
  isSelectMode,
  selectedCount,
  onDelete,
  onAdd,
  bottomInset,
}: TransactionListFABsProps) {
  const { t } = useTranslation();

  if (isSelectMode) {
    return (
      <AppFab
        icon="trash"
        variant="destructive"
        onPress={onDelete}
        disabled={selectedCount === 0}
        accessibilityLabel={t('bulkDelete.deleteButton')}
        bottomInset={bottomInset}
      />
    );
  }

  return (
    <AppFab
      icon="plus"
      onPress={onAdd}
      accessibilityLabel={t('transactions.addTransaction', {
        defaultValue: 'Add transaction',
      })}
      bottomInset={bottomInset}
    />
  );
}
