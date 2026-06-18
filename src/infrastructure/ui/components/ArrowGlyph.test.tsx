import React from 'react';
import { render } from '@testing-library/react-native';
import { ArrowGlyph } from './ArrowGlyph';

describe('ArrowGlyph', () => {
  it('should_render_the_matching_glyph_for_each_direction', async () => {
    // Arrange / Act
    const { getByText, rerender } = await render(<ArrowGlyph direction="UP" />);
    // Assert
    expect(getByText('↑')).toBeTruthy();

    await rerender(<ArrowGlyph direction="RIGHT" />);
    expect(getByText('→')).toBeTruthy();
  });
});
