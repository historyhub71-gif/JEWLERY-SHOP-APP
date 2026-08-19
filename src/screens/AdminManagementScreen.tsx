import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import SweetAlert from 'react-native-sweet-alert';
import { supabase } from '../lib/supabase';

const AdminManagementScreen = ({ navigation }: any) => {
    const [showForm, setShowForm] = useState(false);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);

    const handleCreateAdmin = async () => {
        if (!fullName.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Name Required',
                subTitle: 'Please enter the admin full name.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (!email.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Email Required',
                subTitle: 'Please enter the admin email.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (!phone.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Phone Required',
                subTitle: 'Please enter the admin phone number.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (!city.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'City Required',
                subTitle: 'Please enter the admin city.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (!address.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Address Required',
                subTitle: 'Please enter the admin address.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (password.length < 6) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Password Too Short',
                subTitle: 'Password must contain at least 6 characters.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        setLoading(true);

        try {
           const { data, error } = await supabase.functions.invoke(
    'create-admin',
    {
        body: {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            city: city.trim(),
            address: address.trim(),
            password,
        },
    }
);

if (error) {
    throw new Error(error.message || 'Failed to create admin.');
}

if (!data?.success) {
    throw new Error(data?.error || 'Failed to create admin.');
}

await SweetAlert.showAlert({
    style: 'success',
    title: 'Admin Created',
    subTitle: 'The new admin account has been created successfully.',
    confirmButtonTitle: 'OK',
    confirmButtonColor: '#D4AF37',
});

setFullName('');
setEmail('');
setPhone('');
setCity('');
setAddress('');
setPassword('');
setShowForm(false);
        } catch (error: any) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Error',
                subTitle:
                    error?.message ||
                    'Something went wrong. Please try again.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!showForm) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.openDrawer()}
                    >
                        <Text style={styles.menuButton}>☰</Text>
                    </TouchableOpacity>

                    <View>
                        <Text style={styles.title}>
                            Admin Management
                        </Text>

                        <Text style={styles.subtitle}>
                            Manage GoldKing administrators
                        </Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text style={styles.heading}>
                        Administrators
                    </Text>

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowForm(true)}
                    >
                        <Text style={styles.addButtonText}>
                            + CREATE ADMIN
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >
                <ScrollView
                    contentContainerStyle={styles.formContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formHeader}>
                        <TouchableOpacity
                            onPress={() => setShowForm(false)}
                        >
                            <Text style={styles.backButton}>
                                ←
                            </Text>
                        </TouchableOpacity>

                        <View>
                            <Text style={styles.title}>
                                Create Admin
                            </Text>

                            <Text style={styles.subtitle}>
                                Add a new GoldKing administrator
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.label}>
                        Full Name
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter full name"
                        placeholderTextColor="#777777"
                        value={fullName}
                        onChangeText={setFullName}
                    />

                    <Text style={styles.label}>
                        Email
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter email"
                        placeholderTextColor="#777777"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>
                        Phone
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter phone number"
                        placeholderTextColor="#777777"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>
                        City
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter city"
                        placeholderTextColor="#777777"
                        value={city}
                        onChangeText={setCity}
                    />

                    <Text style={styles.label}>
                        Address
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter address"
                        placeholderTextColor="#777777"
                        value={address}
                        onChangeText={setAddress}
                    />

                    <Text style={styles.label}>
                        Password
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter password"
                        placeholderTextColor="#777777"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            loading && styles.disabledButton,
                        ]}
                        onPress={handleCreateAdmin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator
                                size="small"
                                color="#111111"
                            />
                        ) : (
                            <Text style={styles.createButtonText}>
                                CREATE ADMIN
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },

    container: {
        flex: 1,
        backgroundColor: '#111111',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#292929',
    },

    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },

    menuButton: {
        color: '#D4AF37',
        fontSize: 30,
        marginRight: 18,
    },

    backButton: {
        color: '#D4AF37',
        fontSize: 32,
        marginRight: 18,
    },

    title: {
        color: '#D4AF37',
        fontSize: 22,
        fontWeight: '800',
    },

    subtitle: {
        color: '#888888',
        fontSize: 13,
        marginTop: 4,
    },

    content: {
        padding: 24,
    },

    formContent: {
        padding: 24,
        paddingBottom: 50,
    },

    heading: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
    },

    label: {
        color: '#D4AF37',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },

    input: {
        height: 54,
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        color: '#FFFFFF',
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 20,
    },

    addButton: {
        height: 55,
        borderRadius: 12,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
    },

    addButtonText: {
        color: '#111111',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 1,
    },

    createButton: {
        height: 56,
        borderRadius: 12,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },

    createButtonText: {
        color: '#111111',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },

    disabledButton: {
        opacity: 0.6,
    },
});

export default AdminManagementScreen;