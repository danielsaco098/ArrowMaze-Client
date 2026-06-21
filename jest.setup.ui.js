// Mock the native AsyncStorage module for widget tests so importing the
// composition root (which references it) does not require the native binary.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
