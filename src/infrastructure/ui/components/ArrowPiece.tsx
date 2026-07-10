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
 * Renders one cell's slice of a winding neon arrow. Straight slices are a
 * thin full-length bar; turns are two short arms joined by a corner piece
 * whose outer edge is a quarter-round, so the line CURVES instead of boxing
 * around 90° corners. The tail starts with a rounded cap and the head ends in
 * a triangular arrowhead placed after its final bend, so length and exit
 * direction stay unambiguous.
 */
export function ArrowPiece({
  direction,
  incoming = null,
  color,
  isHead,
  isTail,
  size,
}: Props): React.JSX.Element {
  const t = Math.max(3, Math.round(size * 0.17));
  const label = `arrow-${direction.toLowerCase()}`;
  // The line enters through the edge shared with the previous segment.
  const entrySide = incoming ? OPPOSITE[incoming] : null;
  const turns = entrySide !== null && entrySide !== OPPOSITE[direction];

  // Centreline radius of a bend: the arc the line follows through a turn.
  const bend = t;

  if (!isHead) {
    if (!turns) {
      // Straight slice: one continuous bar (tail rounds its trailing end).
      return (
        <View accessibilityLabel={label} style={styles.fill}>
          {entrySide && <View style={arm(entrySide, size, t, color)} />}
          <View style={[arm(direction, size, t, color), isTail && roundedCap(direction, t)]} />
        </View>
      );
    }
    return (
      <View accessibilityLabel={label} style={styles.fill}>
        <View style={shortArm(entrySide!, size, t, bend, color)} />
        <QuarterRing a={entrySide!} b={direction} size={size} t={t} bend={bend} color={color} />
        <View style={shortArm(direction, size, t, bend, color)} />
      </View>
    );
  }

  const headLen = Math.round(size * 0.44);
  const headHalf = Math.max(t, Math.round(size * 0.23));
  // A single-cell arrow still shows a short shaft behind the head.
  const backSide = entrySide ?? OPPOSITE[direction];
  return (
    <View accessibilityLabel={label} style={styles.fill}>
      {turns ? (
        <>
          <View style={shortArm(backSide, size, t, bend, color)} />
          <QuarterRing a={backSide} b={direction} size={size} t={t} bend={bend} color={color} />
          <View style={headStub(direction, size, t, bend, headLen, color)} />
        </>
      ) : (
        <>
          <View style={[arm(backSide, size, t, color), isTail && roundedCap(backSide, t)]} />
          <View style={shaftToHead(direction, size, t, headLen, color)} />
        </>
      )}
      <View style={arrowhead(direction, size, headLen, headHalf, color)} />
    </View>
  );
}

/**
 * A true curved joint: a quarter of a ring (tube of thickness `t` following a
 * circular arc of centreline radius `bend`) clipped to the bend's quadrant,
 * connecting the arm on side `a` to the arm on side `b`.
 */
function QuarterRing({
  a,
  b,
  size,
  t,
  bend,
  color,
}: {
  a: DirectionName;
  b: DirectionName;
  size: number;
  t: number;
  bend: number;
  color: string;
}): React.JSX.Element {
  const c = size / 2;
  const R = bend + t / 2; // outer radius of the tube
  const sides = new Set([a, b]);
  // Centre of curvature: offset from the cell centre away from both arms.
  const ox = sides.has('LEFT') ? c - bend : c + bend;
  const oy = sides.has('UP') ? c - bend : c + bend;
  // The arc bulges from the centre of curvature toward the cell centre.
  const dx = sides.has('LEFT') ? 1 : -1;
  const dy = sides.has('UP') ? 1 : -1;
  const clip: ViewStyle = {
    position: 'absolute',
    left: dx > 0 ? ox : ox - R,
    top: dy > 0 ? oy : oy - R,
    width: R,
    height: R,
    overflow: 'hidden',
  };
  const ring: ViewStyle = {
    position: 'absolute',
    left: ox - R - (clip.left as number),
    top: oy - R - (clip.top as number),
    width: 2 * R,
    height: 2 * R,
    borderRadius: R,
    borderWidth: t,
    borderColor: color,
  };
  return (
    <View style={clip} pointerEvents="none">
      <View style={ring} />
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

/** Like {@link arm} but stopping where the curved joint begins. */
function shortArm(
  side: DirectionName,
  size: number,
  t: number,
  bend: number,
  color: string,
): ViewStyle {
  const c = size / 2;
  const near = c - t / 2;
  const len = c - bend + 1; // +1 overlaps the ring so no hairline gap shows
  const base: ViewStyle = { position: 'absolute', backgroundColor: color };
  switch (side) {
    case 'LEFT':
      return { ...base, left: 0, top: near, width: len, height: t };
    case 'RIGHT':
      return { ...base, left: size - len, top: near, width: len, height: t };
    case 'UP':
      return { ...base, top: 0, left: near, width: t, height: len };
    case 'DOWN':
    default:
      return { ...base, top: size - len, left: near, width: t, height: len };
  }
}

/** The bar between a turning head's curve and its arrowhead base. */
function headStub(
  direction: DirectionName,
  size: number,
  t: number,
  bend: number,
  headLen: number,
  color: string,
): ViewStyle {
  const c = size / 2;
  const near = c - t / 2;
  // The stub spans from the curve's end (± the bend radius, overlapping the
  // ring by 1px) to the arrowhead's base.
  const fwd = Math.max(0, size - headLen - (c + bend - 1));
  const back = Math.max(0, c - bend + 1 - headLen);
  const base: ViewStyle = { position: 'absolute', backgroundColor: color };
  switch (direction) {
    case 'RIGHT':
      return { ...base, left: c + bend - 1, top: near, width: fwd, height: t };
    case 'LEFT':
      return { ...base, left: headLen, top: near, width: back, height: t };
    case 'DOWN':
      return { ...base, top: c + bend - 1, left: near, width: t, height: fwd };
    case 'UP':
    default:
      return { ...base, top: headLen, left: near, width: t, height: back };
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
