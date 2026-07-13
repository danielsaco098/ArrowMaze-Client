import { CubeLayout } from '../../../adapters/cube/CubeLayout';
import { CUBE_FACE_SIZE } from '../../data/cubeLevels';

/**
 * Presentation registry: which levels render as a cube, and with what topology.
 * This lookup is the ONLY flat-vs-cube branch in the app — GameScreen picks the
 * board Strategy (BoardView / CubeBoardView) from it, and a future cube level
 * is a new entry here, not a new `if` anywhere else.
 */
const CUBE_LEVEL_FACE_SIZE: ReadonlyMap<number, number> = new Map([[16, CUBE_FACE_SIZE]]);

/** The cube topology for a level, or null when the level is a flat board. */
export function cubeLayoutForLevel(levelId: number): CubeLayout | null {
  const faceSize = CUBE_LEVEL_FACE_SIZE.get(levelId);
  return faceSize === undefined ? null : new CubeLayout(faceSize);
}
