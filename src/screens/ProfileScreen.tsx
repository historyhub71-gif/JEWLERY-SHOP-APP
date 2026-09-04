import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react-native';
import ScreenHeader from './components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles, radii, spacing } from '../theme';

const ProfileScreen = ({ navigation }: any) => {
    const { profile } = useAuth();
    const rows = [
        { icon: Mail, label: 'Email', value: profile?.email || 'Not available' },
        { icon: Phone, label: 'Phone', value: profile?.phone || 'Not available' },
        { icon: MapPin, label: 'Address', value: profile?.address || 'Not available' },
    ];
    return (
        <View style={styles.container}>
            <ScreenHeader title="PROFILE" subtitle="Your GoldKing account" navigation={navigation} />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.identity}><View style={styles.avatar}><UserRound color={colors.background} size={30} /></View><View style={styles.identityCopy}><Text style={styles.name}>{profile?.full_name || 'GoldKing member'}</Text><Text style={styles.role}>{profile?.role?.replace('_', ' ').toUpperCase() || 'ACCOUNT'}</Text></View><ShieldCheck color={colors.success} size={22} /></View>
                <View style={styles.status}><View style={styles.dot} /><Text style={styles.statusText}>{profile?.status === 'approved' ? 'Account approved' : 'Account status unavailable'}</Text></View>
                <Text style={styles.sectionTitle}>Account details</Text>
                <View style={styles.card}>{rows.map(row => { const Icon = row.icon; return <View style={styles.row} key={row.label}><Icon color={colors.gold} size={19} /><View style={styles.rowCopy}><Text style={styles.label}>{row.label}</Text><Text style={styles.value}>{row.value}</Text></View></View>; })}</View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    identity: { ...commonStyles.card, alignItems: 'center', flexDirection: 'row', padding: spacing.lg },
    avatar: { alignItems: 'center', backgroundColor: colors.gold, borderRadius: radii.pill, height: 58, justifyContent: 'center', width: 58 },
    identityCopy: { flex: 1, marginHorizontal: spacing.md },
    name: { color: colors.text, fontSize: 18, fontWeight: '800' },
    role: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 5 },
    status: { alignItems: 'center', flexDirection: 'row', marginVertical: spacing.lg },
    dot: { backgroundColor: colors.success, borderRadius: 5, height: 9, marginRight: spacing.sm, width: 9 },
    statusText: { color: colors.success, fontSize: 13, fontWeight: '700' },
    sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', marginBottom: spacing.md },
    card: { ...commonStyles.card, paddingHorizontal: spacing.md },
    row: { alignItems: 'center', borderBottomColor: colors.borderSoft, borderBottomWidth: 1, flexDirection: 'row', minHeight: 76 },
    rowCopy: { flex: 1, marginLeft: spacing.md },
    label: { color: colors.textSubtle, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    value: { color: colors.text, fontSize: 14, marginTop: 5 },
});

export default ProfileScreen;
