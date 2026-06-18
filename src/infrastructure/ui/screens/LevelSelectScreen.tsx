import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '../navigation/NavigationContext';
import { useContainer } from '../AppContainerContext';
import { PlayerProgress } from '../../../domain/entities/PlayerProgress';
import type { Difficulty } from '../../../domain/entities/Level';
import { theme, difficultyColor } from '../theme';

interface LevelItem {
  id: number;
  name: string;
  difficulty: Difficulty;
}

export function LevelSelectScreen(): React.JSX.Element {
  const { navigate, goHome } = useNavigation();
  const container = useContainer();
  const [levels, setLevels] = useState<LevelItem[]>([]);
  const [progress, setProgress] = useState<PlayerProgress>(PlayerProgress.empty());

  useEffect(() => {
    let active = true;
    void (async () => {
      const [all, prog] = await Promise.all([
        container.levels.getAll(),
        container.getProgress.execute(),
      ]);
      if (!active) return;
      setLevels(all.map((l) => ({ id: l.id, name: l.name, difficulty: l.difficulty })));
      setProgress(prog);
    })();
    return () => {
      active = false;
    };
  }, [container]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={goHome} testID="back-button">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Select a level</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {levels.map((level) => {
          const unlocked = progress.isUnlocked(level.id);
          const best = progress.bestScore(level.id);
          return (
            <Pressable
              key={level.id}
              testID={`level-${level.id}`}
              accessibilityRole="button"
              disabled={!unlocked}
              onPress={() => navigate({ name: 'game', levelId: level.id })}
              style={[
                styles.tile,
                { borderColor: difficultyColor[level.difficulty] },
                !unlocked && styles.tileLocked,
              ]}
            >
              <Text style={styles.tileNumber}>{unlocked ? level.id : '🔒'}</Text>
              <Text style={styles.tileDifficulty}>{level.difficulty}</Text>
              {best !== undefined && <Text style={styles.tileScore}>★ {best}</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing(2) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: theme.colors.muted, fontSize: 16 },
  spacer: { width: 48 },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingVertical: theme.spacing(2) },
  tile: {
    width: 92,
    height: 92,
    margin: theme.spacing(1),
    borderRadius: theme.radius,
    borderWidth: 2,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLocked: { backgroundColor: theme.colors.locked, opacity: 0.5 },
  tileNumber: { color: theme.colors.text, fontSize: 24, fontWeight: '900' },
  tileDifficulty: { color: theme.colors.muted, fontSize: 11, marginTop: 4 },
  tileScore: { color: theme.colors.exit, fontSize: 12, marginTop: 2 },
});
