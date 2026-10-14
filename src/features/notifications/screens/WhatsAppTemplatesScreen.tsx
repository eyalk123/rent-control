import React from 'react';
import { allowedModes } from '@/src/shared/utils/capabilities';
import {
  ScrollView,
  StyleSheet,
  Text as RNText,
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
import { Icon, type IconName } from '@/src/shared/components/ui/Icon';
import { useAlert, useOnReconnect } from '@/src/core/context';
import { useLanguageContext, useRtlLabelStyle } from '@/src/context';
import { darkColors, ICON_SM, lightColors, spacing } from '@/src/core/theme';
import { getPreferences, updateSettings } from '../api/preferences';
import {
  TEMPLATE_TOKENS,
  WHATSAPP_TEMPLATE_KEYS,
  TEMPLATE_REQUIREMENTS,
  getDefaultTemplate,
  renderTemplate,
  sampleValues,
  type WhatsAppTemplateKey,
  type WhatsAppTemplates,
} from '../templates';
import { EVENT_ICONS } from '../summary';
import {
  displayToken,
  editorSegments,
  fromEditorText,
  reconcileEdit,
  toEditorText,
  type TokenLabels,
} from '../editorTokens';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { useTour } from '@/src/features/onboarding/TourController';

type Colors = typeof lightColors | typeof darkColors;

/** Each message wears its alert's icon; both CPI stages belong to the one CPI alert. */
const TEMPLATE_ICONS: Record<WhatsAppTemplateKey, IconName> = {
  overdue: EVENT_ICONS.overdue,
  lease_expiring: EVENT_ICONS.lease_expiring,
  cpi_upcoming: EVENT_ICONS.cpi_rent_change,
  cpi_changed: EVENT_ICONS.cpi_rent_change,
};

/**
 * Asks for the tour from inside the loaded tree — the screen shows a spinner until the
 * saved templates arrive. The language anchor is the note above the list; the placeholder
 * anchor lives inside the first section's open body.
 */
function TemplatesTourRequest() {
  useTour('whatsapp-templates');
  return null;
}

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
  anchored,
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
  /** Only the first section carries the placeholder anchor — every section renders the same body. */
  anchored?: boolean;
}) {
  const { t } = useTranslation();
  // The draft is editor text: placeholders appear as translated tags, and are turned back
  // into `{token}` only for the preview and on save. See editorTokens.ts.
  const labels = React.useMemo<TokenLabels>(
    () =>
      Object.fromEntries(
        TEMPLATE_TOKENS[templateKey].map((token) => [token, t(`whatsappTemplates.token.${token}`)]),
      ),
    [templateKey, t],
  );
  const [draft, setDraft] = React.useState(() => toEditorText(effective, labels));
  const [selection, setSelection] = React.useState({
    start: draft.length,
    end: draft.length,
  });
  // Only set on the TextInput right after an insert, to move the caret past the token;
  // released immediately afterwards so the native selection is otherwise left alone.
  const [forcedSelection, setForcedSelection] = React.useState<
    { start: number; end: number } | null
  >(null);

  // Re-sync when the stored value changes under us — a reset, or a failed save rolling
  // back. Guarded on the field being collapsed or unchanged so it can't clobber typing.
  React.useEffect(() => {
    setDraft(toEditorText(effective, labels));
  }, [effective, labels]);

  // Moves the caret after a programmatic change to the text. Deferred a frame because, in a
  // field rendered from styled children, Android applies a selection that arrives with new
  // text *before* the text, then shifts it by the inserted length — a tag inserted at 102
  // left the caret at 118, not 110, and the next Backspace ate a letter of the next word.
  const placeCaret = (caret: number) => {
    setSelection({ start: caret, end: caret });
    requestAnimationFrame(() => setForcedSelection({ start: caret, end: caret }));
  };

  // Keeps each tag whole: an edit that clips one removes it entirely (see reconcileEdit).
  const handleChangeText = (next: string) => {
    const { text, caret } = reconcileEdit(draft, next);
    setDraft(text);
    if (caret !== null) placeCaret(caret);
  };

  const insertToken = (token: string) => {
    const snippet = displayToken(labels[token]);
    setDraft(draft.slice(0, selection.start) + snippet + draft.slice(selection.end));
    placeCaret(selection.start + snippet.length);
  };

  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    setSelection(e.nativeEvent.selection);
    if (forcedSelection) setForcedSelection(null);
  };

  const stored = fromEditorText(draft, labels);
  const preview = renderTemplate(stored, sampleValues(templateKey, language));
  const title = t(`whatsappTemplates.key.${templateKey}`);

  return (
    <View style={[styles.card, { backgroundColor: surface, borderColor: colors.outline }]}>
      {/* Same shape as an alert row on the notifications screen — icon, bold name, the
          line saying when it is used — so each message reads as belonging to its alert. */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
      >
        <View style={[styles.iconBubble, { backgroundColor: colors.primaryBg }]}>
          <Icon name={TEMPLATE_ICONS[templateKey]} size={ICON_SM} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.sectionTitle, rtlLabelStyle, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.usedWhen, rtlLabelStyle, { color: colors.textSecondary }]}>
            {t(`whatsappTemplates.usedWhen.${templateKey}`)}
          </Text>
        </View>
        {isEdited ? (
          <View style={[styles.editedBadge, { backgroundColor: colors.revBg }]}>
            <Text style={[styles.editedText, { color: colors.revFg }]}>
              {t('whatsappTemplates.edited')}
            </Text>
          </View>
        ) : null}
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={ICON_SM}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded ? (
        <View style={[styles.sectionBody, { borderTopColor: colors.outline }]}>
          <Text style={[styles.label, rtlLabelStyle, { color: colors.textSecondary }]}>
            {t('whatsappTemplates.messageLabel')}
          </Text>
          <TextInput
            accessibilityLabel={t('whatsappTemplates.messageLabel')}
            onChangeText={handleChangeText}
            onBlur={() => onCommit(stored)}
            onSelectionChange={handleSelectionChange}
            selection={forcedSelection ?? undefined}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              rtlLabelStyle,
              { borderColor: colors.outline, color: colors.textPrimary, backgroundColor: surface },
            ]}
          >
            {/* Children instead of `value`, so the tags can be styled inside the field. */}
            {editorSegments(draft).map((segment, i) =>
              segment.token ? (
                <RNText key={i} style={[styles.tokenTag, { backgroundColor: colors.primaryBg, color: colors.primary }]}>
                  {segment.text}
                </RNText>
              ) : (
                <RNText key={i}>{segment.text}</RNText>
              ),
            )}
          </TextInput>

          <Text style={[styles.label, rtlLabelStyle, { color: colors.textSecondary }]}>
            {t('whatsappTemplates.insertLabel')}
          </Text>
          <TourAnchor
            id={anchored ? ANCHORS.templatePlaceholders : undefined}
            style={styles.chipRow}
          >
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
          </TourAnchor>

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

/** The templates this country can actually use — see TEMPLATE_REQUIREMENTS. */
const availableTemplateKeys = (): WhatsAppTemplateKey[] =>
  allowedModes<WhatsAppTemplateKey>([...WHATSAPP_TEMPLATE_KEYS], TEMPLATE_REQUIREMENTS);

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
    availableTemplateKeys()[0],
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
  useOnReconnect(() => load());

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
      <TemplatesTourRequest />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* What this text is, then the reassurance, then the one rule people trip on:
            each language keeps its own copy, and the slot follows the app's language. */}
        <View style={styles.intro}>
          <Text style={[styles.lead, rtlLabelStyle, { alignSelf: 'stretch', color: colors.textPrimary }]}>
            {t('whatsappTemplates.subtitle')}
          </Text>
          <Text style={[styles.subtitle, rtlLabelStyle, { alignSelf: 'stretch', color: colors.textSecondary }]}>
            {t('whatsappTemplates.subtitleSafe')}
          </Text>
        </View>
        <TourAnchor id={ANCHORS.templateLanguage}>
          <View style={[styles.note, { backgroundColor: colors.primaryBg }]}>
            <Icon name="languages" size={ICON_SM} color={colors.primary} />
            <Text style={[styles.noteText, rtlLabelStyle, { color: colors.textPrimary }]}>
              {t('whatsappTemplates.languageNote')}
            </Text>
          </View>
        </TourAnchor>

        <Text
          style={[
            styles.groupLabel,
            rtlLabelStyle,
            { alignSelf: 'stretch', color: colors.textSecondary },
            isRtl && { letterSpacing: 0 },
          ]}
        >
          {t('whatsappTemplates.sectionLabel')}
        </Text>

        {availableTemplateKeys().map((key, index) => {
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
              // The first section is the one that starts expanded, so its body is the only
              // one guaranteed to be on screen when the tour opens.
              anchored={index === 0}
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
  intro: { gap: spacing.xs },
  lead: { fontSize: 15, lineHeight: 21 },
  subtitle: { fontSize: 13, lineHeight: 19 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: -spacing.xs,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  // Card title > field labels > content: the alert name is the only bold-and-large text.
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  usedWhen: { fontSize: 12, lineHeight: 17 },
  editedBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  editedText: { fontSize: 11, fontWeight: '700' },
  sectionBody: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
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
  label: { fontSize: 12, fontWeight: '600', marginTop: spacing.sm },
  tokenTag: { fontWeight: '600' },
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
