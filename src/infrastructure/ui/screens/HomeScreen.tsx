import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '../navigation/NavigationContext';
import { useTranslation } from '../i18n/I18nContext';
import { useSound } from '../hooks/useSound';
import { useSession } from '../session/SessionContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';

export function HomeScreen(): React.JSX.Element {
  const { navigate } = useNavigation();
  const { t, language, toggleLanguage } = useTranslation();
  const { effectsMuted, musicMuted, toggleEffects, toggleMusic } = useSound();
  const { isAuthenticated, user } = useSession();

  return (
    <View style={styles.container}>
      <View style={styles.settingsRow}>
        <Pressable
          accessibilityRole="button"
          testID="account-chip"
          onPress={() => navigate({ name: 'login' })}
          style={styles.chip}
        >
          <Text style={styles.chipText}>
            {isAuthenticated ? `👤 ${user?.username ?? ''}` : t('login.signIn')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="language-toggle"
          onPress={toggleLanguage}
          style={styles.chip}
        >
          <Text style={styles.chipText}>{language.toUpperCase()}</Text>
        </Pressable>
      </View>
      <View style={styles.settingsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !effectsMuted }}
          testID="effects-toggle"
          onPress={toggleEffects}
          style={[styles.chip, effectsMuted && styles.chipMuted]}
        >
          <Text style={styles.chipText}>
            {t(effectsMuted ? 'settings.effectsOff' : 'settings.effectsOn')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !musicMuted }}
          testID="music-toggle"
          onPress={toggleMusic}
          style={[styles.chip, musicMuted && styles.chipMuted]}
        >
          <Text style={styles.chipText}>
            {t(musicMuted ? 'settings.musicOff' : 'settings.musicOn')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>Arrow Maze</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

        <View style={styles.actions}>
          <PrimaryButton
            testID="play-button"
            label={t('home.play')}
            onPress={() => navigate({ name: 'levelSelect' })}
          />
          <PrimaryButton
            testID="home-leaderboard-button"
            label={t('leaderboard.open')}
            variant="ghost"
            onPress={() => navigate({ name: 'leaderboard' })}
          />
        </View>

        <Text style={styles.hint}>{t('home.hint')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing(3) },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  chip: {
    paddingVertical: theme.spacing(0.75),
    paddingHorizontal: theme.spacing(1.5),
    borderRadius: theme.radius,
    backgroundColor: theme.colors.surface,
  },
  // A muted channel reads as visually "off": dimmed.
  chipMuted: { opacity: 0.45 },
  chipText: { color: theme.colors.text, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 44, fontWeight: '900', letterSpacing: 1 },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    marginTop: theme.spacing(1),
    textAlign: 'center',
  },
  actions: { marginTop: theme.spacing(5), gap: theme.spacing(1.5), alignItems: 'center' },
  hint: { color: theme.colors.muted, fontSize: 13, marginTop: theme.spacing(3) },
});
