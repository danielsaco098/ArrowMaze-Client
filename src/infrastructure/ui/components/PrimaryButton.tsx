import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  testID?: string;
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  testID,
}: Props): React.JSX.Element {
  const containerStyle: ViewStyle = {
    backgroundColor: variant === 'primary' ? theme.colors.primary : 'transparent',
    borderWidth: variant === 'ghost' ? 1 : 0,
    borderColor: theme.colors.muted,
    opacity: disabled ? 0.4 : 1,
  };

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, containerStyle]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(3),
    borderRadius: theme.radius,
    alignItems: 'center',
    minWidth: 180,
  },
  label: {
    color: theme.colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
});
