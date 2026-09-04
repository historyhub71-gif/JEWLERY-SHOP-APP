import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, CheckCircle2, Inbox } from 'lucide-react-native';
import { colors, spacing } from '../../theme';

type Props = { type: 'loading' | 'empty' | 'error' | 'success'; title: string; description?: string };

const icons = { empty: Inbox, error: AlertCircle, success: CheckCircle2 };

const StateView = ({ type, title, description }: Props) => {
    const Icon = type === 'loading' ? null : icons[type];
    return (
        <View style={styles.container}>
            {type === 'loading' ? <ActivityIndicator color={colors.gold} size="large" /> : null}
            {Icon ? <Icon color={type === 'error' ? colors.danger : type === 'success' ? colors.success : colors.gold} size={30} strokeWidth={1.6} /> : null}
            <Text style={styles.title}>{title}</Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl },
    title: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
    description: { color: colors.textSubtle, fontSize: 13, lineHeight: 19, marginTop: spacing.xs, textAlign: 'center' },
});

export default StateView;
