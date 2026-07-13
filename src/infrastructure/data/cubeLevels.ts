import type { LevelData } from '../../application/ports/ILevelBuilder';
import { CubeLayout } from '../../adapters/cube/CubeLayout';
import { CubeFaceComposer } from '../../adapters/cube/CubeFaceComposer';
import { generateLevel } from './levelGenerator';

/**
 * Level 16 — "The Cube". Six faces played on the surface of a solid.
 *
 * Each face is an ordinary N×N level from the deterministic {@link generateLevel}
 * (so every face is solvable by construction), and {@link CubeFaceComposer} glues
 * the six onto one (6N)×(6N) diagonal board that the unchanged domain plays as a
 * flat level. The presentation layer (a later PR) projects that board onto a cube.
 *
 * N = 5: a 3×3 or 4×4 face is too small to hold the winding arrows, and 5 keeps
 * the composed board at 30×30 (only 6·25 = 150 cells ever carry content, so the
 * board is deliberately sparse — the padding between faces is what lets arrows
 * escape off a face edge).
 *
 * DELIBERATELY UNTIMED, despite being HARD. Every other HARD level carries a
 * countdown, but the cube's arrows are hidden on faces you have to orbit to see;
 * a timer you cannot race because you cannot see the board would be punitive, not
 * hard. So this level sets no `timeLimitSeconds` on purpose (see cubeLevels.test
 * and the HARD-is-timed convention test, which excludes the cube for this reason).
 */
export const CUBE_FACE_SIZE = 5;

/** One fixed seed per face, so the cube level is deterministic like the others. */
const CUBE_FACE_SEEDS = [4201, 4211, 4217, 4229, 4231, 4241] as const;

export function buildCubeLevel16(): LevelData {
  const layout = new CubeLayout(CUBE_FACE_SIZE);
  const faces = CUBE_FACE_SEEDS.map((seed, index) =>
    generateLevel({
      // Per-face id/name are irrelevant — the composer overrides them; face ids
      // never reach the board, only their (remapped) arrow ids do.
      id: index,
      name: `cube-face-${index}`,
      difficulty: 'HARD',
      rows: CUBE_FACE_SIZE,
      cols: CUBE_FACE_SIZE,
      seed,
      maxLength: 4,
      // The cube is a HARD level, so every face carries the HARD furniture:
      // a wall detour and collectible stars, like any other HARD board.
      walls: 1,
      collectibles: 2,
    }),
  );

  return new CubeFaceComposer(layout).compose({
    id: 16,
    name: 'The Cube',
    difficulty: 'HARD',
    faces,
  });
}
