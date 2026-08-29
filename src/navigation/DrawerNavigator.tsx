import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';

import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
} from '@react-navigation/drawer';

import SweetAlert from 'react-native-sweet-alert';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

import SuperAdminDashboardScreen from '../screens/dashboards/SuperAdminDashboardScreen';
import AdminDashboardScreen from '../screens/dashboards/AdminDashboardScreen';
import CustomerDashboardScreen from '../screens/dashboards/CustomerDashboardScreen';

import AdminManagementScreen from '../screens/AdminManagementScreen';
import HomeScreen from '../screens/homescreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CustomerManagementScreen from '../screens/CustomerManagementScreen';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => {
    const handleLogout = async () => {
        const result = await SweetAlert.showAlert({
            title: 'Logout',
            subTitle: 'Are you sure you want to logout?',
            confirmButtonTitle: 'Logout',
            confirmButtonColor: '#D4AF37',
            style: 'warning',
        });

        if (!result) {
            return;
        }

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                throw error;
            }

            props.navigation.replace('Login');
        } catch (error: any) {
            await SweetAlert.showAlert({
                title: 'Error',
                subTitle: error.message,
                confirmButtonTitle: 'OK',
                style: 'error',
            });
        }
    };

    return (
        <DrawerContentScrollView
            {...props}
            contentContainerStyle={{ flex: 1 }}
        >
            <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>GOLD KING</Text>
            </View>

            <View style={{ flex: 1 }}>
                <DrawerItemList {...props} />
            </View>

            <View style={styles.logoutContainer}>
                <DrawerItem
                    label="Logout"
                    onPress={handleLogout}
                    labelStyle={styles.logoutLabel}
                    activeTintColor="#D4AF37"
                    inactiveTintColor="#FF5252"
                />
            </View>
        </DrawerContentScrollView>
    );
};

const DrawerNavigator = () => {
    const { profile } = useAuth();

    const isSuperAdmin = profile?.role === 'super_admin';
    const isAdmin = profile?.role === 'admin';
    const isCustomer = profile?.role === 'customer';

    return (
        <Drawer.Navigator
            drawerContent={(props) => (
                <CustomDrawerContent {...props} />
            )}
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
                    fontWeight: '600',
                },
            }}
        >

            {isSuperAdmin && (
                <Drawer.Screen
                    name="Super Admin"
                    component={SuperAdminDashboardScreen}
                />
            )}

            {isSuperAdmin && (
                <Drawer.Screen
                    name="Customer Management"
                    component={CustomerManagementScreen}
                />
            )}

            {isAdmin && (
                <Drawer.Screen
                    name="Admin"
                    component={AdminDashboardScreen}
                />
            )}

            {isCustomer && (
                <Drawer.Screen
                    name="Customer"
                    component={CustomerDashboardScreen}
                />
            )}

            {isSuperAdmin && (
                <Drawer.Screen
                    name="Admin Management"
                    component={AdminManagementScreen}
                />
            )}

            <Drawer.Screen
                name="Home"
                component={HomeScreen}
            />

            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
            />

            <Drawer.Screen
                name="Notifications"
                component={NotificationsScreen}
            />

            <Drawer.Screen
                name="Settings"
                component={SettingsScreen}
            />

        </Drawer.Navigator>
    );
};

const styles = StyleSheet.create({
    drawerHeader: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#292929',
        marginBottom: 10,
    },

    drawerTitle: {
        color: '#D4AF37',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 2,
    },

    logoutContainer: {
        borderTopWidth: 1,
        borderTopColor: '#292929',
        paddingVertical: 10,
    },

    logoutLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
});

export default DrawerNavigator;