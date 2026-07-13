import { CubeLayout, CubeLayoutError } from './CubeLayout';

describe('CubeLayout', () => {
  describe('construction', () => {
    it('should_lay_six_faces_on_the_diagonal_of_a_6N_square_board', () => {
      // Arrange / Act
      const layout = new CubeLayout(5);

      // Assert
      expect(CubeLayout.FACE_COUNT).toBe(6);
      expect(layout.faces).toHaveLength(6);
      expect(layout.boardSize).toBe(30);
      expect(layout.rows).toBe(30);
      expect(layout.cols).toBe(30);
      layout.faces.forEach((face, index) => {
        expect(face.index).toBe(index);
        expect(face.size).toBe(5);
        // Diagonal placement: block k starts at (kN, kN).
        expect(face.rowStart).toBe(index * 5);
        expect(face.colStart).toBe(index * 5);
      });
    });

    it('should_name_the_faces_in_diagonal_order', () => {
      // Act
      const names = new CubeLayout(5).faces.map((f) => f.name);

      // Assert
      expect(names).toEqual(['FRONT', 'RIGHT', 'BACK', 'LEFT', 'TOP', 'BOTTOM']);
    });

    it('should_reject_a_non_positive_or_non_integer_face_size', () => {
      // Act / Assert
      expect(() => new CubeLayout(0)).toThrow(CubeLayoutError);
      expect(() => new CubeLayout(-3)).toThrow(CubeLayoutError);
      expect(() => new CubeLayout(2.5)).toThrow(CubeLayoutError);
    });
  });

  /**
   * THE load-bearing invariant.
   *
   * Cross-face non-interference — an arrow on one face can never be blocked by an
   * arrow on another — holds for exactly one reason: on the diagonal every pair
   * of faces occupies a DISJOINT set of rows AND a disjoint set of columns, so no
   * full-row or full-column lane on one face ever reaches a cell of another.
   *
   * This property test walks all six faces and every one of their cells and
   * proves that disjointness directly. Any "tighter net" layout that packs the
   * faces closer together (a cross-shaped net, a shared row/column band, an
   * off-by-N offset) would let one face's lane cross another face's cell and MUST
   * fail this test. If this test ever goes red, the cube game rule is broken even
   * though nothing throws — do not "fix" the test, fix the layout.
   */
  describe('cross-face non-interference invariant', () => {
    it('should_keep_every_pair_of_faces_disjoint_in_both_rows_and_columns', () => {
      // Arrange: cover a range of face sizes, including the shipping N = 5.
      for (const n of [1, 2, 5, 8]) {
        const layout = new CubeLayout(n);

        // Collect, per face, the exact set of board rows and columns its cells
        // occupy — visiting ALL cells, not just the block corners.
        const rowsByFace: Array<Set<number>> = [];
        const colsByFace: Array<Set<number>> = [];
        for (let faceIndex = 0; faceIndex < CubeLayout.FACE_COUNT; faceIndex += 1) {
          const rows = new Set<number>();
          const cols = new Set<number>();
          for (let localRow = 0; localRow < n; localRow += 1) {
            for (let localCol = 0; localCol < n; localCol += 1) {
              const { row, col } = layout.toBoard(faceIndex, localRow, localCol);
              rows.add(row);
              cols.add(col);
            }
          }
          rowsByFace.push(rows);
          colsByFace.push(cols);
        }

        // Assert: every pair of distinct faces is disjoint in both axes.
        for (let i = 0; i < CubeLayout.FACE_COUNT; i += 1) {
          for (let j = i + 1; j < CubeLayout.FACE_COUNT; j += 1) {
            const sharedRow = [...rowsByFace[i]].some((r) => rowsByFace[j].has(r));
            const sharedCol = [...colsByFace[i]].some((c) => colsByFace[j].has(c));
            expect({ n, i, j, sharedRow }).toEqual({ n, i, j, sharedRow: false });
            expect({ n, i, j, sharedCol }).toEqual({ n, i, j, sharedCol: false });
          }
        }
      }
    });
  });

  /**
   * THE identity invariant — the guard against the false-victory bug.
   *
   * `Board` keys arrows by a GLOBAL id. `generateLevel` numbers arrows from 1 on
   * EVERY face, so if the six faces are composed without an id offset their id
   * spaces overlap: `pathOfArrow` splices cells from other faces, `clearArrow`
   * wipes several faces at once, and `isCleared` declares victory once ONE face
   * is clear — silently, nothing thrown. `globalArrowId` prevents that by giving
   * each face a disjoint id band, and this property test proves the mapping is
   * injective across every (face, localId) pair it accepts. If it ever goes red,
   * the cube can be won by clearing a single face — fix the mapping, not the test.
   */
  describe('arrow-id identity invariant', () => {
    it('should_map_every_face_and_local_id_to_a_globally_unique_arrow_id', () => {
      // Arrange
      const layout = new CubeLayout(5);
      const seen = new Set<number>();
      let count = 0;

      // Act: exhaust the whole accepted domain of local ids on every face.
      for (let faceIndex = 0; faceIndex < CubeLayout.FACE_COUNT; faceIndex += 1) {
        for (let localId = 1; localId < CubeLayout.ARROW_ID_STRIDE; localId += 1) {
          seen.add(layout.globalArrowId(faceIndex, localId));
          count += 1;
        }
      }

      // Assert: no two inputs collided.
      expect(seen.size).toBe(count);
      expect(count).toBe(CubeLayout.FACE_COUNT * (CubeLayout.ARROW_ID_STRIDE - 1));
    });

    it('should_recover_the_face_from_a_global_arrow_id_round_trip', () => {
      // Arrange
      const layout = new CubeLayout(5);
      const sampleIds = [1, 2, 25, 500, CubeLayout.ARROW_ID_STRIDE - 1];

      // Act / Assert
      for (let faceIndex = 0; faceIndex < CubeLayout.FACE_COUNT; faceIndex += 1) {
        for (const localId of sampleIds) {
          const global = layout.globalArrowId(faceIndex, localId);
          expect(layout.faceOfArrowId(global)).toBe(faceIndex);
        }
      }
    });

    it('should_reject_out_of_range_or_negative_local_ids', () => {
      // Arrange
      const layout = new CubeLayout(5);

      // Act / Assert: 0, the stride boundary, and a NEGATIVE (derived) id all throw.
      expect(() => layout.globalArrowId(0, 0)).toThrow(CubeLayoutError);
      expect(() => layout.globalArrowId(0, CubeLayout.ARROW_ID_STRIDE)).toThrow(CubeLayoutError);
      expect(() => layout.globalArrowId(0, -5)).toThrow(CubeLayoutError);
      expect(() => layout.globalArrowId(6, 1)).toThrow(CubeLayoutError);
    });

    it('should_reject_a_global_id_that_globalArrowId_never_produces', () => {
      // Arrange
      const layout = new CubeLayout(5);

      // Act / Assert: local-id-0 band boundaries and negatives are not valid ids.
      expect(() => layout.faceOfArrowId(0)).toThrow(CubeLayoutError);
      expect(() => layout.faceOfArrowId(CubeLayout.ARROW_ID_STRIDE)).toThrow(CubeLayoutError);
      expect(() => layout.faceOfArrowId(-1001)).toThrow(CubeLayoutError);
    });
  });

  describe('faceAt / padding classification', () => {
    const layout = new CubeLayout(5);

    it('should_return_the_owning_face_for_a_cell_inside_a_diagonal_block', () => {
      // FRONT block is rows/cols [0,5); BACK block is [10,15).
      expect(layout.faceAt(0, 0)).toBe(0);
      expect(layout.faceAt(4, 4)).toBe(0);
      expect(layout.faceAt(12, 13)).toBe(2);
      expect(layout.faceAt(29, 29)).toBe(5);
    });

    it('should_treat_off_diagonal_cells_as_padding', () => {
      // Same row band as FRONT but RIGHT's column band → padding, not a face.
      expect(layout.faceAt(0, 7)).toBeNull();
      expect(layout.faceAt(7, 0)).toBeNull();
      expect(layout.isPadding(0, 7)).toBe(true);
      expect(layout.isInsideFace(0, 7)).toBe(false);
      expect(layout.isInsideFace(2, 3)).toBe(true);
    });

    it('should_treat_out_of_bounds_cells_as_padding', () => {
      expect(layout.faceAt(-1, 0)).toBeNull();
      expect(layout.faceAt(0, 30)).toBeNull();
      expect(layout.isPadding(30, 30)).toBe(true);
    });
  });

  describe('coordinate round-trip', () => {
    it('should_map_every_face_cell_board_and_back_without_loss', () => {
      // Arrange
      const layout = new CubeLayout(5);

      // Act / Assert
      for (let faceIndex = 0; faceIndex < CubeLayout.FACE_COUNT; faceIndex += 1) {
        for (let localRow = 0; localRow < 5; localRow += 1) {
          for (let localCol = 0; localCol < 5; localCol += 1) {
            const board = layout.toBoard(faceIndex, localRow, localCol);
            const local = layout.toLocal(board.row, board.col);
            expect(local).toEqual({ faceIndex, localRow, localCol });
          }
        }
      }
    });

    it('should_return_null_local_for_a_padding_cell', () => {
      expect(new CubeLayout(5).toLocal(0, 7)).toBeNull();
    });

    it('should_reject_a_local_coordinate_off_the_face', () => {
      // Arrange
      const layout = new CubeLayout(5);

      // Act / Assert
      expect(() => layout.toBoard(6, 0, 0)).toThrow(CubeLayoutError);
      expect(() => layout.toBoard(0, 5, 0)).toThrow(CubeLayoutError);
      expect(() => layout.toBoard(0, 0, -1)).toThrow(CubeLayoutError);
    });
  });
});
