import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const SettingsScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => navigation.openDrawer()}
                >
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SETTINGS</Text>
                <View style={styles.headerRight} />
            </View>
            <View style={styles.content}>
                <Text style={styles.text}>Settings Screen</Text>
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
    headerRight: {
        width: 45,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 18,
    },
});

export default SettingsScreen;