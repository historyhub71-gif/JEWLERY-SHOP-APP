import { Platform, StyleSheet } from 'react-native';

export const colors = {
    background: '#111111',
    surface: '#191919',
    surfaceRaised: '#202020',
    surfaceSoft: '#171717',
    gold: '#D4AF37',
    goldBright: '#F1D77A',
    goldMuted: '#806A28',
    white: '#FFFFFF',
    text: '#F5F2EA',
    textMuted: '#A6A29A',
    textSubtle: '#77736C',
    border: '#332F27',
    borderSoft: '#292929',
    success: '#63C98A',
    warning: '#E7B85C',
    danger: '#E87575',
    overlay: 'rgba(0, 0, 0, 0.72)',
};

export const spacing = {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 22,
    xl: 30,
    xxl: 40,
};

export const radii = {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
};

export const shadows = Platform.select({
    android: { elevation: 4 },
    ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.24,
        shadowRadius: 10,
    },
    default: {},
});

export const commonStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    eyebrow: {
        color: colors.gold,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    title: {
        color: colors.text,
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 34,
    },
    body: {
        color: colors.textMuted,
        fontSize: 14,
        lineHeight: 21,
    },
    card: {
        backgroundColor: colors.surface,
        borderColor: colors.borderSoft,
        borderRadius: radii.lg,
        borderWidth: 1,
        ...shadows,
    },
});
