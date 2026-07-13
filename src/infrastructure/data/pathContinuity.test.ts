import { BUNDLED_LEVELS } from './bundledLevels';
import { JsonLevelBuilder } from '../../adapters/builders/JsonLevelBuilder';
import { CubeLayout } from '../../adapters/cube/CubeLayout';
import { CUBE_FACE_SIZE } from './cubeLevels';

const builder = new JsonLevelBuilder();

/**
 * The flat generated levels (1–15). The "no dead gaps" invariant below runs
 * verbatim over these; for the cube (level 16) it is REPARAMETERISED rather than
 * switched off: the padding between faces is exempt (it is the medium an arrow
 * escapes INTO off a face edge — intentional dead space), but holes INSIDE a face
 * are gameplay and must still obey the rule. See the cube-specific test below.
 * The colour and path-continuity invariants run over all sixteen unchanged.
 */
const FLAT_LEVELS = BUNDLED_LEVELS.filter((l) => l.id <= 15);

describe('arrow colours', () => {
  it.each(BUNDLED_LEVELS.map((l) => [l.id, l.name] as const))(
    'should_give_touching_arrows_different_colours_for_level_%i_%s',
    (id) => {
      // Arrange
      const level = BUNDLED_LEVELS.find((l) => l.id === id)!;
      const byPos = new Map<string, { arrowId: number; color?: string }>();
      for (const cell of level.cells) {
        if (cell.kind === 'ARROW' && cell.arrowId !== undefined) {
          byPos.set(`${cell.row},${cell.col}`, { arrowId: cell.arrowId, color: cell.color });
        }
      }

      // Assert: orthogonal neighbours from different arrows never share a colour
      for (const [key, cell] of byPos) {
        const [r, c] = key.split(',').map(Number);
        for (const [dr, dc] of [[1, 0], [0, 1]] as const) {
          const other = byPos.get(`${r + dr},${c + dc}`);
          if (other && other.arrowId !== cell.arrowId) {
            expect(other.color).not.toBe(cell.color);
          }
        }
      }
    },
  );
});

describe('holes', () => {
  it.each(FLAT_LEVELS.map((l) => [l.id, l.name] as const))(
    'should_place_every_gap_on_some_exit_lane_for_level_%i_%s',
    (id) => {
      // Arrange: a gap no exit lane crosses can never swallow an arrow — the
      // generator must fill it or retry the seed.
      const board = builder.build(BUNDLED_LEVELS.find((l) => l.id === id)!).board;
      const onLane = new Set<string>();
      for (const arrowId of board.arrowIds()) {
        const head = board.headCellOfArrow(arrowId);
        let lane = head.position.translate(head.direction);
        while (board.isWithinBounds(lane)) {
          onLane.add(`${lane.row},${lane.col}`);
          // The arrow falls into the first hole: the lane ends there.
          if (board.cellAt(lane).kind === 'EMPTY') break;
          lane = lane.translate(head.direction);
        }
      }

      // Assert
      for (const cell of board.cells()) {
        if (cell.kind === 'EMPTY') {
          expect(onLane.has(`${cell.position.row},${cell.position.col}`)).toBe(true);
        }
      }
    },
  );

  it('should_place_every_in_face_gap_on_some_exit_lane_for_level_16_The_Cube', () => {
    // Same invariant, reparameterised for the cube: PADDING is exempt — it is
    // the escape medium off a face edge, dead by design — but a hole INSIDE a
    // face is gameplay (it swallows arrows) and must sit on some exit lane like
    // any other level's gap, or it is unreachable noise.
    const cube = BUNDLED_LEVELS.find((l) => l.id === 16)!;
    const board = builder.build(cube).board;
    const layout = new CubeLayout(CUBE_FACE_SIZE);

    const onLane = new Set<string>();
    for (const arrowId of board.arrowIds()) {
      const head = board.headCellOfArrow(arrowId);
      let lane = head.position.translate(head.direction);
      while (board.isWithinBounds(lane)) {
        onLane.add(`${lane.row},${lane.col}`);
        // The arrow falls into the first hole: the lane ends there.
        if (board.cellAt(lane).kind === 'EMPTY') break;
        lane = lane.translate(head.direction);
      }
    }

    // Assert: only the EMPTY cells inside a face are held to the rule.
    for (const cell of board.cells()) {
      const { row, col } = cell.position;
      if (cell.kind === 'EMPTY' && layout.isInsideFace(row, col)) {
        expect(onLane.has(`${row},${col}`)).toBe(true);
      }
    }
  });
});

describe('arrow path continuity', () => {
  it.each(BUNDLED_LEVELS.map((l) => [l.id, l.name] as const))(
    'should_never_cross_its_own_exit_lane_for_level_%i_%s',
    (id) => {
      // Arrange: an arrow whose body sits anywhere on its own exit lane reads
      // as the arrow pointing at itself — the generator must never produce it.
      const board = builder.build(BUNDLED_LEVELS.find((l) => l.id === id)!).board;

      for (const arrowId of board.arrowIds()) {
        const head = board.headCellOfArrow(arrowId);
        let lane = head.position.translate(head.direction);
        while (board.isWithinBounds(lane)) {
          const cell = board.cellAt(lane);
          // Assert
          const isOwnBody = cell.isArrow() && (cell as typeof head).arrowId === arrowId;
          expect(isOwnBody).toBe(false);
          lane = lane.translate(head.direction);
        }
      }
    },
  );

  it.each(BUNDLED_LEVELS.map((l) => [l.id, l.name] as const))(
    'should_chain_every_segment_into_the_next_for_level_%i_%s',
    (id) => {
      // Arrange
      const board = builder.build(BUNDLED_LEVELS.find((l) => l.id === id)!).board;

      for (const arrowId of board.arrowIds()) {
        const path = board.pathOfArrow(arrowId);
        // Assert: each segment's direction steps exactly onto the next segment
        for (let i = 0; i < path.length - 1; i += 1) {
          const stepped = path[i].position.translate(path[i].direction);
          expect(`${stepped.row},${stepped.col}`).toBe(
            `${path[i + 1].position.row},${path[i + 1].position.col}`,
          );
        }
      }
    },
  );
});
