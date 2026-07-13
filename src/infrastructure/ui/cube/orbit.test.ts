import {
  CUBE_FACES,
  FACE_CELLS,
  HIT_TEST_MIN_FACING,
  cellPolygon,
  hitTest,
  isFaceVisible,
  outwardScreenVector,
  project,
  rotationOf,
  visibleFacesBackToFront,
  type FaceBasis,
  type Mat3,
  type Vec3,
} from './orbit';
import { CubeLayout } from '../../../adapters/cube/CubeLayout';

/** Anchor orientations: the rotation that brings each named face square to the camera. */
const FACING_CAMERA: ReadonlyArray<{ name: string; yaw: number; pitch: number }> = [
  { name: 'FRONT', yaw: 0, pitch: 0 },
  { name: 'RIGHT', yaw: -Math.PI / 2, pitch: 0 },
  { name: 'BACK', yaw: Math.PI, pitch: 0 },
  { name: 'LEFT', yaw: Math.PI / 2, pitch: 0 },
  { name: 'TOP', yaw: 0, pitch: -Math.PI / 2 },
  { name: 'BOTTOM', yaw: 0, pitch: Math.PI / 2 },
];

const IDENTITY = rotationOf({ yaw: 0, pitch: 0 });

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function add(a: Vec3, b: Vec3, scale: number): Vec3 {
  return { x: a.x + scale * b.x, y: a.y + scale * b.y, z: a.z + scale * b.z };
}

function expectVec3Close(actual: Vec3, expected: Vec3): void {
  expect(actual.x).toBeCloseTo(expected.x, 10);
  expect(actual.y).toBeCloseTo(expected.y, 10);
  expect(actual.z).toBeCloseTo(expected.z, 10);
}

/** Screen centroid of a cell's projected quad (a parallelogram, so it is inside). */
function centroidOfCell(face: FaceBasis, row: number, col: number, r: Mat3) {
  const quad = cellPolygon(face, row, col, r);
  return {
    x: (quad[0].x + quad[1].x + quad[2].x + quad[3].x) / 4,
    y: (quad[0].y + quad[1].y + quad[2].y + quad[3].y) / 4,
  };
}

describe('orbit', () => {
  /**
   * R3 — the face-orientation table is correctness-critical for the visuals:
   * one flipped sign renders a face mirrored or slides an arrow off the wrong
   * edge, with nothing throwing. These tests pin every basis.
   */
  describe('face basis pinning (R3)', () => {
    it('should_list_faces_in_cube_layout_order_index_aligned', () => {
      // The renderer maps board block k → CUBE_FACES[k]; the two orders MUST
      // be the same or every face draws another face's cells.
      const layoutNames = new CubeLayout(FACE_CELLS).faces.map((f) => f.name);
      expect(CUBE_FACES.map((f) => f.name)).toEqual(layoutNames);
      CUBE_FACES.forEach((face, i) => expect(face.index).toBe(i));
    });

    it('should_give_every_face_an_orthonormal_right_handed_basis', () => {
      for (const face of CUBE_FACES) {
        expect(dot(face.u, face.u)).toBeCloseTo(1, 10);
        expect(dot(face.v, face.v)).toBeCloseTo(1, 10);
        expect(dot(face.u, face.v)).toBeCloseTo(0, 10);
        // Outward normal is exactly u × v: consistent winding on all six.
        expectVec3Close(cross(face.u, face.v), face.normal);
      }
    });

    it('should_place_every_face_corner_on_the_cube_surface', () => {
      for (const face of CUBE_FACES) {
        const corners = [
          face.origin,
          add(face.origin, face.u, 2),
          add(face.origin, face.v, 2),
          add(add(face.origin, face.u, 2), face.v, 2),
        ];
        for (const corner of corners) {
          // Every coordinate is ±1 (a cube corner) …
          for (const value of [corner.x, corner.y, corner.z]) {
            expect(Math.abs(value)).toBeCloseTo(1, 10);
          }
          // … and the corner lies on this face's plane (normal axis pinned).
          expect(dot(corner, face.normal)).toBeCloseTo(1, 10);
        }
      }
    });

    it('should_tile_the_cube_with_each_of_the_8_corners_shared_by_3_faces', () => {
      const seen = new Map<string, number>();
      for (const face of CUBE_FACES) {
        for (const corner of [
          face.origin,
          add(face.origin, face.u, 2),
          add(face.origin, face.v, 2),
          add(add(face.origin, face.u, 2), face.v, 2),
        ]) {
          const key = `${Math.round(corner.x)},${Math.round(corner.y)},${Math.round(corner.z)}`;
          seen.set(key, (seen.get(key) ?? 0) + 1);
        }
      }
      expect(seen.size).toBe(8); // exactly the 8 cube corners
      for (const count of seen.values()) {
        expect(count).toBe(3); // each shared by exactly 3 faces
      }
    });

    it.each(FACING_CAMERA)(
      'should_read_the_face_unmirrored_when_it_squarely_faces_the_camera: $name',
      ({ name, yaw, pitch }) => {
        // At its anchor orientation the face's normal points at the camera, its
        // u projects to screen-RIGHT and its v to screen-DOWN — i.e. the face
        // reads exactly like the flat board (arrows visibly slide the right way).
        const face = CUBE_FACES.find((f) => f.name === name)!;
        const r = rotationOf({ yaw, pitch });
        expect(project(face.normal, r).depth).toBeCloseTo(1, 10);
        const u = project(face.u, r);
        const v = project(face.v, r);
        expect(u.x).toBeCloseTo(1, 10);
        expect(u.y).toBeCloseTo(0, 10);
        expect(v.x).toBeCloseTo(0, 10);
        expect(v.y).toBeCloseTo(1, 10);
      },
    );
  });

  describe('visibility', () => {
    it('should_show_exactly_one_face_at_an_axis_aligned_anchor', () => {
      const visible = visibleFacesBackToFront(IDENTITY);
      expect(visible.map((f) => f.name)).toEqual(['FRONT']);
    });

    it('should_show_exactly_two_faces_seen_edge_on', () => {
      // Yaw 45°: FRONT and LEFT share the silhouette; TOP/BOTTOM are exactly
      // edge-on (dot 0) and culled. No hard-coded "three visible faces".
      const r = rotationOf({ yaw: Math.PI / 4, pitch: 0 });
      const visible = visibleFacesBackToFront(r);
      expect(visible.map((f) => f.name).sort()).toEqual(['FRONT', 'LEFT']);
    });

    it('should_show_three_faces_at_a_generic_orientation', () => {
      const r = rotationOf({ yaw: 0.5, pitch: 0.4 });
      const visible = visibleFacesBackToFront(r);
      expect(visible).toHaveLength(3);
      expect(visible.map((f) => f.name).sort()).toEqual(['BOTTOM', 'FRONT', 'LEFT']);
    });

    it('should_never_report_a_back_face_visible', () => {
      for (const orientation of [
        { yaw: 0.3, pitch: 0.9 },
        { yaw: -2.1, pitch: -0.7 },
        { yaw: 4.0, pitch: 1.3 },
      ]) {
        const r = rotationOf(orientation);
        for (const face of CUBE_FACES) {
          if (isFaceVisible(face, r)) {
            expect(project(face.normal, r).depth).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  describe('painter ordering', () => {
    it('should_order_visible_faces_back_to_front_nearest_last', () => {
      for (const orientation of [
        { yaw: 0.5, pitch: 0.4 },
        { yaw: -0.6, pitch: -0.5 },
        { yaw: 2.5, pitch: 0.7 },
      ]) {
        const r = rotationOf(orientation);
        const ordered = visibleFacesBackToFront(r);
        const depths = ordered.map((f) => project(f.normal, r).depth);
        for (let i = 1; i < depths.length; i += 1) {
          expect(depths[i]).toBeGreaterThanOrEqual(depths[i - 1]);
        }
        // Nearest face last, and no culled face anywhere in the list.
        expect(depths[depths.length - 1]).toBe(Math.max(...depths));
        for (const face of ordered) {
          expect(isFaceVisible(face, r)).toBe(true);
        }
      }
    });
  });

  describe('cellPolygon', () => {
    it('should_project_front_cell_0_0_to_the_top_left_at_identity', () => {
      // The face spans [-1,1]²; with N=5 a cell is 0.4 across.
      const [tl, tr, br, bl] = cellPolygon(CUBE_FACES[0], 0, 0, IDENTITY);
      expect(tl.x).toBeCloseTo(-1, 10);
      expect(tl.y).toBeCloseTo(-1, 10);
      expect(tr.x).toBeCloseTo(-0.6, 10);
      expect(tr.y).toBeCloseTo(-1, 10);
      expect(br.x).toBeCloseTo(-0.6, 10);
      expect(br.y).toBeCloseTo(-0.6, 10);
      expect(bl.x).toBeCloseTo(-1, 10);
      expect(bl.y).toBeCloseTo(-0.6, 10);
    });

    it('should_reject_a_cell_outside_the_face', () => {
      expect(() => cellPolygon(CUBE_FACES[0], -1, 0, IDENTITY)).toThrow(RangeError);
      expect(() => cellPolygon(CUBE_FACES[0], 0, FACE_CELLS, IDENTITY)).toThrow(RangeError);
      expect(() => cellPolygon(CUBE_FACES[0], 1.5, 0, IDENTITY)).toThrow(RangeError);
    });
  });

  describe('hitTest', () => {
    it('should_hit_the_center_cell_of_the_facing_face_at_identity', () => {
      expect(hitTest({ x: 0, y: 0 }, IDENTITY)).toEqual({ face: 0, row: 2, col: 2 });
    });

    it('should_never_hit_the_hidden_back_face_behind_the_front_one', () => {
      // At identity BACK projects onto the same silhouette as FRONT; every hit
      // must resolve to FRONT (face 0), never to the culled BACK (face 2).
      for (const point of [
        { x: -0.9, y: -0.9 },
        { x: 0.9, y: 0.9 },
        { x: 0.3, y: -0.5 },
      ]) {
        expect(hitTest(point, IDENTITY)?.face).toBe(0);
      }
    });

    it('should_return_null_for_a_point_off_the_cube', () => {
      expect(hitTest({ x: 5, y: 5 }, IDENTITY)).toBeNull();
      expect(hitTest({ x: -1.01, y: 0 }, IDENTITY)).toBeNull();
    });

    it('should_round_trip_every_tappable_face_through_cell_centroids', () => {
      // Drawing and tapping share cellPolygon: the centroid of any drawn cell
      // must hit-test back to exactly that cell. The two orientations together
      // cover all six faces (FRONT/RIGHT/TOP and BACK/LEFT/BOTTOM).
      const cells: Array<[number, number]> = [[0, 0], [2, 3], [4, 4], [1, 0]];
      for (const orientation of [
        { yaw: -0.6, pitch: -0.5 },
        { yaw: 2.5, pitch: 0.7 },
      ]) {
        const r = rotationOf(orientation);
        const tappable = CUBE_FACES.filter(
          (face) => project(face.normal, r).depth >= HIT_TEST_MIN_FACING,
        );
        expect(tappable.length).toBeGreaterThanOrEqual(3);
        for (const face of tappable) {
          for (const [row, col] of cells) {
            const hit = hitTest(centroidOfCell(face, row, col, r), r);
            expect(hit).toEqual({ face: face.index, row, col });
          }
        }
      }
    });

    it('should_treat_a_nearly_edge_on_face_as_untappable_not_mistappable', () => {
      // Yaw −1.52: RIGHT is almost square to the camera (facing ≈ 0.999) while
      // FRONT survives culling (facing ≈ 0.051 > 0) but is far under the 0.15
      // tap threshold. FRONT's sliver spans x ∈ [−1.049, −0.948) on screen.
      const r = rotationOf({ yaw: -1.52, pitch: 0 });
      const front = CUBE_FACES[0];
      expect(isFaceVisible(front, r)).toBe(true); // still drawn …
      expect(project(front.normal, r).depth).toBeLessThan(HIT_TEST_MIN_FACING);

      // … but a point inside ONLY the sliver returns null (untappable), while
      // the square-on RIGHT face next to it keeps working.
      expect(hitTest({ x: -1.0, y: 0 }, r)).toBeNull();
      expect(hitTest({ x: 0.05, y: 0 }, r)?.face).toBe(1);
    });
  });

  describe('outwardScreenVector', () => {
    it('should_map_the_four_directions_to_screen_axes_on_the_facing_face', () => {
      const front = CUBE_FACES[0];
      const cases = [
        { direction: 'RIGHT', x: 1, y: 0 },
        { direction: 'LEFT', x: -1, y: 0 },
        { direction: 'DOWN', x: 0, y: 1 },
        { direction: 'UP', x: 0, y: -1 },
      ] as const;
      for (const { direction, x, y } of cases) {
        const v = outwardScreenVector(front, direction, IDENTITY);
        expect(v.x).toBeCloseTo(x, 10);
        expect(v.y).toBeCloseTo(y, 10);
      }
    });

    it('should_keep_right_meaning_screen_right_on_a_face_turned_to_camera', () => {
      // RIGHT face squarely facing the camera: an arrow pointing RIGHT must
      // visibly fly screen-right, exactly as on the flat board.
      const r = rotationOf({ yaw: -Math.PI / 2, pitch: 0 });
      const v = outwardScreenVector(CUBE_FACES[1], 'RIGHT', r);
      expect(v.x).toBeCloseTo(1, 10);
      expect(v.y).toBeCloseTo(0, 10);
    });

    it('should_shrink_toward_zero_when_the_lane_points_at_the_camera', () => {
      // FRONT's u points at the camera at yaw −π/2: the screen component is
      // legitimately ~0 (the arrow flies toward the viewer), NOT normalized.
      const r = rotationOf({ yaw: -Math.PI / 2, pitch: 0 });
      const v = outwardScreenVector(CUBE_FACES[0], 'RIGHT', r);
      expect(Math.hypot(v.x, v.y)).toBeLessThan(1e-9);
    });
  });
});
