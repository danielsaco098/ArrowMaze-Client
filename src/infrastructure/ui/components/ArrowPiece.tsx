import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import type { DirectionName } from '../../../domain/value-objects/Direction';

interface Props {
  direction: DirectionName;
  color: string;
  /** True when this cell is the leading cell (head) of its arrow. */
  isHead: boolean;
  /** True when this cell is the trailing cell (tail) of its arrow. */
  isTail: boolean;
  size: number;
}

/**
 * Renders one cell's slice of a coloured arrow as a thin neon line. Body slices
 * are a slim bar that butts against its neighbours so the whole arrow reads as a
 * single continuous line; the tail end is rounded and the head adds a triangular
 * arrowhead, so each arrow's length and direction stay unambiguous even when two
 * same-coloured arrows sit side by side. The cell behind it is transparent.
 */
export function ArrowPiece({ direction, color, isHead, isTail, size }: Props): React.JSX.Element {
  const horizontal = direction === 'LEFT' || direction === 'RIGHT';
  const thickness = Math.round(size * 0.2);
  const headLen = Math.round(size * 0.42);
  const headHalf = Math.round(size * 0.3);
  const tailCap = isTail ? tailCapStyle(direction, Math.round(thickness / 2)) : null;
  const label = `arrow-${direction.toLowerCase()}`;

  if (!isHead) {
    // Body slice: a full-length bar so it touches the neighbouring slices.
    return (
      <View
        accessibilityLabel={label}
        style={[
          { backgroundColor: color },
          horizontal ? { height: thickness, width: '100%' } : { width: thickness, height: '100%' },
          tailCap,
        ]}
      />
    );
  }

  const shaft: ViewStyle = horizontal
    ? { backgroundColor: color, height: thickness, width: size - headLen }
    : { backgroundColor: color, width: thickness, height: size - headLen };
  const head = arrowheadStyle(direction, headLen, headHalf, color);
  const headFirst = direction === 'LEFT' || direction === 'UP';

  return (
    <View
      accessibilityLabel={label}
      style={[styles.head, { flexDirection: horizontal ? 'row' : 'column' }]}
    >
      {headFirst && <View style={head} />}
      <View style={[shaft, tailCap]} />
      {!headFirst && <View style={head} />}
    </View>
  );
}

/** A CSS-border triangle pointing in `direction` (no SVG dependency needed). */
function arrowheadStyle(
  direction: DirectionName,
  len: number,
  half: number,
  color: string,
): ViewStyle {
  const base: ViewStyle = { width: 0, height: 0 };
  switch (direction) {
    case 'RIGHT':
      return {
        ...base,
        borderTopWidth: half,
        borderBottomWidth: half,
        borderLeftWidth: len,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: color,
      };
    case 'LEFT':
      return {
        ...base,
        borderTopWidth: half,
        borderBottomWidth: half,
        borderRightWidth: len,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: color,
      };
    case 'DOWN':
      return {
        ...base,
        borderLeftWidth: half,
        borderRightWidth: half,
        borderTopWidth: len,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: color,
      };
    case 'UP':
    default:
      return {
        ...base,
        borderLeftWidth: half,
        borderRightWidth: half,
        borderBottomWidth: len,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
      };
  }
}

/** Rounds the back (tail) end of the line, opposite the pointing direction. */
function tailCapStyle(direction: DirectionName, r: number): ViewStyle {
  switch (direction) {
    case 'RIGHT':
      return { borderTopLeftRadius: r, borderBottomLeftRadius: r };
    case 'LEFT':
      return { borderTopRightRadius: r, borderBottomRightRadius: r };
    case 'DOWN':
      return { borderTopLeftRadius: r, borderTopRightRadius: r };
    case 'UP':
    default:
      return { borderBottomLeftRadius: r, borderBottomRightRadius: r };
  }
}

const styles = StyleSheet.create({
  head: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
