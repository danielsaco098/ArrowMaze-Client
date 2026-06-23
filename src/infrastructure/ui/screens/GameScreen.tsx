import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '../navigation/NavigationContext';
import { useTranslation } from '../i18n/I18nContext';
import { useContainer } from '../AppContainerContext';
import { useSession } from '../session/SessionContext';
import { useGame } from '../hooks/useGame';
import { BoardView } from '../components/BoardView';
import { PrimaryButton } from '../components/PrimaryButton';
import { GameStatus } from '../../../domain/entities/GameStatus';
import { Lives } from '../../../domain/value-objects/Lives';
import { theme } from '../theme';

const LAST_LEVEL_ID = 15;

export function GameScreen({ levelId }: { levelId: number }): React.JSX.Element {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const container = useContainer();
  const { token } = useSession();
  const { status, lives, moves, outcome, board, holes, level, onTapCell, retry } = useGame(levelId);

  const hearts = '♥'.repeat(lives) + '♡'.repeat(Math.max(0, Lives.DEFAULT - lives));

  // On victory, if the player is signed in, push the score to the backend so it
  // appears on the global leaderboard. Best-effort: a server-offline error is
  // swallowed and never blocks play.
  const score = outcome.score;
  useEffect(() => {
    if (status === GameStatus.Victory && score !== undefined && token) {
      void container.progressApi.sync(token, [{ levelId, score }]).catch(() => undefined);
    }
  }, [status, score, token, levelId, container]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.level}>{level ? level.name : t('common.loading')}</Text>
        <View style={styles.stats}>
          <Text testID="lives" style={styles.lives}>
            {hearts}
          </Text>
          <Text testID="moves" style={styles.moves}>
            {t('game.moves', { count: moves })}
          </Text>
        </View>
      </View>

      <View style={styles.boardArea}>
        {board ? (
          <BoardView board={board} holes={holes} onTapCell={onTapCell} />
        ) : (
          <Text style={styles.loading}>{t('common.loading')}</Text>
        )}
      </View>

      {status === GameStatus.Victory && (
        <Overlay testID="victory-overlay" title={t('game.victoryTitle')} tone={theme.colors.success}>
          <Text style={styles.score}>{t('game.score', { score: outcome.score ?? 0 })}</Text>
          {outcome.isNewBest && <Text style={styles.newBest}>{t('game.newBest')}</Text>}
          {levelId < LAST_LEVEL_ID && (
            <PrimaryButton
              testID="next-button"
              label={t('game.next')}
              onPress={() => navigate({ name: 'game', levelId: levelId + 1 })}
            />
          )}
          <PrimaryButton
            testID="leaderboard-button"
            label={t('leaderboard.open')}
            variant="ghost"
            onPress={() => navigate({ name: 'leaderboard', levelId })}
          />
          <PrimaryButton
            label={t('common.levelSelect')}
            variant="ghost"
            onPress={() => navigate({ name: 'levelSelect' })}
          />
        </Overlay>
      )}

      {status === GameStatus.Defeat && (
        <Overlay testID="defeat-overlay" title={t('game.defeatTitle')} tone={theme.colors.danger}>
          <PrimaryButton testID="retry-button" label={t('game.retry')} onPress={retry} />
          <PrimaryButton
            label={t('common.levelSelect')}
            variant="ghost"
            onPress={() => navigate({ name: 'levelSelect' })}
          />
        </Overlay>
      )}
    </View>
  );
}

function Overlay({
  title,
  tone,
  testID,
  children,
}: {
  title: string;
  tone: string;
  testID: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View testID={testID} style={styles.overlay}>
      <View style={styles.card}>
        <Text style={[styles.overlayTitle, { color: tone }]}>{title}</Text>
        <View style={styles.overlayActions}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing(2) },
  header: { marginBottom: theme.spacing(2) },
  level: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing(1) },
  lives: { color: theme.colors.danger, fontSize: 20, letterSpacing: 2 },
  moves: { color: theme.colors.muted, fontSize: 16 },
  boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: theme.colors.muted },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,18,38,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3),
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
    padding: theme.spacing(3),
    alignItems: 'center',
    width: '100%',
  },
  overlayTitle: { fontSize: 28, fontWeight: '900', marginBottom: theme.spacing(2) },
  overlayActions: { gap: theme.spacing(1.5), alignItems: 'center' },
  score: { color: theme.colors.text, fontSize: 18, marginBottom: theme.spacing(1) },
  newBest: { color: theme.colors.exit, fontSize: 14, marginBottom: theme.spacing(1) },
});
