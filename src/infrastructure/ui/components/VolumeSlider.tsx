import React, { useRef } from 'react';
import { View, StyleSheet, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { theme } from '../theme';

interface Props {
  /** Current volume in [0, 1]. */
  volume: number;
  onChange: (volume: number) => void;
}

/**
 * Dependency-free volume slider: a small track that maps a tap or drag to a
 * [0, 1] volume via the responder system (works on native and web alike).
 */
export function VolumeSlider({ volume, onChange }: Props): React.JSX.Element {
  const width = useRef(120);

  const onLayout = (event: LayoutChangeEvent) => {
    width.current = event.nativeEvent.layout.width || width.current;
  };

  const setFromTouch = (event: GestureResponderEvent) => {
    const x = event.nativeEvent.locationX;
    onChange(Math.min(1, Math.max(0, x / width.current)));
  };

  return (
    <View
      testID="volume-slider"
      accessibilityRole="adjustable"
      accessibilityLabel="volume"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(volume * 100) }}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={setFromTouch}
      onResponderMove={setFromTouch}
      style={styles.touchArea}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(volume * 100)}%` }]} />
        <View style={[styles.thumb, { left: `${Math.round(volume * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // A generous touch area around a slim visual track.
  touchArea: {
    width: 120,
    height: 32,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.surfaceAlt,
    overflow: 'visible',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  thumb: {
    position: 'absolute',
    top: -4,
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.primaryText,
  },
});
