import type { LevelData } from '../../application/ports/ILevelBuilder';
import { generateLevel, LevelConfig } from './levelGenerator';

/**
 * The 15 bundled levels. Each is produced by the deterministic, solvable-by-
 * construction {@link generateLevel} from a curated config: board size and arrow
 * length grow with difficulty (5 EASY, 5 MEDIUM, 5 HARD), so every level is
 * harder than the previous one. The seeds are fixed, so the levels never change.
 * `bundledLevels.test.ts` re-verifies that all 15 are fully solvable.
 */
const LEVEL_CONFIGS: LevelConfig[] = [
  { id: 1, name: 'First Steps', difficulty: 'EASY', rows: 3, cols: 3, seed: 1011, maxLength: 2 },
  { id: 2, name: 'Warming Up', difficulty: 'EASY', rows: 3, cols: 4, seed: 1027, maxLength: 2 },
  { id: 3, name: 'Two Lanes', difficulty: 'EASY', rows: 4, cols: 4, seed: 1033, maxLength: 2 },
  { id: 4, name: 'Wider Path', difficulty: 'EASY', rows: 4, cols: 5, seed: 1049, maxLength: 2 },
  { id: 5, name: 'Full Square', difficulty: 'EASY', rows: 5, cols: 5, seed: 1051, maxLength: 2 },
  { id: 6, name: 'Longer Arrows', difficulty: 'MEDIUM', rows: 5, cols: 5, seed: 2063, maxLength: 3 },
  { id: 7, name: 'Crossroads', difficulty: 'MEDIUM', rows: 5, cols: 6, seed: 2069, maxLength: 3 },
  { id: 8, name: 'Packed Grid', difficulty: 'MEDIUM', rows: 6, cols: 6, seed: 2081, maxLength: 3 },
  { id: 9, name: 'Tight Fit', difficulty: 'MEDIUM', rows: 6, cols: 6, seed: 2099, maxLength: 3 },
  { id: 10, name: 'Big Board', difficulty: 'MEDIUM', rows: 6, cols: 7, seed: 2111, maxLength: 3 },
  { id: 11, name: 'Long Hall', difficulty: 'HARD', rows: 7, cols: 6, seed: 3137, maxLength: 3 },
  { id: 12, name: 'Gridlock', difficulty: 'HARD', rows: 7, cols: 7, seed: 3163, maxLength: 3 },
  { id: 13, name: 'Tangled', difficulty: 'HARD', rows: 7, cols: 7, seed: 3169, maxLength: 3 },
  { id: 14, name: 'Sprawl', difficulty: 'HARD', rows: 7, cols: 8, seed: 3181, maxLength: 3 },
  { id: 15, name: 'The Great Escape', difficulty: 'HARD', rows: 8, cols: 8, seed: 3191, maxLength: 3 },
];

export const BUNDLED_LEVELS: ReadonlyArray<LevelData> = LEVEL_CONFIGS.map(generateLevel);
