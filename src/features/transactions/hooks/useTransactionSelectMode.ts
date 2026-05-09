import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAlert } from '@/src/core/context';
import { deleteTransaction } from '@/src/features/transactions/api/transactions';
import type { Transaction } from '@/src/shared/types';

interface UseTransactionSelectModeParams {
  typeFiltered: Transaction[];
  refresh: () => Promise<void>;
  refreshSummary: () => Promise<void>;
}

export function useTransactionSelectMode({
  typeFiltered,
  refresh,
  refreshSummary,
}: UseTransactionSelectModeParams) {
  const { t } = useTranslation();
  const router = useRouter();
  const { appAlert } = useAlert();

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const allSelected =
    typeFiltered.length > 0 && typeFiltered.every((tx) => selectedIds.has(tx.id));
  const someSelected =
    !allSelected && typeFiltered.some((tx) => selectedIds.has(tx.id));

  const handleTransactionPress = useCallback((id: number) => {
    if (isSelectMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/transactions/${id}` as any);
  }, [isSelectMode, router]);

  const handleLongPress = useCallback((id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSelectMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const handleToggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(typeFiltered.map((tx) => tx.id)));
    }
  }, [allSelected, typeFiltered]);

  const handleCancelSelect = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleDeleteSelected = useCallback(() => {
    const count = selectedIds.size;
    appAlert(
      t('bulkDelete.deleteConfirmTitle', { count }),
      t('bulkDelete.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('bulkDelete.deleteButton'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const ids = Array.from(selectedIds);
            let success = 0;
            let failed = 0;
            for (const id of ids) {
              try {
                await deleteTransaction(id);
                success++;
              } catch {
                failed++;
              }
            }
            await Promise.all([refresh(), refreshSummary()]);
            setDeleting(false);
            setIsSelectMode(false);
            setSelectedIds(new Set());
            if (failed > 0) {
              appAlert(t('bulkDelete.partialError', { success, failed }));
            }
          },
        },
      ],
    );
  }, [selectedIds, t, appAlert, refresh, refreshSummary]);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(prev => prev.size > 0 ? new Set() : prev);
  }, []);

  return {
    isSelectMode,
    selectedIds,
    deleting,
    allSelected,
    someSelected,
    handleTransactionPress,
    handleLongPress,
    handleToggleAll,
    handleCancelSelect,
    handleDeleteSelected,
    exitSelectMode,
  };
}
