import 'react-native-gesture-handler/jestSetup';

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
  addWhitelistedStyleProp: jest.fn(),
  addWhitelistedNativeProps: jest.fn(),
}), { virtual: true });

// Mock SweetAlert
jest.mock('react-native-sweet-alert', () => ({
  showAlert: jest.fn(),
  dismiss: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest')
);

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Worklets
jest.mock('react-native-worklets', () => ({
  Worklets: {
    createContext: jest.fn(),
    createRunInContext: jest.fn(),
  },
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    ScreenContainer: View,
    Screen: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    ScreenStack: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderSubview: View,
    SearchBar: View,
    FullWindowOverlay: View,
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    SafeAreaConsumer: ({ children }) => children(inset),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: inset,
    },
  };
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  const SvgMock = (props) => View;
  return {
    default: SvgMock,
    Svg: View,
    Path: View,
    Circle: View,
    Rect: View,
    G: View,
    Text: View,
    TSpan: View,
    TextPath: View,
    Image: View,
    Use: View,
    Defs: View,
    Stop: View,
    LinearGradient: View,
    RadialGradient: View,
    Mask: View,
    Pattern: View,
    Marker: View,
    ClipPath: View,
    Polyline: View,
    Polygon: View,
    Line: View,
    Ellipse: View,
    Symbol: View,
  };
});


