import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Cell } from '../../../domain/entities/Cell';
import { ArrowCell } from '../../../domain/entities/ArrowCell';
import type { Position } from '../../../domain/value-objects/Position';
import type { DirectionName } from '../../../domain/value-objects/Direction';
import { ArrowPiece } from './ArrowPiece';
import { theme } from '../theme';

interface Props {
  cell: Cell;
  size: number;
  /** True when this cell is the leading cell (head) of its arrow. */
  isHead: boolean;
  /** True when this cell is the trailing cell (tail) of its arrow. */
  isTail: boolean;
  /** Direction of the previous path segment (null at the tail / non-arrows). */
  incoming?: DirectionName | null;
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
export function CellView({
  cell,
  size,
  isHead,
  isTail,
  incoming = null,
  isHole,
  onPress,
}: Props): React.JSX.Element {
  const isArrow = cell instanceof ArrowCell;
  const isWall = cell.kind === 'WALL';
  const backgroundColor = isArrow
    ? 'transparent'
    : isWall
      ? theme.colors.wall
      : cell.kind === 'EXIT'
        ? theme.colors.exit
        : 'transparent'; // gaps draw their hole circle as a child instead

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
          incoming={incoming}
          color={(cell as ArrowCell).color}
          isHead={isHead}
          isTail={isTail}
          size={size}
        />
      ) : cell.kind === 'COLLECTIBLE' ? (
        <Text accessibilityLabel="collectible" style={[styles.star, { fontSize: size * 0.5 }]}>
          ★
        </Text>
      ) : isHole && cell.kind === 'EMPTY' ? (
        // A permanent hole: a round pit that can swallow escaping arrows.
        <View
          accessibilityLabel="hole"
          style={[
            styles.hole,
            { width: size * 0.55, height: size * 0.55, borderRadius: size * 0.275 },
          ]}
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
  star: {
    color: theme.colors.exit,
  },
  hole: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
