import { BUNDLED_LEVELS } from './bundledLevels';
import { JsonLevelBuilder } from '../../adapters/builders/JsonLevelBuilder';

const builder = new JsonLevelBuilder();

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
  it.each(BUNDLED_LEVELS.map((l) => [l.id, l.name] as const))(
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
});

describe('arrow path continuity', () => {
  it.each(BUNDLED_LEVELS.map((l) => [l.id, l.name] as const))(
    'should_never_put_a_body_segment_straight_in_front_of_the_head_for_level_%i_%s',
    (id) => {
      // Arrange: a segment right in front of the head reads as the arrow
      // pointing back into itself — the generator must never produce it.
      const board = builder.build(BUNDLED_LEVELS.find((l) => l.id === id)!).board;

      for (const arrowId of board.arrowIds()) {
        const head = board.headCellOfArrow(arrowId);
        const inFront = head.position.translate(head.direction);
        if (!board.isWithinBounds(inFront)) continue;
        const cell = board.cellAt(inFront);
        // Assert
        const isOwnBody = cell.isArrow() && (cell as typeof head).arrowId === arrowId;
        expect(isOwnBody).toBe(false);
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
