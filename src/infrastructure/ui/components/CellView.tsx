import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import type { Cell } from '../../../domain/entities/Cell';
import { ArrowCell } from '../../../domain/entities/ArrowCell';
import type { Position } from '../../../domain/value-objects/Position';
import { ArrowGlyph } from './ArrowGlyph';
import { theme } from '../theme';

interface Props {
  cell: Cell;
  size: number;
  onPress: (position: Position) => void;
}

/** Renders one board cell; only arrows are interactive. */
export function CellView({ cell, size, onPress }: Props): React.JSX.Element {
  const isArrow = cell instanceof ArrowCell;
  const backgroundColor = isArrow
    ? (cell as ArrowCell).color
    : cell.kind === 'WALL'
      ? theme.colors.wall
      : cell.kind === 'EXIT'
        ? theme.colors.exit
        : theme.colors.surfaceAlt;

  return (
    <Pressable
      testID={`cell-${cell.position.row}-${cell.position.col}`}
      accessibilityRole={isArrow ? 'button' : undefined}
      disabled={!isArrow}
      onPress={() => onPress(cell.position)}
      style={[styles.cell, { width: size, height: size, backgroundColor }]}
    >
      {isArrow ? (
        <ArrowGlyph direction={(cell as ArrowCell).direction.name} />
      ) : (
        <View />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    margin: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
