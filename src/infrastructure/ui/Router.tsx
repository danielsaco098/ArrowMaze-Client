import React from 'react';
import { useNavigation } from './navigation/NavigationContext';
import { HomeScreen } from './screens/HomeScreen';
import { LevelSelectScreen } from './screens/LevelSelectScreen';
import { GameScreen } from './screens/GameScreen';
import { LoginScreen } from './screens/LoginScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';

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
    case 'login':
      return <LoginScreen />;
    case 'leaderboard':
      return <LeaderboardScreen levelId={route.levelId} />;
    default:
      return <HomeScreen />;
  }
}
