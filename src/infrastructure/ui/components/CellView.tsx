import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { Cell } from '../../../domain/entities/Cell';
import { ArrowCell } from '../../../domain/entities/ArrowCell';
import type { Position } from '../../../domain/value-objects/Position';
import { ArrowPiece } from './ArrowPiece';
import { theme } from '../theme';

interface Props {
  cell: Cell;
  size: number;
  /** True when this cell is the leading cell (head) of its arrow. */
  isHead: boolean;
  /** True when this cell is the trailing cell (tail) of its arrow. */
  isTail: boolean;
  /** True when this position started the level empty/blocked (a permanent hole). */
  isHole: boolean;
  onPress: (position: Position) => void;
}

/**
 * Renders one board cell. Arrows are drawn as thin coloured lines over a
 * transparent cell, so only the arrow shows. A wall is a solid slab (it blocks
 * arrows, so it must read differently from a passable gap); a permanent hole is
 * solid black; a cell an arrow has slid out of stays transparent, blending into
 * the background. Only arrows are interactive.
 */
export function CellView({ cell, size, isHead, isTail, isHole, onPress }: Props): React.JSX.Element {
  const isArrow = cell instanceof ArrowCell;
  const isWall = cell.kind === 'WALL';
  const backgroundColor = isArrow
    ? 'transparent'
    : isWall
      ? theme.colors.wall
      : cell.kind === 'EXIT'
        ? theme.colors.exit
        : isHole
          ? theme.colors.hole // a permanent black hole
          : 'transparent'; // a space an arrow has left behind

  return (
    <Pressable
      testID={`cell-${cell.position.row}-${cell.position.col}`}
      accessibilityRole={isArrow ? 'button' : undefined}
      disabled={!isArrow}
      onPress={() => onPress(cell.position)}
      style={[styles.cell, { width: size, height: size, backgroundColor }, isWall && styles.wall]}
    >
      {isArrow ? (
        <ArrowPiece
          direction={(cell as ArrowCell).direction.name}
          color={(cell as ArrowCell).color}
          isHead={isHead}
          isTail={isTail}
          size={size}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Inset rounded slab so the wall reads as a solid obstacle, not a gap.
  wall: {
    borderRadius: 6,
    transform: [{ scale: 0.88 }],
  },
});
