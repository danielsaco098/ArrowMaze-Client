import React from 'react';
import { render } from '@testing-library/react-native';
import { ArrowPiece } from './ArrowPiece';

describe('ArrowPiece', () => {
  it('should_label_the_head_slice_by_its_direction', async () => {
    // Arrange / Act
    const { getByLabelText, rerender } = await render(
      <ArrowPiece direction="UP" color="#FFD166" isHead isTail size={40} />,
    );
    // Assert
    expect(getByLabelText('arrow-up')).toBeTruthy();

    await rerender(<ArrowPiece direction="RIGHT" color="#FFD166" isHead isTail size={40} />);
    expect(getByLabelText('arrow-right')).toBeTruthy();
  });

  it('should_label_body_slices_too_so_the_full_arrow_is_visible', async () => {
    // Arrange / Act
    const { getByLabelText } = await render(
      <ArrowPiece direction="LEFT" color="#FF6B6B" isHead={false} isTail={false} size={40} />,
    );
    // Assert
    expect(getByLabelText('arrow-left')).toBeTruthy();
  });
});
