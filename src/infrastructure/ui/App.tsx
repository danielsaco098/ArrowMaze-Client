import React, { useEffect } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
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

// Android's notification-shade swipe zone reaches BELOW the status bar, so
// interactive rows need extra clearance past `StatusBar.currentHeight` or
// their taps are still swallowed by the system gesture.
const ANDROID_GESTURE_CLEARANCE = 20;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    // RN's SafeAreaView is a no-op on Android, so the header row rendered
    // inside the status bar's touch zone and its taps were swallowed by the
    // notification-shade gesture. Push all content below that whole zone.
    paddingTop:
      Platform.OS === 'android'
        ? (StatusBar.currentHeight ?? 0) + ANDROID_GESTURE_CLEARANCE
        : 0,
  },
});
