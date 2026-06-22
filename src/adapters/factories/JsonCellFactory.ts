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

/** Distinct colors cycled across arrows so each one is visually distinguishable. */
const ARROW_PALETTE = [
  '#6FE3C4',
  '#FFD166',
  '#FF6B6B',
  '#4F7CFF',
  '#C792EA',
  '#F78C6B',
  '#7FDBFF',
  '#B9FBC0',
];

export function arrowColorFor(arrowId: number): string {
  return ARROW_PALETTE[Math.abs(arrowId) % ARROW_PALETTE.length];
}

/** A unique negative id for an ungrouped (single-cell) arrow, derived from its position. */
function deriveArrowId(position: Position): number {
  return -(position.row * 10000 + position.col + 1);
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
        // Cells sharing an explicit arrowId form one multi-cell arrow; an
        // ungrouped arrow gets a unique derived id (length-1).
        const arrowId = spec.arrowId ?? deriveArrowId(position);
        const color = spec.color ?? arrowColorFor(arrowId);
        return new ArrowCell(position, Direction.fromName(spec.direction), arrowId, color);
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
