import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { supabase } from '../lib/supabase';

const RegistrationScreen = () => {
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (
            !fullName.trim() ||
            !phone.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword ||
            !city.trim() ||
            !address.trim()
        ) {
            Alert.alert('Missing Information', 'Please fill all fields.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Password Error', 'Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            Alert.alert(
                'Password Error',
                'Password must be at least 6 characters.'
            );
            return;
        }

        try {
            setLoading(true);

            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
            });

            if (error) {
                throw error;
            }

            if (!data.user) {
                throw new Error('User account could not be created.');
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    full_name: fullName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    city: city.trim(),
                    address: address.trim(),
                    status: 'pending',
                    role: 'user',
                });

            if (profileError) {
                throw profileError;
            }

            Alert.alert(
                'Registration Successful',
                'Your registration has been submitted. Please wait for admin approval.'
            );

            setFullName('');
            setPhone('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setCity('');
            setAddress('');
        } catch (error: any) {
            Alert.alert(
                'Registration Failed',
                error?.message || 'Something went wrong.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Gold King</Text>

                    <Text style={styles.subtitle}>Create Your Account</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#888"
                        value={fullName}
                        onChangeText={setFullName}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        placeholderTextColor="#888"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#888"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#888"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="City"
                        placeholderTextColor="#888"
                        value={city}
                        onChangeText={setCity}
                    />

                    <TextInput
                        style={[styles.input, styles.addressInput]}
                        placeholder="Address"
                        placeholderTextColor="#888"
                        value={address}
                        onChangeText={setAddress}
                        multiline
                    />

                    <TouchableOpacity
                        style={[
                            styles.registerButton,
                            loading && styles.disabledButton,
                        ]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <Text style={styles.registerButtonText}>
                            {loading ? 'Registering...' : 'Register'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },

    formContainer: {
        width: '100%',
    },

    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#D4AF37',
        textAlign: 'center',
        marginBottom: 8,
    },

    subtitle: {
        fontSize: 20,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 28,
    },

    input: {
        height: 52,
        borderWidth: 1,
        borderColor: '#444444',
        borderRadius: 10,
        backgroundColor: '#1B1B1B',
        color: '#FFFFFF',
        paddingHorizontal: 16,
        marginBottom: 14,
        fontSize: 16,
    },

    addressInput: {
        height: 90,
        textAlignVertical: 'top',
        paddingTop: 14,
    },

    registerButton: {
        height: 54,
        backgroundColor: '#D4AF37',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },

    disabledButton: {
        opacity: 0.6,
    },

    registerButtonText: {
        color: '#111111',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default RegistrationScreen;