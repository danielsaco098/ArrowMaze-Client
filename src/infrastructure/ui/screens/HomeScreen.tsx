import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '../navigation/NavigationContext';
import { useTranslation } from '../i18n/I18nContext';
import { useSound } from '../hooks/useSound';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';

export function HomeScreen(): React.JSX.Element {
  const { navigate } = useNavigation();
  const { t, language, toggleLanguage } = useTranslation();
  const { muted, toggleMuted } = useSound();

  return (
    <View style={styles.container}>
      <View style={styles.settingsRow}>
        <Pressable
          accessibilityRole="button"
          testID="sound-toggle"
          onPress={toggleMuted}
          style={styles.chip}
        >
          <Text style={styles.chipText}>{t(muted ? 'settings.soundOff' : 'settings.soundOn')}</Text>
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

      <View style={styles.center}>
        <Text style={styles.title}>Arrow Maze</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

        <View style={styles.actions}>
          <PrimaryButton
            testID="play-button"
            label={t('home.play')}
            onPress={() => navigate({ name: 'levelSelect' })}
          />
        </View>

        <Text style={styles.hint}>{t('home.hint')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing(3) },
  settingsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing(1) },
  chip: {
    paddingVertical: theme.spacing(0.75),
    paddingHorizontal: theme.spacing(1.5),
    borderRadius: theme.radius,
    backgroundColor: theme.colors.surface,
  },
  chipText: { color: theme.colors.text, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 44, fontWeight: '900', letterSpacing: 1 },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    marginTop: theme.spacing(1),
    textAlign: 'center',
  },
  actions: { marginTop: theme.spacing(5) },
  hint: { color: theme.colors.muted, fontSize: 13, marginTop: theme.spacing(3) },
});
