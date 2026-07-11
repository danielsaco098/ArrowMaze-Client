import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, View, StyleSheet } from 'react-native';
import type { Board } from '../../../domain/entities/Board';
import type { Cell } from '../../../domain/entities/Cell';
import { ArrowCell } from '../../../domain/entities/ArrowCell';
import type { Position } from '../../../domain/value-objects/Position';
import type { DirectionName } from '../../../domain/value-objects/Direction';
import type { EscapingArrow } from '../hooks/useGame';
import { CellView } from './CellView';
import { RailEscape } from './RailEscape';

const MAX_BOARD_WIDTH = 480;
const SCREEN_MARGIN = 24;

/** Per-cell path info: how the line enters the cell and whether it ends there. */
interface SegmentInfo {
  incoming: DirectionName | null;
  isHead: boolean;
  isTail: boolean;
}

interface Props {
  board: Board;
  /** Positions that started the level empty/blocked (rendered as black holes). */
  holes: ReadonlySet<string>;
  /** Arrows in flight: each escape queues an overlay that finishes on its own. */
  escaping?: ReadonlyArray<EscapingArrow>;
  /** Arrow that was just blocked: its cells shake in place. */
  shakingArrowId?: number | null;
  onTapCell: (position: Position) => void;
}

/** Renders the full board grid plus the tap-feedback animations. */
export function BoardView({
  board,
  holes,
  escaping = [],
  shakingArrowId = null,
  onTapCell,
}: Props): React.JSX.Element {
  // Cells sit flush (no margin) so each arrow reads as one continuous line.
  // The board takes as much of the screen as it can (arrow strokes are capped,
  // so bigger cells mean more breathing room BETWEEN arrows, not fatter lines).
  const boardWidth = Math.min(Dimensions.get('window').width - SCREEN_MARGIN, MAX_BOARD_WIDTH);
  const size = Math.floor(boardWidth / board.cols);
  const cells = board.cells();
  const rows: Cell[][] = [];
  for (let r = 0; r < board.rows; r += 1) {
    rows.push(cells.slice(r * board.cols, r * board.cols + board.cols));
  }

  // Walk every arrow's path once so each cell knows its role in the line:
  // where the line comes in (for elbows) and whether it is the head or tail.
  const segments = new Map<string, SegmentInfo>();
  for (const arrowId of board.arrowIds()) {
    const path = board.pathOfArrow(arrowId);
    path.forEach((cell, i) => {
      segments.set(`${cell.position.row},${cell.position.col}`, {
        incoming: i === 0 ? null : path[i - 1].direction.name,
        isHead: i === path.length - 1,
        isTail: i === 0,
      });
    });
  }

  // Blocked feedback: a directional recoil — the whole arrow nudges toward
  // its exit and springs back (it TRIED to move and hit something). One
  // shared value keeps every cell of the arrow in sync.
  const recoil = useRef(new Animated.Value(0)).current;
  const recoilDir = useRef<DirectionName>('RIGHT');
  if (shakingArrowId !== null) {
    try {
      recoilDir.current = board.pathOfArrow(shakingArrowId).slice(-1)[0].direction.name;
    } catch {
      // The arrow may already be gone from the board; keep the last direction.
    }
  }
  useEffect(() => {
    if (shakingArrowId === null) {
      return;
    }
    recoil.setValue(0);
    Animated.sequence(
      [
        { toValue: 7, duration: 60 },
        { toValue: -3, duration: 50 },
        { toValue: 0, duration: 50 },
      ].map((step) => Animated.timing(recoil, { ...step, useNativeDriver: true })),
    ).start();
  }, [shakingArrowId, recoil]);
  const axis = recoilDir.current === 'LEFT' || recoilDir.current === 'RIGHT' ? 'x' : 'y';
  const sign = recoilDir.current === 'LEFT' || recoilDir.current === 'UP' ? -1 : 1;
  const recoilTransform =
    axis === 'x'
      ? { translateX: Animated.multiply(recoil, sign) }
      : { translateY: Animated.multiply(recoil, sign) };

  return (
    <View testID="board" style={styles.board}>
      {rows.map((row, r) => (
        <View key={`row-${r}`} style={styles.row}>
          {row.map((cell) => {
            const key = `${cell.position.row},${cell.position.col}`;
            const info = segments.get(key);
            const isShaking =
              shakingArrowId !== null &&
              cell instanceof ArrowCell &&
              cell.arrowId === shakingArrowId;
            const view = (
              <CellView
                key={key}
                cell={cell}
                size={size}
                isHead={info?.isHead ?? false}
                isTail={info?.isTail ?? false}
                incoming={info?.incoming ?? null}
                isHole={holes.has(key)}
                onPress={onTapCell}
              />
            );
            return isShaking ? (
              <Animated.View key={key} style={{ transform: [recoilTransform] }}>
                {view}
              </Animated.View>
            ) : (
              view
            );
          })}
        </View>
      ))}
      {escaping.map((flight) => (
        <RailEscape
          key={`flight-${flight.arrowId}`}
          escaping={flight}
          size={size}
          rows={board.rows}
          cols={board.cols}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
