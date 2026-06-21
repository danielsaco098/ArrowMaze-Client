import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { NavigationProvider, useNavigation } from '../navigation/NavigationContext';
import { I18nProvider } from '../i18n/I18nContext';
import { AppContainerProvider } from '../AppContainerContext';
import { SessionProvider } from '../session/SessionContext';
import { makeFakeContainer } from '../../../test-support/makeFakeContainer';

/** Probe that surfaces the current route name so navigation can be asserted. */
function RouteProbe(): React.JSX.Element {
  const { route } = useNavigation();
  return <Text testID="route">{route.name}</Text>;
}

function renderHome(extra?: React.ReactNode) {
  return render(
    <AppContainerProvider container={makeFakeContainer()}>
      <I18nProvider>
        <SessionProvider>
          <NavigationProvider>
            <HomeScreen />
            {extra}
          </NavigationProvider>
        </SessionProvider>
      </I18nProvider>
    </AppContainerProvider>,
  );
}

describe('HomeScreen', () => {
  it('should_render_the_title_and_play_button', async () => {
    const { getByText, getByTestId } = await renderHome();

    expect(getByText('Arrow Maze')).toBeTruthy();
    expect(getByText('Play')).toBeTruthy();
    expect(getByTestId('play-button')).toBeTruthy();
  });

  it('should_navigate_to_level_select_when_play_is_pressed', async () => {
    const { getByTestId } = await renderHome(<RouteProbe />);
    expect(getByTestId('route').props.children).toBe('home');

    await fireEvent.press(getByTestId('play-button'));

    expect(getByTestId('route').props.children).toBe('levelSelect');
  });

  it('should_switch_the_interface_language_when_the_toggle_is_pressed', async () => {
    const { getByText, getByTestId } = await renderHome();
    expect(getByText('Play')).toBeTruthy();

    await fireEvent.press(getByTestId('language-toggle'));

    // After toggling to Spanish, the play label is translated.
    expect(getByText('Jugar')).toBeTruthy();
  });
});
