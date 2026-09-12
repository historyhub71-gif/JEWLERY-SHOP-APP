import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    ArrowRight,
    Calculator,
    Gem,
    RefreshCw,
    UserRound,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

import ScreenHeader from '../components/ScreenHeader';
import SectionHeader from '../components/SectionHeader';
import { supabase } from '../../lib/supabase';
import { colors, commonStyles, radii, spacing } from '../../theme';

type Metal = 'gold' | 'silver';
type RateUnit = 'gram' | 'tola';

type PublishedShopRate = {
    id: string;
    admin_id: string;
    metal: Metal;
    unit: RateUnit;
    mode: 'follow_live' | 'offset' | 'fixed';
    offset_amount: number | null;
    buy_offset_amount: number | null;
    fixed_rate: number | null;
    sell_rate: number;
    buy_rate: number;
    gold_24k: number | null;
    gold_22k: number | null;
    gold_21k: number | null;
    gold_18k: number | null;
    silver_999: number | null;
    enabled: boolean;
    published_at?: string;
    live_rate?: number | null;
};

const TOLA_IN_GRAMS = 11.6638125;

const formatRate = (value: number | null | undefined) => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return '—';
    }

    return Number(value).toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const convertRate = (
    value: number,
    fromUnit: RateUnit,
    toUnit: RateUnit,
) => {
    if (fromUnit === toUnit) {
        return value;
    }

    if (fromUnit === 'tola' && toUnit === 'gram') {
        return value / TOLA_IN_GRAMS;
    }

    return value * TOLA_IN_GRAMS;
};

const convertOptionalRate = (
    value: number | null,
    fromUnit: RateUnit,
    toUnit: RateUnit,
) => {
    if (value === null || !Number.isFinite(Number(value))) {
        return null;
    }

    return convertRate(Number(value), fromUnit, toUnit);
};

const getGoldPurityRate = (
    rate: PublishedShopRate,
    karat: '24K' | '22K' | '21K' | '18K',
) => {
    switch (karat) {
        case '24K':
            return rate.gold_24k;
        case '22K':
            return rate.gold_22k;
        case '21K':
            return rate.gold_21k;
        case '18K':
            return rate.gold_18k;
        default:
            return null;
    }
};

const CustomerDashboardScreen = ({ navigation }: any) => {
    const [shopRates, setShopRates] = useState<PublishedShopRate[]>([]);
    const [selectedMetal, setSelectedMetal] = useState<Metal>('gold');
    const [selectedUnit, setSelectedUnit] = useState<RateUnit>('tola');
    const [selectedKarat, setSelectedKarat] = useState<
        '24K' | '22K' | '21K' | '18K'
    >('24K');

    const [loadingShopRates, setLoadingShopRates] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [shopRateError, setShopRateError] = useState<string | null>(null);

    const loadShopRates = useCallback(async () => {
        try {
            setShopRateError(null);
            setLoadingShopRates(true);

            const { data, error } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'get_published',
                },
            });

            if (error) {
                throw error;
            }

            if (!data?.success) {
                throw new Error(
                    data?.error || 'Unable to load your shop rates.',
                );
            }

            const rates = Array.isArray(data?.rates)
                ? (data.rates as PublishedShopRate[])
                : [];

            setShopRates(rates);
        } catch (error) {
            console.error('CUSTOMER SHOP RATES LOAD FAILED:', error);

            setShopRateError(
                error instanceof Error
                    ? error.message
                    : 'Unable to load your shop rates.',
            );
        } finally {
            setLoadingShopRates(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadShopRates();
        }, [loadShopRates]),
    );

    const handleRefresh = useCallback(async () => {
        if (refreshing) {
            return;
        }

        setRefreshing(true);

        try {
            await loadShopRates();
        } finally {
            setRefreshing(false);
        }
    }, [loadShopRates, refreshing]);

    const selectedShopRate = shopRates.find(
        rate =>
            rate.metal === selectedMetal &&
            rate.enabled === true,
    );

    const convertedSellRate = selectedShopRate
        ? convertRate(
              Number(
                  selectedMetal === 'gold'
                      ? getGoldPurityRate(selectedShopRate, selectedKarat) ??
                            selectedShopRate.sell_rate
                      : selectedShopRate.silver_999 ?? selectedShopRate.sell_rate,
              ),
              selectedShopRate.unit,
              selectedUnit,
          )
        : null;

    const convertedBuyRate = selectedShopRate
        ? convertRate(
              Number(selectedShopRate.buy_rate),
              selectedShopRate.unit,
              selectedUnit,
          )
        : null;

    const selectedShopUnit = selectedShopRate?.unit ?? null;

    const hasGoldRate = shopRates.some(
        rate => rate.metal === 'gold' && rate.enabled,
    );

    const hasSilverRate = shopRates.some(
        rate => rate.metal === 'silver' && rate.enabled,
    );

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="MY GOLDKING"
                subtitle="Your jewellery companion"
                navigation={navigation}
                home
            />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.gold}
                        colors={[colors.gold]}
                    />
                }
            >
                <Text style={styles.eyebrow}>WELCOME BACK</Text>

                <Text style={styles.title}>
                    A clearer view of value.
                </Text>

                <Text style={styles.subtitle}>
                    Explore your shop rates, live market prices and useful
                    jewellery tools.
                </Text>

                {/* =====================================================
                    YOUR SHOP RATES
                ====================================================== */}

                <SectionHeader
                    title="Your Shop Rates"
                    subtitle="Rates published by your assigned jeweller"
                />

                <View style={styles.shopRatesCard}>
                    {/* METAL SWITCH */}

                    <View style={styles.segmentContainer}>
                        <TouchableOpacity
                            activeOpacity={0.82}
                            onPress={() => setSelectedMetal('gold')}
                            style={[
                                styles.segmentButton,
                                selectedMetal === 'gold' &&
                                    styles.segmentButtonActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.segmentText,
                                    selectedMetal === 'gold' &&
                                        styles.segmentTextActive,
                                ]}
                            >
                                Gold
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.82}
                            onPress={() => setSelectedMetal('silver')}
                            style={[
                                styles.segmentButton,
                                selectedMetal === 'silver' &&
                                    styles.segmentButtonActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.segmentText,
                                    selectedMetal === 'silver' &&
                                        styles.segmentTextActive,
                                ]}
                            >
                                Silver
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* GOLD KARATS */}

                    {selectedMetal === 'gold' ? (
                        <View style={styles.karatRow}>
                            {(['24K', '22K', '21K', '18K'] as const).map(
                                karat => (
                                    <TouchableOpacity
                                        key={karat}
                                        activeOpacity={0.82}
                                        onPress={() =>
                                            setSelectedKarat(karat)
                                        }
                                        style={[
                                            styles.karatButton,
                                            selectedKarat === karat &&
                                                styles.karatButtonActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.karatText,
                                                selectedKarat === karat &&
                                                    styles.karatTextActive,
                                            ]}
                                        >
                                            {karat}
                                        </Text>
                                    </TouchableOpacity>
                                ),
                            )}
                        </View>
                    ) : null}

                    {/* UNIT SWITCH */}

                    <View style={styles.unitRow}>
                        <Text style={styles.unitLabel}>Unit</Text>

                        <View style={styles.unitSwitch}>
                            <TouchableOpacity
                                activeOpacity={0.82}
                                onPress={() => setSelectedUnit('tola')}
                                style={[
                                    styles.unitButton,
                                    selectedUnit === 'tola' &&
                                        styles.unitButtonActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.unitButtonText,
                                        selectedUnit === 'tola' &&
                                            styles.unitButtonTextActive,
                                    ]}
                                >
                                    Tola
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.82}
                                onPress={() => setSelectedUnit('gram')}
                                style={[
                                    styles.unitButton,
                                    selectedUnit === 'gram' &&
                                        styles.unitButtonActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.unitButtonText,
                                        selectedUnit === 'gram' &&
                                            styles.unitButtonTextActive,
                                    ]}
                                >
                                    Gram
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* CONTENT */}

                    {loadingShopRates ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator
                                size="small"
                                color={colors.gold}
                            />

                            <Text style={styles.loadingText}>
                                Loading your shop rates...
                            </Text>
                        </View>
                    ) : shopRateError ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>
                                Unable to load shop rates
                            </Text>

                            <Text style={styles.emptyText}>
                                {shopRateError}
                            </Text>

                            <TouchableOpacity
                                activeOpacity={0.82}
                                onPress={loadShopRates}
                                style={styles.retryButton}
                            >
                                <RefreshCw
                                    color={colors.background}
                                    size={15}
                                />

                                <Text style={styles.retryButtonText}>
                                    Retry
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : !selectedShopRate ? (
                        <View style={styles.emptyContainer}>
                            <Gem
                                color={colors.gold}
                                size={24}
                            />

                            <Text style={styles.emptyTitle}>
                                {selectedMetal === 'gold'
                                    ? hasGoldRate
                                        ? 'Gold rate unavailable'
                                        : 'Gold shop rate not published'
                                    : hasSilverRate
                                      ? 'Silver rate unavailable'
                                      : 'Silver shop rate not published'}
                            </Text>

                            <Text style={styles.emptyText}>
                                Your assigned jeweller has not published an
                                active {selectedMetal} shop rate yet.
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.shopRateHeader}>
                                <View>
                                    <View style={styles.shopRateTitleRow}>
                                        <Text style={styles.shopRateMetal}>
                                            {selectedMetal === 'gold'
                                                ? `Gold ${selectedKarat}`
                                                : 'Silver 999'}
                                        </Text>

                                        <View style={styles.liveBadge}>
                                            <View style={styles.liveDot} />

                                            <Text style={styles.liveText}>
                                                PUBLISHED
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.shopRateSubtext}>
                                        {selectedUnit === 'tola'
                                            ? 'Per Tola'
                                            : 'Per Gram'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.priceGrid}>
                                <View style={styles.priceBox}>
                                    <Text style={styles.priceLabel}>
                                        SELL
                                    </Text>

                                    <Text style={styles.priceValue}>
                                        PKR{' '}
                                        {formatRate(convertedSellRate)}
                                    </Text>

                                    <Text style={styles.priceUnit}>
                                        per {selectedUnit}
                                    </Text>
                                </View>

                                <View style={styles.priceDivider} />

                                <View style={styles.priceBox}>
                                    <Text style={styles.priceLabel}>
                                        BUY
                                    </Text>

                                    <Text style={styles.priceValue}>
                                        PKR{' '}
                                        {formatRate(convertedBuyRate)}
                                    </Text>

                                    <Text style={styles.priceUnit}>
                                        per {selectedUnit}
                                    </Text>
                                </View>
                            </View>

                            {selectedShopUnit !== selectedUnit ? (
                                <Text style={styles.conversionNote}>
                                    Display converted from published{' '}
                                    {selectedShopUnit}.
                                </Text>
                            ) : null}

                            {selectedShopRate.published_at ? (
                                <Text style={styles.publishedText}>
                                    Published{' '}
                                    {new Date(
                                        selectedShopRate.published_at,
                                    ).toLocaleString('en-PK', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                            ) : null}
                        </>
                    )}
                </View>

                {/* =====================================================
                    EXPLORE
                ====================================================== */}

                <SectionHeader
                    title="Explore GoldKing"
                    subtitle="Helpful tools for your next purchase"
                />

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={0.82}
                >
                    <View style={styles.actionIcon}>
                        <Gem
                            color={colors.gold}
                            size={21}
                        />
                    </View>

                    <View style={styles.actionCopy}>
                        <Text style={styles.actionTitle}>
                            Today’s market rates
                        </Text>

                        <Text style={styles.actionText}>
                            View global market movement and live PKR rates.
                        </Text>
                    </View>

                    <ArrowRight
                        color={colors.textSubtle}
                        size={20}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Calculator')}
                    activeOpacity={0.82}
                >
                    <View style={styles.actionIcon}>
                        <Calculator
                            color={colors.gold}
                            size={21}
                        />
                    </View>

                    <View style={styles.actionCopy}>
                        <Text style={styles.actionTitle}>
                            Value calculator
                        </Text>

                        <Text style={styles.actionText}>
                            Estimate gold and jewellery prices.
                        </Text>
                    </View>

                    <ArrowRight
                        color={colors.textSubtle}
                        size={20}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.82}
                >
                    <View style={styles.actionIcon}>
                        <UserRound
                            color={colors.gold}
                            size={21}
                        />
                    </View>

                    <View style={styles.actionCopy}>
                        <Text style={styles.actionTitle}>
                            My profile
                        </Text>

                        <Text style={styles.actionText}>
                            View your account information.
                        </Text>
                    </View>

                    <ArrowRight
                        color={colors.textSubtle}
                        size={20}
                    />
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

    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },

    eyebrow: {
        ...commonStyles.eyebrow,
        marginBottom: spacing.xs,
    },

    title: {
        ...commonStyles.title,
        fontSize: 29,
    },

    subtitle: {
        ...commonStyles.body,
        marginBottom: spacing.xl,
        marginTop: spacing.sm,
    },

    shopRatesCard: {
        ...commonStyles.card,
        padding: spacing.md,
        marginBottom: spacing.xl,
    },

    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#101010',
        borderRadius: radii.md,
        padding: 4,
        marginBottom: spacing.md,
    },

    segmentButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: radii.sm,
    },

    segmentButtonActive: {
        backgroundColor: colors.gold,
    },

    segmentText: {
        color: colors.textSubtle,
        fontSize: 12,
        fontWeight: '800',
    },

    segmentTextActive: {
        color: colors.background,
    },

    karatRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },

    karatButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        marginRight: 6,
        borderWidth: 1,
        borderColor: '#2B2B2B',
        backgroundColor: '#121212',
        borderRadius: 8,
    },

    karatButtonActive: {
        backgroundColor: colors.gold,
        borderColor: colors.gold,
    },

    karatText: {
        color: colors.textSubtle,
        fontSize: 11,
        fontWeight: '800',
    },

    karatTextActive: {
        color: colors.background,
    },

    unitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },

    unitLabel: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '700',
    },

    unitSwitch: {
        flexDirection: 'row',
        backgroundColor: '#101010',
        borderRadius: 9,
        padding: 3,
    },

    unitButton: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 7,
    },

    unitButtonActive: {
        backgroundColor: colors.gold,
    },

    unitButtonText: {
        color: colors.textSubtle,
        fontSize: 10,
        fontWeight: '700',
    },

    unitButtonTextActive: {
        color: colors.background,
    },

    shopRateHeader: {
        marginBottom: spacing.md,
    },

    shopRateTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    shopRateMetal: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '800',
    },

    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#252015',
    },

    liveDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.gold,
        marginRight: 4,
    },

    liveText: {
        color: colors.gold,
        fontSize: 7,
        fontWeight: '800',
        letterSpacing: 0.6,
    },

    shopRateSubtext: {
        color: colors.textSubtle,
        fontSize: 11,
        marginTop: 4,
    },

    priceGrid: {
        flexDirection: 'row',
        backgroundColor: '#121212',
        borderRadius: radii.md,
        padding: spacing.md,
    },

    priceBox: {
        flex: 1,
    },

    priceDivider: {
        width: 1,
        backgroundColor: '#292929',
        marginHorizontal: spacing.md,
    },

    priceLabel: {
        color: colors.gold,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.8,
        marginBottom: 7,
    },

    priceValue: {
        color: colors.text,
        fontSize: 17,
        fontWeight: '800',
    },

    priceUnit: {
        color: colors.textSubtle,
        fontSize: 10,
        marginTop: 4,
    },

    conversionNote: {
        color: '#666666',
        fontSize: 9,
        marginTop: 9,
    },

    publishedText: {
        color: '#555555',
        fontSize: 9,
        marginTop: 7,
    },

    loadingContainer: {
        minHeight: 110,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingText: {
        color: colors.textSubtle,
        fontSize: 11,
        marginTop: 8,
    },

    emptyContainer: {
        minHeight: 130,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
    },

    emptyTitle: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '800',
        marginTop: 9,
        textAlign: 'center',
    },

    emptyText: {
        color: colors.textSubtle,
        fontSize: 11,
        lineHeight: 17,
        textAlign: 'center',
        marginTop: 5,
    },

    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.gold,
        borderRadius: 8,
        paddingHorizontal: 13,
        paddingVertical: 8,
        marginTop: 12,
    },

    retryButtonText: {
        color: colors.background,
        fontSize: 10,
        fontWeight: '800',
        marginLeft: 5,
    },

    actionCard: {
        ...commonStyles.card,
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: spacing.sm,
        minHeight: 76,
        padding: spacing.md,
    },

    actionIcon: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderRadius: radii.sm,
        height: 42,
        justifyContent: 'center',
        width: 42,
    },

    actionCopy: {
        flex: 1,
        marginHorizontal: spacing.md,
    },

    actionTitle: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '800',
    },

    actionText: {
        color: colors.textSubtle,
        fontSize: 12,
        marginTop: 4,
    },
});

export default CustomerDashboardScreen;