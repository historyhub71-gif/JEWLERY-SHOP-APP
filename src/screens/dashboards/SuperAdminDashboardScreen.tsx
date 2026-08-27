import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SuperAdminDashboardScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => navigation.openDrawer()}
                >
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>SUPER ADMIN</Text>

                <View style={styles.headerRight} />
            </View>

            <View style={styles.content}>
                <Text style={styles.welcome}>Welcome to</Text>

                <Text style={styles.title}>SUPER ADMIN</Text>

                <Text style={styles.subtitle}>
                    GoldKing Management Dashboard
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },

    header: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
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
        fontSize: 30,
        color: '#D4AF37',
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: '#D4AF37',
    },

    headerRight: {
        width: 45,
    },

    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 25,
    },

    welcome: {
        color: '#AAAAAA',
        fontSize: 16,
        marginBottom: 8,
    },

    title: {
        color: '#D4AF37',
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 2,
    },

    subtitle: {
        color: '#FFFFFF',
        fontSize: 14,
        marginTop: 8,
        letterSpacing: 1,
        textAlign: 'center',
    },
});

export default SuperAdminDashboardScreen;