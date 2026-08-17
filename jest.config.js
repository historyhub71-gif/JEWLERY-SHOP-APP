module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['./jest-setup.js'],
  moduleNameMapper: {
    '^react-native/Libraries/Animated/NativeAnimatedHelper$': '<rootDir>/jest-mocks/NativeAnimatedHelper.js',
    'react-native-worklets': '<rootDir>/jest-mocks/react-native-worklets.js',
    '^react-native-reanimated/scripts/validate-worklets-version$': '<rootDir>/jest-mocks/validate-worklets-version.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-.*|@react-navigation-.*|react-native-sweet-alert|@react-native-async-storage)/)',
  ],
};