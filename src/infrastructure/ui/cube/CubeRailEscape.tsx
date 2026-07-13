import React, { useEffect, useMemo, useRef, useState } from 'react';
import { G, Path, Polygon } from 'react-native-svg';
import type { CubeLayout } from '../../../adapters/cube/CubeLayout';
import type { EscapingArrow } from '../hooks/useGame';
import {
  CUBE_FACES,
  cellPolygon,
  isFaceVisible,
  outwardScreenVector,
  project,
  projectFaceLocal,
  type Mat3,
  type Vec2,
} from './orbit';
import { cubeCanvasScale } from './orbitGesture';
import {
  FLIGHT_SPEED_CELLS_PER_SEC,
  FLY_OFF_EXTRA_CELLS,
  bodyLocalPoints,
  buildFlightModel,
  pointAlongRail,
} from './cubeFlight';
import { arrowheadPoints, faceStarPoints } from './CubeFace';

/** Below this projected magnitude the lane points at (or away from) the
 * viewer: directional travel collapses, so the flight scales and fades
 * instead — the PR-3 near-zero contract (never normalize the noise). */
const TOWARD_CAMERA_THRESHOLD = 0.35;

interface Props {
  flight: EscapingArrow;
  layout: CubeLayout;
  r: Mat3;
  size: number;
  /** Cube units → canvas pixels (same closure the faces use). */
  toScreen: (p: Vec2) => Vec2;
}

/**
 * One escape flight on the orbiting cube. The flight's state is CUBE-SPACE
 * (a face-local rail from {@link buildFlightModel} plus one progress scalar
 * advanced by a requestAnimationFrame loop this component owns); every screen
 * coordinate is re-derived per render from the CURRENT rotation, so orbiting
 * mid-flight keeps the flight glued to the cube, and a face orbited away is
 * simply culled with the flight still progressing underneath.
 *
 * Inside the face the body slides cell to cell (train motion, bends kept by
 * {@link bodyLocalPoints}); an in-face hole truncates the rail and the window
 * shrinks into the pit; a padding escape continues off the cube along
 * {@link outwardScreenVector} and fades out. Ghost stars pop as the front
 * passes them. The overlay draws nothing once finished — useGame's existing
 * queue timer removes the flight, exactly like the flat RailEscape.
 */
export function CubeRailEscape({ flight, layout, r, size, toScreen }: Props): React.JSX.Element | null {
  const model = useMemo(() => buildFlightModel(flight, layout), [flight, layout]);

  // The progress scalar is OURS (not Animated's): tests and re-projection both
  // read plain state, and the rAF loop is cancelled on unmount — no leaks.
  const progressRef = useRef(0);
  const [, forceFrame] = useState(0);
  useEffect(() => {
    if (model === null) {
      return undefined;
    }
    let live = true;
    let frame = 0;
    let last = Date.now();
    const tick = () => {
      if (!live) {
        return;
      }
      const now = Date.now();
      progressRef.current += ((now - last) / 1000) * FLIGHT_SPEED_CELLS_PER_SEC;
      last = now;
      forceFrame((n) => n + 1);
      if (progressRef.current < model.endProgress) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      live = false;
      cancelAnimationFrame(frame);
    };
  }, [model]);

  if (model === null) {
    return null;
  }
  const progress = progressRef.current;
  if (progress >= model.endProgress) {
    return null; // finished: draw nothing until the queue removes the flight
  }
  const face = CUBE_FACES[model.faceIndex];
  if (!isFaceVisible(face, r)) {
    return null; // face orbited away mid-flight: culled, not crashed
  }

  const cellUnits = 2 / layout.faceSize; // cube units per cell
  // The one glyph rule: face-local points, projected point by point.
  const localToScreen = (local: { row: number; col: number }): Vec2 =>
    toScreen(projectFaceLocal(face, local.row, local.col, r));

  const sTail = progress;
  const sFront = progress + model.bodyArcs;
  const offTail = Math.max(0, sTail - model.totalArcs);
  const offFront = Math.max(0, sFront - model.totalArcs);

  // Off-cube travel: screen-space continuation from the face-edge point along
  // the projected outward direction. NOT normalized — a tiny vector means the
  // lane points at the viewer, handled below by scale-and-fade.
  const outward = outwardScreenVector(face, model.exitDirection, r);
  const pxPerCell = cellUnits * cubeCanvasScale(size);
  const edgeScreen = localToScreen(pointAlongRail(model, model.totalArcs));
  const extension = (cells: number): Vec2 => ({
    x: edgeScreen.x + outward.x * pxPerCell * cells,
    y: edgeScreen.y + outward.y * pxPerCell * cells,
  });

  // Only a fly-off travels beyond the rail; a swallowed body just compresses
  // into the pit (bodyLocalPoints clamps the window at the rail end).
  const points: Vec2[] =
    model.flyOff && offTail > 0
      ? [extension(offTail), extension(offFront)]
      : [
          ...bodyLocalPoints(model, sTail, sFront).map(localToScreen),
          ...(model.flyOff && offFront > 0 ? [extension(offFront)] : []),
        ];

  // Stroke scale from the face's cell size, like the resting arrows.
  const sample = cellPolygon(face, 0, 0, r).map(toScreen);
  const edge = Math.min(
    Math.hypot(sample[1].x - sample[0].x, sample[1].y - sample[0].y),
    Math.hypot(sample[3].x - sample[0].x, sample[3].y - sample[0].y),
  );

  // Near-zero contract: escaping toward the viewer grows and fades ("flies at
  // the camera"); escaping away shrinks and fades behind the cube.
  let scale = 1;
  if (model.flyOff && offFront > 0 && Math.hypot(outward.x, outward.y) < TOWARD_CAMERA_THRESHOLD) {
    const along = model.exitDirection === 'UP' || model.exitDirection === 'DOWN' ? face.v : face.u;
    const sign = model.exitDirection === 'UP' || model.exitDirection === 'LEFT' ? -1 : 1;
    const depth = project({ x: sign * along.x, y: sign * along.y, z: sign * along.z }, r).depth;
    scale = depth >= 0 ? 1 + offFront * 0.5 : 1 / (1 + offFront * 0.5);
  }
  const strokeWidth = edge * 0.16 * scale;
  const opacity = model.flyOff
    ? Math.max(0, 1 - offFront / (FLY_OFF_EXTRA_CELLS + model.bodyArcs))
    : 1;

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  const tip = points[points.length - 1];
  const beforeTip = points.length > 1 ? points[points.length - 2] : tip;

  return (
    <G testID={`cube-flight-${flight.arrowId}`} opacity={opacity}>
      {model.starArcs
        .filter((arc) => arc > sFront) // ghosts pop exactly when the front passes
        .map((arc) => {
          const at = pointAlongRail(model, arc);
          return (
            <Polygon
              key={`ghost-star-${arc}`}
              points={faceStarPoints(face, at.row, at.col, 0.3, r, toScreen)}
              fill="#FFD166"
              opacity={0.9}
            />
          );
        })}
      <Path
        d={d}
        stroke={flight.color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Polygon points={arrowheadPoints(beforeTip, tip)} fill={flight.color} />
    </G>
  );
}
