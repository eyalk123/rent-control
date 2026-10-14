/**
 * How placeholders look inside the WhatsApp template editor.
 *
 * Stored templates use `{name}` (see templates.ts), which reads as code and, in a Hebrew
 * sentence, is an English run that drags the punctuation around it to the wrong side. The
 * editor therefore shows each placeholder as its translated label — `שם פרטי`, `First name`
 * — and converts back to `{name}` before anything is saved or previewed. Nothing stored
 * changes shape, so the backend, the defaults and existing overrides are untouched.
 *
 * A label is wrapped in FSI…PDI (U+2068 / U+2069), the Unicode directional isolates:
 *   - they are invisible, and keep a label's direction from leaking into the sentence;
 *   - no keyboard types them, so they mark a placeholder's extent unambiguously;
 *   - deleting either one, or any letter of the label, leaves a broken pair that
 *     `reconcileEdit` can see in the text alone. That matters on Android, where many
 *     keyboards never report a Backspace key event.
 * Hair spaces inside the pair give the tinted tag a sliver of padding.
 */

const OPEN = '⁨';
const CLOSE = '⁩';
const PAD = ' ';

const DISPLAY_TOKEN = new RegExp(`${OPEN}([^${OPEN}${CLOSE}]*)${CLOSE}`, 'g');

/** token → label, for the placeholders this template offers. */
export type TokenLabels = Record<string, string>;

export function displayToken(label: string): string {
  return `${OPEN}${PAD}${label}${PAD}${CLOSE}`;
}

/** `{name}` → the label tag. Unknown tokens such as a typo'd `{amont}` stay as typed. */
export function toEditorText(stored: string, labels: TokenLabels): string {
  return stored.replace(/\{(\w+)\}/g, (match, token: string) =>
    Object.prototype.hasOwnProperty.call(labels, token) ? displayToken(labels[token]) : match,
  );
}

/** The label tag → `{name}`. Stray isolate marks are dropped rather than saved. */
export function fromEditorText(display: string, labels: TokenLabels): string {
  const byLabel = new Map(Object.entries(labels).map(([token, label]) => [label, token]));
  return display
    .replace(DISPLAY_TOKEN, (_match, inner: string) => {
      const label = inner.split(PAD).join('').trim();
      const token = byLabel.get(label);
      return token ? `{${token}}` : label;
    })
    .split(OPEN).join('')
    .split(CLOSE).join('');
}

export type EditorSegment = { text: string; token: boolean };

/** Split the editor text into plain runs and placeholder tags, for styling. */
export function editorSegments(display: string): EditorSegment[] {
  const segments: EditorSegment[] = [];
  let last = 0;
  for (const match of display.matchAll(DISPLAY_TOKEN)) {
    const start = match.index ?? 0;
    if (start > last) segments.push({ text: display.slice(last, start), token: false });
    segments.push({ text: match[0], token: true });
    last = start + match[0].length;
  }
  if (last < display.length) segments.push({ text: display.slice(last), token: false });
  return segments;
}

function tokenSpans(display: string): [number, number][] {
  return [...display.matchAll(DISPLAY_TOKEN)].map((m) => [m.index ?? 0, (m.index ?? 0) + m[0].length]);
}

/**
 * Make a placeholder behave as one piece. Given the text before and after a native edit,
 * returns the text to keep and, when it differs from what the field now shows, where the
 * caret belongs.
 *
 *   - An edit that removes or replaces any part of a placeholder removes all of it — so
 *     Backspace at the end of `שם פרטי` deletes the tag, never leaving `שם פרט` behind for
 *     a renter to receive.
 *   - Typing with the caret inside a placeholder puts the text just after it instead.
 */
export function reconcileEdit(prev: string, next: string): { text: string; caret: number | null } {
  // The changed region: prev[from, prevEnd) became next[from, nextEnd).
  let from = 0;
  const max = Math.min(prev.length, next.length);
  while (from < max && prev[from] === next[from]) from++;
  let prevEnd = prev.length;
  let nextEnd = next.length;
  while (prevEnd > from && nextEnd > from && prev[prevEnd - 1] === next[nextEnd - 1]) {
    prevEnd--;
    nextEnd--;
  }
  const inserted = next.slice(from, nextEnd);
  const spans = tokenSpans(prev);

  if (prevEnd === from) {
    // Pure insertion: only a problem strictly inside a tag.
    const inside = spans.find(([s, e]) => from > s && from < e);
    if (!inside) return { text: next, caret: null };
    const end = inside[1];
    return { text: prev.slice(0, end) + inserted + prev.slice(end), caret: end + inserted.length };
  }

  const touched = spans.filter(([s, e]) => from < e && prevEnd > s);
  if (touched.length === 0) return { text: next, caret: null };
  const start = Math.min(from, ...touched.map(([s]) => s));
  const end = Math.max(prevEnd, ...touched.map(([, e]) => e));
  return { text: prev.slice(0, start) + inserted + prev.slice(end), caret: start + inserted.length };
}
