import type { CellData, LevelData } from '../../application/ports/ILevelBuilder';
import type { Difficulty } from '../../domain/entities/Level';
import type { DirectionName } from '../../domain/value-objects/Direction';
import { ARROW_PALETTE } from '../../adapters/factories/JsonCellFactory';

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
  /** Collectible stars to place on cells swept by escaping arrows (default 0). */
  collectibles?: number;
}

/** Marks a wall in the working grid (arrows use positive ids). */
const WALL = -1;
/** Marks a cell reserved for a collectible star: arrows may slide OVER it but
 * never occupy it, so it stays free for the star. */
const RESERVED = -2;

/**
 * Constructive level generator. It fills the board with winding, snake-like
 * arrows such that the result is **always solvable**:
 *
 * Each arrow is placed only if the lane from its head to the board edge is
 * currently empty. Placing arrows this way means the reverse order is a valid
 * solve (each arrow's lane is clear of the arrows that outlive it — and an
 * arrow's own body never blocks it, because the body vacates cell by cell as
 * the arrow slides out). Walls are scattered FIRST and never move, so a lane
 * that was wall-free at placement stays wall-free — solvability is preserved.
 * A seeded PRNG makes every level deterministic.
 *
 * Bodies grow BACKWARDS from the head as a self-avoiding random walk with a
 * bias toward turning, which produces the long curved arrows of the original
 * game. Each emitted cell carries its own direction (pointing to the next
 * segment) and a `segmentIndex` (0 = tail) so the path order is explicit.
 */
export function generateLevel(config: LevelConfig): LevelData {
  // Winding fills vary: a given seed may leave no free cell on any exit lane
  // for the requested stars, or fill the board too loosely. Deterministically
  // retry with derived seeds until the level meets its own config; every
  // attempt is solvable by construction, so this only tunes stars/density.
  const wanted = Math.max(0, config.collectibles ?? 0);
  let best: LevelData | null = null;
  for (let attempt = 0; attempt < 250; attempt += 1) {
    const candidate = generateOnce(config, config.seed + attempt * 7919);
    const stars = candidate.cells.filter((c) => c.kind === 'COLLECTIBLE').length;
    const fill =
      candidate.cells.filter((c) => c.kind !== 'EMPTY').length / (config.rows * config.cols);
    if (
      stars >= wanted &&
      fill >= 0.8 &&
      deadHoles(candidate) === 0 &&
      unsweepableStars(candidate) === 0
    ) {
      return candidate;
    }
    best = best ?? candidate;
  }
  return best!;
}

/**
 * A star must be reachable BEFORE the first hole on at least one exit lane:
 * an arrow falls into the hole, so anything beyond it can never be swept.
 */
function unsweepableStars(data: LevelData): number {
  const occupied = new Map<string, CellData>();
  const headOf = new Map<number, CellData>();
  for (const cell of data.cells) {
    occupied.set(`${cell.row},${cell.col}`, cell);
    if (cell.kind === 'ARROW' && cell.arrowId !== undefined) {
      const current = headOf.get(cell.arrowId);
      if (!current || (cell.segmentIndex ?? 0) > (current.segmentIndex ?? 0)) {
        headOf.set(cell.arrowId, cell);
      }
    }
  }
  const sweepable = new Set<string>();
  for (const head of headOf.values()) {
    const dir = DIRS.find((d) => d.name === head.direction)!;
    let r = head.row + dir.dr;
    let c = head.col + dir.dc;
    while (r >= 0 && r < data.rows && c >= 0 && c < data.cols) {
      const cell = occupied.get(`${r},${c}`);
      if (!cell) break; // a hole: the arrow falls in, the lane ends here
      if (cell.kind === 'COLLECTIBLE') sweepable.add(`${r},${c}`);
      r += dir.dr;
      c += dir.dc;
    }
  }
  return data.cells.filter(
    (cell) => cell.kind === 'COLLECTIBLE' && !sweepable.has(`${cell.row},${cell.col}`),
  ).length;
}

/**
 * Gaps no exit lane crosses: they can never swallow an arrow, so they are
 * dead space. The generator fills them by growing tails; any level that
 * still has one is rejected and retried with a derived seed.
 */
function deadHoles(data: LevelData): number {
  const occupied = new Set<string>();
  const headOf = new Map<number, CellData>();
  for (const cell of data.cells) {
    occupied.add(`${cell.row},${cell.col}`);
    if (cell.kind === 'ARROW' && cell.arrowId !== undefined) {
      const current = headOf.get(cell.arrowId);
      if (!current || (cell.segmentIndex ?? 0) > (current.segmentIndex ?? 0)) {
        headOf.set(cell.arrowId, cell);
      }
    }
  }
  const onLane = new Set<string>();
  for (const head of headOf.values()) {
    const dir = DIRS.find((d) => d.name === head.direction)!;
    let r = head.row + dir.dr;
    let c = head.col + dir.dc;
    while (r >= 0 && r < data.rows && c >= 0 && c < data.cols) {
      onLane.add(`${r},${c}`);
      // The lane effectively ENDS at the first hole: the arrow falls in, so
      // cells beyond it are never traversed.
      if (!occupied.has(`${r},${c}`)) break;
      r += dir.dr;
      c += dir.dc;
    }
  }
  let dead = 0;
  for (let r = 0; r < data.rows; r += 1) {
    for (let c = 0; c < data.cols; c += 1) {
      if (!occupied.has(`${r},${c}`) && !onLane.has(`${r},${c}`)) dead += 1;
    }
  }
  return dead;
}

/** CellData while under construction (colour is assigned after placement). */
type MutableCellData = { -readonly [K in keyof CellData]: CellData[K] };

function generateOnce(config: LevelConfig, seed: number): LevelData {
  const { rows, cols, maxLength } = config;
  const rand = createRng(seed);
  const grid: (number | null)[][] = Array.from({ length: rows }, () => Array<number | null>(cols).fill(null));
  const cells: MutableCellData[] = [];
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

  // Reserve spots for collectible stars (also before the arrows). A reserved
  // cell behaves like a gap arrows slide OVER (lanes stay clear) but can never
  // be occupied by an arrow body, so the star has somewhere to sit. Reserve a
  // couple of extras: only those that end up on an actual exit lane are kept.
  const requestedStars = Math.max(0, config.collectibles ?? 0);
  const reserved: Array<[number, number]> = [];
  if (requestedStars > 0) {
    const free = interior.filter(([r, c]) => grid[r][c] === null);
    for (const [r, c] of shuffle(free, rand).slice(0, requestedStars * 2)) {
      grid[r][c] = RESERVED;
      reserved.push([r, c]);
    }
  }

  const laneClear = (hr: number, hc: number, dir: Dir): boolean => {
    let r = hr + dir.dr;
    let c = hc + dir.dc;
    while (inBounds(r, c)) {
      // A reserved (star) cell is passable, so it does not block a lane.
      if (grid[r][c] !== null && grid[r][c] !== RESERVED) return false;
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

  // Heads are recorded as arrows are placed (used to pick sweepable star spots)
  // and tails too (dead gaps are later filled by growing a neighbouring tail).
  const heads: Array<{ r: number; c: number; dir: Dir }> = [];
  const tailAt = new Map<string, number>();
  const minSegOf = new Map<number, number>();

  // Place an arrow with its head at (hr, hc) exiting toward `dir`. The body
  // grows BACKWARDS from the head as a self-avoiding walk over empty cells,
  // preferring to turn, so arrows wind across the board instead of lying in
  // straight bars. Each segment's direction points to the next segment.
  const place = (hr: number, hc: number, dir: Dir): void => {
    // path is head-first while growing; segment i's direction points to i-1.
    const path: Array<{ r: number; c: number; dir: Dir }> = [{ r: hr, c: hc, dir }];
    grid[hr][hc] = 0; // temporarily claim cells so the walk is self-avoiding
    // Favour long arrows: best of two rolls, at least 1.
    const target = Math.max(
      1 + Math.floor(rand() * maxLength),
      1 + Math.floor(rand() * maxLength),
    );
    // The body must never occupy ANY cell of the head's exit lane: a winding
    // body crossing its own lane reads as the arrow pointing at itself.
    const ownLane = new Set<string>();
    {
      let r = hr + dir.dr;
      let c = hc + dir.dc;
      while (inBounds(r, c)) {
        ownLane.add(`${r},${c}`);
        r += dir.dr;
        c += dir.dc;
      }
    }
    while (path.length < target) {
      const tail = path[path.length - 1];
      // The previous segment sits on a free neighbour and points INTO the tail.
      const options = DIRS.map((d) => ({
        r: tail.r - d.dr,
        c: tail.c - d.dc,
        dir: d,
      })).filter((o) => isEmpty(o.r, o.c) && !ownLane.has(`${o.r},${o.c}`));
      if (options.length === 0) {
        break;
      }
      const turning = options.filter((o) => o.dir.name !== tail.dir.name);
      const pool = turning.length > 0 && rand() < 0.7 ? turning : options;
      const next = pool[Math.floor(rand() * pool.length)];
      grid[next.r][next.c] = 0;
      path.push(next);
    }

    const id = nextId;
    nextId += 1;
    // path[0] is the head: highest segmentIndex; the last grown cell is the tail.
    for (let i = 0; i < path.length; i += 1) {
      const { r, c, dir: d } = path[i];
      grid[r][c] = id;
      cells.push({
        row: r,
        col: c,
        kind: 'ARROW',
        direction: d.name,
        arrowId: id,
        segmentIndex: path.length - 1 - i,
      });
    }
    heads.push({ r: hr, c: hc, dir });
    const tail = path[path.length - 1];
    tailAt.set(`${tail.r},${tail.c}`, id);
    minSegOf.set(id, 0);
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

  // Dead gaps — cells no exit lane crosses — can never swallow an arrow, so
  // they are pure noise. Grow a neighbouring arrow's TAIL into each one
  // (occupying a non-lane cell can never block an escape, and it can never
  // sit straight in front of a head, because that cell IS a lane cell), and
  // iterate so chains of gaps fill one after another.
  const onLane = new Set<string>();
  for (const { r: hr, c: hc, dir } of heads) {
    let r = hr + dir.dr;
    let c = hc + dir.dc;
    while (inBounds(r, c)) {
      onLane.add(`${r},${c}`);
      r += dir.dr;
      c += dir.dc;
    }
  }
  let extended = true;
  while (extended) {
    extended = false;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const free = grid[r][c] === null || grid[r][c] === RESERVED;
        if (!free || onLane.has(`${r},${c}`)) continue;
        // The new tail must point INTO the arrow's current tail.
        const d = DIRS.find((dd) => tailAt.has(`${r + dd.dr},${c + dd.dc}`));
        if (!d) continue;
        const id = tailAt.get(`${r + d.dr},${c + d.dc}`)!;
        const seg = (minSegOf.get(id) ?? 0) - 1;
        grid[r][c] = id;
        cells.push({ row: r, col: c, kind: 'ARROW', direction: d.name, arrowId: id, segmentIndex: seg });
        tailAt.delete(`${r + d.dr},${c + d.dc}`);
        tailAt.set(`${r},${c}`, id);
        minSegOf.set(id, seg);
        extended = true;
      }
    }
  }
  // Extensions grew tails below segment 0: shift every arrow's indices so
  // its tail is 0 again (consumers rely on 0 = tail, highest = head).
  for (const cell of cells) {
    if (cell.kind === 'ARROW' && cell.arrowId !== undefined) {
      cell.segmentIndex = (cell.segmentIndex ?? 0) - (minSegOf.get(cell.arrowId) ?? 0);
    }
  }

  // Colour the arrows so no two TOUCHING arrows share a colour — winding
  // same-coloured neighbours would read as one incomprehensible shape. Greedy
  // graph colouring over the arrow adjacency (8 palette colours is plenty);
  // each arrow starts scanning at its own palette slot to keep variety.
  const neighbours = new Map<number, Set<number>>();
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const id = grid[r][c];
      if (typeof id !== 'number' || id <= 0) continue;
      for (const d of DIRS) {
        const other = inBounds(r + d.dr, c + d.dc) ? grid[r + d.dr][c + d.dc] : null;
        if (typeof other === 'number' && other > 0 && other !== id) {
          if (!neighbours.has(id)) neighbours.set(id, new Set());
          neighbours.get(id)!.add(other);
        }
      }
    }
  }
  const colorOf = new Map<number, string>();
  for (let id = 1; id < nextId; id += 1) {
    const taken = new Set(
      [...(neighbours.get(id) ?? [])]
        .map((n) => colorOf.get(n))
        .filter((c): c is string => c !== undefined),
    );
    const start = (id - 1) % ARROW_PALETTE.length;
    let picked = ARROW_PALETTE[start];
    for (let k = 0; k < ARROW_PALETTE.length; k += 1) {
      const candidate = ARROW_PALETTE[(start + k) % ARROW_PALETTE.length];
      if (!taken.has(candidate)) {
        picked = candidate;
        break;
      }
    }
    colorOf.set(id, picked);
  }
  for (const cell of cells) {
    if (cell.kind === 'ARROW' && cell.arrowId !== undefined) {
      cell.color = colorOf.get(cell.arrowId);
    }
  }

  // Keep only the reserved star spots that ended up on some arrow's exit lane
  // (head → edge): every arrow eventually escapes along its lane, so those
  // stars are guaranteed to be sweepable during a full solve. Unused spots
  // simply stay empty.
  if (requestedStars > 0) {
    const onLane = new Set<string>();
    for (const { r: hr, c: hc, dir } of heads) {
      let r = hr + dir.dr;
      let c = hc + dir.dc;
      while (inBounds(r, c)) {
        onLane.add(`${r},${c}`);
        r += dir.dr;
        c += dir.dc;
      }
    }
    // Candidates: reserved spots first, then any other cell left empty — as
    // long as they sit on an exit lane, an escaping arrow will sweep them.
    const emptiesOnLane: Array<[number, number]> = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (grid[r][c] === null && onLane.has(`${r},${c}`)) emptiesOnLane.push([r, c]);
      }
    }
    const sweepable = [
      ...reserved.filter(([r, c]) => onLane.has(`${r},${c}`)),
      ...shuffle(emptiesOnLane, rand),
    ];
    for (const [r, c] of sweepable.slice(0, requestedStars)) {
      cells.push({ row: r, col: c, kind: 'COLLECTIBLE' });
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
