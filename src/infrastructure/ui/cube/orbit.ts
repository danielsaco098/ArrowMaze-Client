import type { CubeFaceName } from '../../../adapters/cube/CubeLayout';
import type { DirectionName } from '../../../domain/value-objects/Direction';
import { CUBE_FACE_SIZE } from '../../data/cubeLevels';

/**
 * Pure projection maths for rendering the cube level. Zero React, zero
 * react-native: everything here is plain numbers in, plain numbers out, so the
 * whole module is unit-testable without a renderer (and the renderer PR can
 * treat it as a black box).
 *
 * ── Coordinate system ────────────────────────────────────────────────────────
 * World: x → screen right, y → screen DOWN (matching the board's row/col
 * convention), z → TOWARD the camera. The cube is axis-aligned spanning
 * [-1, +1]³ in "cube units"; the caller scales/translates projected points to
 * pixels. Projection is orthographic: screen = (x, y), depth = z, and a LARGER
 * depth is NEARER the camera — so painter's order draws ascending depth,
 * nearest last.
 *
 * ── Orientation ──────────────────────────────────────────────────────────────
 * Free orbit in continuous radians, no snapping: {@link rotationOf} builds
 * R = Rx(pitch)·Ry(yaw) (yaw about the vertical screen axis first, then pitch
 * about the horizontal one). Useful anchors, all pinned by tests:
 *   yaw 0, pitch 0   → FRONT faces the camera
 *   yaw −π/2         → RIGHT faces the camera
 *   yaw +π/2         → LEFT,  yaw π → BACK
 *   pitch −π/2       → TOP,   pitch +π/2 → BOTTOM
 */

export interface Orientation {
  /** Rotation about the vertical screen axis, radians, continuous. */
  readonly yaw: number;
  /** Rotation about the horizontal screen axis, radians, continuous. */
  readonly pitch: number;
}

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** Row-major 3×3 rotation matrix. */
export type Mat3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];

export interface ProjectedPoint {
  readonly x: number;
  readonly y: number;
  /** Rotated z: LARGER is NEARER the camera (draw ascending, nearest last). */
  readonly depth: number;
}

/**
 * One cube face's 3D frame: where its board block lives on the solid.
 *  - `origin`: the 3D position of the face's top-left cell corner (local 0,0)
 *  - `u`: unit vector ACROSS COLUMNS (local col+ → this way)
 *  - `v`: unit vector DOWN ROWS (local row+ → this way)
 *  - `normal`: outward normal, always u × v (right-handed winding)
 */
export interface FaceBasis {
  /** MUST equal the CubeLayout face index — the renderer maps board blocks to
   * 3D faces by this shared order (pinned against CubeLayout by a test). */
  readonly index: number;
  readonly name: CubeFaceName;
  readonly origin: Vec3;
  readonly u: Vec3;
  readonly v: Vec3;
  readonly normal: Vec3;
}

export interface CellHit {
  /** CubeLayout face index — feed straight into layout.toBoard(face, row, col). */
  readonly face: number;
  readonly row: number;
  readonly col: number;
}

/** Cells per face edge — the same N the level data is composed with. */
export const FACE_CELLS = CUBE_FACE_SIZE;

/**
 * A face whose rotated normal makes less than this angle-cosine with the view
 * axis is too edge-on to tap: its cells project to slivers a finger cannot aim
 * at, so mis-taps (and lost lives) would be likely. Such faces may still be
 * DRAWN (see {@link isFaceVisible}) but {@link hitTest} never returns them.
 */
export const HIT_TEST_MIN_FACING = 0.15;

/** Strictly-positive facing means visible; edge-on (dot ≈ 0) is culled. */
const VISIBLE_EPS = 1e-9;

const CELL = 2 / FACE_CELLS; // cell edge length in cube units (face spans 2)

/**
 * THE face-orientation table — the R3 risk lives here and nowhere else.
 *
 * Order is CubeLayout's diagonal order: FRONT, RIGHT, BACK, LEFT, TOP, BOTTOM.
 * Each u was chosen so that when its face squarely faces the camera (at the
 * anchor orientations listed in the module doc), u projects to screen-RIGHT and
 * v to screen-DOWN — i.e. the face reads exactly like the flat board, and an
 * arrow pointing RIGHT visibly slides right. Every basis is orthonormal with
 * normal = u × v; the tests pin all of it, so a flipped sign here fails loudly
 * instead of rendering a mirrored face.
 */
export const CUBE_FACES: readonly FaceBasis[] = [
  {
    index: 0,
    name: 'FRONT', // z = +1 plane, toward the camera at identity
    origin: { x: -1, y: -1, z: 1 },
    u: { x: 1, y: 0, z: 0 },
    v: { x: 0, y: 1, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
  },
  {
    index: 1,
    name: 'RIGHT', // x = +1 plane; u runs front→back so yaw −π/2 reads upright
    origin: { x: 1, y: -1, z: 1 },
    u: { x: 0, y: 0, z: -1 },
    v: { x: 0, y: 1, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
  },
  {
    index: 2,
    name: 'BACK', // z = −1 plane; u = −x so yaw π shows it unmirrored
    origin: { x: 1, y: -1, z: -1 },
    u: { x: -1, y: 0, z: 0 },
    v: { x: 0, y: 1, z: 0 },
    normal: { x: 0, y: 0, z: -1 },
  },
  {
    index: 3,
    name: 'LEFT', // x = −1 plane; u runs back→front so yaw +π/2 reads upright
    origin: { x: -1, y: -1, z: -1 },
    u: { x: 0, y: 0, z: 1 },
    v: { x: 0, y: 1, z: 0 },
    normal: { x: -1, y: 0, z: 0 },
  },
  {
    index: 4,
    name: 'TOP', // y = −1 plane (screen-y points down, so the top is −y);
    // v runs back→front: pitching the cube down (pitch −π/2) shows TOP with its
    // rows flowing toward FRONT, keeping FRONT at the bottom of the screen.
    origin: { x: -1, y: -1, z: -1 },
    u: { x: 1, y: 0, z: 0 },
    v: { x: 0, y: 0, z: 1 },
    normal: { x: 0, y: -1, z: 0 },
  },
  {
    index: 5,
    name: 'BOTTOM', // y = +1 plane; v runs front→back, mirror of TOP
    origin: { x: -1, y: 1, z: 1 },
    u: { x: 1, y: 0, z: 0 },
    v: { x: 0, y: 0, z: -1 },
    normal: { x: 0, y: 1, z: 0 },
  },
];

/** R = Rx(pitch) · Ry(yaw): yaw spins the cube, pitch then tips it. */
export function rotationOf({ yaw, pitch }: Orientation): Mat3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return [
    cy, 0, sy,
    sp * sy, cp, -sp * cy,
    -cp * sy, sp, cp * cy,
  ];
}

/** Orthographic projection of a rotated point: screen (x, y) plus depth. */
export function project(p: Vec3, r: Mat3): ProjectedPoint {
  return {
    x: r[0] * p.x + r[1] * p.y + r[2] * p.z,
    y: r[3] * p.x + r[4] * p.y + r[5] * p.z,
    depth: r[6] * p.x + r[7] * p.y + r[8] * p.z,
  };
}

/** The rotated outward normal's view-axis component: >0 faces the camera. */
function facing(face: FaceBasis, r: Mat3): number {
  return project(face.normal, r).depth;
}

/**
 * Backface culling. Strictly geometric — no hard-coded face count: a generic
 * orientation shows three faces, but seen exactly edge-on it can be two (or one
 * at the axis-aligned anchors).
 */
export function isFaceVisible(face: FaceBasis, r: Mat3): boolean {
  return facing(face, r) > VISIBLE_EPS;
}

/**
 * The visible faces in painter's order: back to front, NEAREST LAST. Under an
 * orthographic camera a face plane's depth order equals its rotated normal's
 * view component, so sorting by `facing` ascending is exact. Culled faces are
 * never listed.
 */
export function visibleFacesBackToFront(r: Mat3): FaceBasis[] {
  return CUBE_FACES
    .filter((face) => isFaceVisible(face, r))
    .sort((a, b) => facing(a, r) - facing(b, r));
}

/** The 3D position of a face-local point, in face-fraction steps of `CELL`. */
function facePoint(face: FaceBasis, row: number, col: number): Vec3 {
  return {
    x: face.origin.x + col * CELL * face.u.x + row * CELL * face.v.x,
    y: face.origin.y + col * CELL * face.u.y + row * CELL * face.v.y,
    z: face.origin.z + col * CELL * face.u.z + row * CELL * face.v.z,
  };
}

/**
 * Projects a CONTINUOUS face-local point (row/col in cell units, centres at
 * +0.5). This is the one primitive every glyph must go through: a shape is
 * defined point by point in cube space and projected, never composed in
 * screen space and translated — otherwise it detaches from the sheared face
 * at tumbled attitudes.
 */
export function projectFaceLocal(
  face: FaceBasis,
  row: number,
  col: number,
  r: Mat3,
): ProjectedPoint {
  return project(facePoint(face, row, col), r);
}

/**
 * The projected quad of one cell, corners in order top-left, top-right,
 * bottom-right, bottom-left (in FACE-LOCAL terms). Shared by the renderer and
 * {@link hitTest}, so what is drawn and what is tappable can never disagree.
 */
export function cellPolygon(
  face: FaceBasis,
  row: number,
  col: number,
  r: Mat3,
): [ProjectedPoint, ProjectedPoint, ProjectedPoint, ProjectedPoint] {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 0 ||
    row >= FACE_CELLS ||
    col < 0 ||
    col >= FACE_CELLS
  ) {
    throw new RangeError(`cell (${row}, ${col}) is outside a ${FACE_CELLS}×${FACE_CELLS} face`);
  }
  return [
    project(facePoint(face, row, col), r),
    project(facePoint(face, row, col + 1), r),
    project(facePoint(face, row + 1, col + 1), r),
    project(facePoint(face, row + 1, col), r),
  ];
}

/** Convex-polygon containment: all edge cross products share a sign. */
function quadContains(quad: readonly ProjectedPoint[], point: Vec2): boolean {
  let sign = 0;
  for (let i = 0; i < quad.length; i += 1) {
    const a = quad[i];
    const b = quad[(i + 1) % quad.length];
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    if (Math.abs(cross) < 1e-12) {
      continue; // on the edge line: let either neighbouring cell claim it
    }
    if (sign === 0) {
      sign = Math.sign(cross);
    } else if (Math.sign(cross) !== sign) {
      return false;
    }
  }
  return true;
}

/**
 * Which cell a screen point (in cube units) lands on. Walks the tappable faces
 * FRONT TO BACK and point-in-polygon-tests each cell's {@link cellPolygon}.
 *
 * Faces facing the camera by less than {@link HIT_TEST_MIN_FACING} are skipped:
 * seen that edge-on their cells are slivers, and a sliver must be UNTAPPABLE
 * rather than mis-tappable (a wrong tap costs a life). A culled (back) face is
 * never returned, so the player cannot tap an arrow they cannot see.
 */
export function hitTest(point: Vec2, r: Mat3): CellHit | null {
  const tappable = CUBE_FACES
    .filter((face) => facing(face, r) >= HIT_TEST_MIN_FACING)
    .sort((a, b) => facing(b, r) - facing(a, r)); // nearest first

  for (const face of tappable) {
    for (let row = 0; row < FACE_CELLS; row += 1) {
      for (let col = 0; col < FACE_CELLS; col += 1) {
        if (quadContains(cellPolygon(face, row, col, r), point)) {
          return { face: face.index, row, col };
        }
      }
    }
  }
  return null;
}

/**
 * Where an escaping arrow flies on screen: the face-local exit direction,
 * rotated and projected. UP/DOWN run along −v/+v (rows), LEFT/RIGHT along
 * −u/+u (columns) — the same convention the board uses.
 *
 * NOT normalized: when the lane points nearly at (or away from) the camera the
 * screen component legitimately shrinks toward zero, and the caller (the escape
 * animation) should treat a tiny vector as "flies toward the viewer", not
 * normalize it into noise.
 */
export function outwardScreenVector(
  face: FaceBasis,
  direction: DirectionName,
  r: Mat3,
): Vec2 {
  const along =
    direction === 'UP' || direction === 'DOWN' ? face.v : face.u;
  const s = direction === 'UP' || direction === 'LEFT' ? -1 : 1;
  const p = project({ x: s * along.x, y: s * along.y, z: s * along.z }, r);
  return { x: p.x, y: p.y };
}
