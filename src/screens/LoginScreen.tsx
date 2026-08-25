import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import SweetAlert from 'react-native-sweet-alert';
import { supabase } from '../lib/supabase';

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
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

        if (!password) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Password Required',
                subTitle: 'Please enter your password.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                await SweetAlert.showAlert({
                    style: 'error',
                    title: 'Login Failed',
                    subTitle: error.message || 'Invalid email or password.',
                    confirmButtonTitle: 'OK',
                    confirmButtonColor: '#D4AF37',
                });
                return;
            }

            await SweetAlert.showAlert({
                style: 'success',
                title: 'Welcome Back',
                subTitle: 'You have logged in successfully.',
                confirmButtonTitle: 'Continue',
                confirmButtonColor: '#D4AF37',
            });

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Unable to get logged-in user.');
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, status')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                throw new Error('Your profile could not be found.');
            }

            if (profile.status !== 'approved') {
                await supabase.auth.signOut();

                await SweetAlert.showAlert({
                    style: 'warning',
                    title: 'Account Not Approved',
                    subTitle: 'Your GoldKing account is not approved yet.',
                    confirmButtonTitle: 'OK',
                    confirmButtonColor: '#D4AF37',
                });

                return;
            }

            if (profile.role === 'super_admin') {
                navigation.replace('Home');
                return;
            }

            if (profile.role === 'admin') {
                navigation.replace('Home');
                return;
            }

            if (profile.role === 'customer') {
                navigation.replace('Home');
                return;
            }

            throw new Error('Invalid account role.');
        } catch (error: any) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Login Failed',
                subTitle: error?.message || 'Something went wrong. Please try again.',
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
                <View style={styles.logoSection}>
                    <Text style={styles.logo}>GOLD KING</Text>

                    <Text style={styles.logoSubtitle}>Jewellery & Gold</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.title}>Welcome Back</Text>

                    <Text style={styles.description}>Login to continue to your account</Text>

                    <Text style={styles.label}>Email</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#777777"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Text style={styles.label}>Password</Text>

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter your password"
                            placeholderTextColor="#777777"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Text style={styles.eyeIcon}>{showPassword ? '◉' : '◌'}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#111111" />
                        ) : (
                            <Text style={styles.loginButtonText}>LOGIN</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.registerSection}>
                        <Text style={styles.registerText}>Don't have an account?</Text>

                        <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
                            <Text style={styles.registerLink}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
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
        paddingHorizontal: 24,
        paddingVertical: 40,
    },

    logoSection: {
        alignItems: 'center',
        marginBottom: 45,
    },

    logo: {
        color: '#D4AF37',
        fontSize: 38,
        fontWeight: 'bold',
        letterSpacing: 3,
    },

    logoSubtitle: {
        color: '#FFFFFF',
        fontSize: 14,
        letterSpacing: 1.5,
        marginTop: 7,
    },

    formContainer: {
        width: '100%',
    },

    title: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '700',
        marginBottom: 8,
    },

    description: {
        color: '#888888',
        fontSize: 14,
        marginBottom: 28,
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

    passwordContainer: {
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        marginBottom: 25,
    },

    passwordInput: {
        flex: 1,
        height: '100%',
        color: '#FFFFFF',
        paddingHorizontal: 16,
        fontSize: 16,
    },

    eyeButton: {
        width: 55,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    eyeIcon: {
        color: '#D4AF37',
        fontSize: 22,
    },

    loginButton: {
        height: 56,
        borderRadius: 12,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },

    disabledButton: {
        opacity: 0.6,
    },

    loginButtonText: {
        color: '#111111',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 1.5,
    },

    registerSection: {
        alignItems: 'center',
        marginTop: 28,
    },

    registerText: {
        color: '#777777',
        fontSize: 14,
        marginBottom: 7,
    },

    registerLink: {
        color: '#D4AF37',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default LoginScreen;
