import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Button, Switch, Text, useTheme } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer, LoadingOverlay } from '@/src/shared/components/ui';
import { Icon } from '@/src/shared/components/ui/Icon';
import { FormScrollView } from '@/src/shared/components/form';
import { FormInput } from '@/src/shared/components/form/FormInput';
import { FormChipInput } from '@/src/shared/components/form/FormChipInput';
import { useAlert } from '@/src/core/context';
import { useLanguageContext, useRtlLabelStyle } from '@/src/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { ScopeSelector, type ScopeValue } from '../components/ScopeSelector';
import { createRule, getPreferences, previewRule, updateRule } from '../api/preferences';
import type { NotificationEvent, NotificationRuleDraft, RulePreview } from '../types';

const EMPTY_SCOPE: ScopeValue = {
  scope_property_ids: [],
  scope_property_owners: [],
  scope_renter_ids: [],
};

function parseOffsets(str: string): number[] {
  const set = new Set<number>();
  for (const part of str.split(',')) {
    const n = parseInt(part.trim(), 10);
    if (!Number.isNaN(n) && n >= 0) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

type FormValues = { label: string; offsetsStr: string };

export function RuleEditorScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const { appAlert } = useAlert();
  const rtlLabelStyle = useRtlLabelStyle();
  const { isRtl } = useLanguageContext();

  const params = useLocalSearchParams<{ event?: string; id?: string }>();
  const event: NotificationEvent = params.event === 'lease_expiring' ? 'lease_expiring' : 'overdue';
  const ruleId = params.id ? Number(params.id) : null;
  const isEdit = ruleId != null;

  const header = (
    <View style={[styles.pageHeader, { borderBottomColor: colors.outline }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8} accessibilityRole="button">
        <Icon name={isRtl ? 'chevron-right' : 'chevron-left'} size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text variant="titleLarge" style={[styles.pageTitle, { color: colors.textPrimary }]}>
        {isEdit ? t('notifications.editRule') : t('notifications.newRule')}
      </Text>
      <View style={styles.backButton} />
    </View>
  );

  const { control, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: { label: '', offsetsStr: '' },
  });
  const [scope, setScope] = React.useState<ScopeValue>(EMPTY_SCOPE);
  const [enabled, setEnabled] = React.useState(true);
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [preview, setPreview] = React.useState<RulePreview | null>(null);

  // Load the existing rule when editing.
  React.useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      try {
        const prefs = await getPreferences();
        const rule = prefs.rules.find((r) => r.id === ruleId);
        if (active && rule) {
          reset({ label: rule.label ?? '', offsetsStr: rule.offsets.join(', ') });
          setScope({
            scope_property_ids: rule.scope_property_ids,
            scope_property_owners: rule.scope_property_owners,
            scope_renter_ids: rule.scope_renter_ids,
          });
          setEnabled(rule.enabled);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isEdit, ruleId, reset]);

  const offsetsStr = watch('offsetsStr');
  const offsets = React.useMemo(() => parseOffsets(offsetsStr), [offsetsStr]);

  // Debounced live preview as offsets / scope change.
  React.useEffect(() => {
    if (offsets.length === 0) {
      setPreview(null);
      return;
    }
    const handle = setTimeout(() => {
      previewRule({ event_type: event, offsets, ...scope })
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 350);
    return () => clearTimeout(handle);
  }, [offsetsStr, scope, event]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSave = handleSubmit(async (vals) => {
    const offs = parseOffsets(vals.offsetsStr);
    if (offs.length === 0) {
      appAlert(t('notifications.previewEmpty'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    const draft: NotificationRuleDraft = {
      event_type: event,
      label: vals.label.trim() || null,
      offsets: offs,
      ...scope,
    };
    try {
      if (ruleId != null) {
        await updateRule(ruleId, { ...draft, enabled });
      } else {
        await createRule(draft);
      }
      router.back();
    } catch {
      appAlert(t('error.title', { defaultValue: 'Error' }), t('notifications.saveError', { defaultValue: 'Could not save. Please try again.' }));
    } finally {
      setSaving(false);
    }
  });

  if (loading) {
    return (
      <ScreenContainer>
        {header}
        <LoadingOverlay visible />
      </ScreenContainer>
    );
  }

  const offsetLabel = event === 'lease_expiring' ? t('notifications.remindBefore') : t('notifications.remindAfter');

  const previewText =
    offsets.length === 0
      ? t('notifications.previewEmpty')
      : preview
        ? t('notifications.preview', { renters: preview.matched_renters, alerts: preview.estimated_alerts })
        : t('notifications.previewLoading');

  return (
    <ScreenContainer>
      {header}
      <View style={styles.wrapper}>
        <FormScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <FormInput control={control} name="label" label={t('notifications.ruleName')} placeholder={t('notifications.ruleNamePlaceholder')} />

          <FormChipInput control={control} name="offsetsStr" label={offsetLabel} placeholder={t('notifications.offsetPlaceholder')} numeric sort />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('notifications.offsetHint')}</Text>

          <ScopeSelector value={scope} onChange={setScope} />

          {isEdit && (
            <View style={styles.toggleRow}>
              <Text variant="bodyMedium" style={[rtlLabelStyle, { color: colors.textPrimary }]}>
                {t('notifications.ruleEnabled')}
              </Text>
              <Switch value={enabled} onValueChange={setEnabled} />
            </View>
          )}

          <View style={[styles.previewCard, { backgroundColor: colors.inputFilledBackground }]}>
            <Text style={[styles.previewText, { color: colors.textSecondary }]}>{previewText}</Text>
          </View>
        </FormScrollView>

        <View style={styles.buttonBar}>
          <Button
            mode="contained"
            onPress={onSave}
            loading={saving}
            disabled={saving || offsets.length === 0}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            {t('notifications.saveRule')}
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { width: 32, alignItems: 'center' },
  pageTitle: { fontWeight: '700', flex: 1, textAlign: 'center' },
  wrapper: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    padding: spacing.formPaddingHorizontal,
    paddingBottom: 24,
  },
  hint: {
    fontSize: 12,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  previewCard: {
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  previewText: {
    fontSize: 13,
  },
  buttonBar: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 24,
  },
  saveButton: { borderRadius: 12 },
  saveButtonContent: { minHeight: 48 },
});
