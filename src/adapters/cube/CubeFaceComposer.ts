import type { CellData, LevelData } from '../../application/ports/ILevelBuilder';
import type { Difficulty } from '../../domain/entities/Level';
import { CubeLayout, CubeLayoutError } from './CubeLayout';

/** The six faces of a cube plus the level metadata, before they are glued flat. */
export interface CubeLevelSpec {
  readonly id: number;
  readonly name: string;
  readonly difficulty: Difficulty;
  /**
   * Exactly six N×N face definitions in diagonal order (FRONT, RIGHT, BACK,
   * LEFT, TOP, BOTTOM). Each is an ordinary {@link LevelData} — e.g. a level the
   * generator produced at size N — so faces reuse the whole existing pipeline.
   */
  readonly faces: ReadonlyArray<LevelData>;
  readonly timeLimitSeconds?: number;
}

/**
 * Glues six N×N faces onto ONE (6N)×(6N) board laid out on the diagonal, so the
 * unchanged domain can play a cube as if it were a single flat board. This is a
 * Builder: it assembles one {@link LevelData} from six part specs, then hands it
 * to the existing `JsonLevelBuilder`/`JsonCellFactory` untouched (Open/Closed —
 * a new topology is a new composer, not an edit to the builder).
 *
 * Two invariants make the cube behave, and BOTH are owned by {@link CubeLayout},
 * not reimplemented here:
 *
 * 1. Geometry — faces sit on the diagonal, so any two are disjoint in rows and
 *    columns; an arrow's lane never reaches another face's cell (padding between
 *    faces is left EMPTY, which the domain already treats as an escape hole).
 * 2. Identity — `Board` keys arrows by a GLOBAL id and every face numbers its
 *    arrows from 1, so ids MUST be offset per face or the faces collide (a tap
 *    would clear several faces and one cleared face would win the game). Each
 *    explicit id is routed through {@link CubeLayout.globalArrowId}, which throws
 *    on collision-prone input rather than silently wrapping.
 *
 * Ungrouped arrows (no explicit `arrowId`) are passed through unremapped on
 * purpose: the factory derives their id from board position, and once offset onto
 * the diagonal every ungrouped arrow already has a globally-unique position.
 */
export class CubeFaceComposer {
  constructor(private readonly layout: CubeLayout) {}

  compose(spec: CubeLevelSpec): LevelData {
    if (spec.faces.length !== CubeLayout.FACE_COUNT) {
      throw new CubeLayoutError(
        `a cube needs exactly ${CubeLayout.FACE_COUNT} faces, got ${spec.faces.length}`,
      );
    }

    const cells: CellData[] = [];
    spec.faces.forEach((face, faceIndex) => {
      if (face.rows !== this.layout.faceSize || face.cols !== this.layout.faceSize) {
        throw new CubeLayoutError(
          `face ${faceIndex} must be ${this.layout.faceSize}×${this.layout.faceSize}, ` +
            `got ${face.rows}×${face.cols}`,
        );
      }
      for (const cell of face.cells) {
        cells.push(this.place(faceIndex, cell));
      }
    });

    return {
      id: spec.id,
      name: spec.name,
      difficulty: spec.difficulty,
      rows: this.layout.boardSize,
      cols: this.layout.boardSize,
      cells,
      timeLimitSeconds: spec.timeLimitSeconds,
    };
  }

  /** Offsets one face-local cell onto its diagonal block, remapping its id. */
  private place(faceIndex: number, cell: CellData): CellData {
    // toBoard validates the local coordinate is on the face (throws otherwise).
    const { row, col } = this.layout.toBoard(faceIndex, cell.row, cell.col);
    const moved: CellData = { ...cell, row, col };

    // Only EXPLICIT grouped ids are remapped. globalArrowId rejects non-positive
    // and out-of-range ids, turning a would-be silent id collision into a throw
    // at composition time. `color` and every other field ride along via {...cell}.
    if (cell.kind === 'ARROW' && cell.arrowId !== undefined) {
      return { ...moved, arrowId: this.layout.globalArrowId(faceIndex, cell.arrowId) };
    }
    return moved;
  }
}
