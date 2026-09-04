import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Bell, ChevronRight, Shield, SlidersHorizontal } from 'lucide-react-native';
import ScreenHeader from './components/ScreenHeader';
import { colors, commonStyles, spacing } from '../theme';

const SettingsScreen = ({ navigation }: any) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    return (
        <View style={styles.container}>
            <ScreenHeader title="SETTINGS" subtitle="Make GoldKing feel like yours" navigation={navigation} />
            <View style={styles.content}><Text style={styles.eyebrow}>PREFERENCES</Text><Text style={styles.title}>Quiet control, clear choices.</Text><Text style={styles.subtitle}>Manage local app preferences and account security from one place.</Text><View style={styles.card}><View style={styles.row}><View style={styles.icon}><Bell color={colors.gold} size={20} /></View><View style={styles.copy}><Text style={styles.rowTitle}>Notifications</Text><Text style={styles.rowText}>Receive important account updates</Text></View><Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: colors.borderSoft, true: colors.goldMuted }} thumbColor={notificationsEnabled ? colors.gold : colors.textSubtle} /></View><View style={styles.row}><View style={styles.icon}><Shield color={colors.gold} size={20} /></View><View style={styles.copy}><Text style={styles.rowTitle}>Account security</Text><Text style={styles.rowText}>Your account is protected by Supabase Auth</Text></View><ChevronRight color={colors.textSubtle} size={20} /></View><View style={styles.row}><View style={styles.icon}><SlidersHorizontal color={colors.gold} size={20} /></View><View style={styles.copy}><Text style={styles.rowTitle}>App preferences</Text><Text style={styles.rowText}>More preferences will appear as features grow</Text></View></View></View></View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },
    content: { flex: 1, padding: spacing.lg },
    eyebrow: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
    title: { color: colors.text, fontSize: 27, fontWeight: '800', lineHeight: 34, marginTop: 5 },
    subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginBottom: spacing.xl, marginTop: spacing.sm },
    card: { ...commonStyles.card, paddingHorizontal: spacing.md },
    row: { alignItems: 'center', borderBottomColor: colors.borderSoft, borderBottomWidth: 1, flexDirection: 'row', minHeight: 78 },
    icon: { alignItems: 'center', backgroundColor: '#252015', borderRadius: 9, height: 42, justifyContent: 'center', width: 42 },
    copy: { flex: 1, marginHorizontal: spacing.md },
    rowTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
    rowText: { color: colors.textSubtle, fontSize: 12, lineHeight: 18, marginTop: 3 },
});

export default SettingsScreen;