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
 * Overlay copy of an arrow that just escaped: drawn at its former grid
 * position, then translated along its exit direction until it leaves the screen.
 */
function EscapingArrowOverlay({
  escaping,
  size,
}: {
  escaping: EscapingArrow;
  size: number;
}): React.JSX.Element {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 420,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [escaping, slide]);

  // Far enough to clear any screen edge from any board position.
  const travel = Math.max(Dimensions.get('window').width, Dimensions.get('window').height);
  const delta = {
    UP: { x: 0, y: -travel },
    DOWN: { x: 0, y: travel },
    LEFT: { x: -travel, y: 0 },
    RIGHT: { x: travel, y: 0 },
  }[escaping.direction];
  const transform = [
    { translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, delta.x] }) },
    { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [0, delta.y] }) },
  ];

  // `cells` is the arrow's path, tail first — the same info the grid uses.
  const last = escaping.cells.length - 1;
  return (
    <Animated.View testID="escaping-arrow" pointerEvents="none" style={[StyleSheet.absoluteFill, { transform }]}>
      {escaping.cells.map((cell, i) => (
        <View
          key={`${cell.row},${cell.col}`}
          style={{
            position: 'absolute',
            left: cell.col * size,
            top: cell.row * size,
            width: size,
            height: size,
          }}
        >
          <ArrowPiece
            direction={cell.direction}
            incoming={i === 0 ? null : escaping.cells[i - 1].direction}
            color={escaping.color}
            isHead={i === last}
            isTail={i === 0}
            size={size}
          />
        </View>
      ))}
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
