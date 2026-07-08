import type { Level, Difficulty } from '../../domain/entities/Level';
import type { CellSpec } from './ICellFactory';

/** A single placed cell in a level definition (its spec plus where it sits). */
export interface CellData extends CellSpec {
  readonly row: number;
  readonly col: number;
}

/**
 * Serializable level definition (the shape of a level JSON file).
 *
 * `cells` is sparse: any board position not listed defaults to an empty cell,
 * so authoring a level only requires placing arrows, walls and exits.
 */
export interface LevelData {
  readonly id: number;
  readonly name: string;
  readonly difficulty: Difficulty;
  readonly rows: number;
  readonly cols: number;
  readonly cells: ReadonlyArray<CellData>;
  /** Seconds allowed to clear the board; omitted = untimed. */
  readonly timeLimitSeconds?: number;
}

/**
 * Port for turning a {@link LevelData} definition into a domain {@link Level}.
 * Use cases / repositories depend on this abstraction, not on a concrete builder.
 */
export interface ILevelBuilder {
  build(data: LevelData): Level;
}
