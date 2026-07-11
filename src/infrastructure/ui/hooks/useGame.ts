import { useCallback, useEffect, useRef, useState } from 'react';
import { useContainer } from '../AppContainerContext';
import type { Board } from '../../../domain/entities/Board';
import type { GameSession } from '../../../domain/entities/GameSession';
import type { Level } from '../../../domain/entities/Level';
import type { Position } from '../../../domain/value-objects/Position';
import type { DirectionName } from '../../../domain/value-objects/Direction';
import { ArrowCell } from '../../../domain/entities/ArrowCell';
import { GameStatus, TapOutcome } from '../../../domain/entities/GameStatus';

export type GameViewStatus = 'LOADING' | GameStatus;

export interface GameOutcome {
  score?: number;
  isNewBest?: boolean;
  /** True when this victory completed the LAST remaining level of the game. */
  allCompleted?: boolean;
}

/** Snapshot of an arrow taken right before it escaped, for the slide-out animation. */
export interface EscapingArrow {
  readonly arrowId: number;
  readonly color: string;
  /** The head's exit direction — the way the whole arrow slides off. */
  readonly direction: DirectionName;
  /** The arrow's path, tail first, with each segment's own direction. */
  readonly cells: ReadonlyArray<{ row: number; col: number; direction: DirectionName }>;
  /** Stars sitting on the exit lane (in lane order): ghosts until the flight passes them. */
  readonly stars: ReadonlyArray<{ row: number; col: number }>;
  /** First permanent hole on the exit lane, if any: the arrow is swallowed there. */
  readonly hole: { row: number; col: number } | null;
}

// The rail glide runs at constant speed until the arrow crosses the SCREEN
// edge (capped at ~2s): keep the overlay alive for the worst case — once the
// flight ends the overlay draws nothing, so a lingering state is invisible.
const ESCAPE_ANIMATION_MS = 2400;
const SHAKE_ANIMATION_MS = 200;

/**
 * View-model hook for a level play. Bridges the React UI to the use cases:
 * loads the level, applies taps (slide-out or lose a life), tracks moves/time,
 * and records the result on victory. Keeps the mutable {@link GameSession} in a
 * ref and bumps a render token so the board re-renders after each tap.
 */
export function useGame(levelId: number) {
  const container = useContainer();
  const sessionRef = useRef<GameSession | null>(null);
  const boardRef = useRef<Board | null>(null);
  const levelRef = useRef<Level | null>(null);
  const holesRef = useRef<ReadonlySet<string>>(new Set());
  const startedAtRef = useRef<number>(0);

  const [status, setStatus] = useState<GameViewStatus>('LOADING');
  const [lives, setLives] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [outcome, setOutcome] = useState<GameOutcome>({});
  /** Countdown for timed levels; null when the level has no limit. */
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  /** Stars collected so far / total stars the level started with. */
  const [collected, setCollected] = useState<number>(0);
  const [totalCollectibles, setTotalCollectibles] = useState<number>(0);
  /** Transient animation events consumed by the board. Escapes queue up so
   * every tapped arrow finishes its own flight, even when taps overlap. */
  const [escaping, setEscaping] = useState<ReadonlyArray<EscapingArrow>>([]);
  const [shakingArrowId, setShakingArrowId] = useState<number | null>(null);
  const animationTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [, bumpRenderToken] = useState<number>(0);

  useEffect(
    () => () => {
      animationTimers.current.forEach(clearTimeout);
    },
    [],
  );

  const load = useCallback(async () => {
    setStatus('LOADING');
    setOutcome({});
    const { level, session } = await container.loadLevel.execute({ levelId });
    levelRef.current = level;
    sessionRef.current = session;
    boardRef.current = level.board;
    // Snapshot which cells start EMPTY: those are permanent holes (they can
    // swallow escaping arrows), while a cell an arrow or a star later vacates
    // must NOT become one — it was occupied when the level began.
    const holes = new Set<string>();
    for (const cell of level.board.cells()) {
      if (cell.kind === 'EMPTY') {
        holes.add(`${cell.position.row},${cell.position.col}`);
      }
    }
    holesRef.current = holes;
    startedAtRef.current = Date.now();
    setLives(session.lives.count);
    setMoves(0);
    setRemainingSeconds(level.timeLimitSeconds ?? null);
    setCollected(0);
    setTotalCollectibles(level.board.cells().filter((c) => c.kind === 'COLLECTIBLE').length);
    setStatus(session.status);
    bumpRenderToken((n) => n + 1);
  }, [container, levelId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Countdown for timed levels: ticks once per second while playing and ends
  // the session in defeat when it reaches zero.
  useEffect(() => {
    const limit = levelRef.current?.timeLimitSeconds;
    if (status !== GameStatus.Playing || !limit) {
      return undefined;
    }
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const remaining = Math.max(0, limit - elapsed);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        sessionRef.current?.timeUp();
        setStatus(GameStatus.Defeat);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const onTapCell = useCallback(
    async (position: Position) => {
      const session = sessionRef.current;
      if (!session || session.status !== GameStatus.Playing) {
        return;
      }
      try {
        // Snapshot the tapped arrow BEFORE the move: if it escapes, the board
        // loses it instantly and the slide-out animation needs its shape.
        const board = boardRef.current;
        const tappedCell = board?.cellAt(position);
        let snapshot: EscapingArrow | null = null;
        if (board && tappedCell instanceof ArrowCell) {
          const path = board.pathOfArrow(tappedCell.arrowId);
          const head = path[path.length - 1];
          // Walk the exit lane: stars there become ghosts the flight sweeps,
          // and the first permanent hole swallows the arrow.
          const stars: Array<{ row: number; col: number }> = [];
          let hole: { row: number; col: number } | null = null;
          let lane = head.position.translate(head.direction);
          while (board.isWithinBounds(lane)) {
            const onLane = board.cellAt(lane);
            if (onLane.kind === 'COLLECTIBLE') {
              stars.push({ row: lane.row, col: lane.col });
            } else if (
              hole === null &&
              onLane.kind === 'EMPTY' &&
              holesRef.current.has(`${lane.row},${lane.col}`)
            ) {
              hole = { row: lane.row, col: lane.col };
            }
            lane = lane.translate(head.direction);
          }
          snapshot = {
            arrowId: tappedCell.arrowId,
            color: tappedCell.color,
            direction: head.direction.name,
            cells: path.map((c) => ({
              row: c.position.row,
              col: c.position.col,
              direction: c.direction.name,
            })),
            stars,
            hole,
          };
        }

        const result = await container.tapCell.execute({ session, position });
        setLives(result.livesRemaining);
        setMoves(session.moves);
        setCollected(session.collectiblesCollected);
        setStatus(result.status);
        bumpRenderToken((n) => n + 1);

        if (snapshot) {
          if (result.outcome === TapOutcome.Escaped) {
            const flight = snapshot;
            setEscaping((prev) => [...prev, flight]);
            animationTimers.current.push(
              setTimeout(
                () => setEscaping((prev) => prev.filter((e) => e !== flight)),
                ESCAPE_ANIMATION_MS + 100,
              ),
            );
          } else {
            setShakingArrowId(snapshot.arrowId);
            animationTimers.current.push(
              setTimeout(() => setShakingArrowId(null), SHAKE_ANIMATION_MS + 50),
            );
          }
        }

        if (result.status === GameStatus.Victory) {
          const elapsedMs = Date.now() - startedAtRef.current;
          const recorded = await container.recordResult.execute({
            levelId,
            moves: session.moves,
            elapsedMs,
            difficulty: levelRef.current!.difficulty,
            collectibles: session.collectiblesCollected,
          });
          const allLevels = await container.levels.getAll();
          setOutcome({
            score: recorded.score.points,
            isNewBest: recorded.isNewBest,
            allCompleted: recorded.progress.completedCount() >= allLevels.length,
          });
        }
      } catch {
        // Tapping a non-arrow cell (empty/wall/exit) is a no-op, not a penalty.
      }
    },
    [container, levelId],
  );

  return {
    status,
    lives,
    moves,
    outcome,
    remainingSeconds,
    collected,
    totalCollectibles,
    escaping,
    shakingArrowId,
    board: boardRef.current,
    holes: holesRef.current,
    level: levelRef.current,
    onTapCell,
    retry: load,
  };
}
