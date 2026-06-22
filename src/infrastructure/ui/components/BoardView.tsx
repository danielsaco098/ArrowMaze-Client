import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Board } from '../../../domain/entities/Board';
import type { Cell } from '../../../domain/entities/Cell';
import type { Position } from '../../../domain/value-objects/Position';
import { CellView } from './CellView';

const MAX_BOARD_WIDTH = 340;

interface Props {
  board: Board;
  onTapCell: (position: Position) => void;
}

/** Renders the full board grid. */
export function BoardView({ board, onTapCell }: Props): React.JSX.Element {
  const size = Math.floor(MAX_BOARD_WIDTH / board.cols) - 4;
  const cells = board.cells();
  const rows: Cell[][] = [];
  for (let r = 0; r < board.rows; r += 1) {
    rows.push(cells.slice(r * board.cols, r * board.cols + board.cols));
  }

  // Precompute the head cell of every arrow so each multi-cell arrow shows its
  // arrowhead only once (at the head).
  const headKeys = new Set<string>();
  for (const arrowId of board.arrowIds()) {
    const head = board.headOfArrow(arrowId);
    headKeys.add(`${head.row},${head.col}`);
  }

  return (
    <View testID="board" style={styles.board}>
      {rows.map((row, r) => (
        <View key={`row-${r}`} style={styles.row}>
          {row.map((cell) => (
            <CellView
              key={`${cell.position.row}-${cell.position.col}`}
              cell={cell}
              size={size}
              isHead={headKeys.has(`${cell.position.row},${cell.position.col}`)}
              onPress={onTapCell}
            />
          ))}
        </View>
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
