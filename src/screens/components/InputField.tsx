import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radii, spacing } from '../../theme';

type Props = TextInputProps & { label: string; suffix?: string };

const InputField = ({ label, suffix, style, ...props }: Props) => (
    <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputShell}>
            <TextInput {...props} placeholderTextColor={colors.textSubtle} style={[styles.input, style]} />
            {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { marginBottom: spacing.md },
    label: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: spacing.xs },
    inputShell: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', minHeight: 54 },
    input: { color: colors.text, flex: 1, fontSize: 16, paddingHorizontal: spacing.md, paddingVertical: 12 },
    suffix: { color: colors.textMuted, fontSize: 12, fontWeight: '700', paddingRight: spacing.md },
});

export default InputField;
