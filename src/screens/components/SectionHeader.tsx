import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme';

type Props = { title: string; subtitle?: string };

const SectionHeader = ({ title, subtitle }: Props) => (
    <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
);

const styles = StyleSheet.create({
    container: { marginBottom: spacing.md },
    title: { color: colors.text, fontSize: 19, fontWeight: '800' },
    subtitle: { color: colors.textSubtle, fontSize: 12, lineHeight: 18, marginTop: 4 },
});

export default SectionHeader;
