import type { CubeLayout } from '../../../adapters/cube/CubeLayout';
import type { DirectionName } from '../../../domain/value-objects/Direction';
import type { EscapingArrow } from '../hooks/useGame';

/**
 * Pure model of one escape flight on the cube — no React, no timers, no
 * projection. The flight's STATE lives in cube space: a rail of face-local
 * cells and a single progress scalar; screen coordinates are derived per frame
 * by the component, so orbiting mid-flight keeps the flight glued to the cube.
 *
 * The R1 discriminator lives here: the flat domain path runs into PADDING
 * (which does not exist visually — it is the escape medium off a face edge),
 * while a hole INSIDE the face is gameplay and still swallows. `layout.
 * isPadding` tells them apart: a padding "hole" means the arrow FLIES OFF the
 * cube; an in-face hole truncates the rail and the arrow drops in.
 */

export interface LocalCell {
  readonly row: number;
  readonly col: number;
}

export interface FlightModel {
  /** CubeLayout / CUBE_FACES index of the face the flight happens on. */
  readonly faceIndex: number;
  /** Face-local rail, arrow tail first, ending at the face's last in-lane
   * cell (fly-off) or at the swallowing in-face hole. Adjacent cells: one rail
   * segment = one cell of travel. */
  readonly rail: ReadonlyArray<LocalCell>;
  /** Arc length of the arrow's body along the rail (cells.length − 1). */
  readonly bodyArcs: number;
  /** Total arc length of the rail (rail.length − 1). */
  readonly totalArcs: number;
  /** True: padding escape, the arrow leaves the cube. False: in-face hole. */
  readonly flyOff: boolean;
  /** Rail arc indices of the lane's ghost stars (pop when the head passes). */
  readonly starArcs: ReadonlyArray<number>;
  /** The head's exit direction (face-local, same names as the board). */
  readonly exitDirection: DirectionName;
  /** Progress value at which the flight is over (tail reached the rail end,
   * plus the off-cube fade travel when flying off). */
  readonly endProgress: number;
}

/** Off-cube travel, in cells, over which a flying-off arrow fades out. */
export const FLY_OFF_EXTRA_CELLS = 6;

/** Constant glide speed, cells per second — parity with the flat RailEscape. */
export const FLIGHT_SPEED_CELLS_PER_SEC = 16;

const DELTA: Record<DirectionName, LocalCell> = {
  UP: { row: -1, col: 0 },
  DOWN: { row: 1, col: 0 },
  LEFT: { row: 0, col: -1 },
  RIGHT: { row: 0, col: 1 },
};

/**
 * Builds the flight model from the snapshot useGame already takes (the same
 * one the flat overlay consumes) plus the cube topology. Returns null only for
 * a snapshot whose head is not on a face — a malformed flight is skipped, not
 * crashed on.
 */
export function buildFlightModel(
  flight: EscapingArrow,
  layout: CubeLayout,
): FlightModel | null {
  const head = flight.cells[flight.cells.length - 1];
  if (!head) {
    return null;
  }
  const headLocal = layout.toLocal(head.row, head.col);
  if (headLocal === null) {
    return null;
  }
  const { faceIndex } = headLocal;

  // The arrow's own body, face-localized (tail first, like the snapshot).
  const rail: LocalCell[] = [];
  for (const cell of flight.cells) {
    const local = layout.toLocal(cell.row, cell.col);
    if (local === null || local.faceIndex !== faceIndex) {
      return null; // a body straddling faces cannot happen; refuse gracefully
    }
    rail.push({ row: local.localRow, col: local.localCol });
  }

  // R1: an in-face hole swallows; the padding "hole" means the lane runs off
  // the face edge and the arrow flies off the cube.
  const inFaceHole =
    flight.hole !== null && !layout.isPadding(flight.hole.row, flight.hole.col)
      ? layout.toLocal(flight.hole.row, flight.hole.col)
      : null;

  // The exit lane, face-local, from the head outward: stop AT the swallowing
  // hole, or at the face edge when the lane leaves the face.
  const delta = DELTA[flight.direction];
  const n = layout.faceSize;
  let row = rail[rail.length - 1].row + delta.row;
  let col = rail[rail.length - 1].col + delta.col;
  let holeReached = false;
  while (row >= 0 && row < n && col >= 0 && col < n && !holeReached) {
    rail.push({ row, col });
    holeReached =
      inFaceHole !== null && row === inFaceHole.localRow && col === inFaceHole.localCol;
    row += delta.row;
    col += delta.col;
  }

  // Ghost stars, as rail arc indices (all stars sit before the first hole, so
  // they are always on this face's stretch of the rail).
  const starArcs: number[] = [];
  for (const star of flight.stars) {
    const local = layout.toLocal(star.row, star.col);
    if (local === null || local.faceIndex !== faceIndex) {
      continue;
    }
    const arc = rail.findIndex(
      (cell) => cell.row === local.localRow && cell.col === local.localCol,
    );
    if (arc >= 0) {
      starArcs.push(arc);
    }
  }

  const totalArcs = rail.length - 1;
  const flyOff = !holeReached;
  return {
    faceIndex,
    rail,
    bodyArcs: flight.cells.length - 1,
    totalArcs,
    flyOff,
    starArcs,
    exitDirection: flight.direction,
    // Fly-off: the tail travels past the edge and fades out over the extra
    // cells. Hole: the flight ends the moment the tail reaches the pit.
    endProgress: flyOff ? totalArcs + FLY_OFF_EXTRA_CELLS : totalArcs,
  };
}

/**
 * The face-local point (in fractional cell coordinates, cell centres at +0.5)
 * at arc position `s` along the rail. Clamped to the rail; travel beyond the
 * rail end (the off-cube stretch of a fly-off) is the component's business —
 * it happens in screen space along outwardScreenVector.
 */
export function pointAlongRail(model: FlightModel, s: number): { row: number; col: number } {
  const clamped = Math.max(0, Math.min(s, model.totalArcs));
  const i = Math.min(Math.floor(clamped), model.totalArcs - 1);
  const t = model.totalArcs === 0 ? 0 : clamped - i;
  const a = model.rail[Math.max(0, i)];
  const b = model.rail[Math.max(0, Math.min(i + 1, model.rail.length - 1))];
  return {
    row: a.row + 0.5 + (b.row - a.row) * t,
    col: a.col + 0.5 + (b.col - a.col) * t,
  };
}

/**
 * The body's face-local sample points between tail arc `sTail` and front arc
 * `sFront` (both clamped to the rail): the two ends plus every rail bend in
 * between, so elbows stay elbows. Points beyond the rail end are the
 * component's screen-space extension.
 */
export function bodyLocalPoints(
  model: FlightModel,
  sTail: number,
  sFront: number,
): Array<{ row: number; col: number }> {
  const from = Math.max(0, Math.min(sTail, model.totalArcs));
  const to = Math.max(from, Math.min(sFront, model.totalArcs));
  const points = [pointAlongRail(model, from)];
  for (let arc = Math.floor(from) + 1; arc <= Math.ceil(to) - 1; arc += 1) {
    if (arc > from && arc < to) {
      points.push(pointAlongRail(model, arc));
    }
  }
  points.push(pointAlongRail(model, to));
  return points;
}
