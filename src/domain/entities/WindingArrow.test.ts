import { GameSession } from './GameSession';
import { Board } from './Board';
import { GameStatus, TapOutcome } from './GameStatus';
import { Position } from '../value-objects/Position';
import { JsonCellFactory } from '../../adapters/factories/JsonCellFactory';
import type { CellSpec } from '../../application/ports/ICellFactory';
import type { DirectionName } from '../../domain/value-objects/Direction';

const factory = new JsonCellFactory();

const seg = (
  direction: DirectionName,
  arrowId: number,
  segmentIndex: number,
): CellSpec => ({ kind: 'ARROW', direction, arrowId, segmentIndex });
const empty = (): CellSpec => ({ kind: 'EMPTY' });

function build(specs: CellSpec[][]): Board {
  return new Board(
    specs.map((row, r) => row.map((spec, c) => factory.create(spec, new Position(r, c)))),
  );
}

describe('Winding arrows', () => {
  it('should_take_the_head_from_the_highest_segment_when_the_path_turns', () => {
    // Arrange: an L-shaped arrow — tail (1,0) points UP into (0,0), which
    // points RIGHT and is the head (segment order 0 → 1).
    const board = build([
      [seg('RIGHT', 1, 1), empty()],
      [seg('UP', 1, 0), empty()],
    ]);

    // Assert
    expect(board.headOfArrow(1)).toEqual(new Position(0, 0));
  });

  it('should_escape_along_the_heads_direction_when_a_body_cell_is_tapped', () => {
    // Arrange: same L-shape; the head's RIGHT lane is clear
    const board = build([
      [seg('RIGHT', 1, 1), empty()],
      [seg('UP', 1, 0), empty()],
    ]);
    const session = new GameSession(board);

    // Act: tapping the TAIL (which points UP) still slides the arrow out RIGHT
    const result = session.tap(new Position(1, 0));

    // Assert: the whole path is cleared and the level is won
    expect(result.outcome).toBe(TapOutcome.Escaped);
    expect(result.status).toBe(GameStatus.Victory);
  });

  it('should_escape_when_only_its_own_body_crosses_the_heads_lane', () => {
    // Arrange: a U-shaped arrow whose own body sits on the head's exit lane.
    // Path: (0,0)→(1,0)→(1,1)→(0,1) head pointing LEFT — the lane (0,0) is its
    // own tail, which vacates as the arrow slides (train-style), so it escapes.
    const board = build([
      [seg('DOWN', 1, 0), seg('LEFT', 1, 3), empty()],
      [seg('RIGHT', 1, 1), seg('UP', 1, 2), empty()],
    ]);
    const session = new GameSession(board);

    // Act
    const result = session.tap(new Position(0, 1));

    // Assert
    expect(result.outcome).toBe(TapOutcome.Escaped);
    expect(session.arrowsRemaining).toBe(0);
  });

  it('should_not_collect_stars_beyond_the_first_hole_when_the_arrow_is_swallowed', () => {
    // Arrange: arrow → hole → star: the arrow falls into the hole first
    const board = build([
      [seg('RIGHT', 1, 0), empty(), { kind: 'COLLECTIBLE' }, empty()],
    ]);
    const session = new GameSession(board);

    // Act
    const result = session.tap(new Position(0, 0));

    // Assert: escaped, but the star beyond the hole is untouched
    expect(result.outcome).toBe(TapOutcome.Escaped);
    expect(session.collectiblesCollected).toBe(0);
    expect(board.cellAt(new Position(0, 2)).kind).toBe('COLLECTIBLE');
  });

  it('should_collect_stars_that_sit_before_the_first_hole', () => {
    // Arrange: arrow → star → hole
    const board = build([
      [seg('RIGHT', 1, 0), { kind: 'COLLECTIBLE' }, empty(), empty()],
    ]);
    const session = new GameSession(board);

    // Act
    const result = session.tap(new Position(0, 0));

    // Assert
    expect(result.outcome).toBe(TapOutcome.Escaped);
    expect(session.collectiblesCollected).toBe(1);
  });

  it('should_escape_through_a_hole_even_when_arrows_sit_beyond_it', () => {
    // Arrange: arrow → hole → blocking arrow. The hole swallows the arrow,
    // so the blocker beyond it is irrelevant — no need to clear it first.
    const board = build([
      [seg('RIGHT', 1, 0), empty(), seg('LEFT', 2, 0), empty()],
    ]);
    const session = new GameSession(board);

    // Act
    const result = session.tap(new Position(0, 0));

    // Assert: swallowed by the hole; the other arrow is untouched
    expect(result.outcome).toBe(TapOutcome.Escaped);
    expect(session.arrowsRemaining).toBe(1);
    expect(board.cellAt(new Position(0, 2)).isArrow()).toBe(true);
  });

  it('should_be_blocked_when_another_arrow_sits_in_the_heads_lane', () => {
    // Arrange: the L-shaped arrow's RIGHT lane is blocked by arrow 2
    const board = build([
      [seg('RIGHT', 1, 1), seg('DOWN', 2, 0)],
      [seg('UP', 1, 0), empty()],
    ]);
    const session = new GameSession(board);

    // Act
    const result = session.tap(new Position(1, 0));

    // Assert
    expect(result.outcome).toBe(TapOutcome.Blocked);
    expect(result.livesRemaining).toBe(2);
  });
});
