import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import Svg from 'react-native-svg';
import type { Board } from '../../../domain/entities/Board';
import { Position } from '../../../domain/value-objects/Position';
import type { CubeLayout } from '../../../adapters/cube/CubeLayout';
import type { EscapingArrow } from '../hooks/useGame';
import { hitTest, visibleFacesBackToFront, type Mat3, type Vec2 } from './orbit';
import {
  INITIAL_ROTATION,
  applyDrag,
  isTap,
  cubeToScreen,
  screenToCube,
} from './orbitGesture';
import { CubeFace } from './CubeFace';
import { theme } from '../theme';

const MAX_CANVAS = 420;
const SCREEN_MARGIN = 24;

/** The square canvas size the cube renders into (shared with tests). */
export function cubeBoardSize(): number {
  return Math.min(Dimensions.get('window').width - SCREEN_MARGIN, MAX_CANVAS);
}

interface Props {
  board: Board;
  /** Positions that started the level empty (permanent holes). */
  holes: ReadonlySet<string>;
  /** Accepted for contract parity with BoardView; the 3D escape flight is the
   * animation PR's job, so flights are currently ignored (never a crash). */
  escaping?: ReadonlyArray<EscapingArrow>;
  /** Arrow that was just blocked: flashed in the danger colour. */
  shakingArrowId?: number | null;
  onTapCell: (position: Position) => void;
  /** The cube topology, from the cube registry (level id → CubeLayout). */
  layout: CubeLayout;
}

/**
 * The cube renderer: the Strategy counterpart of BoardView behind the same
 * render contract. The player orbits the solid with a TRACKBALL drag — the
 * state is the rotation matrix itself, each finger delta premultiplied in
 * camera space, so the cube tumbles freely through 360° on every axis with no
 * gimbal pole (presentation state only, never a use case). Taps resolve through
 * orbit.hitTest → layout.toBoard back to the SAME board Positions the flat view
 * reports, so useGame is untouched.
 */
export function CubeBoardView({
  board,
  holes,
  escaping = [],
  shakingArrowId = null,
  onTapCell,
  layout,
}: Props): React.JSX.Element {
  void escaping; // the flight PR renders these as projected slide-off overlays

  const size = cubeBoardSize();
  const [r, setR] = useState<Mat3>(INITIAL_ROTATION);

  // One gesture at a time: where it started (for tap discrimination), the last
  // seen point (each move applies only its own delta — trackball), and the
  // finger's PEAK excursion (a drag that returns to start is still a drag).
  const gesture = useRef({
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    startedAt: 0,
    peakPx: 0,
  });

  const toScreen = useMemo(() => (p: Vec2): Vec2 => cubeToScreen(p, size), [size]);

  // GUARD (the level 15 → 16 white screen): when "Next" changes the levelId,
  // this screen stays mounted and for one async beat useGame's refs still
  // hold the PREVIOUS level's board while the registry already supplies the
  // cube layout. Walking the 30×30 layout over a smaller board throws
  // OutOfBoundsError mid-render — so a size mismatch IS the loading state.
  // (Structural: also protects any future flat↔cube transition, either way.)
  if (board.rows !== layout.boardSize || board.cols !== layout.boardSize) {
    return <View testID="cube-board-loading" style={styles.container} />;
  }

  // "N/6 faces cleared" — derived presentation-side from the board + layout:
  // a face is cleared when none of its block's cells still holds an arrow.
  const clearedFaces = layout.faces.filter((face) => {
    for (let row = 0; row < face.size; row += 1) {
      for (let col = 0; col < face.size; col += 1) {
        const cell = board.cellAt(new Position(face.rowStart + row, face.colStart + col));
        if (cell.kind === 'ARROW') {
          return false;
        }
      }
    }
    return true;
  }).length;

  const point = (e: GestureResponderEvent): Vec2 => ({
    x: e.nativeEvent.locationX,
    y: e.nativeEvent.locationY,
  });

  const onGrant = (e: GestureResponderEvent): void => {
    const p = point(e);
    gesture.current = {
      x: p.x,
      y: p.y,
      lastX: p.x,
      lastY: p.y,
      startedAt: Date.now(),
      peakPx: 0,
    };
  };

  const onMove = (e: GestureResponderEvent): void => {
    const p = point(e);
    const g = gesture.current;
    const ddx = p.x - g.lastX;
    const ddy = p.y - g.lastY;
    g.lastX = p.x;
    g.lastY = p.y;
    g.peakPx = Math.max(g.peakPx, Math.hypot(p.x - g.x, p.y - g.y));
    // Functional update: rapid move events each fold their own delta into the
    // latest attitude, never a stale one.
    setR((prev) => applyDrag(prev, ddx, ddy));
  };

  const onRelease = (e: GestureResponderEvent): void => {
    const p = point(e);
    const g = gesture.current;
    const peak = Math.max(g.peakPx, Math.hypot(p.x - g.x, p.y - g.y));
    if (!isTap(peak, Date.now() - g.startedAt)) {
      return; // an orbit — never a tap, never a lost life
    }
    const hit = hitTest(screenToCube(p, size), r);
    if (hit === null) {
      return; // off the cube (or a face too edge-on to aim at): a no-op
    }
    const { row, col } = layout.toBoard(hit.face, hit.row, hit.col);
    onTapCell(new Position(row, col));
  };

  return (
    <View style={styles.container}>
      <Text testID="faces-cleared" style={styles.cleared}>
        {clearedFaces}/6
      </Text>
      <View
        testID="cube-board"
        style={{ width: size, height: size }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onGrant}
        onResponderMove={onMove}
        onResponderRelease={onRelease}
        onResponderTerminate={() => {
          gesture.current.peakPx = Number.POSITIVE_INFINITY; // stolen: never a tap
        }}
      >
        <Svg width={size} height={size} pointerEvents="none">
          {visibleFacesBackToFront(r).map((face) => (
            <CubeFace
              key={face.index}
              face={face}
              board={board}
              layout={layout}
              r={r}
              toScreen={toScreen}
              holes={holes}
              shakingArrowId={shakingArrowId}
            />
          ))}
        </Svg>
      </View>
      <Text style={styles.hint}>↻</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  cleared: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: theme.spacing(1),
  },
  hint: { color: theme.colors.muted, fontSize: 18, marginTop: theme.spacing(1) },
});
