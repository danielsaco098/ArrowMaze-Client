import type { Board } from './Board';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

/**
 * A level definition: metadata plus the initial board layout.
 * Pure data holder; a `GameSession` is created from a level's board to play it.
 */
export class Level {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly difficulty: Difficulty,
    public readonly board: Board,
  ) {}
}
