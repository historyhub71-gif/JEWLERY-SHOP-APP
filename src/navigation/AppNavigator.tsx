import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import DrawerNavigator from './DrawerNavigator';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const handleNavigationStateChange = (state: any) => {
        // Track navigation state
        if (!state) {
            console.log('Navigation state is null');
        }
    };

    const handleNavigationReady = () => {
        console.log('Navigation ready');
    };

    return (
        <NavigationContainer
            onStateChange={handleNavigationStateChange}
            onReady={handleNavigationReady}
            fallback={
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#000',
                    }}
                >
                    <Text style={{ color: '#fff' }}>Loading...</Text>
                </View>
            }
        >
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen
                    name="Splash"
                    component={SplashScreen}
                    options={{
                        animationTypeForReplace: 'pop',
                    }}
                />

                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                />

                <Stack.Screen
                    name="Registration"
                    component={RegistrationScreen}
                />

                <Stack.Screen
                    name="Main"
                    component={DrawerNavigator}
                />

            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;