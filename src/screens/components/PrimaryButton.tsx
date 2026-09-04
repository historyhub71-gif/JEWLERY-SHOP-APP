import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing } from '../../theme';

type Props = {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'gold' | 'outline' | 'danger';
};

const PrimaryButton = ({ label, onPress, loading = false, disabled = false, variant = 'gold' }: Props) => (
    <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        activeOpacity={0.82}
        disabled={disabled || loading}
        onPress={onPress}
        style={[styles.button, variant === 'outline' && styles.outline, variant === 'danger' && styles.danger, (disabled || loading) && styles.disabled]}
    >
        {loading ? <ActivityIndicator color={variant === 'gold' ? colors.background : colors.gold} /> : <Text style={[styles.label, variant !== 'gold' && styles.outlineLabel]}>{label}</Text>}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: { alignItems: 'center', backgroundColor: colors.gold, borderRadius: radii.md, justifyContent: 'center', minHeight: 54, paddingHorizontal: spacing.lg },
    outline: { backgroundColor: 'transparent', borderColor: colors.gold, borderWidth: 1 },
    danger: { backgroundColor: colors.danger },
    disabled: { opacity: 0.55 },
    label: { color: colors.background, fontSize: 14, fontWeight: '800', letterSpacing: 1.2 },
    outlineLabel: { color: colors.gold },
});

export default PrimaryButton;
