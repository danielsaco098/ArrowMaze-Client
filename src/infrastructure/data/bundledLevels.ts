import type { LevelData } from '../../application/ports/ILevelBuilder';
import { generateLevel, LevelConfig } from './levelGenerator';
import { buildCubeLevel16 } from './cubeLevels';

/**
 * The 16 bundled levels. Levels 1–15 are produced by the deterministic,
 * solvable-by-construction {@link generateLevel} from a curated config: board
 * size and arrow length grow with difficulty (5 EASY, 5 MEDIUM, 5 HARD), so every
 * level is harder than the previous one. Level 16 — "The Cube" — is six of those
 * faces glued onto one 30×30 diagonal board by {@link buildCubeLevel16}; it plays
 * as a flat board to the domain and is projected onto a cube by the UI. The seeds
 * are fixed, so the levels never change. `bundledLevels.test.ts` re-verifies that
 * all 16 are fully solvable.
 */
const LEVEL_CONFIGS: LevelConfig[] = [
  { id: 1, name: 'First Steps', difficulty: 'EASY', rows: 5, cols: 5, seed: 1011, maxLength: 4 },
  { id: 2, name: 'Warming Up', difficulty: 'EASY', rows: 6, cols: 5, seed: 1027, maxLength: 4 },
  { id: 3, name: 'Two Lanes', difficulty: 'EASY', rows: 6, cols: 6, seed: 1033, maxLength: 5 },
  { id: 4, name: 'Wider Path', difficulty: 'EASY', rows: 7, cols: 6, seed: 1049, maxLength: 5 },
  { id: 5, name: 'Full Square', difficulty: 'EASY', rows: 7, cols: 7, seed: 1051, maxLength: 6 },
  { id: 6, name: 'Longer Arrows', difficulty: 'MEDIUM', rows: 8, cols: 8, seed: 2063, maxLength: 7, walls: 1, collectibles: 1 },
  { id: 7, name: 'Crossroads', difficulty: 'MEDIUM', rows: 8, cols: 8, seed: 2069, maxLength: 7, walls: 1, collectibles: 1 },
  { id: 8, name: 'Packed Grid', difficulty: 'MEDIUM', rows: 9, cols: 8, seed: 2081, maxLength: 8, walls: 2, collectibles: 2 },
  { id: 9, name: 'Tight Fit', difficulty: 'MEDIUM', rows: 9, cols: 9, seed: 2101, maxLength: 8, walls: 2, collectibles: 2 },
  { id: 10, name: 'Big Board', difficulty: 'MEDIUM', rows: 9, cols: 9, seed: 2111, maxLength: 9, walls: 2, collectibles: 2 },
  { id: 11, name: 'Long Hall', difficulty: 'HARD', rows: 10, cols: 9, seed: 3137, maxLength: 10, walls: 3, timeLimitSeconds: 150, collectibles: 2 },
  { id: 12, name: 'Gridlock', difficulty: 'HARD', rows: 10, cols: 10, seed: 3163, maxLength: 10, walls: 3, timeLimitSeconds: 140, collectibles: 2 },
  { id: 13, name: 'Tangled', difficulty: 'HARD', rows: 10, cols: 10, seed: 3169, maxLength: 11, walls: 3, timeLimitSeconds: 130, collectibles: 3 },
  { id: 14, name: 'Sprawl', difficulty: 'HARD', rows: 11, cols: 10, seed: 3182, maxLength: 12, walls: 4, timeLimitSeconds: 120, collectibles: 3 },
  { id: 15, name: 'The Great Escape', difficulty: 'HARD', rows: 11, cols: 11, seed: 3191, maxLength: 12, walls: 4, timeLimitSeconds: 110, collectibles: 3 },
];

export const BUNDLED_LEVELS: ReadonlyArray<LevelData> = [
  ...LEVEL_CONFIGS.map(generateLevel),
  buildCubeLevel16(),
];
