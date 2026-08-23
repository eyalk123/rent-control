import type { SourceRef, SourceRefType } from '../types';

// The agent tags sources inline as [[type:id|label]] (see backend SYSTEM_PROMPT). We strip
// these out of the displayed prose and surface them as tappable chips instead.
const MARKER = /\[\[(renter|property|transaction):(\d+)\|([^\]]*)\]\]/g;
// A marker still being streamed (opening "[[" with no closing "]]" yet) — hide it so the
// user never sees a half-written tag flash by.
const PARTIAL_MARKER = /\[\[[^\]]*$/;

/**
 * Split raw agent text into clean prose + de-duplicated source refs.
 * Safe to call on a partially-streamed buffer: complete markers become chips, an
 * in-progress marker at the very end is hidden until it finishes.
 */
export function parseCitations(raw: string): { text: string; refs: SourceRef[] } {
  const refs: SourceRef[] = [];
  const seen = new Set<string>();

  let text = raw.replace(MARKER, (_match, type: string, id: string, label: string) => {
    const key = `${type}:${id}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({ type: type as SourceRefType, id: Number(id), label: label.trim() });
    }
    return '';
  });

  text = text
    .replace(PARTIAL_MARKER, '')
    // tidy whitespace a removed marker may have left behind
    .replace(/[ \t]+([.,;:!?…])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return { text, refs };
}

/**
 * Incremental form of `parseCitations`, for the streaming path.
 *
 * The whole-buffer version was re-scanning every character of the answer on every delta —
 * three regex passes over text that grows each time, i.e. O(n²) in answer length, on the JS
 * thread that is also re-rendering. This keeps the prose already finalized and only examines
 * the short unfinalized tail.
 *
 * Output is identical to `parseCitations(raw)` because of what the tail holds back: an
 * in-progress `[[…` marker, and any trailing run of spaces or tabs. Neither tidy-up rule can
 * then span the boundary — `[ \t]+([.,;:!?…])` needs the whitespace and the punctuation
 * together, and `[ \t]{2,}` needs the whole run — so applying them per chunk is safe.
 */
export function createCitationScanner() {
  let prose = '';
  let tail = '';
  const refs: SourceRef[] = [];
  const seen = new Set<string>();

  const tidy = (s: string) =>
    s.replace(/[ \t]+([.,;:!?…])/g, '$1').replace(/[ \t]{2,}/g, ' ');

  const takeMarkers = (s: string) =>
    s.replace(MARKER, (_match, type: string, id: string, label: string) => {
      const key = `${type}:${id}`;
      if (!seen.has(key)) {
        seen.add(key);
        refs.push({ type: type as SourceRefType, id: Number(id), label: label.trim() });
      }
      return '';
    });

  return {
    push(delta: string): { text: string; refs: SourceRef[] } {
      tail = takeMarkers(tail + delta);
      // Hold back anything a later chunk could still change: a half-written marker, and the
      // trailing whitespace run before it.
      const partial = tail.search(PARTIAL_MARKER);
      let cut = partial === -1 ? tail.length : partial;
      while (cut > 0 && (tail[cut - 1] === ' ' || tail[cut - 1] === '\t')) cut--;
      prose += tidy(tail.slice(0, cut));
      tail = tail.slice(cut);
      return this.value();
    },
    value(): { text: string; refs: SourceRef[] } {
      const text = (prose + tidy(tail.replace(PARTIAL_MARKER, ''))).trim();
      return { text, refs: refs.slice() };
    },
  };
}
