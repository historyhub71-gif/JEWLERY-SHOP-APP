import React from 'react';
import {
    NavigationContainer,
} from '@react-navigation/native';
import DrawerNavigator from './DrawerNavigator';
import {
    createNativeStackNavigator,
} from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import HomeScreen from '../screens/homescreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen
                    name="Splash"
                    component={SplashScreen}
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
                    name="Home"
                    component={HomeScreen}
                />
                <Stack.Screen
                    name="Drawer"
                    component={DrawerNavigator}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;