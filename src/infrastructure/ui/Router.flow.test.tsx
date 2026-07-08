import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Router } from './Router';
import { AppContainerProvider } from './AppContainerContext';
import { I18nProvider } from './i18n/I18nContext';
import { SessionProvider } from './session/SessionContext';
import { NavigationProvider, Route } from './navigation/NavigationContext';
import { makeFakeContainer } from '../../test-support/makeFakeContainer';
import { arrow, buildBoard, empty } from '../../test-support/buildBoard';
import { Level } from '../../domain/entities/Level';
import { GameSession } from '../../domain/entities/GameSession';
import { PlayerProgress } from '../../domain/entities/PlayerProgress';
import { Position } from '../../domain/value-objects/Position';
import type { AppContainer } from '../config/container';

/**
 * End-to-end navigation flows through the real Router and real domain objects
 * (board, session, tap rule); only the container ports are faked.
 */
function makeGameContainer(cells: () => ReturnType<typeof buildBoard>): AppContainer {
  const container = makeFakeContainer();
  const makeLevel = () => new Level(1, 'First Steps', 'EASY', cells());
  (container.levels.getAll as jest.Mock).mockResolvedValue([makeLevel()]);
  (container.getProgress.execute as jest.Mock).mockResolvedValue(PlayerProgress.empty());
  (container.loadLevel.execute as jest.Mock).mockImplementation(async () => {
    const level = makeLevel();
    return { level, session: new GameSession(level.board) };
  });
  (container.tapCell.execute as jest.Mock).mockImplementation(
    async ({ session, position }: { session: GameSession; position: Position }) =>
      session.tap(position),
  );
  (container.recordResult.execute as jest.Mock).mockResolvedValue({
    score: { points: 950 },
    isNewBest: true,
    progress: PlayerProgress.empty(),
  });
  return container;
}

function renderApp(container: AppContainer, initial: Route = { name: 'home' }) {
  return render(
    <AppContainerProvider container={container}>
      <I18nProvider>
        <SessionProvider>
          <NavigationProvider initial={initial}>
            <Router />
          </NavigationProvider>
        </SessionProvider>
      </I18nProvider>
    </AppContainerProvider>,
  );
}

describe('Navigation flows (Router)', () => {
  it('should_reach_the_victory_overlay_when_navigating_home_to_level_and_winning', async () => {
    // Arrange: a level whose single arrow escapes rightwards
    const container = makeGameContainer(() => buildBoard([[arrow('RIGHT'), empty()]]));
    const { getByTestId } = await renderApp(container);

    // Act 1: home → level select
    await fireEvent.press(getByTestId('play-button'));
    await waitFor(() => expect(getByTestId('level-1')).toBeTruthy());

    // Act 2: level select → game
    await fireEvent.press(getByTestId('level-1'));
    await waitFor(() => expect(getByTestId('cell-0-0')).toBeTruthy());

    // Act 3: win by sending the only arrow off the board
    await fireEvent.press(getByTestId('cell-0-0'));

    // Assert: victory overlay with its actions
    await waitFor(() => expect(getByTestId('victory-overlay')).toBeTruthy());
    expect(getByTestId('leaderboard-button')).toBeTruthy();
  });

  it('should_show_the_defeat_overlay_and_recover_when_retry_is_pressed', async () => {
    // Arrange: two arrows blocking each other — every tap loses a life
    const container = makeGameContainer(() => buildBoard([[arrow('DOWN')], [arrow('UP')]]));
    const { getByTestId, queryByTestId } = await renderApp(container, {
      name: 'game',
      levelId: 1,
    });
    await waitFor(() => expect(getByTestId('cell-1-0')).toBeTruthy());

    // Act: burn the three lives on the blocked arrow
    await fireEvent.press(getByTestId('cell-1-0'));
    await fireEvent.press(getByTestId('cell-1-0'));
    await fireEvent.press(getByTestId('cell-1-0'));

    // Assert: defeat overlay appears
    await waitFor(() => expect(getByTestId('defeat-overlay')).toBeTruthy());

    // Act: retry reloads the level and clears the overlay
    await fireEvent.press(getByTestId('retry-button'));
    await waitFor(() => expect(queryByTestId('defeat-overlay')).toBeNull());
    expect(getByTestId('cell-1-0')).toBeTruthy();
  });
});
