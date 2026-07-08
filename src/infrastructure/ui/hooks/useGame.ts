import { useCallback, useEffect, useRef, useState } from 'react';
import { useContainer } from '../AppContainerContext';
import type { Board } from '../../../domain/entities/Board';
import type { GameSession } from '../../../domain/entities/GameSession';
import type { Level } from '../../../domain/entities/Level';
import type { Position } from '../../../domain/value-objects/Position';
import { GameStatus } from '../../../domain/entities/GameStatus';

export type GameViewStatus = 'LOADING' | GameStatus;

export interface GameOutcome {
  score?: number;
  isNewBest?: boolean;
}

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
  const [, bumpRenderToken] = useState<number>(0);

  const load = useCallback(async () => {
    setStatus('LOADING');
    setOutcome({});
    const { level, session } = await container.loadLevel.execute({ levelId });
    levelRef.current = level;
    sessionRef.current = session;
    boardRef.current = level.board;
    // Snapshot which cells start empty/blocked: those stay black holes, while a
    // cell an arrow later slides out of must NOT turn black (it had an arrow now).
    const holes = new Set<string>();
    for (const cell of level.board.cells()) {
      if (cell.kind !== 'ARROW') {
        holes.add(`${cell.position.row},${cell.position.col}`);
      }
    }
    holesRef.current = holes;
    startedAtRef.current = Date.now();
    setLives(session.lives.count);
    setMoves(0);
    setRemainingSeconds(level.timeLimitSeconds ?? null);
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
        const result = await container.tapCell.execute({ session, position });
        setLives(result.livesRemaining);
        setMoves(session.moves);
        setStatus(result.status);
        bumpRenderToken((n) => n + 1);

        if (result.status === GameStatus.Victory) {
          const elapsedMs = Date.now() - startedAtRef.current;
          const recorded = await container.recordResult.execute({
            levelId,
            moves: session.moves,
            elapsedMs,
            difficulty: levelRef.current!.difficulty,
          });
          setOutcome({ score: recorded.score.points, isNewBest: recorded.isNewBest });
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
    board: boardRef.current,
    holes: holesRef.current,
    level: levelRef.current,
    onTapCell,
    retry: load,
  };
}
