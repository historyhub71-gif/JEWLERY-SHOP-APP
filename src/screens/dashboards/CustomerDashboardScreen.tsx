import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const CustomerDashboardScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => navigation.openDrawer()}
                >
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>CUSTOMER</Text>

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.homeIcon}>⌂</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.welcome}>Welcome to</Text>

                <Text style={styles.title}>GOLD KING</Text>

                <Text style={styles.subtitle}>
                    Customer Dashboard
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
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: '#D4AF37',
    },

    homeButton: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },

    homeIcon: {
        fontSize: 28,
        color: '#D4AF37',
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
        fontSize: 38,
        fontWeight: 'bold',
        letterSpacing: 3,
    },

    subtitle: {
        color: '#FFFFFF',
        fontSize: 15,
        marginTop: 8,
        letterSpacing: 1,
    },
});

export default CustomerDashboardScreen;