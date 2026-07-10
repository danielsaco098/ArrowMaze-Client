import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, View, StyleSheet } from 'react-native';
import type { Board } from '../../../domain/entities/Board';
import type { Cell } from '../../../domain/entities/Cell';
import { ArrowCell } from '../../../domain/entities/ArrowCell';
import type { Position } from '../../../domain/value-objects/Position';
import type { DirectionName } from '../../../domain/value-objects/Direction';
import type { EscapingArrow } from '../hooks/useGame';
import { CellView } from './CellView';
import { ArrowPiece } from './ArrowPiece';

const MAX_BOARD_WIDTH = 320;

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
  /** Arrow that just escaped: an overlay copy slides off the screen. */
  escaping?: EscapingArrow | null;
  /** Arrow that was just blocked: its cells shake in place. */
  shakingArrowId?: number | null;
  onTapCell: (position: Position) => void;
}

/** Renders the full board grid plus the tap-feedback animations. */
export function BoardView({
  board,
  holes,
  escaping = null,
  shakingArrowId = null,
  onTapCell,
}: Props): React.JSX.Element {
  // Cells sit flush (no margin) so each arrow reads as one continuous line.
  const size = Math.floor(MAX_BOARD_WIDTH / board.cols);
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

  // Blocked feedback: one shared value keeps every cell of the arrow in sync.
  const shakeX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (shakingArrowId === null) {
      return;
    }
    shakeX.setValue(0);
    Animated.sequence(
      [8, -8, 6, -6, 3, 0].map((toValue) =>
        Animated.timing(shakeX, { toValue, duration: 55, useNativeDriver: true }),
      ),
    ).start();
  }, [shakingArrowId, shakeX]);

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
              <Animated.View key={key} style={{ transform: [{ translateX: shakeX }] }}>
                {view}
              </Animated.View>
            ) : (
              view
            );
          })}
        </View>
      ))}
      {escaping && <EscapingArrowOverlay escaping={escaping} size={size} />}
    </View>
  );
}

/**
 * Overlay copy of an arrow that just escaped. Instead of sliding the whole
 * shape rigidly, every segment travels along the snake's own path and then
 * straight out through the head's exit lane (train-style): segment i follows
 * the same waypoints, offset by its position in the path, all driven by one
 * shared progress value with per-segment multi-stop interpolation.
 */
function EscapingArrowOverlay({
  escaping,
  size,
}: {
  escaping: EscapingArrow;
  size: number;
}): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;

  const cells = escaping.cells;
  const n = cells.length;
  // Waypoints in grid coords: the path itself, then the straight exit lane
  // continued far enough that even the tail clears the screen.
  const travel = Math.max(Dimensions.get('window').width, Dimensions.get('window').height);
  const extra = Math.ceil(travel / size) + 2;
  const step = { UP: [-1, 0], DOWN: [1, 0], LEFT: [0, -1], RIGHT: [0, 1] }[escaping.direction];
  const head = cells[n - 1];
  const waypoints: Array<{ row: number; col: number }> = cells.map((c) => ({
    row: c.row,
    col: c.col,
  }));
  for (let k = 1; k <= extra; k += 1) {
    waypoints.push({ row: head.row + step[0] * k, col: head.col + step[1] * k });
  }
  // Steps until the TAIL (segment 0) reaches the final waypoint.
  const steps = waypoints.length - 1;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: steps,
      duration: 500,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [escaping, progress, steps]);

  const inputRange = Array.from({ length: steps + 1 }, (_, m) => m);
  return (
    <Animated.View testID="escaping-arrow" pointerEvents="none" style={StyleSheet.absoluteFill}>
      {cells.map((cell, i) => {
        // After m steps, segment i sits at waypoint i+m (clamped at the end).
        const at = (m: number) => waypoints[Math.min(i + m, waypoints.length - 1)];
        const transform = [
          {
            translateX: progress.interpolate({
              inputRange,
              outputRange: inputRange.map((m) => (at(m).col - cell.col) * size),
            }),
          },
          {
            translateY: progress.interpolate({
              inputRange,
              outputRange: inputRange.map((m) => (at(m).row - cell.row) * size),
            }),
          },
        ];
        return (
          <Animated.View
            key={`${cell.row},${cell.col}`}
            style={{
              position: 'absolute',
              left: cell.col * size,
              top: cell.row * size,
              width: size,
              height: size,
              transform,
            }}
          >
            <ArrowPiece
              direction={cell.direction}
              incoming={i === 0 ? null : cells[i - 1].direction}
              color={escaping.color}
              isHead={i === n - 1}
              isTail={i === 0}
              size={size}
            />
          </Animated.View>
        );
      })}
    </Animated.View>
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
