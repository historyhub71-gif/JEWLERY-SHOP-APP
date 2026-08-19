import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SuperAdminScreen = ({ navigation }: any) => {
    return (
        <SafeAreaView style={styles.container}>
           <View style={styles.header}>
                   <TouchableOpacity
                       style={styles.menuButton}
                       onPress={() => navigation.openDrawer()}
                       accessibilityRole="button"
                       accessibilityLabel="Open menu"
                   >
                       <Text style={styles.menuIcon}>☰</Text>
                   </TouchableOpacity>
       
                       <Text style={styles.headerTitle}>GOLD KING</Text>
       
                       <View style={styles.headerRight} />
                   </View>

            <View style={styles.content}>
                <Text style={styles.welcome}>
                    Welcome, Super Admin
                </Text>

                <Text style={styles.description}>
                    You have full access to the GoldKing system.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        Super Admin Dashboard
                    </Text>

                    <Text style={styles.cardText}>
                        Admin management, customer management,
                        shop management and system settings will
                        be available here.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
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

    headerRight: {
        width: 45,
    },
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },

    title: {
        color: '#D4AF37',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 2,
    },

    subtitle: {
        color: '#FFFFFF',
        fontSize: 15,
        marginTop: 5,
    },

    content: {
        padding: 24,
    },

    welcome: {
        color: '#FFFFFF',
        fontSize: 25,
        fontWeight: '700',
    },

    description: {
        color: '#888888',
        fontSize: 14,
        marginTop: 8,
        marginBottom: 25,
    },

    card: {
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 14,
        padding: 20,
    },

    cardTitle: {
        color: '#D4AF37',
        fontSize: 18,
        fontWeight: '700',
    },

    cardText: {
        color: '#BBBBBB',
        fontSize: 14,
        lineHeight: 22,
        marginTop: 10,
    },
});

export default SuperAdminScreen;