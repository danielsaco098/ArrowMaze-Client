import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '../navigation/NavigationContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';

export function HomeScreen(): React.JSX.Element {
  const { navigate } = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Arrow Maze</Text>
      <Text style={styles.subtitle}>Tap an arrow to slide it off the board.</Text>

      <View style={styles.actions}>
        <PrimaryButton
          testID="play-button"
          label="Play"
          onPress={() => navigate({ name: 'levelSelect' })}
        />
      </View>

      <Text style={styles.hint}>3 lives · clear every arrow to win</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3),
  },
  title: {
    color: theme.colors.text,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    marginTop: theme.spacing(1),
    textAlign: 'center',
  },
  actions: {
    marginTop: theme.spacing(5),
  },
  hint: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: theme.spacing(3),
  },
});
