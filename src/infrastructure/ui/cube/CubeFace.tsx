import React from 'react';
import { G, Path, Polygon, Circle } from 'react-native-svg';
import type { Board } from '../../../domain/entities/Board';
import { Position } from '../../../domain/value-objects/Position';
import type { DirectionName } from '../../../domain/value-objects/Direction';
import type { CubeLayout } from '../../../adapters/cube/CubeLayout';
import { cellPolygon, projectFaceLocal, type FaceBasis, type Mat3, type Vec2 } from './orbit';
import { theme } from '../theme';

interface Props {
  face: FaceBasis;
  board: Board;
  layout: CubeLayout;
  r: Mat3;
  /** Cube units → canvas pixels (closure over the canvas size). */
  toScreen: (p: Vec2) => Vec2;
  /** Board positions that started EMPTY: permanent holes (dark openings). */
  holes: ReadonlySet<string>;
  /** Arrow whose blocked tap is being flashed in the danger colour. */
  shakingArrowId: number | null;
}

/** Face-local (row, col) step for each board direction — faces are translated
 * blocks of the board, never rotated, so the names coincide. */
const DELTA: Record<DirectionName, { row: number; col: number }> = {
  UP: { row: -1, col: 0 },
  DOWN: { row: 1, col: 0 },
  LEFT: { row: 0, col: -1 },
  RIGHT: { row: 0, col: 1 },
};

/** Arrowhead proportions, in CELL units of face-local space. */
const HEAD_LEN_CELLS = 0.45;
const HEAD_HALF_CELLS = 0.22;

/**
 * One cube face, drawn in projected space under one hard rule: EVERY point of
 * EVERY glyph is defined in cube space (face + continuous local coordinates)
 * and passed through the projection — no shape is ever composed in screen
 * space and translated. A screen-space glyph looks fine at identity and
 * detaches from the sheared face at tumbled attitudes (measured: ~16° of
 * arrowhead misalignment at a 30° tumble before this rule was enforced).
 *
 * Consequences of the rule:
 *  - each arrow is ONE continuous Path through its cell centres (face-local →
 *    projected point by point), so elbows can never render as disconnected
 *    per-cell strokes;
 *  - the arrowhead triangle is built in face-local space from the head's exit
 *    direction and projected corner by corner, so head and body shear
 *    together (see the regression test on the projected perpendicular);
 *  - stars are polygons of face-local offsets, projected point by point.
 *
 * PADDING IS NEVER DRAWN: this component only iterates the face's own N×N
 * cells. The board's off-diagonal EMPTY sea is a domain implementation detail
 * (the escape medium), not part of the visible cube.
 */
export function CubeFace({
  face,
  board,
  layout,
  r,
  toScreen,
  holes,
  shakingArrowId,
}: Props): React.JSX.Element {
  const n = layout.faceSize;
  const local = (row: number, col: number): Vec2 =>
    toScreen(projectFaceLocal(face, row, col, r));

  // All cells of a face are congruent parallelograms under an orthographic
  // camera, so one cell fixes the stroke scale for the whole face.
  const sample = cellPolygon(face, 0, 0, r).map(toScreen);
  const edge = Math.min(
    Math.hypot(sample[1].x - sample[0].x, sample[1].y - sample[0].y),
    Math.hypot(sample[3].x - sample[0].x, sample[3].y - sample[0].y),
  );
  const stroke = edge * 0.16;

  // Face plate: the outer border of the whole face.
  const plate = [local(0, 0), local(0, n), local(n, n), local(n, 0)];

  const cells: React.JSX.Element[] = [];
  for (let row = 0; row < n; row += 1) {
    for (let col = 0; col < n; col += 1) {
      const boardCoord = layout.toBoard(face.index, row, col);
      const cell = board.cellAt(new Position(boardCoord.row, boardCoord.col));
      const quad = cellPolygon(face, row, col, r).map(toScreen);
      const key = `f${face.index}-${row}-${col}`;

      // Cell outline (and wall fill) — the face reads as a board grid.
      cells.push(
        <Polygon
          key={`${key}-cell`}
          points={pointsOf(quad)}
          fill={cell.kind === 'WALL' ? theme.colors.wall : 'transparent'}
          stroke={theme.colors.surfaceAlt}
          strokeWidth={1}
        />,
      );

      if (cell.kind === 'EMPTY' && holes.has(`${boardCoord.row},${boardCoord.col}`)) {
        // A permanent hole: a dark pit, like the flat board's. A circle is
        // orientation-less, so its centre is the only projected point needed.
        const center = local(row + 0.5, col + 0.5);
        cells.push(
          <Circle
            key={`${key}-hole`}
            cx={center.x}
            cy={center.y}
            r={edge * 0.28}
            fill={theme.colors.hole}
            opacity={0.55}
          />,
        );
      } else if (cell.kind === 'COLLECTIBLE') {
        cells.push(
          <Polygon
            key={`${key}-star`}
            points={faceStarPoints(face, row + 0.5, col + 0.5, 0.3, r, toScreen)}
            fill={theme.colors.exit}
          />,
        );
      }
    }
  }

  // Arrows: one continuous winding line per arrow, entirely in cube space.
  const lines: React.JSX.Element[] = [];
  for (const arrowId of board.arrowIds()) {
    const path = board.pathOfArrow(arrowId);
    const first = layout.toLocal(path[0].position.row, path[0].position.col);
    if (first === null || first.faceIndex !== face.index) {
      continue; // an arrow lives entirely on one face; this one is elsewhere
    }
    const centres = path.map((cell) => {
      const l = layout.toLocal(cell.position.row, cell.position.col)!;
      return { row: l.localRow + 0.5, col: l.localCol + 0.5 };
    });

    // Head geometry in FACE-LOCAL space: tip on the exit edge midpoint, base
    // behind it along the exit direction, corners along the face-local
    // perpendicular. Projected corner by corner, it shears with the face.
    const d = DELTA[path[path.length - 1].direction.name];
    const headCentre = centres[centres.length - 1];
    const tip = { row: headCentre.row + 0.5 * d.row, col: headCentre.col + 0.5 * d.col };
    const base = {
      row: tip.row - HEAD_LEN_CELLS * d.row,
      col: tip.col - HEAD_LEN_CELLS * d.col,
    };
    const perp = { row: d.col, col: -d.row };
    const corner1 = {
      row: base.row + HEAD_HALF_CELLS * perp.row,
      col: base.col + HEAD_HALF_CELLS * perp.col,
    };
    const corner2 = {
      row: base.row - HEAD_HALF_CELLS * perp.row,
      col: base.col - HEAD_HALF_CELLS * perp.col,
    };

    const linePoints = [...centres, base].map((p) => local(p.row, p.col));
    const color = arrowId === shakingArrowId ? theme.colors.danger : path[0].color;
    lines.push(
      <Path
        key={`arrow-${arrowId}`}
        testID={`cube-arrow-${arrowId}`}
        d={linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />,
      <Polygon
        key={`head-${arrowId}`}
        testID={`cube-arrowhead-${arrowId}`}
        points={pointsOf([tip, corner1, corner2].map((p) => local(p.row, p.col)))}
        fill={color}
      />,
    );
  }

  return (
    <G testID={`cube-face-${face.index}`}>
      <Polygon
        points={pointsOf(plate)}
        fill={theme.colors.surface}
        stroke={theme.colors.background}
        strokeWidth={2}
      />
      {cells}
      {lines}
    </G>
  );
}

function pointsOf(quad: readonly Vec2[]): string {
  return quad.map((p) => `${p.x},${p.y}`).join(' ');
}

/**
 * A four-spike star as face-local offsets around a centre, projected POINT BY
 * POINT so it shears with its face. Shared with CubeRailEscape's ghost stars.
 * `radiusCells` is in cell units of the face.
 */
export function faceStarPoints(
  face: FaceBasis,
  localRow: number,
  localCol: number,
  radiusCells: number,
  r: Mat3,
  toScreen: (p: Vec2) => Vec2,
): string {
  const inner = radiusCells * 0.4;
  const points: Vec2[] = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const radius = i % 2 === 0 ? radiusCells : inner;
    points.push(
      toScreen(
        projectFaceLocal(
          face,
          localRow + radius * Math.sin(angle),
          localCol + radius * Math.cos(angle),
          r,
        ),
      ),
    );
  }
  return pointsOf(points);
}

/** Triangle with its tip at `tip`, oriented along `center → tip`, composed in
 * SCREEN space from two already-projected points. Used ONLY by the flight's
 * off-cube stretch, where no cube-space definition exists (the arrow has left
 * the solid); resting arrows use the face-local head above. */
export function arrowheadPoints(center: Vec2, tip: Vec2): string {
  const dx = tip.x - center.x;
  const dy = tip.y - center.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const baseX = tip.x - ux * len * 0.55;
  const baseY = tip.y - uy * len * 0.55;
  const half = len * 0.32;
  return pointsOf([
    tip,
    { x: baseX - uy * half, y: baseY + ux * half },
    { x: baseX + uy * half, y: baseY - ux * half },
    tip,
  ]);
}
