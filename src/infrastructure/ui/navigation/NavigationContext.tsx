import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/** The screens the app can show. A game route carries the level to play. */
export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'levelSelect' }
  | { readonly name: 'game'; readonly levelId: number }
  | { readonly name: 'login' }
  // Opened from a level it shows that level's ranking; without one (from the
  // home screen) it opens on the overall totals.
  | { readonly name: 'leaderboard'; readonly levelId?: number };

interface NavigationApi {
  readonly route: Route;
  readonly navigate: (route: Route) => void;
  readonly goHome: () => void;
}

const NavigationContext = createContext<NavigationApi | null>(null);

/**
 * Minimal in-app navigator backed by React state — no native navigation
 * dependency, which keeps screens trivial to render in widget tests.
 */
export function NavigationProvider({
  initial = { name: 'home' },
  children,
}: {
  initial?: Route;
  children: React.ReactNode;
}): React.JSX.Element {
  const [route, setRoute] = useState<Route>(initial);

  const navigate = useCallback((next: Route) => setRoute(next), []);
  const goHome = useCallback(() => setRoute({ name: 'home' }), []);

  const value = useMemo(() => ({ route, navigate, goHome }), [route, navigate, goHome]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationApi {
  const api = useContext(NavigationContext);
  if (!api) {
    throw new Error('useNavigation must be used within a NavigationProvider.');
  }
  return api;
}
