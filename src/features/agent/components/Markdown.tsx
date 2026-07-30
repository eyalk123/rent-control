import React from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import MarkdownDisplay from 'react-native-markdown-display';
import { useTheme } from 'react-native-paper';

/**
 * Renders an assistant answer's Markdown (tables via GFM, bold, lists, headings) with a
 * theme-aware style map. Wide tables scroll horizontally so they don't squeeze on a phone.
 * No raw-HTML handling — the model's output is Markdown/plain text only.
 */
export function Markdown({ children }: { children: string }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const c = theme.colors;

  const mono = 'IBMPlexMono_400Regular';

  const styles = {
    body: { color: c.onSurface, fontSize: 15, lineHeight: 22 },
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
  };

  const rules = {
    // Wide tables scroll horizontally instead of squeezing to fit the phone width.
    table: (node: { key: string }, children: React.ReactNode) => (
      <ScrollView key={node.key} horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.table, { minWidth: width - 96, marginVertical: 8 }]}>{children}</View>
      </ScrollView>
    ),
  };

  return (
    <MarkdownDisplay style={styles as any} rules={rules as any}>
      {children}
    </MarkdownDisplay>
  );
}
