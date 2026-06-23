import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Board } from '../../../domain/entities/Board';
import type { Cell } from '../../../domain/entities/Cell';
import { ArrowCell } from '../../../domain/entities/ArrowCell';
import type { Position } from '../../../domain/value-objects/Position';
import { CellView } from './CellView';

const MAX_BOARD_WIDTH = 340;

interface Props {
  board: Board;
  /** Positions that started the level empty/blocked (rendered as black holes). */
  holes: ReadonlySet<string>;
  onTapCell: (position: Position) => void;
}

/** Renders the full board grid. */
export function BoardView({ board, holes, onTapCell }: Props): React.JSX.Element {
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

  return (
    <View testID="board" style={styles.board}>
      {rows.map((row, r) => (
        <View key={`row-${r}`} style={styles.row}>
          {row.map((cell) => {
            const key = `${cell.position.row},${cell.position.col}`;
            return (
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
          })}
        </View>
      ))}
    </View>
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
