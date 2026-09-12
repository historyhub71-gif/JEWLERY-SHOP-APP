import React from 'react';
import { View, Text, StyleSheet,} from 'react-native';
import ShopRatesScreen from '../screens/ShopRatesScreen';
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
} from '@react-navigation/drawer';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyCustomersScreen from '../screens/MyCustomersScreen';

import SweetAlert from 'react-native-sweet-alert';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { colors, radii, spacing } from '../theme';
import {
    Bell,
    Calculator,
    Gem,
    ClipboardList,
    Home,
    LogOut,
    Settings,
    ShieldCheck,
    Users,
    UserRound,
} from 'lucide-react-native';

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
    const { profile } = useAuth();
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
                <Text style={styles.drawerKicker}>THE GOLD STANDARD</Text>
                <Text style={styles.drawerTitle}>GOLDKING</Text>
                <Text style={styles.drawerRole}>
                    {profile?.role?.replace('_', ' ').toUpperCase() || 'ACCOUNT'}
                </Text>
            </View>

            <View style={{ flex: 1 }}>
                <DrawerItemList {...props} />
            </View>

            <View style={styles.logoutContainer}>
                <DrawerItem
                    label="Logout"
                    onPress={handleLogout}
                    labelStyle={styles.logoutLabel}
                    icon={({ color, size }) => <LogOut color={color} size={size} />}
                    activeTintColor={colors.gold}
                    inactiveTintColor={colors.danger}
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
                    backgroundColor: colors.background,
                    borderRightColor: colors.border,
                    borderRightWidth: 1,
                    width: 300,
                },
                drawerActiveBackgroundColor: '#252015',
                drawerActiveTintColor: colors.gold,
                drawerInactiveTintColor: colors.textMuted,
                drawerLabelStyle: {
                    fontSize: 14,
                    fontWeight: '700',
                    marginLeft: -10,
                },
                drawerItemStyle: {
                    borderRadius: radii.sm,
                    marginHorizontal: spacing.sm,
                    marginVertical: 2,
                },
                drawerIcon: ({ color, size }) => <Home color={color} size={size} />,
            }}
        >
            <Drawer.Screen
                name="Dashboard"
                component={DashboardStackNavigator}
                options={{
                    title: drawerTitle,
                    drawerIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
                }}
            />
            {role === 'admin' && (
                <Drawer.Screen
                    name="Shop Rates"
                    component={ShopRatesScreen}
                    options={{
                        drawerIcon: ({ color, size }) => <Gem color={color} size={size} />,
                    }}
                />
            )}

            {role === 'admin' && (
                <Drawer.Screen
                    name="My Customers"
                    component={MyCustomersScreen}
                    options={{
                        drawerIcon: ({ color, size }) => <Users color={color} size={size} />,
                    }}
                />
            )}

            {role === 'super_admin' && (
                <Drawer.Screen
                    name="Admin Management"
                    component={AdminManagementScreen}
                    options={{
                        drawerIcon: ({ color, size }) => <Users color={color} size={size} />,
                    }}
                />
            )}

            {role === 'super_admin' && (
                <Drawer.Screen
                    name="Customer Management"
                    component={CustomerManagementScreen}
                    options={{
                        drawerIcon: ({ color, size }) => (
                            <ClipboardList color={color} size={size} />
                        ),
                    }}
                />
            )}

            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    drawerIcon: ({ color, size }) => <UserRound color={color} size={size} />,
                }}
            />

            <Drawer.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ drawerIcon: ({ color, size }) => <Bell color={color} size={size} /> }}
            />

            <Drawer.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    drawerIcon: ({ color, size }) => <Settings color={color} size={size} />,
                }}
            />

            <Drawer.Screen
                name="Calculator"
                component={CalculatorScreen}
                options={{
                    drawerIcon: ({ color, size }) => <Calculator color={color} size={size} />,
                }}
            />
        </Drawer.Navigator>
    );
};

const styles = StyleSheet.create({
    drawerHeader: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: spacing.sm,
    },

    drawerTitle: {
        color: colors.gold,
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 2.5,
    },

    drawerKicker: {
        color: colors.textSubtle,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: spacing.xs,
    },

    drawerRole: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: spacing.xs,
    },

    logoutContainer: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingVertical: spacing.sm,
    },

    logoutLabel: {
        fontSize: 14,
        fontWeight: '700',
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
