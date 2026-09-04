import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ArrowRight, Calculator, Gem, UserRound } from 'lucide-react-native';
import ScreenHeader from '../components/ScreenHeader';
import SectionHeader from '../components/SectionHeader';
import { colors, commonStyles, radii, spacing } from '../../theme';

const CustomerDashboardScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <ScreenHeader title="MY GOLDKING" subtitle="Your jewellery companion" navigation={navigation} home />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.eyebrow}>WELCOME BACK</Text>
                <Text style={styles.title}>A clearer view of value.</Text>
                <Text style={styles.subtitle}>Explore today’s gold and silver rates, then make informed jewellery decisions.</Text>
                <View style={styles.featureCard}><View style={styles.featureIcon}><Gem color={colors.background} size={25} /></View><View style={styles.featureCopy}><Text style={styles.featureTitle}>Your private counter</Text><Text style={styles.featureText}>A calm place to review rates and calculate precious metal value.</Text></View></View>
                <SectionHeader title="Explore GoldKing" subtitle="Helpful tools for your next purchase" />
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Home')} activeOpacity={0.82}><View style={styles.actionIcon}><Gem color={colors.gold} size={21} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>Today’s rates</Text><Text style={styles.actionText}>Compare purity and measurement units.</Text></View><ArrowRight color={colors.textSubtle} size={20} /></TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Calculator')} activeOpacity={0.82}><View style={styles.actionIcon}><Calculator color={colors.gold} size={21} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>Value calculator</Text><Text style={styles.actionText}>Estimate gold and jewellery prices.</Text></View><ArrowRight color={colors.textSubtle} size={20} /></TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile')} activeOpacity={0.82}><View style={styles.actionIcon}><UserRound color={colors.gold} size={21} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>My profile</Text><Text style={styles.actionText}>View your account information.</Text></View><ArrowRight color={colors.textSubtle} size={20} /></TouchableOpacity>
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

export default CustomerDashboardScreen;