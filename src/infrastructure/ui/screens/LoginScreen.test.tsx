import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from './LoginScreen';
import { AppContainerProvider } from '../AppContainerContext';
import { I18nProvider } from '../i18n/I18nContext';
import { SessionProvider } from '../session/SessionContext';
import { NavigationProvider } from '../navigation/NavigationContext';
import { makeFakeContainer } from '../../../test-support/makeFakeContainer';
import { HttpError } from '../../../application/ports/IHttpClient';
import type { AppContainer } from '../../config/container';

function renderLogin(container: AppContainer) {
  return render(
    <AppContainerProvider container={container}>
      <I18nProvider>
        <SessionProvider>
          <NavigationProvider initial={{ name: 'login' }}>
            <LoginScreen />
          </NavigationProvider>
        </SessionProvider>
      </I18nProvider>
    </AppContainerProvider>,
  );
}

describe('LoginScreen', () => {
  it('should_render_the_login_form', async () => {
    const container = makeFakeContainer();
    const { getByTestId } = await renderLogin(container);

    expect(getByTestId('username-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
  });

  it('should_call_the_auth_api_with_the_entered_credentials_on_sign_in', async () => {
    // Arrange
    const container = makeFakeContainer();
    (container.authApi.login as jest.Mock).mockResolvedValue({
      accessToken: 't',
      user: { id: '1', username: 'alice', role: 'user' },
    });
    const { getByTestId } = await renderLogin(container);

    // Act
    await fireEvent.changeText(getByTestId('username-input'), 'alice');
    await fireEvent.changeText(getByTestId('password-input'), 'secret123');
    await fireEvent.press(getByTestId('login-button'));

    // Assert
    await waitFor(() =>
      expect(container.authApi.login).toHaveBeenCalledWith({
        username: 'alice',
        password: 'secret123',
      }),
    );
  });

  it('should_show_an_error_when_credentials_are_invalid', async () => {
    // Arrange
    const container = makeFakeContainer();
    (container.authApi.login as jest.Mock).mockRejectedValue(new HttpError(401, 'bad'));
    const { getByTestId } = await renderLogin(container);

    // Act
    await fireEvent.changeText(getByTestId('username-input'), 'alice');
    await fireEvent.changeText(getByTestId('password-input'), 'wrongpass');
    await fireEvent.press(getByTestId('login-button'));

    // Assert
    await waitFor(() => expect(getByTestId('login-error')).toBeTruthy());
  });
});
