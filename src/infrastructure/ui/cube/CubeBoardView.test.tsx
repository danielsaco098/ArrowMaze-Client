import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CubeBoardView, cubeBoardSize } from './CubeBoardView';
import { CUBE_FACES, cellPolygon, project, rotationOf, type Mat3 } from './orbit';
import { INITIAL_ORIENTATION, ORBIT_RADIANS_PER_PX, cubeToScreen } from './orbitGesture';
import { CubeLayout } from '../../../adapters/cube/CubeLayout';
import { Position } from '../../../domain/value-objects/Position';
import { arrow, buildBoard, empty } from '../../../test-support/buildBoard';
import type { Board } from '../../../domain/entities/Board';
import type { CellSpec } from '../../../application/ports/ICellFactory';

const N = 5;
const layout = new CubeLayout(N);
const R0: Mat3 = rotationOf(INITIAL_ORIENTATION);

/** A 30×30 cube board with one RIGHT-pointing arrow at local (0,0) per face. */
function cubeTestBoard(): Board {
  const specs: CellSpec[][] = Array.from({ length: layout.boardSize }, () =>
    Array.from({ length: layout.boardSize }, empty),
  );
  for (let f = 0; f < CubeLayout.FACE_COUNT; f += 1) {
    const { row, col } = layout.toBoard(f, 0, 0);
    specs[row][col] = arrow('RIGHT', { arrowId: layout.globalArrowId(f, 1) });
  }
  return buildBoard(specs);
}

/** The canvas-pixel point at the centre of a face's cell, per the shared math. */
function screenPointOfCell(faceIndex: number, row: number, col: number, r: Mat3) {
  const quad = cellPolygon(CUBE_FACES[faceIndex], row, col, r);
  const centroid = {
    x: (quad[0].x + quad[1].x + quad[2].x + quad[3].x) / 4,
    y: (quad[0].y + quad[1].y + quad[2].y + quad[3].y) / 4,
  };
  return cubeToScreen(centroid, cubeBoardSize());
}

function touch(x: number, y: number) {
  return { nativeEvent: { locationX: x, locationY: y } };
}

describe('CubeBoardView', () => {
  it('should_call_onTapCell_with_the_board_position_when_a_visible_arrow_is_tapped', async () => {
    // Arrange
    const onTapCell = jest.fn();
    const { getByTestId } = await render(
      <CubeBoardView
        board={cubeTestBoard()}
        holes={new Set()}
        onTapCell={onTapCell}
        layout={layout}
      />,
    );
    const view = getByTestId('cube-board');

    // Act: a still, quick press on FRONT's local (0,0) — board (0,0).
    const front = screenPointOfCell(0, 0, 0, R0);
    await fireEvent(view, 'responderGrant', touch(front.x, front.y));
    await fireEvent(view, 'responderRelease', touch(front.x, front.y));

    // …and on RIGHT's local (0,0) — board (5,5): the face→board mapping shows.
    const right = screenPointOfCell(1, 0, 0, R0);
    await fireEvent(view, 'responderGrant', touch(right.x, right.y));
    await fireEvent(view, 'responderRelease', touch(right.x, right.y));

    // Assert
    expect(onTapCell).toHaveBeenNthCalledWith(1, new Position(0, 0));
    expect(onTapCell).toHaveBeenNthCalledWith(2, new Position(5, 5));
  });

  it('should_not_tap_when_the_gesture_is_an_orbit_drag', async () => {
    // Arrange
    const onTapCell = jest.fn();
    const { getByTestId } = await render(
      <CubeBoardView
        board={cubeTestBoard()}
        holes={new Set()}
        onTapCell={onTapCell}
        layout={layout}
      />,
    );
    const view = getByTestId('cube-board');
    const size = cubeBoardSize();

    // Act: press, drag 60px, release at the far point → an orbit.
    await fireEvent(view, 'responderGrant', touch(size / 2, size / 2));
    await fireEvent(view, 'responderMove', touch(size / 2 + 60, size / 2));
    await fireEvent(view, 'responderRelease', touch(size / 2 + 60, size / 2));

    // Assert: orbiting must NEVER tap (a wrong tap costs a life).
    expect(onTapCell).not.toHaveBeenCalled();
  });

  it('should_not_tap_when_a_drag_returns_to_its_starting_point', async () => {
    // Arrange: the sneaky case — the finger ends where it began, but it MOVED.
    const onTapCell = jest.fn();
    const { getByTestId } = await render(
      <CubeBoardView
        board={cubeTestBoard()}
        holes={new Set()}
        onTapCell={onTapCell}
        layout={layout}
      />,
    );
    const view = getByTestId('cube-board');
    const size = cubeBoardSize();

    // Act: out 60px and back to the start, then release at the origin.
    await fireEvent(view, 'responderGrant', touch(size / 2, size / 2));
    await fireEvent(view, 'responderMove', touch(size / 2 + 60, size / 2));
    await fireEvent(view, 'responderMove', touch(size / 2, size / 2));
    await fireEvent(view, 'responderRelease', touch(size / 2, size / 2));

    // Assert: peak excursion decides, not the release point.
    expect(onTapCell).not.toHaveBeenCalled();
  });

  it('should_render_only_the_visible_faces', async () => {
    // Arrange / Act: the initial corner view shows FRONT, RIGHT and TOP.
    const { queryByTestId } = await render(
      <CubeBoardView
        board={cubeTestBoard()}
        holes={new Set()}
        onTapCell={() => {}}
        layout={layout}
      />,
    );

    // Assert: hidden faces (BACK, LEFT, BOTTOM) render NOTHING.
    expect(queryByTestId('cube-face-0')).toBeTruthy();
    expect(queryByTestId('cube-face-1')).toBeTruthy();
    expect(queryByTestId('cube-face-4')).toBeTruthy();
    expect(queryByTestId('cube-face-2')).toBeNull();
    expect(queryByTestId('cube-face-3')).toBeNull();
    expect(queryByTestId('cube-face-5')).toBeNull();
  });

  it('should_tumble_through_the_pole_and_show_the_back_face', async () => {
    // Arrange: full free rotation — a half-turn vertical drag was impossible
    // under the old ±85° pitch clamp; the trackball state must sail through.
    const onTapCell = jest.fn();
    const { getByTestId, queryByTestId } = await render(
      <CubeBoardView
        board={cubeTestBoard()}
        holes={new Set()}
        onTapCell={onTapCell}
        layout={layout}
      />,
    );
    const view = getByTestId('cube-board');
    const size = cubeBoardSize();
    const cx = size / 2;
    const cy = size / 4;
    const total = Math.PI / ORBIT_RADIANS_PER_PX; // px for a half turn

    // Act: drag straight down a half turn, in thirds like a real gesture.
    await fireEvent(view, 'responderGrant', touch(cx, cy));
    await fireEvent(view, 'responderMove', touch(cx, cy + total / 3));
    await fireEvent(view, 'responderMove', touch(cx, cy + (2 * total) / 3));
    await fireEvent(view, 'responderMove', touch(cx, cy + total));
    await fireEvent(view, 'responderRelease', touch(cx, cy + total));

    // Assert: BACK swung into view, FRONT swung out — and no tap happened.
    expect(queryByTestId('cube-face-2')).toBeTruthy();
    expect(queryByTestId('cube-face-0')).toBeNull();
    expect(onTapCell).not.toHaveBeenCalled();
  });

  it('should_do_nothing_when_the_tap_lands_off_the_cube', async () => {
    // Arrange
    const onTapCell = jest.fn();
    const { getByTestId } = await render(
      <CubeBoardView
        board={cubeTestBoard()}
        holes={new Set()}
        onTapCell={onTapCell}
        layout={layout}
      />,
    );
    const view = getByTestId('cube-board');

    // Act: a clean tap on the canvas corner — outside the cube's silhouette.
    // (The padding is not tappable by construction: hitTest only knows faces.)
    await fireEvent(view, 'responderGrant', touch(2, 2));
    await fireEvent(view, 'responderRelease', touch(2, 2));

    // Assert
    expect(onTapCell).not.toHaveBeenCalled();
  });

  it('should_update_the_cleared_faces_indicator_when_a_face_empties', async () => {
    // Arrange: every face still holds its one arrow.
    const board = cubeTestBoard();
    const props = {
      board,
      holes: new Set<string>(),
      onTapCell: () => {},
      layout,
    };
    const { getByText, rerender } = await render(<CubeBoardView {...props} />);
    expect(getByText('0/6')).toBeTruthy();

    // Act: FRONT's arrow escapes (the domain would clear it on a good tap).
    board.clearArrow(layout.globalArrowId(0, 1));
    await rerender(<CubeBoardView {...props} />);

    // Assert
    expect(getByText('1/6')).toBeTruthy();
  });

  it('should_shear_the_arrowhead_with_the_face_not_the_screen', async () => {
    // Regression for the detached-glyph bug: every glyph point must be
    // defined in cube space and projected — never composed in screen space
    // and translated. At the (non-identity) initial attitude FRONT is
    // sheared; the old screen-space arrowhead was ~16° off its face here.
    const { getByTestId } = await render(
      <CubeBoardView
        board={cubeTestBoard()}
        holes={new Set()}
        onTapCell={() => {}}
        layout={layout}
      />,
    );

    // The last body segment of FRONT's arrow, from its Path "M x y L x y".
    const d: string = getByTestId('cube-arrow-1').props.d;
    const nums = d.match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g)!.map(Number);
    const prev = { x: nums[nums.length - 4], y: nums[nums.length - 3] };
    const base = { x: nums[nums.length - 2], y: nums[nums.length - 1] };

    // The arrowhead polygon: tip, c1, c2 (react-native-svg may expose the
    // geometry as `points` or as a converted `d` depending on version).
    const headProps = getByTestId('cube-arrowhead-1').props;
    const raw: string = headProps.points ?? headProps.d;
    const hn = raw.match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g)!.map(Number);
    const tip = { x: hn[0], y: hn[1] };
    const c1 = { x: hn[2], y: hn[3] };
    const c2 = { x: hn[4], y: hn[5] };

    const normCross = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.abs(a.x * b.y - a.y * b.x) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));

    // 1) The tip lies on the projected extension of the last body segment
    //    (the detachment guard) …
    const seg = { x: base.x - prev.x, y: base.y - prev.y };
    const toTip = { x: tip.x - base.x, y: tip.y - base.y };
    expect(normCross(seg, toTip)).toBeLessThan(1e-6);
    expect(seg.x * toTip.x + seg.y * toTip.y).toBeGreaterThan(0);

    // 2) … and the head's base edge follows the face's PROJECTED
    //    perpendicular, not the screen's — the assertion the old
    //    screen-space glyph failed by ~16° at this attitude.
    const vProj = project(CUBE_FACES[0].v, R0);
    const baseEdge = { x: c1.x - c2.x, y: c1.y - c2.y };
    expect(normCross(baseEdge, { x: vProj.x, y: vProj.y })).toBeLessThan(1e-6);
  });

  it('should_treat_a_board_of_the_wrong_size_as_still_loading', async () => {
    // The white-screen seam: for one async beat after "Next" (level 15 → 16)
    // GameScreen's refs still hold the previous 11×11 flat board while the
    // registry already supplies the 30×30 cube layout. The view must render a
    // loading state — never walk the cube layout over the smaller board.
    const flat11: CellSpec[][] = Array.from({ length: 11 }, () =>
      Array.from({ length: 11 }, empty),
    );
    const { queryByTestId } = await render(
      <CubeBoardView
        board={buildBoard(flat11)}
        holes={new Set()}
        onTapCell={() => {}}
        layout={layout}
      />,
    );

    expect(queryByTestId('cube-board')).toBeNull();
    expect(queryByTestId('cube-board-loading')).toBeTruthy();
  });

  it('should_accept_an_escaping_flight_without_crashing', async () => {
    // The flight PR renders these in 3D; until then the prop is accepted and
    // ignored gracefully (contract parity with BoardView).
    const { getByTestId } = await render(
      <CubeBoardView
        board={cubeTestBoard()}
        holes={new Set()}
        escaping={[
          {
            arrowId: 1,
            color: '#FFD166',
            direction: 'RIGHT',
            cells: [{ row: 0, col: 0, direction: 'RIGHT' }],
            stars: [],
            hole: null,
          },
        ]}
        onTapCell={() => {}}
        layout={layout}
      />,
    );
    expect(getByTestId('cube-board')).toBeTruthy();
  });
});
