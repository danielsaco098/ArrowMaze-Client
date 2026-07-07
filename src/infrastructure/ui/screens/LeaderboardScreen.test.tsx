import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { LeaderboardScreen } from './LeaderboardScreen';
import { AppContainerProvider } from '../AppContainerContext';
import { I18nProvider } from '../i18n/I18nContext';
import { SessionProvider } from '../session/SessionContext';
import { NavigationProvider } from '../navigation/NavigationContext';
import { makeFakeContainer } from '../../../test-support/makeFakeContainer';
import { NotAuthenticatedError } from '../../../application/errors';
import type { AppContainer } from '../../config/container';

function renderLeaderboard(container: AppContainer, levelId = 1) {
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
  it('should_list_the_entries_returned_by_the_use_case', async () => {
    // Arrange
    const container = makeFakeContainer();
    (container.getLeaderboard.execute as jest.Mock).mockResolvedValue([
      { levelId: 1, username: 'bob', score: 950, achievedAt: 'x' },
      { levelId: 1, username: 'alice', score: 800, achievedAt: 'y' },
    ]);

    // Act
    const { getByTestId, getByText } = await renderLeaderboard(container);

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
    const { getByText } = await renderLeaderboard(container);

    // Assert: the error message mentions the server being offline
    await waitFor(() => expect(getByText(/offline|apagado/i)).toBeTruthy());
  });

  it('should_ask_the_player_to_sign_in_when_the_session_is_missing', async () => {
    // Arrange: the authentication aspect rejects the auth-required use case
    const container = makeFakeContainer();
    (container.getLeaderboard.execute as jest.Mock).mockRejectedValue(
      new NotAuthenticatedError('GetLeaderboard'),
    );

    // Act
    const { getByTestId } = await renderLeaderboard(container);

    // Assert: sign-in prompt with a button to the login screen, no error state
    await waitFor(() => expect(getByTestId('auth-required')).toBeTruthy());
    expect(getByTestId('go-login-button')).toBeTruthy();
  });
});
