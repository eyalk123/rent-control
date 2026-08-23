import React, { useMemo } from 'react';
import { Linking, ScrollView, useWindowDimensions, View } from 'react-native';
import MarkdownDisplay from 'react-native-markdown-display';
import { useTheme } from 'react-native-paper';

/**
 * Renders an assistant answer's Markdown (tables via GFM, bold, lists, headings) with a
 * theme-aware style map. Wide tables scroll horizontally so they don't squeeze on a phone.
 * No raw-HTML handling — the model's output is Markdown/plain text only.
 */
/**
 * Only let the model's answers open plain web links. Without an `onLinkPress`,
 * react-native-markdown-display falls through to a bare `Linking.openURL`, which would open
 * whatever scheme appeared in the text — `tel:`, `mailto:`, an app deep link — with no
 * confirmation. Answers are model output shaped by tool results drawn from user-entered
 * records, so the href is not something we control. Returning false leaves the tap inert.
 */
function openIfHttps(url: string): boolean {
  if (!/^https:\/\//i.test(url)) return false;
  Linking.openURL(url).catch(() => {
    /* no browser for it, or the OS refused — nothing useful to say */
  });
  return false;
}

/** Hebrew, Arabic and Syriac blocks — enough for the languages this product ships in. */
const RTL_CHAR = /[֐-׿؀-ۿ܀-ݏ]/;
const LTR_CHAR = /[A-Za-z]/;

/** The direction of the answer's first strong character, the way `dir="auto"` decides it. */
function detectDirection(text: string): 'ltr' | 'rtl' {
  for (const ch of text) {
    if (RTL_CHAR.test(ch)) return 'rtl';
    if (LTR_CHAR.test(ch)) return 'ltr';
  }
  return 'ltr';
}

export const Markdown = React.memo(function Markdown({ children }: { children: string }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const c = theme.colors;
  const dir = detectDirection(children);

  const mono = 'IBMPlexMono_400Regular';

  const styles = useMemo(() => ({
    // The assistant answers in Hebrew or English regardless of the app's language, so each
    // answer has to carry its own direction. Two separate things are needed: `direction` on
    // this View drives *layout* (which side list bullets sit on), while `writingDirection` on
    // `textgroup` below drives *text* (alignment and where punctuation lands). Putting
    // writingDirection here does nothing — the library renders `body` as a View and strips
    // text-only props out of it.
    body: { color: c.onSurface, fontSize: 15, lineHeight: 22, direction: dir },
    textgroup: { writingDirection: 'auto' as const },
    paragraph: { marginTop: 0, marginBottom: 8 },
    strong: { fontWeight: '700' as const },
    em: { fontStyle: 'italic' as const },
    link: { color: c.primary, textDecorationLine: 'underline' as const },
    bullet_list: { marginBottom: 8 },
    ordered_list: { marginBottom: 8 },
    list_item: { marginVertical: 2 },
    heading1: { fontSize: 18, fontWeight: '700' as const, marginTop: 8, marginBottom: 4, color: c.onSurface },
    heading2: { fontSize: 16, fontWeight: '700' as const, marginTop: 8, marginBottom: 4, color: c.onSurface },
    heading3: { fontSize: 15, fontWeight: '700' as const, marginTop: 8, marginBottom: 4, color: c.onSurface },
    blockquote: {
      backgroundColor: c.surfaceVariant,
      borderColor: c.outline,
      borderLeftWidth: 3,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginVertical: 6,
    },
    hr: { backgroundColor: c.outline, height: 1, marginVertical: 10 },
    code_inline: { backgroundColor: c.surfaceVariant, color: c.onSurface, fontFamily: mono, borderRadius: 4, fontSize: 13 },
    code_block: { backgroundColor: c.surfaceVariant, color: c.onSurface, fontFamily: mono, padding: 10, borderRadius: 8, fontSize: 13 },
    fence: { backgroundColor: c.surfaceVariant, color: c.onSurface, fontFamily: mono, padding: 10, borderRadius: 8, fontSize: 13 },
    table: { borderColor: c.outline, borderWidth: 1, borderRadius: 6 },
    thead: { backgroundColor: c.surfaceVariant },
    th: { padding: 6, borderColor: c.outline, fontWeight: '700' as const },
    td: { padding: 6, borderColor: c.outline },
    tr: { borderColor: c.outline },
  }), [c, dir]);

  const rules = useMemo(
    () => ({
      // Wide tables scroll horizontally instead of squeezing to fit the phone width.
      table: (node: { key: string }, children: React.ReactNode) => (
        <ScrollView key={node.key} horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.table, { minWidth: width - 96, marginVertical: 8 }]}>{children}</View>
        </ScrollView>
      ),
    }),
    [styles, width],
  );

  return (
    <MarkdownDisplay style={styles as any} rules={rules as any} onLinkPress={openIfHttps}>
      {children}
    </MarkdownDisplay>
  );
});
