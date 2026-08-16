import React from 'react';
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem,
} from '@react-navigation/drawer';
import SweetAlert from 'react-native-sweet-alert';
import { supabase } from '../lib/supabase';

import HomeScreen from '../screens/homescreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => {
    const handleLogout = () => {
        SweetAlert.showAlertWithOptions(
            {
                title: 'Logout',
                subTitle: 'Are you sure you want to logout?',
                confirmButtonTitle: 'Logout',
                confirmButtonColor: '#D4AF37',
                otherButtonTitle: 'Cancel',
                otherButtonColor: '#333333',
                style: 'warning',
                cancellable: true,
            },
            async (confirmed) => {
                if (!confirmed) return;

                try {
                    const { error } = await supabase.auth.signOut();

                    if (error) throw error;

                    props.navigation.replace('Login');
                } catch (error: any) {
                    SweetAlert.showAlertWithOptions(
                        {
                            title: 'Error',
                            subTitle: error.message,
                            confirmButtonTitle: 'OK',
                            style: 'error',
                        },
                        () => {}
                    );
                }
            }
        );
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

const DrawerNavigator = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
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
            <Drawer.Screen name="Home" component={HomeScreen} />
            <Drawer.Screen name="Profile" component={ProfileScreen} />
            <Drawer.Screen name="Notifications" component={NotificationsScreen} />
            <Drawer.Screen name="Settings" component={SettingsScreen} />
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