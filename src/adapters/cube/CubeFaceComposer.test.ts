import { CubeFaceComposer } from './CubeFaceComposer';
import { CubeLayout, CubeLayoutError } from './CubeLayout';
import { JsonLevelBuilder } from '../builders/JsonLevelBuilder';
import { GameSession } from '../../domain/entities/GameSession';
import { GameStatus } from '../../domain/entities/GameStatus';
import { PathTraversalService } from '../../domain/services/PathTraversalService';
import { Position } from '../../domain/value-objects/Position';
import type { Board } from '../../domain/entities/Board';
import type { CellData, LevelData } from '../../application/ports/ILevelBuilder';
import { buildCubeLevel16, CUBE_FACE_SIZE } from '../../infrastructure/data/cubeLevels';

const N = 5;

/** A single-cell arrow spec at a face-local position. */
function arrow(row: number, col: number, arrowId: number, color?: string): CellData {
  return { row, col, kind: 'ARROW', direction: 'RIGHT', arrowId, color };
}

/** A face with the given cells (rest empty), sized N×N. */
function face(cells: CellData[]): LevelData {
  return { id: 0, name: 'f', difficulty: 'EASY', rows: N, cols: N, cells };
}

/** Six faces, each carrying two right-pointing single-cell arrows (ids 1 and 2)
 * on distinct rows, so every arrow escapes on tap and faces never interfere. */
function sixTwoArrowFaces(): LevelData[] {
  return Array.from({ length: 6 }, () => face([arrow(0, 0, 1), arrow(2, 0, 2)]));
}

describe('CubeFaceComposer', () => {
  const layout = new CubeLayout(N);
  const composer = new CubeFaceComposer(layout);

  describe('placing faces on the diagonal', () => {
    it('should_offset_each_face_cell_into_its_diagonal_block', () => {
      // Arrange: one marker arrow at local (0,0) on every face.
      const spec = {
        id: 16,
        name: 'The Cube',
        difficulty: 'HARD' as const,
        faces: Array.from({ length: 6 }, () => face([arrow(0, 0, 1)])),
      };

      // Act
      const composed = composer.compose(spec);

      // Assert: FRONT→(0,0), RIGHT→(5,5), … BOTTOM→(25,25).
      const positions = composed.cells.map((c) => `${c.row},${c.col}`).sort();
      expect(positions).toEqual(['0,0', '10,10', '15,15', '20,20', '25,25', '5,5'].sort());
      expect(composed.rows).toBe(30);
      expect(composed.cols).toBe(30);
      expect(composed.id).toBe(16);
    });

    it('should_remap_each_faces_explicit_arrow_id_into_its_global_band', () => {
      // Act
      const composed = composer.compose({
        id: 16,
        name: 'c',
        difficulty: 'HARD',
        faces: sixTwoArrowFaces(),
      });

      // Assert: face f's local ids {1,2} → {f*1000+1, f*1000+2}, all distinct.
      const ids = composed.cells
        .filter((c) => c.kind === 'ARROW')
        .map((c) => c.arrowId)
        .sort((a, b) => (a ?? 0) - (b ?? 0));
      expect(ids).toEqual([1, 2, 1001, 1002, 2001, 2002, 3001, 3002, 4001, 4002, 5001, 5002]);
      expect(new Set(ids).size).toBe(ids.length); // globally unique
    });

    it('should_preserve_the_generators_explicit_color_verbatim', () => {
      // Arrange: a face arrow with a hand-picked colour on RIGHT face (index 1).
      const faces = Array.from({ length: 6 }, (_, i) =>
        i === 1 ? face([arrow(0, 0, 1, '#ABCDEF')]) : face([]),
      );

      // Act
      const composed = composer.compose({ id: 16, name: 'c', difficulty: 'HARD', faces });

      // Assert: the colour rode along unchanged, at RIGHT's offset (5,5).
      const cell = composed.cells.find((c) => c.row === 5 && c.col === 5);
      expect(cell?.color).toBe('#ABCDEF');
    });

    it('should_preserve_non_arrow_cells_and_winding_segments_when_offsetting', () => {
      // Arrange: BACK face (index 2) with a wall, a star and a 2-segment arrow.
      const backFace = face([
        { row: 1, col: 1, kind: 'WALL' },
        { row: 3, col: 3, kind: 'COLLECTIBLE' },
        { row: 0, col: 0, kind: 'ARROW', direction: 'RIGHT', arrowId: 7, segmentIndex: 1 },
        { row: 0, col: 1, kind: 'ARROW', direction: 'RIGHT', arrowId: 7, segmentIndex: 0 },
      ]);
      const faces = Array.from({ length: 6 }, (_, i) => (i === 2 ? backFace : face([])));

      // Act
      const composed = composer.compose({ id: 16, name: 'c', difficulty: 'HARD', faces });

      // Assert: everything offset by (10,10); both arrow segments share id 2007.
      const wall = composed.cells.find((c) => c.kind === 'WALL');
      const star = composed.cells.find((c) => c.kind === 'COLLECTIBLE');
      const segs = composed.cells.filter((c) => c.kind === 'ARROW');
      expect(wall).toMatchObject({ row: 11, col: 11 });
      expect(star).toMatchObject({ row: 13, col: 13 });
      expect(segs.every((c) => c.arrowId === 2007)).toBe(true);
      expect(segs.map((c) => c.segmentIndex).sort()).toEqual([0, 1]);
    });

    it('should_pass_ungrouped_arrows_through_without_an_id_so_the_factory_derives_it', () => {
      // Arrange: an arrow with NO explicit id (a length-1 ungrouped arrow).
      const faces = Array.from({ length: 6 }, (_, i) =>
        i === 0 ? face([{ row: 4, col: 4, kind: 'ARROW', direction: 'UP' }]) : face([]),
      );

      // Act
      const composed = composer.compose({ id: 16, name: 'c', difficulty: 'HARD', faces });

      // Assert: still no explicit id — its unique (negative) id comes from its now
      // global board position, disjoint by geometry.
      const cell = composed.cells.find((c) => c.kind === 'ARROW');
      expect(cell?.arrowId).toBeUndefined();
      expect(cell).toMatchObject({ row: 4, col: 4 });
    });

    it('should_reject_a_spec_without_exactly_six_faces', () => {
      expect(() =>
        composer.compose({ id: 16, name: 'c', difficulty: 'HARD', faces: [face([]), face([])] }),
      ).toThrow(CubeLayoutError);
    });

    it('should_reject_a_face_that_is_not_N_by_N', () => {
      // Arrange: one face sized wrong.
      const faces = Array.from({ length: 6 }, (_, i) =>
        i === 3 ? { id: 0, name: 'f', difficulty: 'EASY' as const, rows: 4, cols: 5, cells: [] } : face([]),
      );

      // Act / Assert
      expect(() => composer.compose({ id: 16, name: 'c', difficulty: 'HARD', faces })).toThrow(
        CubeLayoutError,
      );
    });
  });

  /**
   * The behaviour that the R0 id-remap exists to protect. Without the per-face id
   * offset these two tests would both fail silently: a tap on FRONT would clear
   * arrows on other faces, and clearing one face would win the game.
   */
  describe('cross-face identity behaviour', () => {
    function composedBoard(): Board {
      const data = composer.compose({
        id: 16,
        name: 'c',
        difficulty: 'HARD',
        faces: sixTwoArrowFaces(),
      });
      return new JsonLevelBuilder().build(data).board;
    }

    it('should_leave_every_other_faces_arrows_untouched_when_one_face_arrow_is_tapped', () => {
      // Arrange
      const board = composedBoard();
      const session = new GameSession(board);
      const before = new Set(board.arrowIds());
      expect(before.size).toBe(12);

      // Act: tap FRONT's arrow id 1, which sits at board (0,0).
      session.tap(new Position(0, 0));

      // Assert: exactly that one arrow is gone; the other 11 (incl. all five
      // other faces) are untouched.
      const after = new Set(board.arrowIds());
      expect(after.size).toBe(11);
      expect(after.has(1)).toBe(false);
      for (const id of [2, 1001, 1002, 2001, 2002, 3001, 3002, 4001, 4002, 5001, 5002]) {
        expect(after.has(id)).toBe(true);
      }
    });

    it('should_declare_victory_only_after_the_sixth_face_is_cleared', () => {
      // Arrange
      const board = composedBoard();
      const session = new GameSession(board);

      // Act / Assert: clear five faces (ids 0..4) — never a victory yet.
      for (let f = 0; f < 5; f += 1) {
        session.tap(new Position(f * N, f * N)); // that face's arrow id 1
        session.tap(new Position(f * N + 2, f * N)); // …and id 2
        expect(session.status).toBe(GameStatus.Playing);
      }

      // Clear the sixth face → now it is a victory.
      session.tap(new Position(5 * N, 5 * N));
      expect(session.status).toBe(GameStatus.Playing);
      session.tap(new Position(5 * N + 2, 5 * N));
      expect(session.status).toBe(GameStatus.Victory);
    });
  });

  /**
   * Go/no-go gate: the REAL level 16 (six generated faces) must be fully solvable
   * through the unchanged domain — proving the cube is just a flat board to the
   * rules. A greedy solver taps any currently-escapable arrow until the board is
   * clear; if the composition were wrong (colliding ids, an arrow blocked by
   * another face) this would stall short of victory.
   */
  describe('the composed level 16 is playable end-to-end', () => {
    it('should_build_and_be_solvable_by_repeatedly_tapping_escapable_arrows', () => {
      // Arrange
      const data = buildCubeLevel16();
      const board = new JsonLevelBuilder().build(data).board;
      const session = new GameSession(board);
      const traversal = new PathTraversalService();
      const holes = new Set(
        board
          .cells()
          .filter((c) => c.kind === 'EMPTY')
          .map((c) => `${c.position.row},${c.position.col}`),
      );
      expect(data.rows).toBe(CUBE_FACE_SIZE * 6);
      const startArrows = board.arrowCount();
      expect(startArrows).toBeGreaterThanOrEqual(6);

      // Act: greedily tap an escapable arrow until the board clears.
      let guard = 0;
      while (!board.isCleared() && guard < startArrows * 4) {
        guard += 1;
        const escapable = board
          .arrowIds()
          .find((id) => traversal.canEscape(board, board.headOfArrow(id), holes));
        if (escapable === undefined) break;
        session.tap(board.headOfArrow(escapable));
      }

      // Assert
      expect(board.isCleared()).toBe(true);
      expect(session.status).toBe(GameStatus.Victory);
    });

    it('should_give_every_arrow_a_globally_unique_id_across_all_six_faces', () => {
      // Arrange
      const board = new JsonLevelBuilder().build(buildCubeLevel16()).board;

      // Act
      const ids = board.arrowIds();

      // Assert: unique, and each positive id maps back to one of the six faces.
      expect(new Set(ids).size).toBe(ids.length);
      const layoutForIds = new CubeLayout(CUBE_FACE_SIZE);
      const faces = new Set(ids.filter((id) => id > 0).map((id) => layoutForIds.faceOfArrowId(id)));
      expect([...faces].sort()).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });
});
