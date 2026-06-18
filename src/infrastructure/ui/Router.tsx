import React from 'react';
import { useNavigation } from './navigation/NavigationContext';
import { HomeScreen } from './screens/HomeScreen';
import { LevelSelectScreen } from './screens/LevelSelectScreen';
import { GameScreen } from './screens/GameScreen';

/** Renders the screen for the current route. */
export function Router(): React.JSX.Element {
  const { route } = useNavigation();

  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'levelSelect':
      return <LevelSelectScreen />;
    case 'game':
      return <GameScreen levelId={route.levelId} />;
    default:
      return <HomeScreen />;
  }
}
