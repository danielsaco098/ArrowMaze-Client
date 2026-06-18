import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { AppContainerProvider } from './AppContainerContext';
import { NavigationProvider } from './navigation/NavigationContext';
import { Router } from './Router';
import { theme } from './theme';

/** Application root: wires the DI container, navigation and the screen router. */
export function App(): React.JSX.Element {
  return (
    <AppContainerProvider>
      <NavigationProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
          <Router />
        </SafeAreaView>
      </NavigationProvider>
    </AppContainerProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
