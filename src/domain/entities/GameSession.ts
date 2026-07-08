import { Board } from './Board';
import { ArrowCell } from './ArrowCell';
import { GameStatus, TapOutcome, TapResult } from './GameStatus';
import { Lives } from '../value-objects/Lives';
import { Position } from '../value-objects/Position';
import { PathTraversalService } from '../services/PathTraversalService';
import { GameAlreadyOverError, NotAnArrowError } from '../errors';
import { Direction } from '../value-objects/Direction';

/**
 * Aggregate root for one level play. Owns the board, the player's lives and the
 * game status, and enforces the core rule:
 *
 *   Tap an arrow → if it can slide off the board it escapes (cell cleared);
 *   if it is blocked, the player loses a life. Clear every arrow to win;
 *   reach zero lives to lose.
 *
 * The traversal service is injected (Dependency Inversion) so the rule can be
 * unit-tested with a stub and alternative path logic can be swapped in.
 */
export class GameSession {
  private currentLives: Lives;
  private currentStatus: GameStatus;
  private moveCount: number;
  private collectedCount: number;

  constructor(
    private readonly board: Board,
    private readonly traversal: PathTraversalService = new PathTraversalService(),
    lives: Lives = Lives.initial(),
  ) {
    this.currentLives = lives;
    this.moveCount = 0;
    this.collectedCount = 0;
    this.currentStatus = board.isCleared() ? GameStatus.Victory : GameStatus.Playing;
  }

  get status(): GameStatus {
    return this.currentStatus;
  }

  get lives(): Lives {
    return this.currentLives;
  }

  get moves(): number {
    return this.moveCount;
  }

  get arrowsRemaining(): number {
    return this.board.arrowCount();
  }

  /** Stars swept up by escaping arrows so far (bonus points at scoring time). */
  get collectiblesCollected(): number {
    return this.collectedCount;
  }

  /**
   * Ends the session in defeat because the level's time limit ran out.
   * A no-op when the game is already over (the countdown may race the last tap).
   */
  timeUp(): void {
    if (this.currentStatus === GameStatus.Playing) {
      this.currentStatus = GameStatus.Defeat;
    }
  }

  /**
   * Attempts to send the arrow at `position` off the board.
   * @throws GameAlreadyOverError if the session is no longer playing.
   * @throws NotAnArrowError if the tapped cell is not an arrow.
   */
  tap(position: Position): TapResult {
    if (this.currentStatus !== GameStatus.Playing) {
      throw new GameAlreadyOverError();
    }
    if (!this.board.cellAt(position).isArrow()) {
      throw new NotAnArrowError(position);
    }

    this.moveCount += 1;

    const arrow = this.board.cellAt(position) as ArrowCell;
    const arrowId = arrow.arrowId;
    let outcome: TapOutcome;
    if (this.traversal.canEscape(this.board, position)) {
      const head = this.board.headOfArrow(arrowId);
      this.board.clearArrow(arrowId);
      this.collectAlongLane(head, arrow.direction);
      outcome = TapOutcome.Escaped;
      if (this.board.isCleared()) {
        this.currentStatus = GameStatus.Victory;
      }
    } else {
      this.currentLives = this.currentLives.decrement();
      outcome = TapOutcome.Blocked;
      if (this.currentLives.isZero()) {
        this.currentStatus = GameStatus.Defeat;
      }
    }

    return {
      outcome,
      status: this.currentStatus,
      livesRemaining: this.currentLives.count,
      arrowsRemaining: this.board.arrowCount(),
    };
  }

  /**
   * An escaping arrow sweeps every cell from its head to the board edge:
   * any collectible star on that lane is picked up (the cell becomes empty).
   */
  private collectAlongLane(head: Position, direction: Direction): void {
    let row = head.row + direction.rowDelta;
    let col = head.col + direction.colDelta;
    while (row >= 0 && row < this.board.rows && col >= 0 && col < this.board.cols) {
      const cell = this.board.cellAt(new Position(row, col));
      if (cell.kind === 'COLLECTIBLE') {
        this.board.clearCell(cell.position);
        this.collectedCount += 1;
      }
      row += direction.rowDelta;
      col += direction.colDelta;
    }
  }
}
