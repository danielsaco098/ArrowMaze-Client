import type { AppContainer } from '../infrastructure/config/container';
import { InMemoryEventBus } from '../adapters/events/InMemoryEventBus';

/**
 * Builds a fully-stubbed {@link AppContainer} for widget tests, avoiding any real
 * network or AsyncStorage. Pass `overrides` to customize specific members.
 */
export function makeFakeContainer(overrides: Partial<AppContainer> = {}): AppContainer {
  const base = {
    levels: { getById: jest.fn(), getAll: jest.fn().mockResolvedValue([]) },
    eventBus: new InMemoryEventBus(),
    loadLevel: { execute: jest.fn() },
    tapCell: { execute: jest.fn() },
    recordResult: { execute: jest.fn() },
    getProgress: { execute: jest.fn() },
    authApi: { login: jest.fn(), register: jest.fn() },
    leaderboardApi: { topForLevel: jest.fn().mockResolvedValue([]) },
    progressApi: { sync: jest.fn().mockResolvedValue([]), getProgress: jest.fn().mockResolvedValue([]) },
    session: {
      load: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
  } as unknown as AppContainer;

  return { ...base, ...overrides };
}
