import { Board } from '../entities/Board';
import { ArrowCell } from '../entities/ArrowCell';
import { Position } from '../value-objects/Position';
import { NotAnArrowError } from '../errors';

/**
 * Pure domain service that decides whether the arrow at a given position can
 * slide off the board in the direction its HEAD points.
 *
 * It walks cell by cell from the head toward the edge: if every cell on that
 * lane is passable, the arrow escapes. The arrow's OWN body never blocks it:
 * a winding arrow may cross its head's lane, but as the arrow slides out each
 * body segment vacates its cell before the head arrives (train-style motion).
 */
export class PathTraversalService {
  canEscape(board: Board, position: Position): boolean {
    const cell = board.cellAt(position);
    if (!(cell instanceof ArrowCell)) {
      throw new NotAnArrowError(position);
    }

    const head = board.headCellOfArrow(cell.arrowId);
    let next = head.position.translate(head.direction);
    while (board.isWithinBounds(next)) {
      const onLane = board.cellAt(next);
      const isOwnBody = onLane instanceof ArrowCell && onLane.arrowId === cell.arrowId;
      if (!onLane.isPassable() && !isOwnBody) {
        return false;
      }
      next = next.translate(head.direction);
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

    const head = board.headCellOfArrow(cell.arrowId);
    const path: Position[] = [];
    let next = head.position.translate(head.direction);
    while (board.isWithinBounds(next)) {
      path.push(next);
      next = next.translate(head.direction);
    }
    path.push(next); // first off-board cell = the exit point
    return path;
  }
}
