import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '../navigation/NavigationContext';
import { useContainer } from '../AppContainerContext';
import { useTranslation } from '../i18n/I18nContext';
import { useSession } from '../session/SessionContext';
import type { LeaderboardEntry } from '../../../application/ports/ILeaderboardApi';
import { NotAuthenticatedError } from '../../../application/errors';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'unauthenticated' }
  | { status: 'ready'; entries: LeaderboardEntry[] };

export function LeaderboardScreen({ levelId }: { levelId: number }): React.JSX.Element {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const container = useContainer();
  const { user } = useSession();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    // Auth-required use case: the authentication aspect rejects with
    // NotAuthenticatedError when nobody is signed in.
    container.getLeaderboard
      .execute({ levelId })
      .then((entries) => active && setState({ status: 'ready', entries }))
      .catch(
        (error: unknown) =>
          active &&
          setState(
            error instanceof NotAuthenticatedError
              ? { status: 'unauthenticated' }
              : { status: 'error' },
          ),
      );
    return () => {
      active = false;
    };
  }, [container, levelId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          testID="back-button"
          onPress={() => navigate({ name: 'levelSelect' })}
        >
          <Text style={styles.back}>{t('common.back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('leaderboard.title', { level: levelId })}</Text>
        <View style={styles.spacer} />
      </View>

      {state.status === 'loading' && <ActivityIndicator testID="loading" color={theme.colors.primary} />}
      {state.status === 'error' && <Text style={styles.message}>{t('leaderboard.error')}</Text>}
      {state.status === 'unauthenticated' && (
        <View testID="auth-required">
          <Text style={styles.message}>{t('leaderboard.signInRequired')}</Text>
          <View style={styles.signInAction}>
            <PrimaryButton
              testID="go-login-button"
              label={t('login.signIn')}
              onPress={() => navigate({ name: 'login' })}
            />
          </View>
        </View>
      )}
      {state.status === 'ready' && state.entries.length === 0 && (
        <Text style={styles.message}>{t('leaderboard.empty')}</Text>
      )}

      {state.status === 'ready' && state.entries.length > 0 && (
        <ScrollView testID="leaderboard-list" contentContainerStyle={styles.list}>
          {state.entries.map((entry, index) => {
            const isMe = user?.username === entry.username;
            return (
              <View
                key={`${entry.username}-${index}`}
                testID={`entry-${index}`}
                style={[styles.row, isMe && styles.rowMe]}
              >
                <Text style={styles.rank}>{index + 1}</Text>
                <Text style={styles.name}>{entry.username}</Text>
                <Text style={styles.score}>{entry.score}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing(2) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: theme.colors.muted, fontSize: 16 },
  spacer: { width: 40 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  message: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing(4), paddingHorizontal: theme.spacing(2) },
  signInAction: { alignItems: 'center', marginTop: theme.spacing(2) },
  list: { paddingVertical: theme.spacing(2), gap: theme.spacing(1) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(2),
  },
  rowMe: { borderWidth: 1, borderColor: theme.colors.primary },
  rank: { color: theme.colors.muted, width: 32, fontSize: 16, fontWeight: '800' },
  name: { color: theme.colors.text, flex: 1, fontSize: 16 },
  score: { color: theme.colors.exit, fontSize: 16, fontWeight: '700' },
});
