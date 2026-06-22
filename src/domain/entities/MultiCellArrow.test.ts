import { GameSession } from './GameSession';
import { GameStatus, TapOutcome } from './GameStatus';
import { Position } from '../value-objects/Position';
import { PathTraversalService } from '../services/PathTraversalService';
import { arrow, buildBoard, empty } from '../../test-support/buildBoard';

describe('Multi-cell arrows', () => {
  it('should_treat_cells_sharing_an_arrowId_as_a_single_arrow', () => {
    // Arrange: a length-2 RIGHT arrow occupying (0,0) and (0,1)
    const board = buildBoard([[arrow('RIGHT', { arrowId: 1 }), arrow('RIGHT', { arrowId: 1 }), empty()]]);

    // Assert
    expect(board.arrowCount()).toBe(1);
    expect(board.headOfArrow(1)).toEqual(new Position(0, 1));
  });

  it('should_escape_as_a_block_when_the_head_lane_is_clear', () => {
    // Arrange
    const board = buildBoard([[arrow('RIGHT', { arrowId: 1 }), arrow('RIGHT', { arrowId: 1 }), empty()]]);
    const session = new GameSession(board);

    // Act: tapping the tail still moves the whole arrow
    const result = session.tap(new Position(0, 0));

    // Assert: both cells cleared, level won
    expect(result.outcome).toBe(TapOutcome.Escaped);
    expect(result.status).toBe(GameStatus.Victory);
    expect(board.cellAt(new Position(0, 0)).isArrow()).toBe(false);
    expect(board.cellAt(new Position(0, 1)).isArrow()).toBe(false);
  });

  it('should_be_blocked_when_another_arrow_sits_in_the_head_lane', () => {
    // Arrange: length-2 arrow whose head lane is blocked by another arrow
    const board = buildBoard([
      [arrow('RIGHT', { arrowId: 1 }), arrow('RIGHT', { arrowId: 1 }), arrow('UP', { arrowId: 2 })],
    ]);
    const session = new GameSession(board, new PathTraversalService());

    // Act
    const result = session.tap(new Position(0, 0));

    // Assert
    expect(result.outcome).toBe(TapOutcome.Blocked);
    expect(result.livesRemaining).toBe(2);
    expect(board.arrowCount()).toBe(2);
  });
});
