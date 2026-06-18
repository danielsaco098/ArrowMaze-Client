import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BoardView } from './BoardView';
import { arrow, buildBoard, empty } from '../../../test-support/buildBoard';
import { Position } from '../../../domain/value-objects/Position';

describe('BoardView', () => {
  it('should_render_a_cell_for_every_board_position', async () => {
    // Arrange
    const board = buildBoard([
      [arrow('RIGHT'), empty()],
      [empty(), arrow('UP')],
    ]);

    // Act
    const { getByTestId, getByText } = await render(<BoardView board={board} onTapCell={() => {}} />);

    // Assert
    expect(getByTestId('board')).toBeTruthy();
    expect(getByTestId('cell-0-0')).toBeTruthy();
    expect(getByTestId('cell-1-1')).toBeTruthy();
    expect(getByText('→')).toBeTruthy();
  });

  it('should_invoke_onTapCell_with_the_position_when_an_arrow_is_pressed', async () => {
    // Arrange
    const board = buildBoard([[arrow('RIGHT'), empty()]]);
    const onTapCell = jest.fn();
    const { getByTestId } = await render(<BoardView board={board} onTapCell={onTapCell} />);

    // Act
    await fireEvent.press(getByTestId('cell-0-0'));

    // Assert
    expect(onTapCell).toHaveBeenCalledWith(new Position(0, 0));
  });
});
