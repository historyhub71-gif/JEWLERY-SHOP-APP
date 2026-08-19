import React from 'react';
import { View, Text } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

// Global error handler
const originalError = console.error;

console.error = (...args: any[]) => {
  originalError(...args);
};

export default App;