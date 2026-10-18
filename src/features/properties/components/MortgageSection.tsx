import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, IconButton, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/src/core/context';
import { getApiErrorMessage } from '@/src/core/api/client';
import {
  createMortgagePayment,
  deleteMortgagePayment,
  getPropertyById,
} from '@/src/features/properties/api/properties';
import {
  MortgagePaymentDialog,
  MortgagePaymentHistoryDialog,
} from '@/src/features/properties/components/MortgageDialogs';
import { formatCoverage, formatWholeMoney } from '@/src/features/properties/utils/propertyReturns';
import { darkColors, lightColors, spacing, ICON_SM } from '@/src/core/theme';
import { formatDate, formatMoney } from '@/src/shared/utils/money';
import { toISODate } from '@/src/shared/utils/dates';
import { DetailRow, DetailSection, Icon } from '@/src/shared/components/ui';
import type { Mortgage, MortgagePaymentInput, Property } from '@/src/shared/types';

interface Props {
  property: Property;
  mortgage: Mortgage;
  /** Replaces the screen's copy after a change, which moves the server-computed cash flow. */
  onPropertyChange: (property: Property) => void;
}

/**
 * The property's mortgage, and the cash flow after it. Rendered only when the property has
 * one — the property form's switch is where a mortgage is added, corrected or removed.
 *
 * What lives here is what the form deliberately does not do: recording that the payment
 * changed from a date on (a rate change), which keeps the months before it as they were.
 */
export function MortgageSection({ property, mortgage, onPropertyChange }: Props) {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Re-read the property: the mortgage is read off it, and its cash flow is the server's.
  const refresh = React.useCallback(async () => {
    try {
      onPropertyChange(await getPropertyById(property.id));
    } catch {
      // Saved; the screen catches up on its next focus.
    }
  }, [property.id, onPropertyChange]);

  const addPayment = async (data: MortgagePaymentInput) => {
    setSaving(true);
    try {
      await createMortgagePayment(property.id, mortgage.id, data);
      setPaymentOpen(false);
      await refresh();
    } catch (err) {
      appAlert(t('error.title'), getApiErrorMessage(err, t('mortgage.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletePayment = (paymentId: number) => {
    appAlert(t('mortgage.deletePaymentConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMortgagePayment(property.id, mortgage.id, paymentId);
            await refresh();
          } catch (err) {
            appAlert(t('error.title'), getApiErrorMessage(err, t('error.saveFailed')));
          }
        },
      },
    ]);
  };

  const ended = mortgage.end_date != null && mortgage.end_date < toISODate(new Date());
  // Computed by the server, like the yields.
  const r = property.returns;

  return (
    <>
      <DetailSection
        title={t('mortgage.section')}
        action={
          <IconButton
            mode="contained"
            size={18}
            containerColor={colors.primary}
            icon={() => <Icon name="plus" size={ICON_SM} color={colors.onPrimary} />}
            onPress={() => setPaymentOpen(true)}
            accessibilityLabel={t('mortgage.newPayment')}
            style={styles.headerButton}
          />
        }
      >
        <DetailRow
          label={t('mortgage.monthlyPayment')}
          value={
            mortgage.current_payment != null
              ? formatMoney(mortgage.current_payment)
              : ended ? t('mortgage.ended') : t('mortgage.notStarted')
          }
        />
        <DetailRow label={t('mortgage.chargeDay')} value={t('mortgage.chargeDayValue', { day: mortgage.charge_day })} />
        {mortgage.end_date ? <DetailRow label={t('mortgage.endDate')} value={formatDate(mortgage.end_date)} /> : null}
        {/* Neutral ink like the yields; averages rounded — they are computed, not amounts
            anyone typed. Separate children, not a fragment: DetailSection draws a divider
            per child. */}
        {r?.monthly_left != null ? (
          <DetailRow label={t('mortgage.averageExpenses')} info={t('mortgage.info.averageExpenses')} value={formatWholeMoney(r.monthly_expenses ?? 0)} />
        ) : null}
        {r?.monthly_left != null ? (
          <DetailRow label={t('mortgage.left')} info={t('mortgage.info.left')} value={formatWholeMoney(r.monthly_left)} />
        ) : null}
        {r?.mortgage_coverage != null ? (
          <DetailRow label={t('mortgage.coverage')} info={t('mortgage.info.coverage')} value={formatCoverage(r.mortgage_coverage)} />
        ) : null}
        <Button
          mode="text"
          compact
          icon={() => <Icon name="clock" size={ICON_SM} color={colors.primary} />}
          onPress={() => setHistoryOpen(true)}
          style={styles.historyButton}
        >
          {t('mortgage.history')}
        </Button>
      </DetailSection>

      <MortgagePaymentDialog
        visible={paymentOpen}
        loading={saving}
        onConfirm={addPayment}
        onDismiss={() => setPaymentOpen(false)}
      />
      <MortgagePaymentHistoryDialog
        mortgage={historyOpen ? mortgage : null}
        onDelete={confirmDeletePayment}
        onDismiss={() => setHistoryOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    margin: 0,
  },
  historyButton: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
  },
});
