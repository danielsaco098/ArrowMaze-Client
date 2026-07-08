import type { CellData, LevelData } from '../../application/ports/ILevelBuilder';
import type { Difficulty } from '../../domain/entities/Level';
import type { DirectionName } from '../../domain/value-objects/Direction';

interface Dir {
  name: DirectionName;
  dr: number;
  dc: number;
}

const DIRS: Dir[] = [
  { name: 'UP', dr: -1, dc: 0 },
  { name: 'DOWN', dr: 1, dc: 0 },
  { name: 'LEFT', dr: 0, dc: -1 },
  { name: 'RIGHT', dr: 0, dc: 1 },
];

/** Deterministic PRNG (mulberry32) so a seed always yields the same level. */
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface LevelConfig {
  id: number;
  name: string;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  seed: number;
  maxLength: number;
  /** Impassable wall cells scattered before the arrows are placed (default 0). */
  walls?: number;
  /** Countdown for advanced levels; omitted = untimed. */
  timeLimitSeconds?: number;
}

/** Marks a wall in the working grid (arrows use positive ids). */
const WALL = -1;

/**
 * Constructive level generator. It fills the board with arrows of varying
 * lengths such that the result is **always solvable**:
 *
 * Each arrow is placed only if the lane from its head to the board edge is
 * currently empty. Placing arrows this way means the reverse order is a valid
 * solve (each arrow's lane is clear of the arrows that outlive it), so the board
 * can always be cleared. Walls are scattered FIRST and never move, so a lane
 * that was wall-free at placement stays wall-free — solvability is preserved.
 * A seeded PRNG makes every level deterministic.
 */
export function generateLevel(config: LevelConfig): LevelData {
  const { rows, cols, seed, maxLength } = config;
  const rand = createRng(seed);
  const grid: (number | null)[][] = Array.from({ length: rows }, () => Array<number | null>(cols).fill(null));
  const cells: CellData[] = [];
  let nextId = 1;

  const inBounds = (r: number, c: number): boolean => r >= 0 && r < rows && c >= 0 && c < cols;
  const isEmpty = (r: number, c: number): boolean => inBounds(r, c) && grid[r][c] === null;

  // Walls go in before any arrow. Interior positions only: a wall on the border
  // tends to strand whole lanes, while interior walls create the interesting
  // detours the original game has.
  const interior: Array<[number, number]> = [];
  for (let r = 1; r < rows - 1; r += 1) {
    for (let c = 1; c < cols - 1; c += 1) {
      interior.push([r, c]);
    }
  }
  for (const [r, c] of shuffle(interior, rand).slice(0, Math.max(0, config.walls ?? 0))) {
    grid[r][c] = WALL;
    cells.push({ row: r, col: c, kind: 'WALL' });
  }

  const laneClear = (hr: number, hc: number, dir: Dir): boolean => {
    let r = hr + dir.dr;
    let c = hc + dir.dc;
    while (inBounds(r, c)) {
      if (grid[r][c] !== null) return false;
      r += dir.dr;
      c += dir.dc;
    }
    return true;
  };

  /** Distance from (hr, hc) to the board edge along a direction. */
  const laneLength = (hr: number, hc: number, dir: Dir): number => {
    let n = 0;
    let r = hr + dir.dr;
    let c = hc + dir.dc;
    while (inBounds(r, c)) {
      n += 1;
      r += dir.dr;
      c += dir.dc;
    }
    return n;
  };

  // Place an arrow with its head at (hr, hc), body extending backwards (opposite
  // the pointing direction) over empty cells, up to a random length.
  const place = (hr: number, hc: number, dir: Dir): void => {
    const body: Array<[number, number]> = [[hr, hc]];
    let r = hr - dir.dr;
    let c = hc - dir.dc;
    while (body.length < maxLength && isEmpty(r, c)) {
      body.push([r, c]);
      r -= dir.dr;
      c -= dir.dc;
    }
    const length = 1 + Math.floor(rand() * body.length);
    const id = nextId;
    nextId += 1;
    for (const [br, bc] of body.slice(0, length)) {
      grid[br][bc] = id;
      cells.push({ row: br, col: bc, kind: 'ARROW', direction: dir.name, arrowId: id });
    }
  };

  let progressed = true;
  while (progressed) {
    progressed = false;
    const empties: Array<[number, number]> = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (grid[r][c] === null) empties.push([r, c]);
      }
    }
    for (const [r, c] of shuffle(empties, rand)) {
      if (grid[r][c] !== null) continue;
      // (r, c) becomes the arrow's head. Among directions with a clear lane,
      // prefer the shortest lane (nearest edge): arrows hug the edges, which
      // leaves fewer stranded interior cells and fills the board more densely.
      const candidates = shuffle(DIRS, rand)
        .filter((dir) => laneClear(r, c, dir))
        .sort((a, b) => laneLength(r, c, a) - laneLength(r, c, b));
      if (candidates.length > 0) {
        place(r, c, candidates[0]);
        progressed = true;
      }
    }
  }

  return {
    id: config.id,
    name: config.name,
    difficulty: config.difficulty,
    rows,
    cols,
    cells,
    timeLimitSeconds: config.timeLimitSeconds,
  };
}
