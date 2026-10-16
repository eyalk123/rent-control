import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/src/core/context';
import { getApiErrorMessage } from '@/src/core/api/client';
import {
  createMortgagePayment,
  createPropertyMortgage,
  deleteMortgagePayment,
  deletePropertyMortgage,
  getPropertyById,
  getPropertyMortgages,
  updatePropertyMortgage,
} from '@/src/features/properties/api/properties';
import {
  MortgageDialog,
  MortgagePaymentDialog,
  MortgagePaymentHistoryDialog,
} from '@/src/features/properties/components/MortgageDialogs';
import { formatCoverage, formatWholeMoney } from '@/src/features/properties/utils/propertyReturns';
import { darkColors, lightColors, spacing, ICON_MD, ICON_SM } from '@/src/core/theme';
import { formatDate, formatMoney } from '@/src/shared/utils/money';
import { toISODate } from '@/src/shared/utils/dates';
import { DetailRow, DetailSection, Icon } from '@/src/shared/components/ui';
import type { Mortgage, Property } from '@/src/shared/types';

interface Props {
  property: Property;
  /** Replaces the screen's copy after a change, which moves the server-computed cash flow. */
  onPropertyChange: (property: Property) => void;
}

/**
 * The property's mortgages: what goes to the bank each month, and when.
 *
 * Without one it is an invitation, not an empty form — most properties have no mortgage.
 * Rendered only where the country has the capability (Israel); the API refuses these routes
 * everywhere else.
 */
export function MortgageSection({ property, onPropertyChange }: Props) {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const [mortgages, setMortgages] = React.useState<Mortgage[] | null>(null);
  // `null` adds a new mortgage; a mortgage edits it.
  const [editing, setEditing] = React.useState<Mortgage | null | undefined>(undefined);
  const [paymentFor, setPaymentFor] = React.useState<Mortgage | null>(null);
  const [historyFor, setHistoryFor] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setMortgages(await getPropertyMortgages(property.id));
    } catch {
      setMortgages([]);
    }
  }, [property.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Re-read both: the list, and the property whose cash flow the server recomputes.
  const refresh = React.useCallback(async () => {
    await load();
    try {
      onPropertyChange(await getPropertyById(property.id));
    } catch {
      // Saved; the screen catches up on its next focus.
    }
  }, [load, property.id, onPropertyChange]);

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    setSaving(true);
    try {
      await action();
      after?.();
      await refresh();
    } catch (err) {
      appAlert(t('error.title'), getApiErrorMessage(err, t('mortgage.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (m: Mortgage) => {
    appAlert(t('mortgage.deleteConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => run(() => deletePropertyMortgage(property.id, m.id)),
      },
    ]);
  };

  const confirmDeletePayment = (mortgageId: number, paymentId: number) => {
    appAlert(t('mortgage.deletePaymentConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: () => run(() => deleteMortgagePayment(property.id, mortgageId, paymentId)),
      },
    ]);
  };

  const historyMortgage = mortgages?.find((m) => m.id === historyFor) ?? null;
  const today = toISODate(new Date());
  // Computed by the server, like the yields — for the property, not one mortgage.
  const r = property.returns;

  return (
    <>
      {mortgages == null ? (
        <DetailSection title={t('mortgage.section')}>
          <ActivityIndicator style={styles.loading} />
        </DetailSection>
      ) : mortgages.length === 0 ? (
        <DetailSection title={t('mortgage.section')}>
          <View style={styles.invite}>
            <Icon name="bank" size={ICON_MD} color={colors.primary} />
            <View style={styles.inviteText}>
              <Text variant="titleSmall" style={{ color: colors.textPrimary }}>{t('mortgage.inviteTitle')}</Text>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>{t('mortgage.inviteBody')}</Text>
              <Button
                mode="contained"
                compact
                icon={() => <Icon name="plus" size={ICON_SM} color={colors.onPrimary} />}
                onPress={() => setEditing(null)}
                style={styles.inviteButton}
              >
                {t('mortgage.add')}
              </Button>
            </View>
          </View>
        </DetailSection>
      ) : (
        mortgages.map((m, i) => {
          const last = i === mortgages.length - 1;
          const ended = m.end_date != null && m.end_date < today;
          return (
            <DetailSection
              key={m.id}
              title={mortgages.length > 1 ? t('mortgage.sectionNumbered', { n: i + 1 }) : t('mortgage.section')}
              action={
                <IconButton
                  mode="contained"
                  size={18}
                  containerColor={colors.primary}
                  icon={() => <Icon name="plus" size={ICON_SM} color={colors.onPrimary} />}
                  onPress={() => setPaymentFor(m)}
                  accessibilityLabel={t('mortgage.newPayment')}
                  style={styles.headerButton}
                />
              }
            >
              <DetailRow
                label={t('mortgage.monthlyPayment')}
                value={
                  m.current_payment != null
                    ? formatMoney(m.current_payment)
                    : ended ? t('mortgage.ended') : t('mortgage.notStarted')
                }
              />
              <DetailRow label={t('mortgage.chargeDay')} value={t('mortgage.chargeDayValue', { day: m.charge_day })} />
              {m.end_date ? <DetailRow label={t('mortgage.endDate')} value={formatDate(m.end_date)} /> : null}
              {/* The property's cash flow, under the last mortgage. Neutral ink like the
                  yields; averages rounded — they are computed, not amounts anyone typed. */}
              {last && r?.monthly_left != null ? (
                <DetailRow
                  label={t('mortgage.averageExpenses')}
                  value={formatWholeMoney(r.monthly_expenses ?? 0)}
                />
              ) : null}
              {/* Separate children, not a fragment: DetailSection draws a divider per child. */}
              {last && r?.monthly_left != null ? (
                <DetailRow label={t('mortgage.left')} value={formatWholeMoney(r.monthly_left)} />
              ) : null}
              {last && r?.mortgage_coverage != null ? (
                <DetailRow label={t('mortgage.coverage')} value={formatCoverage(r.mortgage_coverage)} />
              ) : null}
              <View style={styles.actions}>
                <Button
                  mode="text"
                  compact
                  icon={() => <Icon name="clock" size={ICON_SM} color={colors.primary} />}
                  onPress={() => setHistoryFor(m.id)}
                >
                  {t('mortgage.history')}
                </Button>
                <Button
                  mode="text"
                  compact
                  icon={() => <Icon name="pencil" size={ICON_SM} color={colors.primary} />}
                  onPress={() => setEditing(m)}
                >
                  {t('mortgage.edit')}
                </Button>
                <Button
                  mode="text"
                  compact
                  textColor={colors.error}
                  icon={() => <Icon name="trash" size={ICON_SM} color={colors.error} />}
                  onPress={() => confirmDelete(m)}
                >
                  {t('mortgage.delete')}
                </Button>
              </View>
              {last ? (
                <Button
                  mode="text"
                  compact
                  icon={() => <Icon name="plus" size={ICON_SM} color={colors.primary} />}
                  onPress={() => setEditing(null)}
                  style={styles.addAnother}
                >
                  {t('mortgage.addAnother')}
                </Button>
              ) : null}
            </DetailSection>
          );
        })
      )}

      <MortgageDialog
        visible={editing !== undefined}
        mortgage={editing}
        loading={saving}
        onCreate={(data) => run(() => createPropertyMortgage(property.id, data), () => setEditing(undefined))}
        onUpdate={(data) => {
          if (!editing) return;
          run(() => updatePropertyMortgage(property.id, editing.id, data), () => setEditing(undefined));
        }}
        onDismiss={() => setEditing(undefined)}
      />
      <MortgagePaymentDialog
        visible={paymentFor != null}
        loading={saving}
        onConfirm={(data) => {
          if (!paymentFor) return;
          run(() => createMortgagePayment(property.id, paymentFor.id, data), () => setPaymentFor(null));
        }}
        onDismiss={() => setPaymentFor(null)}
      />
      <MortgagePaymentHistoryDialog
        mortgage={historyMortgage}
        onDelete={(paymentId) => historyMortgage && confirmDeletePayment(historyMortgage.id, paymentId)}
        onDismiss={() => setHistoryFor(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: spacing.lg,
  },
  invite: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inviteText: {
    flex: 1,
    gap: spacing.xs,
  },
  inviteButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  headerButton: {
    margin: 0,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  addAnother: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
});
