import React, { createContext, useContext, useMemo } from 'react';
import type { AppContainer } from '../config/container';
import { createContainer } from '../config/container';

const AppContainerContext = createContext<AppContainer | null>(null);

/**
 * Provides the {@link AppContainer} (the wired use cases) to the React tree.
 * Tests can inject a custom container; the app builds the real one by default.
 */
export function AppContainerProvider({
  container,
  children,
}: {
  container?: AppContainer;
  children: React.ReactNode;
}): React.JSX.Element {
  const value = useMemo(() => container ?? createContainer(), [container]);
  return <AppContainerContext.Provider value={value}>{children}</AppContainerContext.Provider>;
}

export function useContainer(): AppContainer {
  const container = useContext(AppContainerContext);
  if (!container) {
    throw new Error('useContainer must be used within an AppContainerProvider.');
  }
  return container;
}
