import {
  FLY_OFF_EXTRA_CELLS,
  bodyLocalPoints,
  buildFlightModel,
  pointAlongRail,
} from './cubeFlight';
import { CubeLayout } from '../../../adapters/cube/CubeLayout';
import type { EscapingArrow } from '../hooks/useGame';

const layout = new CubeLayout(5);

/** A snapshot like useGame takes: cells tail-first, board coordinates. */
function flightOf(overrides: Partial<EscapingArrow> = {}): EscapingArrow {
  return {
    arrowId: 1001,
    color: '#FFD166',
    direction: 'RIGHT',
    // RIGHT face (block at 5,5): single-cell arrow at local (0,0) = board (5,5).
    cells: [{ row: 5, col: 5, direction: 'RIGHT' }],
    stars: [],
    hole: { row: 5, col: 10 }, // first padding cell past the face edge
    ...overrides,
  };
}

describe('cubeFlight', () => {
  describe('buildFlightModel — the R1 discriminator', () => {
    it('should_fly_off_when_the_snapshot_hole_is_padding', () => {
      // The domain sees the padding as a hole; visually it does not exist —
      // the lane runs to the face edge and the arrow leaves the cube.
      const model = buildFlightModel(flightOf(), layout)!;

      expect(model.faceIndex).toBe(1);
      expect(model.flyOff).toBe(true);
      // Rail: the body cell (0,0) then the in-face lane (0,1)..(0,4) — it
      // stops AT the edge; the padding cell (local col 5) is never on it.
      expect(model.rail).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 0, col: 4 },
      ]);
      expect(model.totalArcs).toBe(4);
      // The flight ends only after the off-cube fade travel.
      expect(model.endProgress).toBe(4 + FLY_OFF_EXTRA_CELLS);
    });

    it('should_stop_at_an_in_face_hole_and_not_fly_off', () => {
      // A hole INSIDE the face is gameplay: the rail truncates at the pit.
      const model = buildFlightModel(
        flightOf({ hole: { row: 5, col: 8 } }), // local (0, 3): inside RIGHT
        layout,
      )!;

      expect(model.flyOff).toBe(false);
      expect(model.rail).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 }, // the hole: last rail cell — nothing beyond it
      ]);
      expect(model.totalArcs).toBe(3);
      // Over the moment the tail reaches the pit: no fade travel.
      expect(model.endProgress).toBe(3);
    });

    it('should_map_lane_stars_to_their_rail_arcs', () => {
      const model = buildFlightModel(
        flightOf({ stars: [{ row: 5, col: 7 }, { row: 5, col: 9 }] }), // local (0,2) & (0,4)
        layout,
      )!;
      expect(model.starArcs).toEqual([2, 4]);
    });

    it('should_localize_a_winding_body_and_keep_its_arc_length', () => {
      // A 3-segment arrow on FRONT: tail (1,0)→(0,0)→head (0,1), exiting RIGHT.
      const model = buildFlightModel(
        flightOf({
          cells: [
            { row: 1, col: 0, direction: 'UP' },
            { row: 0, col: 0, direction: 'RIGHT' },
            { row: 0, col: 1, direction: 'RIGHT' },
          ],
          hole: { row: 0, col: 5 }, // padding past FRONT's edge
        }),
        layout,
      )!;

      expect(model.faceIndex).toBe(0);
      expect(model.bodyArcs).toBe(2);
      expect(model.rail.slice(0, 3)).toEqual([
        { row: 1, col: 0 },
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ]);
      expect(model.flyOff).toBe(true);
    });

    it('should_refuse_a_snapshot_whose_head_is_not_on_a_face', () => {
      expect(buildFlightModel(flightOf({ cells: [{ row: 0, col: 7, direction: 'RIGHT' }] }), layout)).toBeNull();
      expect(buildFlightModel(flightOf({ cells: [] }), layout)).toBeNull();
    });
  });

  describe('pointAlongRail', () => {
    const model = buildFlightModel(flightOf(), layout)!;

    it('should_interpolate_between_cell_centres', () => {
      expect(pointAlongRail(model, 0)).toEqual({ row: 0.5, col: 0.5 });
      expect(pointAlongRail(model, 1)).toEqual({ row: 0.5, col: 1.5 });
      expect(pointAlongRail(model, 2.5)).toEqual({ row: 0.5, col: 3 });
    });

    it('should_clamp_to_the_rail_ends', () => {
      expect(pointAlongRail(model, -1)).toEqual({ row: 0.5, col: 0.5 });
      expect(pointAlongRail(model, 99)).toEqual({ row: 0.5, col: 4.5 });
    });
  });

  describe('bodyLocalPoints', () => {
    it('should_include_the_bends_between_tail_and_front', () => {
      // Winding body through the corner at local (0,0).
      const model = buildFlightModel(
        flightOf({
          cells: [
            { row: 1, col: 0, direction: 'UP' },
            { row: 0, col: 0, direction: 'RIGHT' },
            { row: 0, col: 1, direction: 'RIGHT' },
          ],
          hole: { row: 0, col: 5 },
        }),
        layout,
      )!;

      // Body from arc 0.5 to arc 2.5: tail point, the two bends, front point.
      const points = bodyLocalPoints(model, 0.5, 2.5);
      expect(points).toEqual([
        { row: 1, col: 0.5 }, // halfway up the tail cell
        { row: 0.5, col: 0.5 }, // bend at (0,0)
        { row: 0.5, col: 1.5 }, // bend at (0,1)
        { row: 0.5, col: 2 }, // front, halfway across (0,2)
      ]);
    });

    it('should_clamp_the_window_to_the_rail_for_the_off_cube_stretch', () => {
      const model = buildFlightModel(flightOf(), layout)!;
      // Front far past the rail end: the on-face part ends at the edge cell.
      const points = bodyLocalPoints(model, 3.5, 9);
      expect(points[points.length - 1]).toEqual({ row: 0.5, col: 4.5 });
    });
  });
});
