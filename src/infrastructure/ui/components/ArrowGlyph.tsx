import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { DirectionName } from '../../../domain/value-objects/Direction';
import { theme } from '../theme';

const GLYPH: Record<DirectionName, string> = {
  UP: '↑',
  DOWN: '↓',
  LEFT: '←',
  RIGHT: '→',
};

/** Renders the arrow character for a given direction. */
export function ArrowGlyph({ direction }: { direction: DirectionName }): React.JSX.Element {
  return (
    <Text accessibilityLabel={`arrow-${direction.toLowerCase()}`} style={styles.glyph}>
      {GLYPH[direction]}
    </Text>
  );
}

const styles = StyleSheet.create({
  glyph: {
    color: theme.colors.background,
    fontSize: 26,
    fontWeight: '900',
  },
});
