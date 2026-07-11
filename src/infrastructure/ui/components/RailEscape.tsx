import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';
import type { EscapingArrow } from '../hooks/useGame';
import { AudioManager } from '../../audio/AudioManager';
import { arrowMetrics } from './arrowMetrics';
import { theme } from '../theme';

/** Constant glide speed, in board cells per second. */
const SPEED_CELLS_PER_SEC = 16;

interface Point {
  x: number;
  y: number;
}

const UNIT: Record<EscapingArrow['direction'], Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

/**
 * Escape animation as a sliding window over a persistent rail.
 *
 * The arrow's path plus its exit lane become one polyline through the cell
 * centres — the rail. A single scalar, `arcOffset` (distance travelled along
 * the rail), is advanced by a requestAnimationFrame loop at CONSTANT speed;
 * the body is the stroke-dash window of the rail path, so corners bend
 * (round joins) instead of the body splitting, and the arrowhead rides the
 * front of the window.
 *
 * Where the flight ends depends on the lane: with a permanent hole on it the
 * rail STOPS at the hole's centre, so the window shrinks into the hole (the
 * arrow is swallowed); otherwise the rail extends past the screen edge and
 * the arrow flies out of view. Stars on the lane stay visible as ghosts and
 * vanish (with a collect chime) exactly when the front reaches them.
 * Purely presentational: the domain has already settled the outcome.
 */
export function RailEscape({
  escaping,
  size,
  rows,
  cols,
}: {
  escaping: EscapingArrow;
  size: number;
  rows: number;
  cols: number;
}): React.JSX.Element {
  const { t, headLen, headHalf } = arrowMetrics(size);

  const rail = useMemo(() => {
    // Enough to reach any screen edge from anywhere on the board.
    const window = Dimensions.get('window');
    const offScreen = Math.max(window.width, window.height);
    const centre = (v: number) => (v + 0.5) * size;
    const d = UNIT[escaping.direction];
    // The SVG canvas grows toward the exit side so the flight stays visible
    // past the board; rail coordinates shift by the canvas origin.
    const padX = d.x < 0 ? offScreen : 0;
    const padY = d.y < 0 ? offScreen : 0;
    const canvasWidth = cols * size + (d.x !== 0 ? offScreen : 0);
    const canvasHeight = rows * size + (d.y !== 0 ? offScreen : 0);

    const pts: Point[] = escaping.cells.map((c) => ({
      x: centre(c.col) + padX,
      y: centre(c.row) + padY,
    }));
    const head = pts[pts.length - 1];
    // A single-cell arrow still shows a short body behind its head.
    const snakeLen = Math.max((pts.length - 1) * size, Math.round(size * 0.45));
    // Swallowed: the rail ends at the hole's centre and the window shrinks
    // into it. Otherwise: fly until even the tail crosses the screen edge.
    const extension = escaping.hole
      ? Math.abs(centre(escaping.hole.col) + padX - head.x) +
        Math.abs(centre(escaping.hole.row) + padY - head.y)
      : offScreen + snakeLen + headLen + t;
    pts.push({ x: head.x + d.x * extension, y: head.y + d.y * extension });

    const lengths: number[] = [0];
    for (let i = 1; i < pts.length; i += 1) {
      lengths.push(
        lengths[i - 1] + Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y),
      );
    }
    const total = lengths[lengths.length - 1];
    // Arc distance at which the front reaches each lane star.
    const headArc = lengths[pts.length - 2];
    const starArcs = escaping.stars.map(
      (s) =>
        headArc +
        Math.abs(centre(s.col) + padX - head.x) +
        Math.abs(centre(s.row) + padY - head.y),
    );
    return {
      pts,
      lengths,
      snakeLen,
      total,
      starArcs,
      path: pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
      canvas: { left: -padX, top: -padY, width: canvasWidth, height: canvasHeight },
    };
  }, [escaping, size, rows, cols, headLen, t]);

  // The one scalar that drives everything: distance travelled along the rail.
  const [arcOffset, setArcOffset] = useState(0);
  const chimed = useRef<Set<number>>(new Set());

  useEffect(() => {
    setArcOffset(0);
    chimed.current = new Set();
    const end = rail.total;
    // Widget tests only assert presence: jump to the end state instead of
    // scheduling an animation loop that would starve the test runner.
    if (process.env.JEST_WORKER_ID !== undefined) {
      setArcOffset(end);
      return undefined;
    }
    // Constant speed, but never let a long flight drag past ~2 seconds.
    const speed = Math.max(SPEED_CELLS_PER_SEC * size, end / 2);
    let raf = 0;
    let last = Date.now();
    let arc = 0;
    const step = () => {
      const now = Date.now();
      arc += ((now - last) / 1000) * speed;
      last = now;
      const clamped = Math.min(arc, end);
      // A star vanishes with a chime the moment the front sweeps over it.
      rail.starArcs.forEach((starArc, i) => {
        if (!chimed.current.has(i) && clamped + rail.snakeLen >= starArc) {
          chimed.current.add(i);
          AudioManager.getInstance().playEffect('COLLECT');
        }
      });
      setArcOffset(clamped);
      if (arc < end) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [rail, size]);

  // The head rides the front of the window (clamped to the rail).
  const front = Math.min(arcOffset + rail.snakeLen, rail.total);
  const head = pointAt(rail.pts, rail.lengths, front);
  const done = arcOffset >= rail.total;
  // A swallowed head disappears into the hole; a flying one exits the screen.
  const headVisible = !(escaping.hole && front >= rail.total) && !done;

  return (
    <View testID="escaping-arrow" pointerEvents="none" style={styles.overlay}>
      <Svg
        width={rail.canvas.width}
        height={rail.canvas.height}
        style={{ position: 'absolute', left: rail.canvas.left, top: rail.canvas.top }}
      >
        <Path
          d={rail.path}
          stroke={escaping.color}
          strokeWidth={t}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${rail.snakeLen} ${rail.total + rail.snakeLen}`}
          strokeDashoffset={-arcOffset}
        />
        {headVisible && (
          <Polygon
            points={`0,${-headHalf} 0,${headHalf} ${headLen},0`}
            fill={escaping.color}
            transform={`translate(${head.x}, ${head.y}) rotate(${head.angle})`}
          />
        )}
      </Svg>
      {escaping.stars.map((star, i) =>
        !done && front < rail.starArcs[i] ? (
          <Text
            key={`star-${star.row}-${star.col}`}
            accessibilityLabel="collectible-ghost"
            style={[
              styles.star,
              {
                left: star.col * size,
                top: star.row * size,
                width: size,
                height: size,
                fontSize: size * 0.5,
                lineHeight: size,
              },
            ]}
          >
            ★
          </Text>
        ) : null,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Fills the board but lets the flight overflow it (RN default is visible;
  // Android honours it since RN 0.72).
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
  },
  star: {
    position: 'absolute',
    textAlign: 'center',
    color: theme.colors.exit,
  },
});

/** Point and travel angle at arc distance `s` along the polyline. */
function pointAt(
  pts: Point[],
  lengths: number[],
  s: number,
): { x: number; y: number; angle: number } {
  for (let i = 1; i < pts.length; i += 1) {
    if (s <= lengths[i] || i === pts.length - 1) {
      const span = lengths[i] - lengths[i - 1] || 1;
      const f = Math.min(1, Math.max(0, (s - lengths[i - 1]) / span));
      const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f;
      const y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f;
      const angle =
        (Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x) * 180) / Math.PI;
      return { x, y, angle };
    }
  }
  return { ...pts[pts.length - 1], angle: 0 };
}
