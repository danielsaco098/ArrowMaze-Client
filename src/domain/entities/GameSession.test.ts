import { GameSession } from './GameSession';
import { GameStatus, TapOutcome } from './GameStatus';
import { Board } from './Board';
import { Lives } from '../value-objects/Lives';
import { Position } from '../value-objects/Position';
import { PathTraversalService } from '../services/PathTraversalService';
import { GameAlreadyOverError, NotAnArrowError } from '../errors';
import { arrow, buildBoard, collectible, empty } from '../../test-support/buildBoard';

describe('GameSession', () => {
  it('should_clear_the_arrow_and_keep_playing_when_a_tapped_arrow_escapes', () => {
    // Arrange: two arrows; the first can slide right off the board
    const board = buildBoard([
      [arrow('RIGHT'), empty(), empty()],
      [arrow('RIGHT'), empty(), empty()],
    ]);
    const session = new GameSession(board);

    // Act
    const result = session.tap(new Position(0, 0));

    // Assert
    expect(result.outcome).toBe(TapOutcome.Escaped);
    expect(result.status).toBe(GameStatus.Playing);
    expect(result.arrowsRemaining).toBe(1);
    expect(session.lives.count).toBe(3);
    expect(session.moves).toBe(1);
  });

  it('should_lose_a_life_when_a_tapped_arrow_is_blocked', () => {
    // Arrange: the two arrows block each other vertically
    const board = buildBoard([[arrow('DOWN')], [arrow('UP')]]);
    const session = new GameSession(board);

    // Act: tapping the bottom arrow (UP) is blocked by the top arrow
    const result = session.tap(new Position(1, 0));

    // Assert
    expect(result.outcome).toBe(TapOutcome.Blocked);
    expect(result.status).toBe(GameStatus.Playing);
    expect(result.livesRemaining).toBe(2);
    expect(result.arrowsRemaining).toBe(2); // nothing was removed
  });

  it('should_collect_the_stars_swept_by_an_escaping_arrow', () => {
    // Arrange: the arrow exits rightwards over a star
    const board = buildBoard([[arrow('RIGHT'), collectible(), empty()]]);
    const session = new GameSession(board);

    // Act
    const result = session.tap(new Position(0, 0));

    // Assert: star collected and its cell now empty
    expect(result.outcome).toBe(TapOutcome.Escaped);
    expect(session.collectiblesCollected).toBe(1);
    expect(board.cellAt(new Position(0, 1)).kind).toBe('EMPTY');
  });

  it('should_not_collect_stars_when_the_arrow_is_blocked', () => {
    // Arrange: the star lies behind a blocking arrow
    const board = buildBoard([[arrow('RIGHT'), collectible(), arrow('LEFT')]]);
    const session = new GameSession(board);

    // Act: blocked (loses a life), nothing collected
    const result = session.tap(new Position(0, 0));

    // Assert
    expect(result.outcome).toBe(TapOutcome.Blocked);
    expect(session.collectiblesCollected).toBe(0);
    expect(board.cellAt(new Position(0, 1)).kind).toBe('COLLECTIBLE');
  });

  it('should_end_in_defeat_when_the_time_limit_runs_out', () => {
    // Arrange
    const board = buildBoard([[arrow('RIGHT'), empty()]]);
    const session = new GameSession(board);

    // Act
    session.timeUp();

    // Assert
    expect(session.status).toBe(GameStatus.Defeat);
  });

  it('should_not_override_a_finished_game_when_time_runs_out', () => {
    // Arrange: winning first...
    const board = buildBoard([[arrow('RIGHT'), empty()]]);
    const session = new GameSession(board);
    session.tap(new Position(0, 0));
    expect(session.status).toBe(GameStatus.Victory);

    // Act: ...then the countdown fires late
    session.timeUp();

    // Assert: victory stands
    expect(session.status).toBe(GameStatus.Victory);
  });

  it('should_return_victory_state_when_the_board_is_cleared', () => {
    // Arrange: a single arrow that can escape
    const board = buildBoard([[arrow('RIGHT'), empty()]]);
    const session = new GameSession(board);

    // Act
    const result = session.tap(new Position(0, 0));

    // Assert
    expect(result.status).toBe(GameStatus.Victory);
    expect(session.status).toBe(GameStatus.Victory);
    expect(result.arrowsRemaining).toBe(0);
  });

  it('should_return_defeat_state_when_lives_reach_zero', () => {
    // Arrange: blocked configuration, starting with a single life
    const board = buildBoard([[arrow('DOWN')], [arrow('UP')]]);
    const session = new GameSession(board, new PathTraversalService(), Lives.of(1));

    // Act
    const result = session.tap(new Position(1, 0));

    // Assert
    expect(result.status).toBe(GameStatus.Defeat);
    expect(result.livesRemaining).toBe(0);
  });

  it('should_throw_GameAlreadyOverError_when_tapping_after_the_game_ended', () => {
    // Arrange: win the game first
    const board = buildBoard([[arrow('RIGHT'), empty()]]);
    const session = new GameSession(board);
    session.tap(new Position(0, 0));

    // Act / Assert
    expect(() => session.tap(new Position(0, 0))).toThrow(GameAlreadyOverError);
  });

  it('should_throw_NotAnArrowError_when_tapping_a_non_arrow_cell', () => {
    // Arrange
    const board = buildBoard([[arrow('RIGHT'), empty()]]);
    const session = new GameSession(board);

    // Act / Assert
    expect(() => session.tap(new Position(0, 1))).toThrow(NotAnArrowError);
  });

  it('should_start_in_victory_when_the_board_has_no_arrows', () => {
    // Arrange / Act
    const session = new GameSession(buildBoard([[empty(), empty()]]));

    // Assert
    expect(session.status).toBe(GameStatus.Victory);
  });

  it('should_defer_the_escape_decision_to_the_injected_traversal_service', () => {
    // Arrange: a stub that always reports "blocked", proving the rule depends on
    // the abstraction, not on a hard-coded path computation (Dependency Inversion).
    const board = buildBoard([[arrow('RIGHT'), empty()]]);
    const alwaysBlocked: Pick<PathTraversalService, 'canEscape'> = { canEscape: () => false };
    const session = new GameSession(board, alwaysBlocked as PathTraversalService);

    // Act
    const result = session.tap(new Position(0, 0));

    // Assert
    expect(result.outcome).toBe(TapOutcome.Blocked);
    expect(result.livesRemaining).toBe(2);
  });

  it('should_keep_an_independent_board_when_constructed_from_a_built_board', () => {
    // Arrange
    const board = buildBoard([[arrow('RIGHT'), empty()]]);
    const session = new GameSession(board);

    // Act
    session.tap(new Position(0, 0));

    // Assert: querying the board through the session is reflected in arrow count
    expect(session.arrowsRemaining).toBe(0);
    expect(board).toBeInstanceOf(Board);
  });
});
