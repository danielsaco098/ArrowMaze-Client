import React from 'react';
import { render } from '@testing-library/react-native';
import { GameScreen } from './GameScreen';
import { AppContainerProvider } from '../AppContainerContext';
import { I18nProvider } from '../i18n/I18nContext';
import { SessionProvider } from '../session/SessionContext';
import { NavigationProvider } from '../navigation/NavigationContext';
import { makeFakeContainer } from '../../../test-support/makeFakeContainer';
import { arrow, buildBoard, empty } from '../../../test-support/buildBoard';
import { Level } from '../../../domain/entities/Level';
import { GameSession } from '../../../domain/entities/GameSession';
import type { AppContainer } from '../../config/container';
import type { CellSpec } from '../../../application/ports/ICellFactory';

/** A flat 11×11 board (level 15's shape) with one arrow so play continues. */
function flatBoard() {
  const specs: CellSpec[][] = Array.from({ length: 11 }, () =>
    Array.from({ length: 11 }, empty),
  );
  specs[0][0] = arrow('RIGHT');
  return buildBoard(specs);
}

/** A 30×30 cube board (level 16's shape) with one arrow on FRONT. */
function cubeBoard() {
  const specs: CellSpec[][] = Array.from({ length: 30 }, () =>
    Array.from({ length: 30 }, empty),
  );
  specs[0][0] = arrow('RIGHT');
  return buildBoard(specs);
}

function makeContainer(): AppContainer {
  const container = makeFakeContainer();
  (container.loadLevel.execute as jest.Mock).mockImplementation(
    async ({ levelId }: { levelId: number }) => {
      const level =
        levelId === 16
          ? new Level(16, 'The Cube', 'HARD', cubeBoard())
          : new Level(15, 'The Great Escape', 'HARD', flatBoard());
      return { level, session: new GameSession(level.board) };
    },
  );
  return container;
}

function screen(container: AppContainer, levelId: number) {
  return (
    <AppContainerProvider container={container}>
      <I18nProvider>
        <SessionProvider>
          <NavigationProvider initial={{ name: 'game', levelId }}>
            <GameScreen levelId={levelId} />
          </NavigationProvider>
        </SessionProvider>
      </I18nProvider>
    </AppContainerProvider>
  );
}

describe('GameScreen level 15 → 16 transition', () => {
  it('should_survive_pressing_next_from_a_flat_level_into_the_cube', async () => {
    // Arrange: the exact user path that white-screened — the Router keeps
    // GameScreen MOUNTED when "Next" navigates from 15 to 16; only the levelId
    // prop changes, and for one async beat useGame's refs still hold level
    // 15's 11×11 board while the registry already returns the 30×30 layout.
    const container = makeContainer();
    const { findByTestId, rerender } = await render(screen(container, 15));
    await findByTestId('board'); // level 15's flat board is on screen

    // Act: "Next" — same mounted screen, new levelId. Unguarded, this render
    // walks the cube layout over the stale 11×11 board and throws
    // OutOfBoundsError before the new level finishes loading.
    await rerender(screen(container, 16));

    // Assert: the cube renders once level 16's board arrives — no crash.
    expect(await findByTestId('cube-board')).toBeTruthy();
  });
});
