import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { NavigationProvider, useNavigation } from '../navigation/NavigationContext';

/** Probe that surfaces the current route name so navigation can be asserted. */
function RouteProbe(): React.JSX.Element {
  const { route } = useNavigation();
  return <Text testID="route">{route.name}</Text>;
}

describe('HomeScreen', () => {
  it('should_render_the_title_and_play_button', async () => {
    // Arrange / Act
    const { getByText, getByTestId } = await render(
      <NavigationProvider>
        <HomeScreen />
      </NavigationProvider>,
    );

    // Assert
    expect(getByText('Arrow Maze')).toBeTruthy();
    expect(getByTestId('play-button')).toBeTruthy();
  });

  it('should_navigate_to_level_select_when_play_is_pressed', async () => {
    // Arrange
    const { getByTestId } = await render(
      <NavigationProvider>
        <HomeScreen />
        <RouteProbe />
      </NavigationProvider>,
    );
    expect(getByTestId('route').props.children).toBe('home');

    // Act
    await fireEvent.press(getByTestId('play-button'));

    // Assert
    expect(getByTestId('route').props.children).toBe('levelSelect');
  });
});
