import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BoardView } from './BoardView';
import { arrow, buildBoard, empty } from '../../../test-support/buildBoard';
import { Position } from '../../../domain/value-objects/Position';

describe('BoardView', () => {
  it('should_render_a_cell_for_every_position_when_the_board_is_drawn', async () => {
    // Arrange
    const board = buildBoard([
      [arrow('RIGHT'), empty()],
      [empty(), arrow('UP')],
    ]);

    // Act
    const { getByTestId, getByLabelText } = await render(
      <BoardView board={board} holes={new Set()} onTapCell={() => {}} />,
    );

    // Assert
    expect(getByTestId('board')).toBeTruthy();
    expect(getByTestId('cell-0-0')).toBeTruthy();
    expect(getByTestId('cell-1-1')).toBeTruthy();
    expect(getByLabelText('arrow-right')).toBeTruthy();
  });

  it('should_render_the_slide_out_overlay_when_an_arrow_is_escaping', async () => {
    // Arrange
    const board = buildBoard([[arrow('RIGHT'), empty()]]);

    // Act: the overlay copy of a just-escaped arrow is drawn over the board
    const { getByTestId } = await render(
      <BoardView
        board={board}
        holes={new Set()}
        escaping={[
          {
            arrowId: 9,
            color: '#FFD166',
            direction: 'RIGHT',
            cells: [{ row: 0, col: 0, direction: 'RIGHT' }],
            stars: [],
            hole: null,
          },
        ]}
        onTapCell={() => {}}
      />,
    );

    // Assert
    expect(getByTestId('escaping-arrow')).toBeTruthy();
  });

  it('should_render_one_overlay_per_flight_when_several_arrows_escape_in_a_row', async () => {
    // Arrange: two flights in progress at once (overlapping taps)
    const board = buildBoard([[arrow('RIGHT'), empty()]]);
    const flight = (arrowId: number) => ({
      arrowId,
      color: '#FFD166',
      direction: 'RIGHT' as const,
      cells: [{ row: 0, col: 0, direction: 'RIGHT' as const }],
      stars: [],
      hole: null,
    });

    // Act
    const { getAllByTestId } = await render(
      <BoardView
        board={board}
        holes={new Set()}
        escaping={[flight(1), flight(2)]}
        onTapCell={() => {}}
      />,
    );

    // Assert: each escape keeps its own animation overlay
    expect(getAllByTestId('escaping-arrow')).toHaveLength(2);
  });

  it('should_keep_rendering_the_board_when_an_arrow_is_shaking', async () => {
    // Arrange: the blocked arrow's cells are wrapped in the shake transform
    const board = buildBoard([[arrow('RIGHT', { arrowId: 5 }), arrow('LEFT', { arrowId: 6 })]]);

    // Act
    const { getByTestId } = await render(
      <BoardView board={board} holes={new Set()} shakingArrowId={5} onTapCell={() => {}} />,
    );

    // Assert: both cells still present and pressable
    expect(getByTestId('cell-0-0')).toBeTruthy();
    expect(getByTestId('cell-0-1')).toBeTruthy();
  });

  it('should_invoke_onTapCell_with_the_position_when_an_arrow_is_pressed', async () => {
    // Arrange
    const board = buildBoard([[arrow('RIGHT'), empty()]]);
    const onTapCell = jest.fn();
    const { getByTestId } = await render(
      <BoardView board={board} holes={new Set()} onTapCell={onTapCell} />,
    );

    // Act
    await fireEvent.press(getByTestId('cell-0-0'));

    // Assert
    expect(onTapCell).toHaveBeenCalledWith(new Position(0, 0));
  });
});
