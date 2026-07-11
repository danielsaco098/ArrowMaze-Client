/**
 * Single source of truth for arrow stroke metrics, shared by the static board
 * pieces and the escape-flight overlay so they always match.
 *
 * Proportions follow the original game: a thin line (~12% of the cell) with a
 * clearly wider arrowhead, capped so arrows never fatten on big cells — the
 * extra room becomes separation between arrows instead.
 */
export interface ArrowMetrics {
  /** Line thickness. */
  t: number;
  /** Arrowhead length along the pointing direction. */
  headLen: number;
  /** Arrowhead half-width (the triangle's base is twice this). */
  headHalf: number;
}

export function arrowMetrics(size: number): ArrowMetrics {
  const t = Math.min(8, Math.max(3, Math.round(size * 0.125)));
  const headLen = Math.min(20, Math.max(8, Math.round(size * 0.34)));
  const headHalf = Math.min(11, Math.max(t + 2, Math.round(size * 0.18)));
  return { t, headLen, headHalf };
}
