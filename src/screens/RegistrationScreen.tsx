import SweetAlert from 'react-native-sweet-alert';
import React, { useState } from 'react';
import {
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
        if (!fullName.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Full Name Required',
                subTitle: 'Please enter your full name.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        const phoneRegex = /^(03\d{9}|\+923\d{9}|923\d{9})$/;

        if (!phone.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Phone Number Required',
                subTitle: 'Please enter your phone number.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (!phoneRegex.test(phone.trim())) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Invalid Phone Number',
                subTitle:
                    'Please enter a valid Pakistani phone number. Example: 03001234567 or +923001234567',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }
        if (!email.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Email Required',
                subTitle: 'Please enter your email address.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (!emailRegex.test(email.trim())) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Invalid Email',
                subTitle: 'Please enter a valid email address.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }
        if (city === '') {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'City Required',
                subTitle: 'Please select your city.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }
        if (address === '') {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Address Required',
                subTitle: 'Please enter your address.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }
        if (!password) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Password Required',
                subTitle: 'Please enter a password.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        // 1. Minimum 8 characters
        if (password.length < 8) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Password Too Short',
                subTitle: 'Your password must contain at least 8 characters.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        // 2. At least one uppercase letter
        if (!/[A-Z]/.test(password)) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Uppercase Letter Required',
                subTitle: 'Please add at least one uppercase letter (A-Z).',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        // 3. At least one number
        if (!/[0-9]/.test(password)) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Number Required',
                subTitle: 'Please add at least one number (0-9).',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        // 4. At least one special character
        if (!/[@$!%*?&]/.test(password)) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Special Character Required',
                subTitle:
                    'Please add at least one special character such as @, $, !, %, *, ?, or &.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        // 5. Confirm password must not be empty
        if (!confirmPassword) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Confirm Password Required',
                subTitle: 'Please enter your password again.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        // 6. Passwords must match
        if (password !== confirmPassword) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Passwords Do Not Match',
                subTitle: 'Your password and confirm password must be exactly the same.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (!city.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'City Required',
                subTitle: 'Please enter your city.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (!address.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Address Required',
                subTitle: 'Please enter your address.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
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

            const { error: profileError } = await supabase.from('profiles').insert({
                id: data.user.id,
                full_name: fullName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                city: city.trim(),
                address: address.trim(),
                status: 'pending',
                role: 'customer',
            });

            if (profileError) {
                throw profileError;
            }

            await SweetAlert.showAlert({
                style: 'success',
                title: 'Registration Successful',
                subTitle: 'Your registration has been submitted. Please wait for admin approval.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });

            setFullName('');
            setPhone('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setCity('');
            setAddress('');
        } catch (error: any) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Registration Failed',
                subTitle: error?.message || 'Something went wrong.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
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

                    <Text style={styles.description}>Join Gold King and create your account</Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>

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
                            autoCorrect={false}
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

                    <Text style={[styles.sectionTitle, styles.securityTitle]}>SECURITY</Text>

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
                            <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁'}</Text>
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
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeButton}
                        >
                            <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁' : '👁'}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.registerButton, loading && styles.disabledButton]}
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
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 1.8,
        marginBottom: 9,
    },

    securityTitle: {
        marginTop: 15,
    },

    label: {
        color: '#CFCFCF',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 3,
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
        color: '#ffd95dff',
        fontSize: 18,
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
        fontSize: 13,
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
