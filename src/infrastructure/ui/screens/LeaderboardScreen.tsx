import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '../navigation/NavigationContext';
import { useContainer } from '../AppContainerContext';
import { useTranslation } from '../i18n/I18nContext';
import { useSession } from '../session/SessionContext';
import { NotAuthenticatedError } from '../../../application/errors';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';

/** Which ranking is displayed: one level's top scores, or the overall totals. */
type Scope = 'level' | 'total';

interface Row {
  username: string;
  points: number;
  /** Extra detail line (only for the overall ranking: levels played). */
  detail?: string;
}

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'unauthenticated' }
  | { status: 'ready'; rows: Row[] };

export function LeaderboardScreen({ levelId }: { levelId: number }): React.JSX.Element {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const container = useContainer();
  const { user } = useSession();
  const [scope, setScope] = useState<Scope>('level');
  const [state, setState] = useState<State>({ status: 'loading' });

  // Refetches whenever the selected scope changes. Both use cases are
  // auth-required: the authentication aspect rejects with
  // NotAuthenticatedError when nobody is signed in.
  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    const request: Promise<Row[]> =
      scope === 'level'
        ? container.getLeaderboard
            .execute({ levelId })
            .then((entries) =>
              entries.map((e) => ({ username: e.username, points: e.score })),
            )
        : container.getOverallLeaderboard.execute({}).then((entries) =>
            entries.map((e) => ({
              username: e.username,
              points: e.totalScore,
              detail: t('leaderboard.levelsPlayed', { count: e.levelsPlayed }),
            })),
          );
    request
      .then((rows) => active && setState({ status: 'ready', rows }))
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
  }, [container, levelId, scope, t]);

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
        <Text style={styles.title}>
          {scope === 'level' ? t('leaderboard.title', { level: levelId }) : t('leaderboard.titleTotal')}
        </Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.tabs}>
        <ScopeTab
          testID="tab-level"
          label={t('leaderboard.tabLevel', { level: levelId })}
          active={scope === 'level'}
          onPress={() => setScope('level')}
        />
        <ScopeTab
          testID="tab-total"
          label={t('leaderboard.tabTotal')}
          active={scope === 'total'}
          onPress={() => setScope('total')}
        />
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
      {state.status === 'ready' && state.rows.length === 0 && (
        <Text style={styles.message}>{t('leaderboard.empty')}</Text>
      )}

      {state.status === 'ready' && state.rows.length > 0 && (
        <ScrollView testID="leaderboard-list" contentContainerStyle={styles.list}>
          {state.rows.map((row, index) => {
            const isMe = user?.username === row.username;
            return (
              <View
                key={`${row.username}-${index}`}
                testID={`entry-${index}`}
                style={[styles.row, isMe && styles.rowMe]}
              >
                <Text style={styles.rank}>{index + 1}</Text>
                <View style={styles.nameBlock}>
                  <Text style={styles.name}>{row.username}</Text>
                  {row.detail !== undefined && <Text style={styles.detail}>{row.detail}</Text>}
                </View>
                <Text style={styles.score}>{row.points}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function ScopeTab({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      testID={testID}
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing(2) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: theme.colors.muted, fontSize: 16 },
  spacer: { width: 40 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  tabs: {
    flexDirection: 'row',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
    justifyContent: 'center',
  },
  tab: {
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(2),
    borderRadius: theme.radius,
    backgroundColor: theme.colors.surface,
  },
  tabActive: { backgroundColor: theme.colors.primary },
  tabLabel: { color: theme.colors.muted, fontSize: 14, fontWeight: '700' },
  tabLabelActive: { color: theme.colors.primaryText },
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
  nameBlock: { flex: 1 },
  name: { color: theme.colors.text, fontSize: 16 },
  detail: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  score: { color: theme.colors.exit, fontSize: 16, fontWeight: '700' },
});
