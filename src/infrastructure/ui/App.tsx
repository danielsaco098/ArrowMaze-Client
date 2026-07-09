import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { AppContainerProvider } from './AppContainerContext';
import { NavigationProvider } from './navigation/NavigationContext';
import { I18nProvider } from './i18n/I18nContext';
import { SessionProvider } from './session/SessionContext';
import { Router } from './Router';
import { theme } from './theme';
import { AudioManager } from '../audio/AudioManager';
import { ExpoAudioService } from '../audio/ExpoAudioService';

/** Application root: wires the DI container, i18n, session, navigation and the router. */
export function App(): React.JSX.Element {
  // Plug the real audio engine into the AudioManager singleton and start the
  // background music (the manager's mute flag gates everything).
  useEffect(() => {
    const audio = AudioManager.getInstance();
    audio.useEngine(new ExpoAudioService());
    audio.startMusic();
    return () => audio.stopMusic();
  }, []);

  return (
    <AppContainerProvider>
      <I18nProvider>
        <SessionProvider>
          <NavigationProvider>
            <SafeAreaView style={styles.safeArea}>
              <StatusBar barStyle="light-content" />
              <Router />
            </SafeAreaView>
          </NavigationProvider>
        </SessionProvider>
      </I18nProvider>
    </AppContainerProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
