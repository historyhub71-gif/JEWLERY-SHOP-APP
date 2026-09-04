import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ArrowRight, Calculator, Gem, Users } from 'lucide-react-native';
import ScreenHeader from '../components/ScreenHeader';
import SectionHeader from '../components/SectionHeader';
import { colors, commonStyles, radii, spacing } from '../../theme';

const AdminDashboardScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <ScreenHeader title="ADMIN DESK" subtitle="GoldKing business operations" navigation={navigation} home />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.eyebrow}>GOOD TO SEE YOU</Text>
                <Text style={styles.title}>Run the day beautifully.</Text>
                <Text style={styles.subtitle}>Keep your rates, calculations, and customer experience close at hand.</Text>

                <View style={styles.featureCard}>
                    <View style={styles.featureIcon}><Gem color={colors.background} size={25} /></View>
                    <View style={styles.featureCopy}><Text style={styles.featureTitle}>Today at the shop</Text><Text style={styles.featureText}>Review live-looking rate views and prepare precise jewellery quotations.</Text></View>
                </View>

                <SectionHeader title="Quick actions" subtitle="Common tools for your counter team" />
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Home')} activeOpacity={0.82}>
                    <View style={styles.actionIcon}><Gem color={colors.gold} size={21} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>Gold & silver rates</Text><Text style={styles.actionText}>Check purity and unit pricing.</Text></View><ArrowRight color={colors.textSubtle} size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Calculator')} activeOpacity={0.82}>
                    <View style={styles.actionIcon}><Calculator color={colors.gold} size={21} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>Jeweller calculator</Text><Text style={styles.actionText}>Build accurate customer quotations.</Text></View><ArrowRight color={colors.textSubtle} size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile')} activeOpacity={0.82}>
                    <View style={styles.actionIcon}><Users color={colors.gold} size={21} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>Your account</Text><Text style={styles.actionText}>Keep your profile details within reach.</Text></View><ArrowRight color={colors.textSubtle} size={20} />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },

    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    eyebrow: { ...commonStyles.eyebrow, marginBottom: spacing.xs },
    title: { ...commonStyles.title, fontSize: 29 },
    subtitle: { ...commonStyles.body, marginBottom: spacing.xl, marginTop: spacing.sm },
    featureCard: { ...commonStyles.card, alignItems: 'center', flexDirection: 'row', marginBottom: spacing.xl, padding: spacing.md },
    featureIcon: { alignItems: 'center', backgroundColor: colors.gold, borderRadius: radii.md, height: 52, justifyContent: 'center', width: 52 },
    featureCopy: { flex: 1, marginLeft: spacing.md },
    featureTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
    featureText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4 },
    actionCard: { ...commonStyles.card, alignItems: 'center', flexDirection: 'row', marginBottom: spacing.sm, minHeight: 76, padding: spacing.md },
    actionIcon: { alignItems: 'center', backgroundColor: '#252015', borderRadius: radii.sm, height: 42, justifyContent: 'center', width: 42 },
    actionCopy: { flex: 1, marginHorizontal: spacing.md },
    actionTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
    actionText: { color: colors.textSubtle, fontSize: 12, marginTop: 4 },
});

export default AdminDashboardScreen;