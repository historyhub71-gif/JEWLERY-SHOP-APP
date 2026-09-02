import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
} from '@react-navigation/drawer';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SweetAlert from 'react-native-sweet-alert';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

import SuperAdminDashboardScreen from '../screens/dashboards/SuperAdminDashboardScreen';
import AdminDashboardScreen from '../screens/dashboards/AdminDashboardScreen';
import CustomerDashboardScreen from '../screens/dashboards/CustomerDashboardScreen';
import HomeScreen from '../screens/homescreen';

import AdminManagementScreen from '../screens/AdminManagementScreen';
import CustomerManagementScreen from '../screens/CustomerManagementScreen';

import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CalculatorScreen from '../screens/CalculatorScreen';

const Drawer = createDrawerNavigator();
const DashboardStack = createNativeStackNavigator();

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

            props.navigation.getParent()?.replace('Login');
        } catch (error: any) {
            await SweetAlert.showAlert({
                title: 'Error',
                subTitle: error?.message || 'Logout failed.',
                confirmButtonTitle: 'OK',
                style: 'error',
            });
        }
    };

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
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

const DashboardStackNavigator = () => {
    const { profile } = useAuth();

    const role = profile?.role;

    if (!role) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading user profile...</Text>
            </View>
        );
    }

    return (
        <DashboardStack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            {role === 'super_admin' && (
                <DashboardStack.Screen
                    name="SuperAdminDashboard"
                    component={SuperAdminDashboardScreen}
                />
            )}

            {role === 'admin' && (
                <DashboardStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            )}

            {role === 'customer' && (
                <DashboardStack.Screen
                    name="CustomerDashboard"
                    component={CustomerDashboardScreen}
                />
            )}

            <DashboardStack.Screen name="Home" component={HomeScreen} />
        </DashboardStack.Navigator>
    );
};

const DrawerNavigator = () => {
    const { profile } = useAuth();

    const role = profile?.role;

    const drawerTitle =
        role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Customer';

    return (
        <Drawer.Navigator
            initialRouteName="Dashboard"
            drawerContent={props => <CustomDrawerContent {...props} />}
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
            <Drawer.Screen
                name="Dashboard"
                component={DashboardStackNavigator}
                options={{
                    title: drawerTitle,
                }}
            />

            {role === 'super_admin' && (
                <Drawer.Screen name="Admin Management" component={AdminManagementScreen} />
            )}

            {role === 'super_admin' && (
                <Drawer.Screen name="Customer Management" component={CustomerManagementScreen} />
            )}

            <Drawer.Screen name="Profile" component={ProfileScreen} />

            <Drawer.Screen name="Notifications" component={NotificationsScreen} />

            <Drawer.Screen name="Settings" component={SettingsScreen} />

            <Drawer.Screen name="Calculator" component={CalculatorScreen} />
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

    loadingContainer: {
        flex: 1,
        backgroundColor: '#111111',
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
        color: '#D4AF37',
        fontSize: 15,
    },
});

export default DrawerNavigator;
