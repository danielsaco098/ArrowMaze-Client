import {
  INITIAL_ORIENTATION,
  INITIAL_ROTATION,
  ORBIT_RADIANS_PER_PX,
  TAP_MAX_DURATION_MS,
  TAP_MAX_MOVEMENT_PX,
  applyDrag,
  cubeToScreen,
  isTap,
  screenToCube,
} from './orbitGesture';
import {
  CUBE_FACES,
  HIT_TEST_MIN_FACING,
  cellPolygon,
  hitTest,
  project,
  rotationOf,
  visibleFacesBackToFront,
  type FaceBasis,
  type Mat3,
} from './orbit';

/** Pixels of vertical drag that tumble the cube by `radians`. */
const pxFor = (radians: number): number => radians / ORBIT_RADIANS_PER_PX;

/** Screen centroid (cube units) of a cell's projected quad. */
function centroidOfCell(face: FaceBasis, row: number, col: number, r: Mat3) {
  const quad = cellPolygon(face, row, col, r);
  return {
    x: (quad[0].x + quad[1].x + quad[2].x + quad[3].x) / 4,
    y: (quad[0].y + quad[1].y + quad[2].y + quad[3].y) / 4,
  };
}

describe('orbitGesture', () => {
  describe('trackball rotation', () => {
    it('should_tumble_through_the_pole_to_show_the_back_face_upside_down', () => {
      // A long downward drag, applied in many increments like a real gesture:
      // the cube rolls a half turn about the screen's horizontal axis. Under
      // the old yaw/pitch state this was impossible (clamped at ±85°).
      let r: Mat3 = rotationOf({ yaw: 0, pitch: 0 }); // FRONT facing the camera
      const steps = 40;
      for (let i = 0; i < steps; i += 1) {
        r = applyDrag(r, 0, pxFor(Math.PI) / steps);
      }

      // BACK now squarely faces the camera…
      expect(project(CUBE_FACES[2].normal, r).depth).toBeCloseTo(1, 5);
      // …UPSIDE-DOWN: its row direction (v) points screen-UP. No snap-back.
      expect(project(CUBE_FACES[2].v, r).y).toBeCloseTo(-1, 5);
    });

    it('should_pass_through_top_halfway_into_the_tumble', () => {
      // Continuity through the pole: at a quarter turn the TOP faces the
      // camera — the exact attitude the old clamp forbade.
      let r: Mat3 = rotationOf({ yaw: 0, pitch: 0 });
      const steps = 20;
      for (let i = 0; i < steps; i += 1) {
        r = applyDrag(r, 0, pxFor(Math.PI / 2) / steps);
      }
      expect(project(CUBE_FACES[4].normal, r).depth).toBeCloseTo(1, 5);
    });

    it('should_keep_horizontal_drags_rotating_in_the_same_screen_direction_past_the_pole', () => {
      // THE camera-space property — the test Euler angles FAIL: past 90° of
      // vertical tumble, a yaw-based drag visually reverses (yaw turns about
      // the WORLD vertical, which now points away from the screen's). With the
      // premultiplied trackball, the cube point facing the camera must move
      // screen-RIGHT on a rightward drag at ANY attitude.
      const attitudes = [
        applyDrag(rotationOf({ yaw: 0, pitch: 0 }), 0, pxFor(0.4)), // before the pole
        applyDrag(rotationOf({ yaw: 0, pitch: 0 }), 0, pxFor(Math.PI / 2 + 0.3)), // past it
        applyDrag(rotationOf({ yaw: 0, pitch: 0 }), 0, pxFor(Math.PI - 0.2)), // nearly inverted
      ];
      for (const r of attitudes) {
        // The cube point currently projecting dead-centre toward the viewer:
        const facingPoint = { x: r[6], y: r[7], z: r[8] }; // R⁻¹·(0,0,1) = Rᵀ row 3
        expect(project(facingPoint, r).depth).toBeCloseTo(1, 10);

        const after = applyDrag(r, 50, 0); // drag right
        expect(project(facingPoint, after).x).toBeGreaterThan(0); // moves right
      }
    });

    it('should_stay_orthonormal_and_keep_faces_convex_after_1000_random_drags', () => {
      // Drift guard: accumulated float multiplies would slowly skew R; the
      // per-increment renormalization must hold it on the rotation group.
      let seed = 42;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 2 ** 32;
      };
      let r: Mat3 = INITIAL_ROTATION;
      for (let i = 0; i < 1000; i += 1) {
        r = applyDrag(r, (rand() - 0.5) * 120, (rand() - 0.5) * 120);
      }

      // Rᵀ·R = I within epsilon.
      for (let i = 0; i < 3; i += 1) {
        for (let j = 0; j < 3; j += 1) {
          const dot = r[i] * r[j] + r[3 + i] * r[3 + j] + r[6 + i] * r[6 + j];
          expect(dot).toBeCloseTo(i === j ? 1 : 0, 9);
        }
      }

      // Every visible face still projects to a convex, non-degenerate polygon.
      for (const face of visibleFacesBackToFront(r)) {
        const quad = [
          cellPolygon(face, 0, 0, r)[0],
          cellPolygon(face, 0, 4, r)[1],
          cellPolygon(face, 4, 4, r)[2],
          cellPolygon(face, 4, 0, r)[3],
        ];
        let sign = 0;
        for (let i = 0; i < 4; i += 1) {
          const a = quad[i];
          const b = quad[(i + 1) % 4];
          const c = quad[(i + 2) % 4];
          const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
          expect(Math.abs(cross)).toBeGreaterThan(1e-6); // non-degenerate
          if (sign === 0) sign = Math.sign(cross);
          expect(Math.sign(cross)).toBe(sign); // convex: consistent winding
        }
      }
    });

    it('should_round_trip_hit_tests_at_arbitrary_tumbled_attitudes', () => {
      // The drawing↔tapping agreement must survive tumbling: at attitudes only
      // reachable through the (formerly clamped) pole, every tappable cell's
      // centroid still hit-tests back to exactly itself.
      const dragSequences: Array<Array<[number, number]>> = [
        [[0, pxFor(2.0)], [pxFor(0.7), 0]], // over the pole, then sideways
        [[pxFor(-1.2), pxFor(2.6)], [pxFor(0.3), pxFor(-0.4)]],
        [[pxFor(0.5), pxFor(-2.9)]], // backwards over the other pole
      ];
      for (const sequence of dragSequences) {
        let r: Mat3 = INITIAL_ROTATION;
        for (const [dx, dy] of sequence) {
          r = applyDrag(r, dx, dy);
        }
        const tappable = CUBE_FACES.filter(
          (face) => project(face.normal, r).depth >= HIT_TEST_MIN_FACING,
        );
        expect(tappable.length).toBeGreaterThanOrEqual(2);
        for (const face of tappable) {
          for (const [row, col] of [[0, 0], [2, 3], [4, 4]] as const) {
            const hit = hitTest(centroidOfCell(face, row, col, r), r);
            expect(hit).toEqual({ face: face.index, row, col });
          }
        }
      }
    });
  });

  describe('isTap', () => {
    it('should_accept_a_short_still_press_as_a_tap', () => {
      expect(isTap(0, 0)).toBe(true);
      expect(isTap(TAP_MAX_MOVEMENT_PX - 0.1, TAP_MAX_DURATION_MS - 1)).toBe(true);
    });

    it('should_reject_movement_at_or_over_the_threshold', () => {
      expect(isTap(TAP_MAX_MOVEMENT_PX, 50)).toBe(false);
      expect(isTap(60, 50)).toBe(false);
    });

    it('should_reject_a_long_press_even_when_still', () => {
      expect(isTap(0, TAP_MAX_DURATION_MS)).toBe(false);
      expect(isTap(0, 1000)).toBe(false);
    });
  });

  describe('screen mapping', () => {
    it('should_map_the_canvas_centre_to_the_cube_origin_and_round_trip', () => {
      const size = 400;
      expect(screenToCube({ x: 200, y: 200 }, size)).toEqual({ x: 0, y: 0 });
      for (const p of [{ x: 0.7, y: -1.2 }, { x: -1.6, y: 0.3 }]) {
        const back = screenToCube(cubeToScreen(p, size), size);
        expect(back.x).toBeCloseTo(p.x, 10);
        expect(back.y).toBeCloseTo(p.y, 10);
      }
    });

    it('should_keep_the_whole_cube_on_canvas_at_any_orientation', () => {
      // The scale reserves √3 cube units of radius: a cube corner (the farthest
      // point) always lands inside the canvas.
      const size = 400;
      const corner = cubeToScreen({ x: Math.sqrt(3), y: Math.sqrt(3) / 2 }, size);
      expect(corner.x).toBeLessThanOrEqual(size);
      expect(corner.y).toBeLessThanOrEqual(size);
    });
  });

  describe('initial orientation', () => {
    it('should_open_on_a_corner_view_with_three_tappable_faces', () => {
      const tappable = CUBE_FACES.filter(
        (face) => project(face.normal, INITIAL_ROTATION).depth >= HIT_TEST_MIN_FACING,
      );
      expect(tappable.map((f) => f.name).sort()).toEqual(['FRONT', 'RIGHT', 'TOP']);
    });

    it('should_build_the_initial_matrix_from_the_named_orientation', () => {
      expect(INITIAL_ROTATION).toEqual(rotationOf(INITIAL_ORIENTATION));
    });
  });
});
