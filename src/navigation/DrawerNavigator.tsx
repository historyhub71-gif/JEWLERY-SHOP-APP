import React from 'react';
import {
    createDrawerNavigator,
} from '@react-navigation/drawer';

import HomeScreen from '../screens/homescreen';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    backgroundColor: '#111111',
                    width: 290,
                },
                drawerActiveTintColor: '#D4AF37',
                drawerInactiveTintColor: '#FFFFFF',
                drawerLabelStyle: {
                    fontSize: 15,
                    marginLeft: -10,
                },
            }}
        >
            <Drawer.Screen
                name="Home"
                component={HomeScreen}
            />
        </Drawer.Navigator>
    );
};

export default DrawerNavigator;