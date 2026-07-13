import { rotationOf, type Mat3, type Orientation, type Vec2 } from './orbit';

/**
 * Pure gesture model for the cube: every DECISION (is this a tap or an orbit?
 * where does the camera end up? which cube point did the finger touch?) lives
 * here as plain math, unit-tested without React. The component only wires
 * responder events to these functions.
 *
 * ── Trackball rotation ───────────────────────────────────────────────────────
 * The orientation STATE is the rotation matrix itself, not yaw/pitch angles.
 * Each drag increment is applied IN CAMERA SPACE, premultiplied:
 *
 *     R_new = Rx(−k·dy) · Ry(k·dx) · R_current
 *
 * Because the increment is relative to the SCREEN, drag-right always turns the
 * cube right and drag-down always tumbles the top toward the viewer, regardless
 * of the cube's current attitude — full 360° tumbling on every axis, no gimbal
 * pole, no clamp. (A yaw/pitch Euler state cannot do this: past 90° of pitch a
 * yaw drag visually REVERSES, because yaw turns about the world vertical, and
 * the pole itself is a singularity. The old ±85° pitch clamp was a band-aid
 * over exactly that; the matrix state removes the disease, not the symptom.)
 *
 * The −dy sign keeps the vertical mapping the flat-hand feel already approved:
 * dragging DOWN brings TOP into view (the cube rolls under the finger).
 */

/**
 * The classic isometric corner view: three faces visible and comfortably
 * tappable (FRONT, RIGHT and TOP), so the level opens looking like a solid,
 * not a flat board. Kept as angles purely as a readable way to BUILD the
 * initial matrix — the live state never goes back to angles.
 */
export const INITIAL_ORIENTATION: Orientation = { yaw: -Math.PI / 5, pitch: -0.46 };

/** The initial orientation as the matrix the component state starts from. */
export const INITIAL_ROTATION: Mat3 = rotationOf(INITIAL_ORIENTATION);

/** Drag sensitivity: a ~290px swipe turns the cube a little over 180°. */
export const ORBIT_RADIANS_PER_PX = 0.011;

/**
 * Tap-vs-drag discrimination. Getting this wrong costs the player a LIFE every
 * time they orbit, so the rule is strict: a release counts as a tap only when
 * the finger's PEAK excursion stayed under the movement threshold AND the press
 * was short. Everything else is an orbit and must never tap.
 */
export const TAP_MAX_MOVEMENT_PX = 8;
export const TAP_MAX_DURATION_MS = 250;

/** Row-major 3×3 multiply: (a·b), so `a` is applied AFTER `b`. */
export function multiplyMat3(a: Mat3, b: Mat3): Mat3 {
  const m: number[] = new Array<number>(9);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      m[row * 3 + col] =
        a[row * 3] * b[col] + a[row * 3 + 1] * b[3 + col] + a[row * 3 + 2] * b[6 + col];
    }
  }
  return m as unknown as Mat3;
}

/**
 * Snaps an almost-rotation back onto the rotation group (Gram-Schmidt on the
 * rows, third row rebuilt as a cross product so handedness is preserved).
 * Hundreds of accumulated float multiplies drift R away from orthonormal, and
 * a drifted R skews every projected quad — so every drag increment ends here.
 */
export function renormalizeMat3(m: Mat3): Mat3 {
  let r0x = m[0];
  let r0y = m[1];
  let r0z = m[2];
  const n0 = Math.hypot(r0x, r0y, r0z);
  r0x /= n0;
  r0y /= n0;
  r0z /= n0;

  let r1x = m[3];
  let r1y = m[4];
  let r1z = m[5];
  const d = r1x * r0x + r1y * r0y + r1z * r0z;
  r1x -= d * r0x;
  r1y -= d * r0y;
  r1z -= d * r0z;
  const n1 = Math.hypot(r1x, r1y, r1z);
  r1x /= n1;
  r1y /= n1;
  r1z /= n1;

  // r2 = r0 × r1: orthonormal by construction, right-handed like the input.
  const r2x = r0y * r1z - r0z * r1y;
  const r2y = r0z * r1x - r0x * r1z;
  const r2z = r0x * r1y - r0y * r1x;

  return [r0x, r0y, r0z, r1x, r1y, r1z, r2x, r2y, r2z];
}

/**
 * One drag increment: the screen-space rotation for (dxPx, dyPx) of finger
 * travel, premultiplied onto the current attitude and renormalized.
 * `rotationOf({yaw, pitch})` is exactly Rx(pitch)·Ry(yaw), so it doubles as the
 * increment builder.
 */
export function applyDrag(r: Mat3, dxPx: number, dyPx: number): Mat3 {
  const increment = rotationOf({
    yaw: dxPx * ORBIT_RADIANS_PER_PX,
    pitch: -dyPx * ORBIT_RADIANS_PER_PX,
  });
  return renormalizeMat3(multiplyMat3(increment, r));
}

/** Is a release a TAP? `peakMovementPx` is the largest excursion from the
 * start at ANY point during the gesture — a drag that returns to its origin is
 * still a drag, not a tap. */
export function isTap(peakMovementPx: number, durationMs: number): boolean {
  return peakMovementPx < TAP_MAX_MOVEMENT_PX && durationMs < TAP_MAX_DURATION_MS;
}

/**
 * Pixels per cube unit for a square canvas of `sizePx`. The cube's projected
 * silhouette can reach √3 from the centre (corner-on view), so this scale
 * guarantees the whole solid stays on the canvas at every orientation.
 */
export function cubeCanvasScale(sizePx: number): number {
  return sizePx / (2 * Math.sqrt(3));
}

/** Canvas pixels → cube units (the space orbit.hitTest works in). */
export function screenToCube(point: Vec2, sizePx: number): Vec2 {
  const scale = cubeCanvasScale(sizePx);
  return { x: (point.x - sizePx / 2) / scale, y: (point.y - sizePx / 2) / scale };
}

/** Cube units → canvas pixels. Inverse of {@link screenToCube}. */
export function cubeToScreen(point: Vec2, sizePx: number): Vec2 {
  const scale = cubeCanvasScale(sizePx);
  return { x: sizePx / 2 + point.x * scale, y: sizePx / 2 + point.y * scale };
}
