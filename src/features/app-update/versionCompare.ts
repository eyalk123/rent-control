/**
 * Compares dotted numeric versions ("1.3.1" vs "1.10.0"). Negative when `a` is older.
 * Missing parts count as 0, so "1.3" equals "1.3.0". Anything non-numeric in a part is
 * read as 0 rather than throwing — a typo in an env var must never crash start-up.
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((p) => parseInt(p, 10) || 0);
  const pb = b.split('.').map((p) => parseInt(p, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
