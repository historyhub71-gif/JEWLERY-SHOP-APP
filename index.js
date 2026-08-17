/**
 * @format
 */
import 'react-native-gesture-handler';

// Guard reanimated import: if native module isn't installed, don't crash at startup
try {
	require('react-native-reanimated');
} catch (e) {
	// eslint-disable-next-line no-console
	console.warn('react-native-reanimated native module not available', e);
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
