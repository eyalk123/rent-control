/**
 * The blocking country screen, shown once.
 *
 * Same enforcement point as `LegalConsentGate`, for the same reason: **Continue with
 * Google** creates the Firebase account the moment the native sheet resolves, so there is
 * no point in the sign-up flow where a field could be required. A gate that runs *after*
 * authentication is the only thing that covers every way in.
 *
 * Every pre-existing account was backfilled to `IL`, so this never fires for them.
 *
 * **No country is refused, and none is told what it is missing.** Choosing is the whole
 * screen: confirm, and you are in the app. There used to be a second step for non-Israeli
 * accounts listing the country-specific features that do not exist yet, with a "notify me
 * when you add {Country}" capture under it. Both are gone — the first thing a new user met
 * was an inventory of absences, and the one sentence on it that did real work (open-ended
 * tenancies still need an estimated end date) is said by the lease form itself, at the
 * field it is about: `renter.openEndedTermNote` in LeaseTermBuilder.
 *
 * An absolutely-positioned sibling of the navigator, like the consent gate, and it sits
 * just below it: terms are the condition of using the product at all, a country is a
 * setting within it, and asking where someone lives before they have agreed to anything is
 * the wrong order to collect it in.
 *
 * ---
 *
 * **Built from the app's form parts, because it is the app's first form.**
 *
 * It used to draw itself: a bare `TextInput` with a magnify icon, `List.Item` rows edge to
 * edge with `Divider`s between them, and the two preferences as outlined buttons captioned
 * "Currency: USD". None of that shape appears anywhere else in the product, so the one
 * screen every new account sees first was the one screen that did not look like the app.
 * It now uses `useFieldSurface` for the box, `FormField` for the label, the grouped-list
 * container from `DetailSection` (MOBILE-DESIGN.md §6) for the results, and real
 * `DropdownField`s for currency and language.
 *
 * The header is **left-aligned**, unlike the consent gate's. That gate is a single
 * paragraph and a checkbox, so centring it reads as a prompt; this one is a form with
 * three labelled fields, and centring the title above left-aligned labels is what made it
 * read as a splash screen rather than the first thing you fill in.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useRtlInputStyle, useRtlLabelStyle } from '@/src/core/context';
import { Icon } from '@/src/shared/components/ui';
import { DropdownField } from '@/src/shared/components/form/DropdownField';
import { FormField } from '@/src/shared/components/form/FormField';
import { useFieldSurface } from '@/src/shared/components/form/fieldSurface';
import { useCountry } from '../CountryContext';
import { flagEmoji } from '../flagEmoji';
import { useLanguageContext } from '@/src/core/context/LanguageContext';
import type { SupportedLanguage } from '@/src/core/i18n';
import type { Country } from '../api/countries';

/** Best guess from the device, always confirmable. Never a silent decision. */
function guessCountry(countries: Country[]): string | null {
  const known = new Set(countries.map((c) => c.countryCode));
  try {
    for (const locale of Localization.getLocales()) {
      const region = locale.regionCode?.toUpperCase();
      if (region && known.has(region)) return region;
    }
  } catch {
    // Localization can be unavailable in odd environments. Fall through to no guess.
  }
  return known.has('IL') ? 'IL' : null;
}

/**
 * Lowercased and stripped of accents, so "cote" finds Côte d'Ivoire and "aland" finds
 * Åland Islands. The explicit combining-mark range rather than `\p{Diacritic}`: Hermes is
 * not somewhere to bet on unicode property escapes. Web has the same helper.
 */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Named in themselves — a picker that reads "Hebrew" to someone who only reads Hebrew is
 * no help. Two entries today; this list is the only thing a third locale has to change.
 */
const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  he: 'עברית',
};

/** How far the results list is allowed to run before it scrolls inside itself. */
const LIST_MAX_HEIGHT = 300;

export function CountryGate() {
  const { blocked, countries, currencies, choose, finish, savePreferences } = useCountry();
  const { language, setLanguage } = useLanguageContext();
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const rtlLabelStyle = useRtlLabelStyle();
  // The overlay is absoluteFillObject, so it covers the status bar and the gesture bar
  // too. Without these the title sits under the clock and the confirm button under the
  // home indicator — both confirmed on the emulator, and neither visible in the web
  // preview.
  const insets = useSafeAreaInsets();

  /**
   * The chosen country, or `null` while the search is open. **One or the other is on
   * screen, never both.**
   *
   * A choice used to be a tick on a row inside a 250-row scroller: scroll past it and the
   * screen showed no evidence anything had been picked, and the next stray tap anywhere in
   * the list silently replaced it. Now choosing collapses the search into a chip naming the
   * country, and changing it is a deliberate act — the X. Web does the same, so the two
   * platforms agree about what "chosen" looks like.
   *
   * The device guess seeds this once, when the table lands, so the ordinary case is still
   * one confirmation rather than a search. Clearing it must not be undone, which is what
   * `seeded` is for — without it the effect would re-guess the instant the X emptied it.
   */
  const [selected, setSelected] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (seeded || countries.length === 0) return;
    setSeeded(true);
    setSelected(guessCountry(countries));
  }, [countries, seeded]);

  const chosen = countries.find((c) => c.countryCode === selected);

  /**
   * Currency and language follow the country until the user says otherwise.
   *
   * `null` means "still following" rather than "unset", which is what lets both fields
   * re-fill as the country changes and then stop the moment either is touched.
   */
  const [currencyTouched, setCurrencyTouched] = useState<string | null>(null);
  const [languageTouched, setLanguageTouched] = useState<SupportedLanguage | null>(null);

  const currencyValue = currencyTouched ?? chosen?.currency ?? '';
  // The device's language, not the country's: `expo-localization` knows what this person
  // reads, and a French-reading Israeli is an ordinary case. The country config carries a
  // `locale` and it is deliberately not consulted here.
  const languageValue = languageTouched ?? language;

  const searchSurface = useFieldSurface({ focused: searchFocused });
  const chipSurface = useFieldSurface();

  const currencyItems = useMemo(
    () =>
      currencies.map((c) => ({
        value: c.code,
        label: `${c.code} — ${c.name}${c.symbol === c.code ? '' : ` (${c.symbol})`}`,
      })),
    [currencies],
  );

  const languageItems = useMemo(
    () =>
      (Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]).map((code) => ({
        value: code,
        label: LANGUAGE_LABELS[code],
      })),
    [],
  );

  /**
   * Prefix matches first, then matches anywhere: typing "ind" offers India before British
   * Indian Ocean Territory. The ISO code matches too, for anyone who thinks in codes.
   */
  const matches = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return countries;
    const starts: Country[] = [];
    const contains: Country[] = [];
    for (const c of countries) {
      const name = fold(c.name);
      if (name.startsWith(q) || fold(c.countryCode).startsWith(q)) starts.push(c);
      else if (name.includes(q)) contains.push(c);
    }
    return [...starts, ...contains];
  }, [countries, query]);

  // Swallow the hardware back button while blocked, so the user cannot navigate around
  // behind a screen they cannot see. Same approach as the consent gate.
  useEffect(() => {
    if (!blocked) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [blocked]);

  const onConfirm = useCallback(async () => {
    if (!chosen) return;
    setSaving(true);
    setError('');
    try {
      await choose(chosen.countryCode);
      // Country first because it is the one that gates the screen, then the two that
      // depend on it. One `finish` at the end, so the gate still lifts in one place.
      await savePreferences({ currency: currencyValue, language: languageValue });
      if (languageValue !== language) await setLanguage(languageValue);
      finish(chosen.countryCode);
    } catch {
      // Only advance on a confirmed write: the country drives currency and formats, so
      // landing in the app without it stored would silently render as Israel.
      setError(t('country.saveError'));
    } finally {
      setSaving(false);
    }
  }, [chosen, choose, finish, savePreferences, currencyValue, languageValue, language, setLanguage, t]);

  if (!blocked) return null;

  const overlay = [styles.overlay, { backgroundColor: colors.background }];

  if (countries.length === 0) {
    return (
      <View style={overlay} accessibilityViewIsModal accessibilityLabel={t('country.gateTitle')}>
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      </View>
    );
  }

  return (
    <View style={overlay} accessibilityViewIsModal accessibilityLabel={t('country.gateTitle')}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, rtlLabelStyle, { color: colors.textPrimary }]}>
          {t('country.gateTitle')}
        </Text>
        <Text style={[styles.subtitle, rtlLabelStyle, { color: colors.textSecondary }]}>
          {t('country.gateSubtitle')}
        </Text>

        <View style={styles.fields}>
          <FormField label={t('country.label')}>
            {chosen ? (
              /*
                The choice, standing where the search box was, in the same box every other
                field draws itself in. Only the X is pressable — the old list could be
                re-picked by any stray tap in 250 rows, and this cannot be changed by
                accident at all.

                Outlined, not filled, for the reason the forms redraw gives (§13): a tint
                behind a field reads as a grey slab rather than as emphasis, and it did
                exactly that here in light mode. `primary` on the border is the whole
                difference between this box and the three around it, and it is enough.
              */
              <View style={[chipSurface, styles.chip, { borderColor: colors.primary }]}>
                <Text style={styles.chipFlag} maxFontSizeMultiplier={1.2}>
                  {flagEmoji(chosen.countryCode)}
                </Text>
                <Text
                  style={[styles.chipName, rtlInputStyle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {chosen.name}
                </Text>
                <Text
                  style={[styles.code, { color: colors.textSecondary }]}
                  maxFontSizeMultiplier={1.4}
                >
                  {chosen.countryCode}
                </Text>
                <Pressable
                  onPress={() => {
                    setSelected(null);
                    // Whatever was typed before would still be filtering the list that is
                    // about to reappear, which is not what "choose a different country"
                    // means.
                    setQuery('');
                    setError('');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t('country.clearChoice')}
                  style={styles.clear}
                >
                  <Icon name="x" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <>
                <View style={[searchSurface, styles.search]}>
                  <Icon name="search" size={20} color={colors.placeholder} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t('country.searchPlaceholder')}
                    placeholderTextColor={colors.placeholder}
                    accessibilityLabel={t('country.searchPlaceholder')}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    style={[styles.searchInput, rtlInputStyle, { color: colors.textPrimary }]}
                  />
                </View>

                {/*
                  The grouped-list container from MOBILE-DESIGN.md §6 — surface, radius 12,
                  hairline border, hairline separators between rows. Capped and scrolled
                  rather than left to run: 248 rows in the page flow put the confirm button
                  somewhere off the bottom of a very long scroll.
                */}
                <View
                  style={[
                    styles.group,
                    { backgroundColor: colors.surface, borderColor: colors.outline },
                  ]}
                >
                  {matches.length === 0 ? (
                    <Text
                      style={[styles.empty, rtlLabelStyle, { color: colors.textSecondary }]}
                    >
                      {t('country.noMatches')}
                    </Text>
                  ) : (
                    <ScrollView
                      style={{ maxHeight: LIST_MAX_HEIGHT }}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled
                    >
                      {matches.map((c, idx) => (
                        <React.Fragment key={c.countryCode}>
                          {idx > 0 && (
                            <View
                              style={[styles.separator, { backgroundColor: colors.outline }]}
                            />
                          )}
                          {/*
                            No selected state drawn in here any more: picking a row is what
                            closes this list, so a ticked row could only ever be one nobody
                            had chosen.
                          */}
                          <Pressable
                            onPress={() => {
                              setSelected(c.countryCode);
                              setError('');
                            }}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                              styles.row,
                              pressed && { backgroundColor: colors.inputFilledBackground },
                            ]}
                          >
                            <Text style={styles.rowFlag} maxFontSizeMultiplier={1.2}>
                              {flagEmoji(c.countryCode)}
                            </Text>
                            <Text
                              style={[styles.rowName, rtlInputStyle, { color: colors.textPrimary }]}
                              numberOfLines={1}
                            >
                              {c.name}
                            </Text>
                            <Text
                              style={[styles.code, { color: colors.textSecondary }]}
                              maxFontSizeMultiplier={1.4}
                            >
                              {c.countryCode}
                            </Text>
                          </Pressable>
                        </React.Fragment>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </>
            )}
          </FormField>

          {/*
            Currency and language, pre-filled and changeable. The country is a good guess at
            both and not a fact: a Swiss landlord may let in euros, and plenty of people read
            the app in a language their country does not imply.

            They sit on this screen because this is the one moment the account is empty,
            which is the only moment the currency can be chosen freely — after the first
            property it locks, since every property freezes its currency at creation.

            Real dropdowns rather than the outlined buttons captioned "Currency: USD" that
            stood here: a label belongs above its field, not inside its value, and these are
            the same control the rest of the forms use.
          */}
          <DropdownField
            label={t('country.currencyLabel')}
            data={currencyItems}
            value={currencyValue || null}
            onChange={setCurrencyTouched}
            placeholder={t('country.currencyFollowsCountry')}
          />
          <DropdownField
            label={t('country.languageLabel')}
            data={languageItems}
            value={languageValue}
            onChange={(v) => setLanguageTouched(v as SupportedLanguage)}
            sorted={false}
          />
        </View>
      </ScrollView>

      {/*
        Pinned rather than scrolled to, because the list can be 248 rows and the one action
        on the screen must not be reachable only by scrolling past all of them. This is the
        `fixedButtonBar` every add/edit form in the app already uses — no rule above it and
        no background of its own, because §6 makes whitespace the separator and the list is
        capped inside its own container rather than scrolling underneath this.
      */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}
        <Button
          mode="contained"
          onPress={onConfirm}
          loading={saving}
          disabled={!chosen || saving}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {t('country.confirm')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Just below LegalConsentGate (1500), which is itself below OfflineGate (2000): a
    // device with no connection has a more immediate problem, and consent comes before a
    // setting within the product.
    zIndex: 1400,
    elevation: 1400,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    // `formPaddingHorizontal`, because this is a form. Lists and detail screens use 16.
    paddingHorizontal: 18,
    paddingBottom: spacing.xl,
  },
  title: {
    // The screen title from MOBILE-DESIGN.md §3, which appears exactly once per screen.
    fontSize: 28,
    fontWeight: '700',
    // Explicit on display-size text, per §3 — Android otherwise pads it asymmetrically.
    lineHeight: 34,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  fields: {
    marginTop: spacing.xl,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    // The form input size from §3.
    fontSize: 16,
    // No `height`: a fixed height on anything containing text clips it at large Dynamic
    // Type. The field box already carries `minHeight: 48`.
    padding: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chipFlag: {
    fontSize: 22,
  },
  chipName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  clear: {
    alignItems: 'center',
    justifyContent: 'center',
    // Sized rather than given `hitSlop`: §5 makes 44pt a hard floor and says to verify it
    // with `uiautomator dump`, which reports the view's own bounds and cannot see a
    // hitSlop. A target that only measures up at runtime is a target nobody can check.
    minWidth: 44,
    minHeight: 44,
    // Pull it to the box edge so the larger target does not push the row wider than the
    // 14px the field surface asks for.
    marginEnd: -8,
  },
  group: {
    marginTop: spacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    // Inset so the line starts under the name, not at the container edge — the same
    // treatment `DetailSection` gives its rows.
    marginStart: spacing.lg + 26,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    // The 44pt touch-target floor from §5, with room to spare.
    minHeight: 52,
  },
  rowFlag: {
    fontSize: 20,
    // Fixed so every name starts on the same x, whatever the glyph's own advance is.
    width: 26,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
  },
  code: {
    fontSize: 12,
    fontWeight: '500',
    // The code never truncates; the name yields first. See §3.
    flexShrink: 0,
  },
  empty: {
    padding: spacing.lg,
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: spacing.sm,
  },
  error: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    minHeight: 48,
  },
});
