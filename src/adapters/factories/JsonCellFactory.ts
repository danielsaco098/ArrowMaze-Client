import { Cell } from '../../domain/entities/Cell';
import { ArrowCell } from '../../domain/entities/ArrowCell';
import { WallCell } from '../../domain/entities/WallCell';
import { EmptyCell } from '../../domain/entities/EmptyCell';
import { ExitCell } from '../../domain/entities/ExitCell';
import { Direction } from '../../domain/value-objects/Direction';
import type { Position } from '../../domain/value-objects/Position';
import type { CellSpec, ICellFactory } from '../../application/ports/ICellFactory';

/** Raised when a cell spec is missing required data or has an unknown kind. */
export class MalformedCellSpecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MalformedCellSpecError';
  }
}

/**
 * Factory Method implementation: decides which concrete `Cell` subclass to build
 * from a serialized {@link CellSpec}, so level-loading code never instantiates
 * concrete cells directly. Adding a new cell type means adding one `case` here
 * (and its class), leaving callers untouched.
 */
export class JsonCellFactory implements ICellFactory {
  create(spec: CellSpec, position: Position): Cell {
    switch (spec.kind) {
      case 'ARROW': {
        if (!spec.direction) {
          throw new MalformedCellSpecError('An arrow cell requires a "direction".');
        }
        return new ArrowCell(position, Direction.fromName(spec.direction));
      }
      case 'WALL':
        return new WallCell(position);
      case 'EMPTY':
        return new EmptyCell(position);
      case 'EXIT':
        return new ExitCell(position);
      default:
        throw new MalformedCellSpecError(`Unknown cell kind: "${String((spec as CellSpec).kind)}".`);
    }
  }
}
