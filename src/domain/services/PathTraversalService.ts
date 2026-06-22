import { Board } from '../entities/Board';
import { ArrowCell } from '../entities/ArrowCell';
import { Position } from '../value-objects/Position';
import { NotAnArrowError } from '../errors';

/**
 * Pure domain service that decides whether the arrow at a given position can
 * slide off the board in the direction it points.
 *
 * It walks cell by cell from the arrow toward the edge: if every intermediate
 * cell is passable, the arrow escapes; if any solid cell blocks the way, it cannot.
 * Relies only on the polymorphic `isPassable()` (no knowledge of concrete cell types).
 */
export class PathTraversalService {
  canEscape(board: Board, position: Position): boolean {
    const cell = board.cellAt(position);
    if (!(cell instanceof ArrowCell)) {
      throw new NotAnArrowError(position);
    }

    // Walk from the arrow's leading cell (head) toward the edge. The arrow's own
    // body cells are behind the head, so they never block its own path.
    const head = board.headOfArrow(cell.arrowId);
    let next = head.translate(cell.direction);
    while (board.isWithinBounds(next)) {
      if (!board.cellAt(next).isPassable()) {
        return false;
      }
      next = next.translate(cell.direction);
    }
    return true;
  }

  /**
   * The straight-line path the arrow's head would travel, from its first step up
   * to and including the off-board position it exits through. Useful for animations.
   */
  pathToEdge(board: Board, position: Position): Position[] {
    const cell = board.cellAt(position);
    if (!(cell instanceof ArrowCell)) {
      throw new NotAnArrowError(position);
    }

    const head = board.headOfArrow(cell.arrowId);
    const path: Position[] = [];
    let next = head.translate(cell.direction);
    while (board.isWithinBounds(next)) {
      path.push(next);
      next = next.translate(cell.direction);
    }
    path.push(next); // first off-board cell = the exit point
    return path;
  }
}
