import SweetAlert from 'react-native-sweet-alert';
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

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Missing Information',
                subTitle: 'Please fill all fields.',
                confirmButtonTitle: 'OK',
            });
            return;
        }

        if (password !== confirmPassword) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Password Error',
                subTitle: 'Passwords do not match.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });

            return;
        }

        if (password.length < 6) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Password Error',
                subTitle: 'Password must be at least 6 characters.',
                confirmButtonTitle: 'OK',
            });
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
                'Your registration has been submitted. Please wait for admin approval.',
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
                error?.message || 'Something went wrong.',
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
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>

                    <Text style={styles.brand}>GOLD KING</Text>

                    <Text style={styles.tagline}>JEWELLERY & GOLD</Text>

                    <View style={styles.goldLine} />

                    <Text style={styles.heading}>Create Account</Text>

                    <Text style={styles.description}>
                        Join Gold King and create your account
                    </Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>
                        PERSONAL INFORMATION
                    </Text>

                    <Text style={styles.label}>Full Name</Text>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>●</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            placeholderTextColor="#777"
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    <Text style={styles.label}>Phone Number</Text>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>☎</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter phone number"
                            placeholderTextColor="#777"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <Text style={styles.label}>Email Address</Text>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>✉</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter email address"
                            placeholderTextColor="#777"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <Text style={styles.label}>City</Text>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>⌖</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter your city"
                            placeholderTextColor="#777"
                            value={city}
                            onChangeText={setCity}
                        />
                    </View>

                    <Text style={styles.label}>Address</Text>

                    <View style={styles.addressWrapper}>
                        <Text style={styles.inputIcon}>⌂</Text>

                        <TextInput
                            style={styles.addressInput}
                            placeholder="Enter your complete address"
                            placeholderTextColor="#777"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    <Text style={[styles.sectionTitle, styles.securityTitle]}>
                        SECURITY
                    </Text>

                    <Text style={styles.label}>Password</Text>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>●</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Create a password"
                            placeholderTextColor="#777"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />

                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeButton}
                        >
                            <Text style={styles.eyeIcon}>
                                {showPassword ? '👁' : '👁'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Confirm Password</Text>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>●</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm your password"
                            placeholderTextColor="#777"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />

                        <TouchableOpacity
                            onPress={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            style={styles.eyeButton}
                        >
                            <Text style={styles.eyeIcon}>
                                {showConfirmPassword ? '👁' : '👁'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.registerButton,
                            loading && styles.disabledButton,
                        ]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.bottomText}>
                        By creating an account, you agree to Gold King's terms.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080808',
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 35,
    },

    header: {
        alignItems: 'center',
        marginBottom: 25,
    },
    logoSymbol: {
        color: '#D4AF37',
        fontSize: 50,
        fontWeight: '800',
    },

    brand: {
        color: '#D4AF37',
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: 4,
    },

    tagline: {
        color: '#999',
        fontSize: 10,
        letterSpacing: 3,
        marginTop: 5,
    },

    goldLine: {
        width: 55,
        height: 2,
        backgroundColor: '#D4AF37',
        marginTop: 12,
        marginBottom: 11,
    },

    heading: {
        color: '#FFFFFF',
        fontSize: 25,
        fontWeight: '700',
    },

    description: {
        color: '#777',
        fontSize: 13,
        marginTop: 6,
    },

    formCard: {
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: '#252525',
        borderRadius: 20,
        padding: 20,
    },

    sectionTitle: {
        color: '#D4AF37',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.8,
        marginBottom: 18,
    },

    securityTitle: {
        marginTop: 2,
    },

    label: {
        color: '#CFCFCF',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 1,
    },

    inputWrapper: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#292929',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 14,
    },

    inputIcon: {
        width: 27,
        color: '#D4AF37',
        fontSize: 16,
    },

    input: {
        flex: 1,
        minHeight: 52,
        color: '#FFFFFF',
        fontSize: 15,
        paddingVertical: 0,
    },

    addressWrapper: {
        minHeight: 90,
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#292929',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 14,
        paddingTop: 14,
    },

    addressInput: {
        flex: 1,
        minHeight: 70,
        color: '#FFFFFF',
        fontSize: 15,
        paddingTop: 0,
    },
    eyeButton: {
        width: 35,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },

    eyeIcon: {
        color: '#D4AF37',
        fontSize: 17,
    },
    registerButton: {
        height: 56,
        backgroundColor: '#D4AF37',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },

    disabledButton: {
        opacity: 0.55,
    },

    buttonText: {
        color: '#080808',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 1.2,
    },

    bottomText: {
        color: '#666',
        textAlign: 'center',
        fontSize: 11,
        marginTop: 16,
        lineHeight: 17,
    },
});

export default RegistrationScreen;