import type { Position } from './value-objects/Position';

/**
 * Base class for all domain rule violations. Keeping a single root lets the
 * application layer catch domain errors distinctly from infrastructure errors.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidDirectionError extends DomainError {
  constructor(name: string) {
    super(`Invalid direction: "${name}".`);
  }
}

export class InvalidLivesError extends DomainError {
  constructor(count: number) {
    super(`Lives must be a non-negative integer, received: ${count}.`);
  }
}

export class NoLivesRemainingError extends DomainError {
  constructor() {
    super('Cannot decrement lives below zero.');
  }
}

export class InvalidScoreError extends DomainError {
  constructor(points: number) {
    super(`Score points must be a non-negative number, received: ${points}.`);
  }
}

export class EmptyBoardError extends DomainError {
  constructor() {
    super('A board must have at least one row and one column.');
  }
}

export class NonRectangularBoardError extends DomainError {
  constructor() {
    super('All board rows must have the same number of columns.');
  }
}

export class MisplacedCellError extends DomainError {
  constructor(expectedRow: number, expectedCol: number) {
    super(`Cell position does not match its grid coordinates (${expectedRow}, ${expectedCol}).`);
  }
}

export class OutOfBoundsError extends DomainError {
  constructor(position: Position) {
    super(`Position ${position.toString()} is outside the board.`);
  }
}

export class NotAnArrowError extends DomainError {
  constructor(position: Position) {
    super(`The cell at ${position.toString()} is not a tappable arrow.`);
  }
}

export class UnknownArrowError extends DomainError {
  constructor(arrowId: number) {
    super(`No arrow with id ${arrowId} exists on the board.`);
  }
}

export class GameAlreadyOverError extends DomainError {
  constructor() {
    super('The game session is already finished; no further moves are allowed.');
  }
}
