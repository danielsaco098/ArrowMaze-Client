import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import type { DirectionName } from '../../../domain/value-objects/Direction';

interface Props {
  /** This segment's direction: where the path continues (the head's exit). */
  direction: DirectionName;
  /** The previous segment's direction (the one pointing INTO this cell); null at the tail. */
  incoming?: DirectionName | null;
  color: string;
  /** True when this cell is the leading cell (head) of its arrow. */
  isHead: boolean;
  /** True when this cell is the trailing cell (tail) of its arrow. */
  isTail: boolean;
  size: number;
}

const OPPOSITE: Record<DirectionName, DirectionName> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

/**
 * Renders one cell's slice of a winding neon arrow. Each slice is built from
 * "arms" — thin bars running from the cell's centre to one of its edges — so a
 * straight slice is two collinear arms, and a turn (the previous segment came
 * in from a perpendicular side) is two arms meeting at the centre in an elbow.
 * The tail starts with a rounded cap at the centre and the head ends in a
 * triangular arrowhead, so length and exit direction stay unambiguous.
 */
export function ArrowPiece({
  direction,
  incoming = null,
  color,
  isHead,
  isTail,
  size,
}: Props): React.JSX.Element {
  const t = Math.max(3, Math.round(size * 0.16));
  const label = `arrow-${direction.toLowerCase()}`;
  // The line enters through the edge shared with the previous segment.
  const entrySide = incoming ? OPPOSITE[incoming] : null;

  if (!isHead) {
    return (
      <View accessibilityLabel={label} style={styles.fill}>
        {entrySide && <View style={arm(entrySide, size, t, color)} />}
        <View style={[arm(direction, size, t, color), isTail && roundedCap(direction, t)]} />
      </View>
    );
  }

  const headLen = Math.round(size * 0.42);
  const headHalf = Math.max(t, Math.round(size * 0.26));
  // A single-cell arrow still shows a short shaft behind the head.
  const backSide = entrySide ?? OPPOSITE[direction];
  return (
    <View accessibilityLabel={label} style={styles.fill}>
      <View style={[arm(backSide, size, t, color), isTail && roundedCap(backSide, t)]} />
      <View style={shaftToHead(direction, size, t, headLen, color)} />
      <View style={arrowhead(direction, size, headLen, headHalf, color)} />
    </View>
  );
}

/** A thin bar from the cell's centre to the given edge. */
function arm(side: DirectionName, size: number, t: number, color: string): ViewStyle {
  const c = size / 2;
  const near = c - t / 2;
  const span = c + t / 2;
  const base: ViewStyle = { position: 'absolute', backgroundColor: color };
  switch (side) {
    case 'LEFT':
      return { ...base, left: 0, top: near, width: span, height: t };
    case 'RIGHT':
      return { ...base, left: near, top: near, width: span, height: t };
    case 'UP':
      return { ...base, top: 0, left: near, width: t, height: span };
    case 'DOWN':
    default:
      return { ...base, top: near, left: near, width: t, height: span };
  }
}

/** Rounds the centre end of an arm (the visible start of a tail). */
function roundedCap(side: DirectionName, t: number): ViewStyle {
  const r = Math.round(t / 2);
  switch (side) {
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

/** The short bar between the centre and the arrowhead's base. */
function shaftToHead(
  direction: DirectionName,
  size: number,
  t: number,
  headLen: number,
  color: string,
): ViewStyle {
  const c = size / 2;
  const near = c - t / 2;
  const len = Math.max(0, size - headLen - near);
  const base: ViewStyle = { position: 'absolute', backgroundColor: color };
  switch (direction) {
    case 'RIGHT':
      return { ...base, left: near, top: near, width: len, height: t };
    case 'LEFT':
      return { ...base, left: headLen, top: near, width: len, height: t };
    case 'DOWN':
      return { ...base, top: near, left: near, width: t, height: len };
    case 'UP':
    default:
      return { ...base, top: headLen, left: near, width: t, height: len };
  }
}

/** A CSS-border triangle at the exit edge, pointing in `direction`. */
function arrowhead(
  direction: DirectionName,
  size: number,
  len: number,
  half: number,
  color: string,
): ViewStyle {
  const c = size / 2;
  const base: ViewStyle = { position: 'absolute', width: 0, height: 0 };
  switch (direction) {
    case 'RIGHT':
      return {
        ...base,
        left: size - len,
        top: c - half,
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
        left: 0,
        top: c - half,
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
        top: size - len,
        left: c - half,
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
        top: 0,
        left: c - half,
        borderLeftWidth: half,
        borderRightWidth: half,
        borderBottomWidth: len,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
      };
  }
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
});
