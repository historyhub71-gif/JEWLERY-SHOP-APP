import React from 'react';
import { View, Text } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <AppNavigator />
  );
};

// Global error handler
const originalError = console.error;
console.error = (...args: any[]) => {
  originalError(...args);
};

export default App;