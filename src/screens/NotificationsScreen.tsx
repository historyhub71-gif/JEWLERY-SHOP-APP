import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Bell, CheckCircle2 } from 'lucide-react-native';
import ScreenHeader from './components/ScreenHeader';
import StateView from './components/StateView';
import { colors, commonStyles, spacing } from '../theme';

const NotificationsScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <ScreenHeader title="NOTIFICATIONS" subtitle="Stay close to what matters" navigation={navigation} />
            <View style={styles.content}><View style={styles.banner}><Bell color={colors.gold} size={23} /><View style={styles.bannerCopy}><Text style={styles.bannerTitle}>All caught up</Text><Text style={styles.bannerText}>Important account updates will appear here.</Text></View><CheckCircle2 color={colors.success} size={20} /></View><View style={styles.empty}><StateView type="empty" title="No new notifications" description="There is nothing waiting for your attention right now." /></View></View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },
    content: { flex: 1, padding: spacing.lg },
    banner: { ...commonStyles.card, alignItems: 'center', flexDirection: 'row', padding: spacing.md },
    bannerCopy: { flex: 1, marginHorizontal: spacing.md },
    bannerTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
    bannerText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
    empty: { flex: 1, justifyContent: 'center' },
});

export default NotificationsScreen;
