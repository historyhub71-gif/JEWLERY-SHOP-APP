import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type Props = {
    navigation: any;
};

const SplashScreen = ({ navigation }: Props) => {
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const subtitleTranslate = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),

            Animated.spring(logoScale, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start(() => {
            Animated.parallel([
                Animated.timing(subtitleOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),

                Animated.timing(subtitleTranslate, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setTimeout(() => {
                    navigation.replace('Registration');
                }, 2000);
            });
        });
    }, [navigation]);

    return (
        <View style={styles.container}>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
        justifyContent: 'center',
        alignItems: 'center',
    },

    logoContainer: {
        alignItems: 'center',
    },

    logo: {
        fontSize: 38,
        fontWeight: 'bold',
        color: '#D4AF37',
        letterSpacing: 3,
    },

    subtitleContainer: {
        marginTop: 10,
    },

    subtitle: {
        fontSize: 15,
        color: '#FFFFFF',
        letterSpacing: 1.5,
    },
});

export default SplashScreen;