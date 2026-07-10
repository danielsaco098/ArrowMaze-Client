import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';
import type { EscapingArrow } from '../hooks/useGame';

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
 * The arrow's path (plus its straight exit lane, extended past the board
 * edge) becomes one polyline through the cell centres — the rail. A single
 * scalar, `arcOffset` (distance travelled along the rail), is advanced by a
 * requestAnimationFrame loop at CONSTANT speed; the body is the stroke-dash
 * window [arcOffset, arcOffset + snakeLen] of the rail path, so corners bend
 * (round joins) instead of the body splitting, and the arrowhead rides the
 * front of the window. The SVG canvas is exactly the board, so the snake is
 * clipped at the board edge — it slides OUT of the board, not across the
 * screen. Purely presentational: the domain has already removed the arrow.
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
  const t = Math.min(8, Math.max(3, Math.round(size * 0.17)));
  const headLen = Math.min(20, Math.round(size * 0.44));
  const headHalf = Math.min(11, Math.max(t, Math.round(size * 0.23)));

  const rail = useMemo(() => {
    const centre = (v: number) => (v + 0.5) * size;
    const pts: Point[] = escaping.cells.map((c) => ({ x: centre(c.col), y: centre(c.row) }));
    const head = pts[pts.length - 1];
    const d = UNIT[escaping.direction];
    // Distance from the head centre to the board edge along the exit lane.
    const edgeDist =
      d.x > 0 ? cols * size - head.x : d.x < 0 ? head.x : d.y > 0 ? rows * size - head.y : head.y;
    // A single-cell arrow still shows a short body behind its head.
    const snakeLen = Math.max((pts.length - 1) * size, Math.round(size * 0.45));
    // Extend past the edge until the tail (and its round cap) clears the clip.
    const extension = edgeDist + snakeLen + headLen + t;
    pts.push({ x: head.x + d.x * extension, y: head.y + d.y * extension });

    const lengths: number[] = [0];
    for (let i = 1; i < pts.length; i += 1) {
      lengths.push(
        lengths[i - 1] + Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y),
      );
    }
    return {
      pts,
      lengths,
      snakeLen,
      total: lengths[lengths.length - 1],
      path: pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
    };
  }, [escaping, size, rows, cols, headLen, t]);

  // The one scalar that drives everything: distance travelled along the rail.
  const [arcOffset, setArcOffset] = useState(0);

  useEffect(() => {
    setArcOffset(0);
    const end = rail.total;
    // Widget tests only assert presence: jump to the end state instead of
    // scheduling an animation loop that would starve the test runner.
    if (process.env.JEST_WORKER_ID !== undefined) {
      setArcOffset(end);
      return undefined;
    }
    const speed = SPEED_CELLS_PER_SEC * size;
    let raf = 0;
    let last = Date.now();
    let arc = 0;
    const step = () => {
      const now = Date.now();
      arc += ((now - last) / 1000) * speed;
      last = now;
      if (arc >= end) {
        setArcOffset(end);
        return;
      }
      setArcOffset(arc);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [rail, size]);

  // The head rides the front of the window (clamped to the rail).
  const front = Math.min(arcOffset + rail.snakeLen, rail.total);
  const head = pointAt(rail.pts, rail.lengths, front);

  return (
    <View testID="escaping-arrow" pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={cols * size} height={rows * size}>
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
        <Polygon
          points={`0,${-headHalf} 0,${headHalf} ${headLen},0`}
          fill={escaping.color}
          transform={`translate(${head.x}, ${head.y}) rotate(${head.angle})`}
        />
      </Svg>
    </View>
  );
}

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
