import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, View, StyleSheet } from 'react-native';
import type { Board } from '../../../domain/entities/Board';
import type { Cell } from '../../../domain/entities/Cell';
import { ArrowCell } from '../../../domain/entities/ArrowCell';
import type { Position } from '../../../domain/value-objects/Position';
import type { EscapingArrow } from '../hooks/useGame';
import { CellView } from './CellView';
import { ArrowPiece } from './ArrowPiece';

const MAX_BOARD_WIDTH = 340;

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

  // Precompute the head and tail cell of every arrow so each multi-cell arrow
  // gets its arrowhead and its rounded tail in exactly the right place.
  const headKeys = new Set<string>();
  const tailKeys = new Set<string>();
  for (const arrowId of board.arrowIds()) {
    const head = board.headOfArrow(arrowId);
    headKeys.add(`${head.row},${head.col}`);
    tailKeys.add(keyOfTail(cells, arrowId));
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
            const isShaking =
              shakingArrowId !== null &&
              cell instanceof ArrowCell &&
              cell.arrowId === shakingArrowId;
            const view = (
              <CellView
                key={key}
                cell={cell}
                size={size}
                isHead={headKeys.has(key)}
                isTail={tailKeys.has(key)}
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
 * position, then translated along its direction until it leaves the screen.
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

  // Head = the cell furthest along the pointing direction; tail = the opposite end.
  const dirVector = { UP: [-1, 0], DOWN: [1, 0], LEFT: [0, -1], RIGHT: [0, 1] }[
    escaping.direction
  ];
  const projection = (c: { row: number; col: number }) =>
    c.row * dirVector[0] + c.col * dirVector[1];
  const headKey = [...escaping.cells].sort((a, b) => projection(b) - projection(a))[0];
  const tailKey = [...escaping.cells].sort((a, b) => projection(a) - projection(b))[0];

  return (
    <Animated.View testID="escaping-arrow" pointerEvents="none" style={[StyleSheet.absoluteFill, { transform }]}>
      {escaping.cells.map((cell) => (
        <View
          key={`${cell.row},${cell.col}`}
          style={{
            position: 'absolute',
            left: cell.col * size,
            top: cell.row * size,
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowPiece
            direction={escaping.direction}
            color={escaping.color}
            isHead={cell === headKey}
            isTail={cell === tailKey}
            size={size}
          />
        </View>
      ))}
    </Animated.View>
  );
}

/** Key of an arrow's trailing cell — the one furthest opposite its direction. */
function keyOfTail(cells: Cell[], arrowId: number): string {
  const arrowCells = cells.filter(
    (c): c is ArrowCell => c instanceof ArrowCell && c.arrowId === arrowId,
  );
  const dir = arrowCells[0].direction;
  const projection = (c: ArrowCell): number =>
    c.position.row * dir.rowDelta + c.position.col * dir.colDelta;
  const tail = arrowCells.reduce((min, c) => (projection(c) < projection(min) ? c : min));
  return `${tail.position.row},${tail.position.col}`;
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
