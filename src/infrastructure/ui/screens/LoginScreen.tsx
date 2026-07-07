import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '../navigation/NavigationContext';
import { useTranslation } from '../i18n/I18nContext';
import { useSession } from '../session/SessionContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../theme';

export function LoginScreen(): React.JSX.Element {
  const { goHome } = useNavigation();
  const { t } = useTranslation();
  const { login, register, logout, busy, error, isAuthenticated, user, clearError } = useSession();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const errorMessage =
    error === 'invalid'
      ? t('login.errorInvalid')
      : error === 'taken'
        ? t('login.errorTaken')
        : error === 'validation'
          ? t('login.errorValidation')
          : error === 'network'
            ? t('login.errorNetwork')
            : null;

  const submit = async (action: typeof login) => {
    const ok = await action({ username: username.trim(), password });
    if (ok) goHome();
  };

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" onPress={goHome} testID="back-button">
        <Text style={styles.back}>{t('common.back')}</Text>
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.title}>{t('login.title')}</Text>

        {isAuthenticated ? (
          <>
            <Text style={styles.signedIn}>
              {t('login.signedInAs', { username: user?.username ?? '' })}
            </Text>
            <PrimaryButton testID="signout-button" label={t('login.signOut')} onPress={logout} />
          </>
        ) : (
          <>
            <TextInput
              testID="username-input"
              style={styles.input}
              placeholder={t('login.username')}
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
              value={username}
              onChangeText={(v) => {
                clearError();
                setUsername(v);
              }}
            />
            <TextInput
              testID="password-input"
              style={styles.input}
              placeholder={t('login.password')}
              placeholderTextColor={theme.colors.muted}
              secureTextEntry
              value={password}
              onChangeText={(v) => {
                clearError();
                setPassword(v);
              }}
            />

            {errorMessage && (
              <Text testID="login-error" style={styles.error}>
                {errorMessage}
              </Text>
            )}

            <View style={styles.actions}>
              <PrimaryButton
                testID="login-button"
                label={t('login.loginBtn')}
                disabled={busy}
                onPress={() => void submit(login)}
              />
              <PrimaryButton
                testID="register-button"
                label={t('login.registerBtn')}
                variant="ghost"
                disabled={busy}
                onPress={() => void submit(register)}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing(2) },
  back: { color: theme.colors.muted, fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing(1.5) },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '800', marginBottom: theme.spacing(2) },
  input: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: theme.radius,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    fontSize: 16,
  },
  error: { color: theme.colors.danger, fontSize: 14, textAlign: 'center', maxWidth: 320 },
  signedIn: { color: theme.colors.text, fontSize: 16, marginBottom: theme.spacing(2) },
  actions: { gap: theme.spacing(1.5), alignItems: 'center', marginTop: theme.spacing(1) },
});
