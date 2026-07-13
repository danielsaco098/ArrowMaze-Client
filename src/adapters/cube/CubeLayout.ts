/**
 * Maps the six faces of a cube onto ONE flat board, and back.
 *
 * This is a plain coordinate/identity POLICY object — not a GoF pattern. It
 * composes no part-whole hierarchy (the domain's Composite is `Board` over
 * `Cell`) and shares no intrinsic state (it is not a Flyweight). It just decides
 * where each face lives on the board and whether a given board cell belongs to a
 * face or to the padding between faces, and it owns the per-face arrow-id offset
 * that keeps the six faces from colliding in the board's global id space
 * (see {@link globalArrowId}). It has no dependency on the domain, on
 * React, or on any rendering concern; the cube's 3D orientation/basis lives in
 * the presentation layer, not here.
 *
 * ── The diagonal layout ──────────────────────────────────────────────────────
 * A cube has six faces, each an N×N sub-board. They are laid out ON THE DIAGONAL
 * of a single (6N)×(6N) board: face k occupies rows [kN, (k+1)N) and cols
 * [kN, (k+1)N). Everything off the diagonal is padding (left EMPTY by the level
 * author, which the domain already treats as a hole).
 *
 * The diagonal is not an aesthetic choice: it is the ENTIRE reason cross-face
 * non-interference holds. A horizontal lane spans a whole board row and a
 * vertical lane a whole board column; if two faces shared any row or any column,
 * an arrow on one face could be blocked by an arrow on another — which this game
 * never does. On the diagonal, any two faces are disjoint in BOTH rows and
 * columns, so non-interference is guaranteed by geometry, not by a runtime `if`.
 * See CubeLayout.test.ts: any "tighter net" layout MUST fail its disjointness
 * property test.
 */

export type CubeFaceName = 'FRONT' | 'RIGHT' | 'BACK' | 'LEFT' | 'TOP' | 'BOTTOM';

/** A cube face and the diagonal block of the board it occupies. */
export interface CubeFace {
  /** 0..5. Also the index of the diagonal block the face sits in. */
  readonly index: number;
  readonly name: CubeFaceName;
  /** Top-left corner of the face's block on the board (inclusive). */
  readonly rowStart: number;
  readonly colStart: number;
  /** Edge length N of the (square) face. */
  readonly size: number;
}

/** A cell addressed relative to the face it belongs to. */
export interface FaceLocal {
  readonly faceIndex: number;
  readonly localRow: number;
  readonly localCol: number;
}

/** A board (row, col) coordinate as a plain value (no domain dependency). */
export interface BoardCoord {
  readonly row: number;
  readonly col: number;
}

/** Thrown when a coordinate handed to CubeLayout is outside the cube. */
export class CubeLayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CubeLayoutError';
  }
}

/** Face identities in diagonal order: face k sits in block k. */
const FACE_NAMES: readonly CubeFaceName[] = [
  'FRONT',
  'RIGHT',
  'BACK',
  'LEFT',
  'TOP',
  'BOTTOM',
];

export class CubeLayout {
  /** A cube always has six faces. */
  static readonly FACE_COUNT = 6;

  /**
   * Per-face offset applied to arrow ids so the six faces never collide in the
   * board's GLOBAL id space (`Board` treats `arrowId` as global across the whole
   * grid). Face f owns the id band [f·STRIDE + 1, (f+1)·STRIDE).
   *
   * This is the identity counterpart of the geometric disjointness invariant:
   * both are global properties the diagonal alone does not enforce. If two faces
   * ever shared an id, `pathOfArrow` would splice cells from another face,
   * `clearArrow` would wipe several faces at once, and `isCleared` would declare
   * VICTORY the moment one face is cleared — silently, nothing thrown. The stride
   * plus {@link globalArrowId}'s range check turn that into a loud failure at
   * composition time, the only place it is still cheap to fix.
   */
  static readonly ARROW_ID_STRIDE = 1000;

  readonly faces: readonly CubeFace[];
  /** Side length of the whole board: 6 × faceSize. */
  readonly boardSize: number;

  /**
   * @param faceSize N, the edge length of each face. Must be a positive integer.
   *   N ≥ 5 is recommended so a face can hold winding (multi-cell) arrows.
   */
  constructor(readonly faceSize: number) {
    if (!Number.isInteger(faceSize) || faceSize < 1) {
      throw new CubeLayoutError(`faceSize must be a positive integer, got ${faceSize}`);
    }
    this.boardSize = faceSize * CubeLayout.FACE_COUNT;
    this.faces = FACE_NAMES.map((name, index) => ({
      index,
      name,
      rowStart: index * faceSize,
      colStart: index * faceSize,
      size: faceSize,
    }));
  }

  /** Rows/cols of the flat board this layout projects onto. */
  get rows(): number {
    return this.boardSize;
  }

  get cols(): number {
    return this.boardSize;
  }

  /** The face with the given index (0..5). */
  face(index: number): CubeFace {
    const face = this.faces[index];
    if (!face) {
      throw new CubeLayoutError(`faceIndex must be 0..${CubeLayout.FACE_COUNT - 1}, got ${index}`);
    }
    return face;
  }

  /**
   * The face that owns a board cell, or `null` if the cell is padding.
   * On the diagonal a cell belongs to a face only when it lies in that face's
   * block, i.e. its block-row and block-col indices coincide.
   *
   * ⚠ FRONT is face 0, and 0 is falsy. NEVER write `if (!layout.faceAt(r, c))`
   * to mean "is padding" — that treats FRONT as padding. Compare against `null`
   * explicitly, or use {@link isPadding} / {@link isInsideFace}, which do.
   */
  faceAt(row: number, col: number): number | null {
    if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
      return null;
    }
    const blockRow = Math.floor(row / this.faceSize);
    const blockCol = Math.floor(col / this.faceSize);
    return blockRow === blockCol ? blockRow : null;
  }

  /** Does this board cell belong to a face (rather than the padding)? */
  isInsideFace(row: number, col: number): boolean {
    return this.faceAt(row, col) !== null;
  }

  /**
   * Is this board cell padding — the empty space between faces?
   *
   * This is exactly the distinction the escape animation needs (R1): an arrow
   * whose lane reaches PADDING slides off its face into space, whereas an arrow
   * whose lane reaches a hole INSIDE a face drops into that hole. The domain
   * treats both as escape holes; only presentation needs to tell them apart.
   */
  isPadding(row: number, col: number): boolean {
    return this.faceAt(row, col) === null;
  }

  /** Board coordinate → face-local coordinate, or `null` if the cell is padding. */
  toLocal(row: number, col: number): FaceLocal | null {
    const faceIndex = this.faceAt(row, col);
    if (faceIndex === null) {
      return null;
    }
    const face = this.faces[faceIndex];
    return {
      faceIndex,
      localRow: row - face.rowStart,
      localCol: col - face.colStart,
    };
  }

  /**
   * A face-local arrow id → its globally-unique id on the composed board.
   *
   * Only EXPLICIT, grouped arrow ids belong here: `generateLevel` numbers those
   * from 1 upward, so a valid local id is an integer in [1, ARROW_ID_STRIDE).
   * A local id of 0, one ≥ the stride, or a NEGATIVE one is rejected — it is
   * never clamped or wrapped, because a silent overlap is the false-victory bug
   * this method exists to prevent (throw at composition time, fix it there).
   *
   * Negative ids are rejected deliberately: the factory derives them from a
   * cell's board position (`-(row·10000 + col + 1)`), and once a face's cells are
   * offset onto its diagonal block every ungrouped arrow already has a unique
   * board position — so derived ids are ALREADY globally unique and must be left
   * unremapped. Remapping them here would be both unnecessary and wrong (there is
   * no multi-cell group to renumber). The composer therefore remaps only cells
   * that carry an explicit `arrowId` and passes ungrouped cells through as-is.
   */
  globalArrowId(faceIndex: number, localArrowId: number): number {
    this.face(faceIndex); // validates the face index (throws if out of range)
    if (
      !Number.isInteger(localArrowId) ||
      localArrowId < 1 ||
      localArrowId >= CubeLayout.ARROW_ID_STRIDE
    ) {
      throw new CubeLayoutError(
        `localArrowId must be an integer in [1, ${CubeLayout.ARROW_ID_STRIDE}), got ${localArrowId}`,
      );
    }
    return faceIndex * CubeLayout.ARROW_ID_STRIDE + localArrowId;
  }

  /** The face a global arrow id belongs to. Inverse of {@link globalArrowId}. */
  faceOfArrowId(globalArrowId: number): number {
    const maxId = CubeLayout.FACE_COUNT * CubeLayout.ARROW_ID_STRIDE;
    if (
      !Number.isInteger(globalArrowId) ||
      globalArrowId < 1 ||
      globalArrowId >= maxId ||
      globalArrowId % CubeLayout.ARROW_ID_STRIDE === 0
    ) {
      throw new CubeLayoutError(
        `globalArrowId must be a value produced by globalArrowId(), got ${globalArrowId}`,
      );
    }
    return Math.floor(globalArrowId / CubeLayout.ARROW_ID_STRIDE);
  }

  /** Face-local coordinate → board coordinate. Throws if it is off the face. */
  toBoard(faceIndex: number, localRow: number, localCol: number): BoardCoord {
    const face = this.face(faceIndex);
    if (
      !Number.isInteger(localRow) ||
      !Number.isInteger(localCol) ||
      localRow < 0 ||
      localRow >= face.size ||
      localCol < 0 ||
      localCol >= face.size
    ) {
      throw new CubeLayoutError(
        `local (${localRow}, ${localCol}) is outside face ${faceIndex} of size ${face.size}`,
      );
    }
    return { row: face.rowStart + localRow, col: face.colStart + localCol };
  }
}
