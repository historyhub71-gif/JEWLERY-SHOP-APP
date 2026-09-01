import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type Props = {
    navigation: any;
};

const SplashScreen = ({ navigation }: Props) => {
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const { session, profile, loading } = useAuth();
    const logoScale = useRef(new Animated.Value(0.75)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const shimmerPosition = useRef(new Animated.Value(-1)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const subtitleTranslate = useRef(new Animated.Value(25)).current;
    const loaderOpacity = useRef(new Animated.Value(0)).current;
    const loaderScale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        // Start animations
        Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();

        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 900,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),

            Animated.spring(logoScale, {
                toValue: 1,
                friction: 5,
                tension: 45,
                useNativeDriver: true,
            }),
        ]).start(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shimmerPosition, {
                        toValue: 1,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(shimmerPosition, {
                        toValue: -1,
                        duration: 1200,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                {
                    iterations: 2,
                },
            ).start();

            Animated.parallel([
                Animated.timing(subtitleOpacity, {
                    toValue: 1,
                    duration: 650,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),

                Animated.timing(subtitleTranslate, {
                    toValue: 0,
                    duration: 650,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();

            Animated.parallel([
                Animated.timing(loaderOpacity, {
                    toValue: 1,
                    duration: 500,
                    delay: 400,
                    useNativeDriver: true,
                }),

                Animated.spring(loaderScale, {
                    toValue: 1,
                    friction: 5,
                    tension: 50,
                    delay: 400,
                    useNativeDriver: true,
                }),
            ]).start();

            // Navigate after delay
            const timer = setTimeout(() => {
         try {
         if (loading) {
             return;
       }

        if (!session) {
            console.log('No session → Login');
            navigation.replace('Login');
            return;
        }

        if (!profile) {
            console.log('Session exists but profile not found');
            navigation.replace('Login');
            return;
        }

        if (
            profile.role === 'super_admin' &&
            profile.status === 'approved'
        ) {
            console.log('Super Admin → Home');
            navigation.replace('Main');
            return;
        }

        if (
            profile.role === 'admin' &&
            profile.status === 'approved'
        ) {
            console.log('Admin → Home');
            navigation.replace('Main');
            return;
        }

        if (
            profile.role === 'customer' &&
            profile.status === 'approved'
        ) {
            console.log('Customer → Home');
            navigation.replace('Main');
            return;
        }

        console.log('Account is not approved');
        navigation.replace('Login');
    } catch (error) {
        console.error('Navigation error:', error);
        navigation.replace('Login');
    }
}, 3500);
            return () => clearTimeout(timer);
        });
    }, [
    navigation,
    glowOpacity,
    loaderOpacity,
    loaderScale,
    logoOpacity,
    logoScale,
    shimmerPosition,
    subtitleOpacity,
    subtitleTranslate,
    session,
    profile,
    loading,
]);

    const shimmerTranslate = shimmerPosition.interpolate({
        inputRange: [-1, 1],
        outputRange: [-80, 80],
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.glow,
                    {
                        opacity: glowOpacity,
                        transform: [{ scale: logoScale }],
                    },
                ]}
            />

            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }],
                    },
                ]}
            >
                <Text style={styles.logo}>GOLD KING</Text>

                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.shimmer,
                        {
                            transform: [{ translateX: shimmerTranslate }],
                        },
                    ]}
                />
            </Animated.View>

            <Animated.View
                style={[
                    styles.subtitleContainer,
                    {
                        opacity: subtitleOpacity,
                        transform: [{ translateY: subtitleTranslate }],
                    },
                ]}
            >
                <Text style={styles.subtitle}>Jewellery & Gold</Text>
            </Animated.View>

            <Animated.View
                style={[
                    styles.loaderContainer,
                    {
                        opacity: loaderOpacity,
                        transform: [{ scale: loaderScale }],
                    },
                ]}
            >
                <View style={styles.loaderDot} />
                <View style={styles.loaderDot} />
                <View style={styles.loaderDot} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000ff',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    glow: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: '#a4a4a4ff',
    },

    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    logo: {
        fontSize: 40,
        fontWeight: '800',
        color: '#ecbe32ff',
        letterSpacing: 4,
    },

    shimmer: {
        position: 'absolute',
        width: 25,
        borderRadius: 80,
        height: 80,
        backgroundColor: 'rgba(255, 255, 255, 0.62)',
        transform: [{ rotate: '20deg' }],
    },

    subtitleContainer: {
        marginTop: 12,
    },

    subtitle: {
        fontSize: 15,
        color: '#000000ff',
        letterSpacing: 2,
    },

    loaderContainer: {
        position: 'absolute',
        bottom: 80,
        flexDirection: 'row',
        gap: 7,
    },

    loaderDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#f7d567ff',
    },
});

export default SplashScreen;