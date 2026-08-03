import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenContainer } from '@/src/shared/components/ui';
import { Icon } from '@/src/shared/components/ui/Icon';
import { useAlert } from '@/src/core/context';
import { useLanguageContext, useRtlLabelStyle } from '@/src/context';
import { darkColors, ICON_SM, lightColors, spacing } from '@/src/core/theme';
import { getPreferences, updateSettings } from '../api/preferences';
import {
  TEMPLATE_TOKENS,
  WHATSAPP_TEMPLATE_KEYS,
  getDefaultTemplate,
  renderTemplate,
  sampleValues,
  type WhatsAppTemplateKey,
  type WhatsAppTemplates,
} from '../templates';

type Colors = typeof lightColors | typeof darkColors;

/**
 * One template. The text box always shows the *effective* message — the owner's edit if
 * there is one, otherwise the shipped default — so there is never an empty box to stare
 * at, and "Reset" is just "put the default back and save that".
 *
 * Committed on blur rather than per keystroke, matching ThresholdField in the
 * notification settings screen: every character typed must not be a PUT.
 */
function TemplateSection({
  templateKey,
  effective,
  isEdited,
  expanded,
  onToggle,
  onCommit,
  onReset,
  colors,
  surface,
  language,
  rtlLabelStyle,
}: {
  templateKey: WhatsAppTemplateKey;
  effective: string;
  isEdited: boolean;
  expanded: boolean;
  onToggle: () => void;
  onCommit: (text: string) => void;
  onReset: () => void;
  colors: Colors;
  surface: string;
  language: string;
  rtlLabelStyle: object;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState(effective);
  const [selection, setSelection] = React.useState({
    start: effective.length,
    end: effective.length,
  });
  // Only set on the TextInput right after an insert, to move the caret past the token;
  // released immediately afterwards so the native selection is otherwise left alone.
  const [forcedSelection, setForcedSelection] = React.useState<
    { start: number; end: number } | null
  >(null);

  // Re-sync when the stored value changes under us — a reset, or a failed save rolling
  // back. Guarded on the field being collapsed or unchanged so it can't clobber typing.
  React.useEffect(() => {
    setDraft(effective);
  }, [effective]);

  const insertToken = (token: string) => {
    const snippet = `{${token}}`;
    const next = draft.slice(0, selection.start) + snippet + draft.slice(selection.end);
    const caret = selection.start + snippet.length;
    setDraft(next);
    setSelection({ start: caret, end: caret });
    setForcedSelection({ start: caret, end: caret });
  };

  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    setSelection(e.nativeEvent.selection);
    if (forcedSelection) setForcedSelection(null);
  };

  const preview = renderTemplate(draft, sampleValues(templateKey, language));

  return (
    <View style={[styles.card, { backgroundColor: surface, borderColor: colors.outline }]}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} accessibilityRole="button">
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={ICON_SM}
          color={colors.textSecondary}
        />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {t(`whatsappTemplates.key.${templateKey}`)}
        </Text>
        {isEdited ? (
          <View style={[styles.editedBadge, { backgroundColor: colors.revBg }]}>
            <Text style={[styles.editedText, { color: colors.revFg }]}>
              {t('whatsappTemplates.edited')}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.sectionBody}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onBlur={() => onCommit(draft)}
            onSelectionChange={handleSelectionChange}
            selection={forcedSelection ?? undefined}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              rtlLabelStyle,
              { borderColor: colors.outline, color: colors.textPrimary, backgroundColor: surface },
            ]}
          />

          <Text style={[styles.label, rtlLabelStyle, { color: colors.textSecondary }]}>
            {t('whatsappTemplates.insertLabel')}
          </Text>
          <View style={styles.chipRow}>
            {TEMPLATE_TOKENS[templateKey].map((token) => (
              <TouchableOpacity
                key={token}
                style={[styles.chip, { borderColor: colors.outline }]}
                onPress={() => insertToken(token)}
                accessibilityRole="button"
              >
                <Text style={[styles.chipText, { color: colors.primary }]}>
                  {t(`whatsappTemplates.token.${token}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, rtlLabelStyle, { color: colors.textSecondary }]}>
            {t('whatsappTemplates.previewLabel')}
          </Text>
          <View style={[styles.preview, { borderColor: colors.outline }]}>
            <Text style={[styles.previewText, rtlLabelStyle, { color: colors.textPrimary }]}>
              {preview.trim() || t('whatsappTemplates.emptyHint')}
            </Text>
          </View>

          {isEdited ? (
            <TouchableOpacity onPress={onReset} style={styles.resetRow} accessibilityRole="button">
              <Text style={[styles.resetText, { color: colors.primary }]}>
                {t('whatsappTemplates.reset')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function WhatsAppTemplatesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const { appConfirm, appAlert } = useAlert();
  const rtlLabelStyle = useRtlLabelStyle();
  const { language, isRtl } = useLanguageContext();

  // Overrides are stored per language, so which slot an edit lands in follows the app's
  // current language. Switching to Hebrew therefore shows the Hebrew default rather than
  // the English edit — which is the point: neither language overwrites the other.
  const locale = language.startsWith('he') ? 'he' : 'en';

  const [templates, setTemplates] = React.useState<WhatsAppTemplates>({});
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState<WhatsAppTemplateKey | null>(
    WHATSAPP_TEMPLATE_KEYS[0],
  );

  const load = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const prefs = await getPreferences();
      setTemplates(prefs.settings.whatsapp_templates ?? {});
    } catch {
      // keep whatever is on screen; the defaults still render
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  const save = async (next: WhatsAppTemplates) => {
    const previous = templates;
    setTemplates(next); // optimistic
    try {
      await updateSettings({ whatsapp_templates: next });
    } catch {
      setTemplates(previous);
      appAlert(t('error.title', { defaultValue: 'Error' }), t('whatsappTemplates.saveError'));
    }
  };

  /**
   * Storing text identical to the default would light up the "Edited" badge for a message
   * the user never changed, and would freeze a copy of today's wording — so an edit that
   * matches the default (which is exactly what Reset produces) removes the override
   * instead of writing one.
   */
  const commit = (key: WhatsAppTemplateKey, text: string) => {
    const trimmed = text.trim();
    const isDefault = !trimmed || trimmed === getDefaultTemplate(key, t).trim();
    const current = templates[key]?.[locale] ?? '';
    if (isDefault && !current) return;
    if (!isDefault && current === text) return;

    const next: WhatsAppTemplates = { ...templates };
    const forKey = { ...(next[key] ?? {}) };
    if (isDefault) {
      delete forKey[locale];
    } else {
      forKey[locale] = text;
    }
    if (Object.keys(forKey).length === 0) {
      delete next[key];
    } else {
      next[key] = forKey;
    }
    save(next);
  };

  const reset = async (key: WhatsAppTemplateKey) => {
    const ok = await appConfirm(
      t('whatsappTemplates.resetTitle'),
      t('whatsappTemplates.resetMessage'),
    );
    if (!ok) return;
    commit(key, getDefaultTemplate(key, t));
  };

  const header = (
    <View style={[styles.pageHeader, { borderBottomColor: colors.outline }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={8}
        accessibilityRole="button"
      >
        <Icon name={isRtl ? 'chevron-right' : 'chevron-left'} size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text variant="titleLarge" style={[styles.pageTitle, { color: colors.textPrimary }]}>
        {t('whatsappTemplates.title')}
      </Text>
      <View style={styles.backButton} />
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer>
        {header}
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {header}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, rtlLabelStyle, { color: colors.textSecondary }]}>
          {t('whatsappTemplates.subtitle')}
        </Text>

        {WHATSAPP_TEMPLATE_KEYS.map((key) => {
          const override = templates[key]?.[locale];
          return (
            <TemplateSection
              // Keyed by locale too: switching language swaps which text this box holds,
              // and a fresh instance is the simplest way to reset its draft state.
              key={`${key}-${locale}`}
              templateKey={key}
              effective={override?.trim() ? override : getDefaultTemplate(key, t)}
              isEdited={Boolean(override?.trim())}
              expanded={expanded === key}
              onToggle={() => setExpanded((prev) => (prev === key ? null : key))}
              onCommit={(text) => commit(key, text)}
              onReset={() => reset(key)}
              colors={colors}
              surface={theme.colors.surface}
              language={language}
              rtlLabelStyle={rtlLabelStyle}
            />
          );
        })}
      </ScrollView>
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
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  subtitle: { fontSize: 13, marginBottom: spacing.xs, lineHeight: 19 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  editedBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  editedText: { fontSize: 11, fontWeight: '700' },
  sectionBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  label: { fontSize: 12, fontWeight: '600', marginTop: spacing.xs },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  preview: {
    borderWidth: 1,
    borderRadius: 9,
    borderStyle: 'dashed',
    padding: 10,
  },
  previewText: { fontSize: 13, lineHeight: 19 },
  resetRow: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  resetText: { fontSize: 13, fontWeight: '600' },
});
