import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LeaderboardScreen } from './LeaderboardScreen';
import { AppContainerProvider } from '../AppContainerContext';
import { I18nProvider } from '../i18n/I18nContext';
import { SessionProvider } from '../session/SessionContext';
import { NavigationProvider } from '../navigation/NavigationContext';
import { makeFakeContainer } from '../../../test-support/makeFakeContainer';
import { NotAuthenticatedError } from '../../../application/errors';
import type { AppContainer } from '../../config/container';

function renderLeaderboard(container: AppContainer, levelId?: number) {
  return render(
    <AppContainerProvider container={container}>
      <I18nProvider>
        <SessionProvider>
          <NavigationProvider initial={{ name: 'leaderboard', levelId }}>
            <LeaderboardScreen levelId={levelId} />
          </NavigationProvider>
        </SessionProvider>
      </I18nProvider>
    </AppContainerProvider>,
  );
}

describe('LeaderboardScreen', () => {
  it('should_list_the_entries_when_the_use_case_returns_results', async () => {
    // Arrange
    const container = makeFakeContainer();
    (container.getLeaderboard.execute as jest.Mock).mockResolvedValue([
      { levelId: 1, username: 'bob', score: 950, achievedAt: 'x' },
      { levelId: 1, username: 'alice', score: 800, achievedAt: 'y' },
    ]);

    // Act
    const { getByTestId, getByText } = await renderLeaderboard(container, 1);

    // Assert
    await waitFor(() => expect(getByTestId('entry-0')).toBeTruthy());
    expect(getByText('bob')).toBeTruthy();
    expect(getByText('950')).toBeTruthy();
    expect(container.getLeaderboard.execute).toHaveBeenCalledWith({ levelId: 1 });
  });

  it('should_show_an_error_message_when_the_request_fails', async () => {
    // Arrange
    const container = makeFakeContainer();
    (container.getLeaderboard.execute as jest.Mock).mockRejectedValue(new Error('offline'));

    // Act
    const { getByText } = await renderLeaderboard(container, 1);

    // Assert: the error message mentions the server being offline
    await waitFor(() => expect(getByText(/offline|apagado/i)).toBeTruthy());
  });

  it('should_switch_to_the_overall_ranking_and_refetch_when_the_total_tab_is_pressed', async () => {
    // Arrange
    const container = makeFakeContainer();
    (container.getLeaderboard.execute as jest.Mock).mockResolvedValue([
      { levelId: 1, username: 'bob', score: 950, achievedAt: 'x' },
    ]);
    (container.getOverallLeaderboard.execute as jest.Mock).mockResolvedValue([
      { username: 'ana', totalScore: 4200, levelsPlayed: 5 },
      { username: 'bob', totalScore: 950, levelsPlayed: 1 },
    ]);
    const { getByTestId, getByText } = await renderLeaderboard(container, 1);
    await waitFor(() => expect(getByTestId('entry-0')).toBeTruthy());

    // Act: switch to the Total tab
    await fireEvent.press(getByTestId('tab-total'));

    // Assert: the overall use case is called and the totals render
    await waitFor(() => expect(getByText('ana')).toBeTruthy());
    expect(container.getOverallLeaderboard.execute).toHaveBeenCalledWith({});
    expect(getByText('4200')).toBeTruthy();
    expect(getByText(/5 (levels|niveles)/)).toBeTruthy();
  });

  it('should_open_on_the_overall_ranking_when_no_level_is_given', async () => {
    // Arrange: opened from the home screen (no levelId)
    const container = makeFakeContainer();
    (container.getOverallLeaderboard.execute as jest.Mock).mockResolvedValue([
      { username: 'ana', totalScore: 4200, levelsPlayed: 5 },
    ]);

    // Act
    const { getByText } = await renderLeaderboard(container);

    // Assert: totals load first; the per-level use case is not called
    await waitFor(() => expect(getByText('ana')).toBeTruthy());
    expect(container.getOverallLeaderboard.execute).toHaveBeenCalledWith({});
    expect(container.getLeaderboard.execute).not.toHaveBeenCalled();
  });

  it('should_refetch_the_picked_levels_ranking_when_a_level_chip_is_pressed', async () => {
    // Arrange: the picker lists the available levels
    const container = makeFakeContainer();
    (container.levels.getAll as jest.Mock).mockResolvedValue([
      { id: 1, name: 'L1', difficulty: 'EASY' },
      { id: 2, name: 'L2', difficulty: 'EASY' },
      { id: 3, name: 'L3', difficulty: 'MEDIUM' },
    ]);
    (container.getLeaderboard.execute as jest.Mock).mockResolvedValue([
      { levelId: 1, username: 'bob', score: 950, achievedAt: 'x' },
    ]);
    const { getByTestId } = await renderLeaderboard(container, 1);
    await waitFor(() => expect(getByTestId('pick-level-3')).toBeTruthy());

    // Act: pick level 3
    await fireEvent.press(getByTestId('pick-level-3'));

    // Assert: the ranking is refetched for the picked level
    await waitFor(() =>
      expect(container.getLeaderboard.execute).toHaveBeenCalledWith({ levelId: 3 }),
    );
  });

  it('should_ask_the_player_to_sign_in_when_the_session_is_missing', async () => {
    // Arrange: the authentication aspect rejects the auth-required use case
    const container = makeFakeContainer();
    (container.getLeaderboard.execute as jest.Mock).mockRejectedValue(
      new NotAuthenticatedError('GetLeaderboard'),
    );

    // Act
    const { getByTestId } = await renderLeaderboard(container, 1);

    // Assert: sign-in prompt with a button to the login screen, no error state
    await waitFor(() => expect(getByTestId('auth-required')).toBeTruthy());
    expect(getByTestId('go-login-button')).toBeTruthy();
  });
});
