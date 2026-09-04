import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, commonStyles, spacing } from '../../theme';

type Props = { label: string; value: string | number; accent?: boolean };

const StatCard = ({ label, value, accent = false }: Props) => (
    <View style={[commonStyles.card, styles.card]}>
        <View style={[styles.mark, accent && styles.markAccent]} />
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    card: { flex: 1, minWidth: '46%', padding: spacing.md },
    mark: { backgroundColor: colors.border, borderRadius: 2, height: 4, marginBottom: spacing.md, width: 28 },
    markAccent: { backgroundColor: colors.gold },
    value: { color: colors.text, fontSize: 25, fontWeight: '800' },
    label: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});

export default StatCard;
