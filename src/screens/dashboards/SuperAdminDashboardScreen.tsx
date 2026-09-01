import React, { useCallback, useEffect, useState } from 'react';
import {ActivityIndicator, RefreshControl,SafeAreaView, ScrollView,StyleSheet,  Text,TouchableOpacity,View,} from 'react-native';

import SweetAlert from 'react-native-sweet-alert';
import { supabase } from '../../lib/supabase';

const SuperAdminDashboardScreen = ({ navigation }: any) => {
    const [adminCount, setAdminCount] = useState(0);
    const [customerCount, setCustomerCount] = useState(0);
    const [pendingCustomers, setPendingCustomers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboardData = useCallback(async () => {
        try {
            const { count: admins, error: adminError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'admin');

            if (adminError) {
                throw adminError;
            }

            const { count: customers, error: customerError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'customer');

            if (customerError) {
                throw customerError;
            }

            const { count: pending, error: pendingError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'customer')
                .eq('status', 'pending');

            if (pendingError) {
                throw pendingError;
            }

            setAdminCount(admins || 0);
            setCustomerCount(customers || 0);
            setPendingCustomers(pending || 0);
        } catch (error: any) {
            console.error('SUPER ADMIN DASHBOARD ERROR:', error);

            await SweetAlert.showAlert({
                style: 'error',
                title: 'Dashboard Error',
                subTitle: error?.message || 'Unable to load dashboard data.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>SUPER ADMIN</Text>

                    <Text style={styles.headerSubtitle}>GoldKing Control Center</Text>
                </View>

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.homeIcon}>⌂</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#D4AF37"
                    />
                }
            >
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeText}>Welcome back</Text>

                    <Text style={styles.dashboardTitle}>Super Admin Dashboard</Text>

                    <Text style={styles.dashboardSubtitle}>
                        Manage your GoldKing platform from one place.
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#D4AF37" />

                        <Text style={styles.loadingText}>Loading dashboard...</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <View style={styles.statIcon}>
                                    <Text style={styles.statIconText}>A</Text>
                                </View>

                                <Text style={styles.statNumber}>{adminCount}</Text>

                                <Text style={styles.statLabel}>Administrators</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.statIcon}>
                                    <Text style={styles.statIconText}>C</Text>
                                </View>

                                <Text style={styles.statNumber}>{customerCount}</Text>

                                <Text style={styles.statLabel}>Customers</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.pendingIcon}>
                                    <Text style={styles.statIconText}>!</Text>
                                </View>

                                <Text style={styles.statNumber}>{pendingCustomers}</Text>

                                <Text style={styles.statLabel}>Pending Approval</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={styles.statIcon}>
                                    <Text style={styles.statIconText}>GK</Text>
                                </View>

                                <Text style={styles.statNumber}>3</Text>

                                <Text style={styles.statLabel}>User Roles</Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Quick Management</Text>

                            <Text style={styles.sectionSubtitle}>
                                Access important management areas quickly.
                            </Text>

                            <TouchableOpacity
                                style={styles.managementCard}
                                onPress={() => navigation.navigate('Admin Management')}
                            >
                                <View style={styles.managementIcon}>
                                    <Text style={styles.managementIconText}>A</Text>
                                </View>

                                <View style={styles.managementInfo}>
                                    <Text style={styles.managementTitle}>Admin Management</Text>

                                    <Text style={styles.managementDescription}>
                                        Create, edit and manage administrators.
                                    </Text>
                                </View>

                                <Text style={styles.arrow}>›</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.managementCard}
                                onPress={() => navigation.navigate('Customer Management')}
                            >
                                <View style={styles.managementIcon}>
                                    <Text style={styles.managementIconText}>C</Text>
                                </View>

                                <View style={styles.managementInfo}>
                                    <Text style={styles.managementTitle}>Customer Management</Text>

                                    <Text style={styles.managementDescription}>
                                        View and approve GoldKing customers.
                                    </Text>
                                </View>

                                {pendingCustomers > 0 && (
                                    <View style={styles.pendingBadge}>
                                        <Text style={styles.pendingBadgeText}>
                                            {pendingCustomers}
                                        </Text>
                                    </View>
                                )}

                                <Text style={styles.arrow}>›</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={styles.infoIcon}>
                                <Text style={styles.infoIconText}>✓</Text>
                            </View>

                            <View style={styles.infoContent}>
                                <Text style={styles.infoTitle}>System Status</Text>

                                <Text style={styles.infoText}>
                                    GoldKing management system is active and ready.
                                </Text>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },

    header: {
        height: 76,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#292929',
    },

    menuButton: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },

    menuIcon: {
        color: '#D4AF37',
        fontSize: 30,
    },

    headerTitleContainer: {
        flex: 1,
        marginLeft: 8,
    },

    headerTitle: {
        color: '#D4AF37',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 2,
    },

    headerSubtitle: {
        color: '#777777',
        fontSize: 11,
        marginTop: 3,
    },

    headerRight: {
        width: 45,
    },

    content: {
        flex: 1,
    },

    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 25,
        paddingBottom: 40,
    },

    welcomeSection: {
        marginBottom: 25,
    },

    welcomeText: {
        color: '#888888',
        fontSize: 14,
        marginBottom: 5,
    },

    dashboardTitle: {
        color: '#FFFFFF',
        fontSize: 27,
        fontWeight: '800',
    },

    dashboardSubtitle: {
        color: '#777777',
        fontSize: 13,
        marginTop: 7,
        lineHeight: 19,
    },

    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },

    loadingText: {
        color: '#888888',
        fontSize: 13,
        marginTop: 12,
    },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    statCard: {
        width: '48.5%',
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#292929',
        borderRadius: 15,
        padding: 16,
        marginBottom: 12,
    },

    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    pendingIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#8B6F1E',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    statIconText: {
        color: '#111111',
        fontSize: 12,
        fontWeight: '900',
    },

    statNumber: {
        color: '#FFFFFF',
        fontSize: 25,
        fontWeight: '800',
    },

    statLabel: {
        color: '#888888',
        fontSize: 12,
        marginTop: 4,
    },

    section: {
        marginTop: 25,
    },

    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },

    sectionSubtitle: {
        color: '#777777',
        fontSize: 12,
        marginTop: 5,
        marginBottom: 15,
    },

    managementCard: {
        minHeight: 75,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#292929',
        borderRadius: 15,
        paddingHorizontal: 14,
        marginBottom: 12,
    },

    managementIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
    },

    managementIconText: {
        color: '#111111',
        fontSize: 15,
        fontWeight: '900',
    },

    managementInfo: {
        flex: 1,
        marginLeft: 13,
    },

    managementTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    managementDescription: {
        color: '#777777',
        fontSize: 11,
        marginTop: 4,
    },

    pendingBadge: {
        minWidth: 25,
        height: 25,
        borderRadius: 13,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    pendingBadgeText: {
        color: '#111111',
        fontSize: 11,
        fontWeight: '900',
    },

    arrow: {
        color: '#D4AF37',
        fontSize: 30,
        fontWeight: '300',
    },

    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#151515',
        borderWidth: 1,
        borderColor: '#292929',
        borderRadius: 15,
        padding: 15,
        marginTop: 13,
    },

    infoIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#17301F',
        justifyContent: 'center',
        alignItems: 'center',
    },

    infoIconText: {
        color: '#55C878',
        fontSize: 17,
        fontWeight: '800',
    },

    infoContent: {
        flex: 1,
        marginLeft: 12,
    },

    infoTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    infoText: {
        color: '#777777',
        fontSize: 11,
        marginTop: 3,
    },
    //home icon styles
    homeButton: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },

    homeIcon: {
        color: '#D4AF37',
        fontSize: 30,
        fontWeight: '700',
    },
});

export default SuperAdminDashboardScreen;
