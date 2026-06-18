import type { Cell } from '../../domain/entities/Cell';
import type { Position } from '../../domain/value-objects/Position';
import type { DirectionName } from '../../domain/value-objects/Direction';
import type { CellKind } from '../../domain/entities/Cell';

/** Serialized description of a single cell, as it comes from level data (JSON). */
export interface CellSpec {
  readonly kind: CellKind;
  /** Required only when `kind` is `'ARROW'`. */
  readonly direction?: DirectionName;
}

/**
 * Port (Dependency Inversion): the application/level loading code depends on this
 * abstraction to turn raw cell data into domain `Cell`s, never on a concrete factory.
 */
export interface ICellFactory {
  create(spec: CellSpec, position: Position): Cell;
}
