// Mock the native AsyncStorage module for widget tests so importing the
// composition root (which references it) does not require the native binary.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Make Animated compositions complete instantly. The real timing loop drives
// requestAnimationFrame for the whole animation duration, which starves
// waitFor() on slow CI runners and made the navigation-flow suite flaky.
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const instant = { start: (cb) => cb && cb({ finished: true }), stop: () => {}, reset: () => {} };
  RN.Animated.timing = () => instant;
  RN.Animated.sequence = () => instant;
  return RN;
});
