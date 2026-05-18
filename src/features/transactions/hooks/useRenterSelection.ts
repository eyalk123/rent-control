import { useState } from 'react';
import { getRenterMonthlyRent, type Renter } from '@/src/shared/types';

interface UseRenterSelectionParams {
  allRenters: Renter[];
  onDirtyChange?: (isDirty: boolean) => void;
}

export function useRenterSelection({ allRenters, onDirtyChange }: UseRenterSelectionParams) {
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [amounts, setAmounts] = useState<Map<number, string>>(new Map());
  const [overriddenIds, setOverriddenIds] = useState<Set<number>>(new Set());

  const allChecked = allRenters.length > 0 && allRenters.every((r) => checkedIds.has(r.id));
  const someChecked = !allChecked && allRenters.some((r) => checkedIds.has(r.id));

  const handleToggleAll = () => {
    if (allChecked) {
      setCheckedIds(new Set());
      onDirtyChange?.(false);
    } else {
      setCheckedIds(new Set<number>(allRenters.map((r) => r.id)));
      setAmounts((prev) => {
        const next = new Map(prev);
        for (const r of allRenters) {
          if (!next.has(r.id)) {
            next.set(r.id, String(getRenterMonthlyRent(r) || ''));
          }
        }
        return next;
      });
      onDirtyChange?.(true);
    }
  };

  const handleToggleRenter = (renter: Renter) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(renter.id)) {
        next.delete(renter.id);
        onDirtyChange?.(next.size > 0);
      } else {
        next.add(renter.id);
        setAmounts((am) => {
          if (am.has(renter.id)) return am;
          const next2 = new Map(am);
          next2.set(renter.id, String(getRenterMonthlyRent(renter) || ''));
          return next2;
        });
        onDirtyChange?.(true);
      }
      return next;
    });
  };

  const handleAmountChange = (renterId: number, value: string) => {
    setAmounts((prev) => new Map(prev).set(renterId, value));
  };

  const handleToggleOverride = (renterId: number, renter: Renter) => {
    setOverriddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(renterId)) {
        next.delete(renterId);
      } else {
        next.add(renterId);
        setAmounts((am) => {
          if (am.has(renterId)) return am;
          const next2 = new Map(am);
          next2.set(renterId, String(getRenterMonthlyRent(renter) || ''));
          return next2;
        });
      }
      return next;
    });
  };

  return {
    checkedIds,
    amounts,
    overriddenIds,
    allChecked,
    someChecked,
    handleToggleAll,
    handleToggleRenter,
    handleAmountChange,
    handleToggleOverride,
  };
}
