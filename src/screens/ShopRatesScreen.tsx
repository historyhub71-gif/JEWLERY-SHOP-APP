import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    CheckCircle2,
    ChevronDown,
    Gem,
    LockKeyhole,
    RefreshCw,
    Save,
    ShieldCheck,
    Sparkles,
    TrendingUp,
} from 'lucide-react-native';

import ScreenHeader from './components/ScreenHeader';
import SectionHeader from './components/SectionHeader';
import { colors, commonStyles, radii, spacing } from '../theme';
import { supabase } from '../lib/supabase';

type Metal = 'gold' | 'silver';
type RateUnit = 'gram' | 'tola';
type RateMode = 'follow_live' | 'offset' | 'fixed';

type Draft = {
    id?: string;
    metal: Metal;
    unit: RateUnit;
    mode: RateMode;
    offset_amount: number | null;
    fixed_rate: number | null;
    sell_rate: number;
    buy_rate: number;
    gold_24k: number | null;
    gold_22k: number | null;
    gold_21k: number | null;
    gold_18k: number | null;
    silver_999: number | null;
    enabled: boolean;
};

type PublishedRate = Draft & {
    published_at?: string;
};

type MarketQuote = {
    metal: Metal;
    current_usd: number | null;
    source_updated_at?: string;
};

const RATE_MODES: {
    value: RateMode;
    title: string;
    subtitle: string;
}[] = [
    {
        value: 'follow_live',
        title: 'Follow Live',
        subtitle: 'Automatically follows market',
    },
    {
        value: 'offset',
        title: 'Offset',
        subtitle: 'Add or subtract from live rate',
    },
    {
        value: 'fixed',
        title: 'Fixed',
        subtitle: 'Use your own fixed rate',
    },
];

const formatRate = (value: number | null | undefined) => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return '—';
    }

    return Number(value).toLocaleString('en-PK', {
        maximumFractionDigits: 2,
    });
};

const getFunctionError = async (
    error: any,
    fallback: string,
): Promise<string> => {
    if (!error) {
        return fallback;
    }

    try {
        if (error.context?.json) {
            const body = await error.context.json();

            if (body?.error) {
                return body.error;
            }

            if (body?.message) {
                return body.message;
            }
        }

        if (error.context?.text) {
            const text = await error.context.text();

            if (text) {
                return text;
            }
        }
    } catch {
        // Ignore parsing errors.
    }

    return error.message || fallback;
};

const ShopRatesScreen = ({ navigation }: any) => {
    const [metal, setMetal] = useState<Metal>('gold');
    const [unit, setUnit] = useState<RateUnit>('tola');
    const [mode, setMode] = useState<RateMode>('follow_live');

    const [offsetAmount, setOffsetAmount] = useState('');
    const [fixedRate, setFixedRate] = useState('');
    const [buyRate, setBuyRate] = useState('');

    const [liveRate, setLiveRate] = useState<number | null>(null);
    const [marketQuotes, setMarketQuotes] = useState<MarketQuote[]>([]);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [publishedRate, setPublishedRate] =
        useState<PublishedRate | null>(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showModeMenu, setShowModeMenu] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const selectedMode = useMemo(
        () => RATE_MODES.find((item) => item.value === mode) ?? RATE_MODES[0],
        [mode],
    );

    const effectiveSellRate = useMemo(() => {
        const live = Number(liveRate);

        if (!Number.isFinite(live)) {
            return null;
        }

        if (mode === 'follow_live') {
            return live;
        }

        if (mode === 'offset') {
            const offset = Number(offsetAmount);

            if (!Number.isFinite(offset)) {
                return null;
            }

            return live + offset;
        }

        const fixed = Number(fixedRate);

        if (!Number.isFinite(fixed)) {
            return null;
        }

        return fixed;
    }, [liveRate, mode, offsetAmount, fixedRate]);

    const derivedPurities = useMemo(() => {
        if (metal !== 'gold' || effectiveSellRate === null) {
            return null;
        }

        return {
            '24K': effectiveSellRate,
            '22K': (effectiveSellRate * 22) / 24,
            '21K': (effectiveSellRate * 21) / 24,
            '18K': (effectiveSellRate * 18) / 24,
        };
    }, [metal, effectiveSellRate]);

    const buySellError = useMemo(() => {
        const buy = Number(buyRate);
        const sell = effectiveSellRate;

        if (!buyRate || sell === null) {
            return null;
        }

        if (!Number.isFinite(buy)) {
            return 'Enter a valid buy rate.';
        }

        if (buy < 0) {
            return 'Buy rate cannot be negative.';
        }

        if (sell < 0) {
            return 'Sell rate cannot be negative.';
        }

        if (buy > sell) {
            return 'Buy rate cannot be higher than sell rate.';
        }

        return null;
    }, [buyRate, effectiveSellRate]);

    const selectedQuote = useMemo(
        () => marketQuotes.find((quote) => quote.metal === metal),
        [marketQuotes, metal],
    );

    const loadLiveRate = useCallback(
        async (selectedMetal: Metal, selectedUnit: RateUnit) => {
            const purity = selectedMetal === 'gold' ? 24 : 999;
            const column =
                selectedUnit === 'gram'
                    ? 'rate_per_gram'
                    : 'rate_per_tola';

            const { data, error } = await supabase
                .from('metal_rates')
                .select(column)
                .eq('metal', selectedMetal)
                .eq('purity', purity)
                .maybeSingle();

            if (error) {
                throw new Error(
                    `Live ${selectedMetal} rate lookup failed: ${error.message}`,
                );
            }

            const value = Number(
                data?.[column as keyof typeof data],
            );

            if (!Number.isFinite(value)) {
                throw new Error(
                    `Live ${selectedMetal} rate is unavailable.`,
                );
            }

            return value;
        },
        [],
    );

    const loadScreenData = useCallback(
        async (showRefresh = false) => {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const [
                    liveRateValue,
                    marketResponse,
                    publishedResponse,
                    draftResponse,
                ] = await Promise.all([
                    loadLiveRate(metal, unit),

                    supabase.functions.invoke('shop-rates', {
                        body: {
                            action: 'get_live_market',
                        },
                    }),

                    supabase.functions.invoke('shop-rates', {
                        body: {
                            action: 'get_published',
                        },
                    }),

                    supabase.functions.invoke('shop-rates', {
                        body: {
                            action: 'get_draft',
                            metal,
                        },
                    }),
                ]);

                if (marketResponse.error) {
                    throw new Error(
                        await getFunctionError(
                            marketResponse.error,
                            'Unable to load market data.',
                        ),
                    );
                }

                if (!marketResponse.data?.success) {
                    throw new Error(
                        marketResponse.data?.error ||
                            'Unable to load market data.',
                    );
                }

                if (publishedResponse.error) {
                    throw new Error(
                        await getFunctionError(
                            publishedResponse.error,
                            'Unable to load published rates.',
                        ),
                    );
                }

                if (!publishedResponse.data?.success) {
                    throw new Error(
                        publishedResponse.data?.error ||
                            'Unable to load published rates.',
                    );
                }

                if (draftResponse.error) {
                    throw new Error(
                        await getFunctionError(
                            draftResponse.error,
                            'Unable to load rate draft.',
                        ),
                    );
                }

                if (!draftResponse.data?.success) {
                    throw new Error(
                        draftResponse.data?.error ||
                            'Unable to load rate draft.',
                    );
                }

                const quotes = Array.isArray(marketResponse.data?.quotes)
                    ? marketResponse.data.quotes
                    : [];

                const published = Array.isArray(
                    publishedResponse.data?.rates,
                )
                    ? publishedResponse.data.rates.find(
                          (rate: PublishedRate) =>
                              rate.metal === metal,
                      )
                    : null;

                const loadedDraft = draftResponse.data?.draft ?? null;

                setLiveRate(liveRateValue);
                setMarketQuotes(quotes);
                setPublishedRate(published ?? null);
                setDraft(loadedDraft);

                if (loadedDraft) {
                    setUnit(loadedDraft.unit);
                    setMode(loadedDraft.mode);
                    setOffsetAmount(
                        loadedDraft.offset_amount !== null &&
                            loadedDraft.offset_amount !== undefined
                            ? String(loadedDraft.offset_amount)
                            : '',
                    );
                    setFixedRate(
                        loadedDraft.fixed_rate !== null &&
                            loadedDraft.fixed_rate !== undefined
                            ? String(loadedDraft.fixed_rate)
                            : '',
                    );
                    setBuyRate(
                        loadedDraft.buy_rate !== null &&
                            loadedDraft.buy_rate !== undefined
                            ? String(loadedDraft.buy_rate)
                            : '',
                    );
                } else if (published) {
                    setUnit(published.unit);
                    setMode(published.mode);
                    setOffsetAmount(
                        published.offset_amount !== null &&
                            published.offset_amount !== undefined
                            ? String(published.offset_amount)
                            : '',
                    );
                    setFixedRate(
                        published.fixed_rate !== null &&
                            published.fixed_rate !== undefined
                            ? String(published.fixed_rate)
                            : '',
                    );
                    setBuyRate(
                        published.buy_rate !== null &&
                            published.buy_rate !== undefined
                            ? String(published.buy_rate)
                            : '',
                    );
                } else {
                    setBuyRate('');
                    setOffsetAmount('');
                    setFixedRate('');
                }
            } catch (error) {
                console.error('SHOP RATES SCREEN LOAD FAILED:', error);

                Alert.alert(
                    'Unable to Load Shop Rates',
                    error instanceof Error
                        ? error.message
                        : 'Something went wrong while loading shop rates.',
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [loadLiveRate, metal, unit],
    );

    useEffect(() => {
        loadScreenData();
    }, [metal]);

    const handleMetalChange = (nextMetal: Metal) => {
        if (nextMetal === metal) {
            return;
        }

        setMetal(nextMetal);
        setUnit('tola');
        setMode('follow_live');
        setOffsetAmount('');
        setFixedRate('');
        setBuyRate('');
        setDraft(null);
        setPublishedRate(null);
    };

    const handleUnitChange = async (nextUnit: RateUnit) => {
        if (nextUnit === unit) {
            return;
        }

        try {
            setRefreshing(true);

            const nextLiveRate = await loadLiveRate(metal, nextUnit);

            setUnit(nextUnit);
            setLiveRate(nextLiveRate);
        } catch (error) {
            Alert.alert(
                'Rate Error',
                error instanceof Error
                    ? error.message
                    : 'Unable to change rate unit.',
            );
        } finally {
            setRefreshing(false);
        }
    };

    const handleSaveDraft = async () => {
        if (saving) {
            return;
        }

        const sell = effectiveSellRate;
        const buy = Number(buyRate);

        if (sell === null || !Number.isFinite(sell)) {
            Alert.alert(
                'Incomplete Rate',
                'Please configure a valid sell rate first.',
            );
            return;
        }

        if (!buyRate || !Number.isFinite(buy)) {
            Alert.alert(
                'Buy Rate Required',
                'Please enter a valid buy rate.',
            );
            return;
        }

        if (buySellError) {
            Alert.alert('Invalid Rates', buySellError);
            return;
        }

        if (mode === 'offset' && !Number.isFinite(Number(offsetAmount))) {
            Alert.alert(
                'Offset Required',
                'Please enter a valid offset amount.',
            );
            return;
        }

        if (mode === 'fixed' && !Number.isFinite(Number(fixedRate))) {
            Alert.alert(
                'Fixed Rate Required',
                'Please enter a valid fixed rate.',
            );
            return;
        }

        setSaving(true);

        try {
            const { data, error } = await supabase.functions.invoke(
                'shop-rates',
                {
                    body: {
                        action: 'save_draft',
                        metal,
                        unit,
                        mode,
                        offset_amount:
                            mode === 'offset'
                                ? Number(offsetAmount)
                                : null,
                        fixed_rate:
                            mode === 'fixed'
                                ? Number(fixedRate)
                                : null,
                        buy_rate: buy,
                        enabled: true,
                    },
                },
            );

            if (error) {
                throw new Error(
                    await getFunctionError(
                        error,
                        'Draft save failed.',
                    ),
                );
            }

            if (!data?.success || !data?.draft) {
                throw new Error(
                    data?.error || 'Draft save failed.',
                );
            }

            setDraft(data.draft);

            Alert.alert(
                'Draft Saved',
                `${metal === 'gold' ? 'Gold' : 'Silver'} shop rate draft saved successfully.`,
            );
        } catch (error) {
            console.error('SHOP RATE DRAFT SAVE FAILED:', error);

            Alert.alert(
                'Save Failed',
                error instanceof Error
                    ? error.message
                    : 'Unable to save shop rate draft.',
            );
        } finally {
            setSaving(false);
        }
    };

    const openPreview = () => {
        if (effectiveSellRate === null) {
            Alert.alert(
                'Preview Unavailable',
                'Configure a valid sell rate first.',
            );
            return;
        }

        if (!buyRate || buySellError) {
            Alert.alert(
                'Preview Unavailable',
                buySellError || 'Enter a valid buy rate first.',
            );
            return;
        }

        setShowPreview(true);
    };

    const getRateTrend = () => {
        if (!selectedQuote?.current_usd || !liveRate) {
            return null;
        }

        return null;
    };

    const trend = getRateTrend();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    color={colors.gold}
                    size="large"
                />

                <Text style={styles.loadingTitle}>
                    Loading Shop Rates
                </Text>

                <Text style={styles.loadingText}>
                    Preparing your live market and shop-rate workspace...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="SHOP RATES"
                subtitle="Your customer-facing rate desk"
                navigation={navigation}
                home
            />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* HERO */}
                    <View style={styles.hero}>
                        <View style={styles.heroBadge}>
                            <Sparkles
                                color={colors.gold}
                                size={14}
                            />

                            <Text style={styles.heroBadgeText}>
                                ADMIN RATE DESK
                            </Text>
                        </View>

                        <Text style={styles.heroTitle}>
                            Set your shop's rate.
                        </Text>

                        <Text style={styles.heroSubtitle}>
                            Market data stays live. Your published shop
                            rate is what your customers see.
                        </Text>
                    </View>

                    {/* METAL SWITCH */}
                    <View style={styles.segmentCard}>
                        <TouchableOpacity
                            style={[
                                styles.segment,
                                metal === 'gold' &&
                                    styles.segmentActive,
                            ]}
                            onPress={() =>
                                handleMetalChange('gold')
                            }
                            activeOpacity={0.85}
                        >
                            <Gem
                                color={
                                    metal === 'gold'
                                        ? colors.background
                                        : colors.textMuted
                                }
                                size={18}
                            />

                            <Text
                                style={[
                                    styles.segmentText,
                                    metal === 'gold' &&
                                        styles.segmentTextActive,
                                ]}
                            >
                                Gold
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.segment,
                                metal === 'silver' &&
                                    styles.segmentActive,
                            ]}
                            onPress={() =>
                                handleMetalChange('silver')
                            }
                            activeOpacity={0.85}
                        >
                            <View style={styles.silverDot} />

                            <Text
                                style={[
                                    styles.segmentText,
                                    metal === 'silver' &&
                                        styles.segmentTextActive,
                                ]}
                            >
                                Silver
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* MARKET + PUBLISHED */}
                    <View style={styles.rateGrid}>
                        <View style={styles.rateCard}>
                            <View style={styles.cardTopRow}>
                                <View>
                                    <Text style={styles.cardEyebrow}>
                                        MARKET RATE
                                    </Text>

                                    <Text style={styles.cardLabel}>
                                        Live {metal === 'gold' ? '24K' : '999'}
                                    </Text>
                                </View>

                                <View style={styles.liveBadge}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveText}>
                                        LIVE
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.bigRate}>
                                {formatRate(liveRate)}
                            </Text>

                            <Text style={styles.rateUnit}>
                                PKR / {unit}
                            </Text>

                            <View style={styles.marketFooter}>
                                <TrendingUp
                                    color="#63D471"
                                    size={15}
                                />

                                <Text style={styles.marketFooterText}>
                                    Source: live market feed
                                </Text>
                            </View>
                        </View>

                        <View style={styles.rateCard}>
                            <View style={styles.cardTopRow}>
                                <View>
                                    <Text style={styles.cardEyebrow}>
                                        PUBLISHED SHOP RATE
                                    </Text>

                                    <Text style={styles.cardLabel}>
                                        Customer-facing
                                    </Text>
                                </View>

                                <CheckCircle2
                                    color={
                                        publishedRate
                                            ? '#63D471'
                                            : colors.textSubtle
                                    }
                                    size={19}
                                />
                            </View>

                            <Text style={styles.bigRate}>
                                {publishedRate
                                    ? formatRate(
                                          publishedRate.sell_rate,
                                      )
                                    : '—'}
                            </Text>

                            <Text style={styles.rateUnit}>
                                PKR / {unit}
                            </Text>

                            <Text style={styles.publishedMode}>
                                {publishedRate
                                    ? publishedRate.mode.replace(
                                          '_',
                                          ' ',
                                      )
                                    : 'Not published yet'}
                            </Text>
                        </View>
                    </View>

                    {/* REFRESH */}
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={() => loadScreenData(true)}
                        disabled={refreshing}
                        activeOpacity={0.8}
                    >
                        {refreshing ? (
                            <ActivityIndicator
                                color={colors.gold}
                                size="small"
                            />
                        ) : (
                            <RefreshCw
                                color={colors.gold}
                                size={17}
                            />
                        )}

                        <Text style={styles.refreshText}>
                            {refreshing
                                ? 'Refreshing...'
                                : 'Refresh market data'}
                        </Text>
                    </TouchableOpacity>

                    <SectionHeader
                        title="Rate configuration"
                        subtitle="Build the rate you want customers to see"
                    />

                    {/* UNIT */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.inputLabel}>
                            RATE UNIT
                        </Text>

                        <View style={styles.unitRow}>
                            <TouchableOpacity
                                style={[
                                    styles.unitButton,
                                    unit === 'tola' &&
                                        styles.unitButtonActive,
                                ]}
                                onPress={() =>
                                    handleUnitChange('tola')
                                }
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.unitButtonText,
                                        unit === 'tola' &&
                                            styles.unitButtonTextActive,
                                    ]}
                                >
                                    Per Tola
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.unitButton,
                                    unit === 'gram' &&
                                        styles.unitButtonActive,
                                ]}
                                onPress={() =>
                                    handleUnitChange('gram')
                                }
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.unitButtonText,
                                        unit === 'gram' &&
                                            styles.unitButtonTextActive,
                                    ]}
                                >
                                    Per Gram
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* MODE */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.inputLabel}>
                            SELL RATE MODE
                        </Text>

                        <TouchableOpacity
                            style={styles.modeSelector}
                            onPress={() =>
                                setShowModeMenu((value) => !value)
                            }
                            activeOpacity={0.85}
                        >
                            <View style={styles.modeSelectorIcon}>
                                <TrendingUp
                                    color={colors.gold}
                                    size={19}
                                />
                            </View>

                            <View style={styles.modeSelectorCopy}>
                                <Text style={styles.modeSelectorTitle}>
                                    {selectedMode.title}
                                </Text>

                                <Text style={styles.modeSelectorSubtitle}>
                                    {selectedMode.subtitle}
                                </Text>
                            </View>

                            <ChevronDown
                                color={colors.textMuted}
                                size={20}
                            />
                        </TouchableOpacity>

                        {showModeMenu && (
                            <View style={styles.modeMenu}>
                                {RATE_MODES.map((item) => (
                                    <TouchableOpacity
                                        key={item.value}
                                        style={[
                                            styles.modeOption,
                                            mode === item.value &&
                                                styles.modeOptionActive,
                                        ]}
                                        onPress={() => {
                                            setMode(item.value);
                                            setShowModeMenu(false);
                                        }}
                                        activeOpacity={0.85}
                                    >
                                        <View
                                            style={
                                                styles.modeOptionCopy
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.modeOptionTitle,
                                                    mode ===
                                                        item.value &&
                                                        styles.modeOptionTitleActive,
                                                ]}
                                            >
                                                {item.title}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.modeOptionSubtitle
                                                }
                                            >
                                                {item.subtitle}
                                            </Text>
                                        </View>

                                        {mode === item.value && (
                                            <CheckCircle2
                                                color={colors.gold}
                                                size={19}
                                            />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* OFFSET / FIXED */}
                    {mode === 'offset' && (
                        <View style={styles.sectionCard}>
                            <Text style={styles.inputLabel}>
                                OFFSET AMOUNT
                            </Text>

                            <Text style={styles.helperText}>
                                Positive adds to the live rate.
                                Negative reduces it.
                            </Text>

                            <View style={styles.inputShell}>
                                <Text style={styles.inputPrefix}>
                                    PKR
                                </Text>

                                <TextInput
                                    value={offsetAmount}
                                    onChangeText={(value) =>
                                        setOffsetAmount(
                                            value.replace(
                                                /[^0-9.-]/g,
                                                '',
                                            ),
                                        )
                                    }
                                    keyboardType="decimal-pad"
                                    placeholder="e.g. 500"
                                    placeholderTextColor={
                                        colors.textSubtle
                                    }
                                    style={styles.rateInput}
                                />
                            </View>
                        </View>
                    )}

                    {mode === 'fixed' && (
                        <View style={styles.sectionCard}>
                            <Text style={styles.inputLabel}>
                                FIXED SELL RATE
                            </Text>

                            <Text style={styles.helperText}>
                                This rate stays fixed until you publish
                                another configuration.
                            </Text>

                            <View style={styles.inputShell}>
                                <Text style={styles.inputPrefix}>
                                    PKR
                                </Text>

                                <TextInput
                                    value={fixedRate}
                                    onChangeText={(value) =>
                                        setFixedRate(
                                            value.replace(
                                                /[^0-9.]/g,
                                                '',
                                            ),
                                        )
                                    }
                                    keyboardType="decimal-pad"
                                    placeholder="Enter fixed rate"
                                    placeholderTextColor={
                                        colors.textSubtle
                                    }
                                    style={styles.rateInput}
                                />
                            </View>
                        </View>
                    )}

                    {/* SELL PREVIEW */}
                    <View style={styles.sellPreview}>
                        <View>
                            <Text style={styles.sellPreviewEyebrow}>
                                EFFECTIVE SELL RATE
                            </Text>

                            <Text style={styles.sellPreviewRate}>
                                {formatRate(effectiveSellRate)}
                            </Text>

                            <Text style={styles.sellPreviewUnit}>
                                PKR / {unit}
                            </Text>
                        </View>

                        {effectiveSellRate !== null &&
                            liveRate !== null &&
                            effectiveSellRate > liveRate && (
                                <View style={styles.upBadge}>
                                    <ArrowUp
                                        color="#63D471"
                                        size={15}
                                    />

                                    <Text style={styles.upBadgeText}>
                                        Above live
                                    </Text>
                                </View>
                            )}

                        {effectiveSellRate !== null &&
                            liveRate !== null &&
                            effectiveSellRate < liveRate && (
                                <View style={styles.downBadge}>
                                    <ArrowDown
                                        color="#FF9A9A"
                                        size={15}
                                    />

                                    <Text style={styles.downBadgeText}>
                                        Below live
                                    </Text>
                                </View>
                            )}
                    </View>

                    {/* BUY RATE */}
                    <View style={styles.sectionCard}>
                        <View style={styles.buyHeader}>
                            <View>
                                <Text style={styles.inputLabel}>
                                    BUY RATE
                                </Text>

                                <Text style={styles.helperText}>
                                    Must not exceed your sell rate.
                                </Text>
                            </View>

                            <View style={styles.buyBadge}>
                                <ShieldCheck
                                    color={colors.gold}
                                    size={14}
                                />

                                <Text style={styles.buyBadgeText}>
                                    Margin protected
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.inputShell,
                                buySellError &&
                                    styles.inputShellError,
                            ]}
                        >
                            <Text style={styles.inputPrefix}>
                                PKR
                            </Text>

                            <TextInput
                                value={buyRate}
                                onChangeText={(value) =>
                                    setBuyRate(
                                        value.replace(
                                            /[^0-9.]/g,
                                            '',
                                        ),
                                    )
                                }
                                keyboardType="decimal-pad"
                                placeholder="Enter buy rate"
                                placeholderTextColor={
                                    colors.textSubtle
                                }
                                style={styles.rateInput}
                            />
                        </View>

                        {buySellError ? (
                            <Text style={styles.errorText}>
                                {buySellError}
                            </Text>
                        ) : (
                            <Text style={styles.validText}>
                                Buy rate is valid.
                            </Text>
                        )}
                    </View>

                    {/* GOLD PURITY */}
                    {metal === 'gold' && derivedPurities && (
                        <>
                            <SectionHeader
                                title="Gold purity preview"
                                subtitle="24K controls all derived gold purities"
                            />

                            <View style={styles.purityCard}>
                                {(
                                    Object.keys(
                                        derivedPurities,
                                    ) as Array<keyof typeof derivedPurities>
                                ).map((purity) => (
                                    <View
                                        key={purity}
                                        style={styles.purityRow}
                                    >
                                        <View
                                            style={
                                                styles.purityLeft
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.purityDot
                                                }
                                            />

                                            <Text
                                                style={
                                                    styles.purityName
                                                }
                                            >
                                                {purity}
                                            </Text>
                                        </View>

                                        <Text
                                            style={
                                                styles.purityRate
                                            }
                                        >
                                            {formatRate(
                                                derivedPurities[
                                                    purity
                                                ],
                                            )}
                                        </Text>
                                    </View>
                                ))}

                                <View style={styles.purityNote}>
                                    <Gem
                                        color={colors.gold}
                                        size={14}
                                    />

                                    <Text
                                        style={styles.purityNoteText}
                                    >
                                        Derived automatically from the
                                        effective 24K sell rate.
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}

                    {metal === 'silver' && (
                        <View style={styles.silverPreview}>
                            <View style={styles.silverPreviewIcon}>
                                <View style={styles.silverLargeDot} />
                            </View>

                            <View style={styles.silverPreviewCopy}>
                                <Text style={styles.silverPreviewTitle}>
                                    Silver 999
                                </Text>

                                <Text style={styles.silverPreviewText}>
                                    Your effective sell rate applies to
                                    Silver 999.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* DRAFT STATUS */}
                    <View style={styles.draftStatus}>
                        <View style={styles.draftStatusIcon}>
                            <Save
                                color={colors.gold}
                                size={17}
                            />
                        </View>

                        <View style={styles.draftStatusCopy}>
                            <Text style={styles.draftStatusTitle}>
                                {draft
                                    ? 'Draft ready'
                                    : 'No saved draft yet'}
                            </Text>

                            <Text style={styles.draftStatusText}>
                                {draft
                                    ? 'Your current configuration has been saved securely.'
                                    : 'Save your configuration before publishing.'}
                            </Text>
                        </View>

                        {draft && (
                            <CheckCircle2
                                color="#63D471"
                                size={19}
                            />
                        )}
                    </View>

                    {/* ACTIONS */}
                    <View style={styles.actionStack}>
                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                saving &&
                                    styles.primaryButtonDisabled,
                            ]}
                            onPress={handleSaveDraft}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            {saving ? (
                                <ActivityIndicator
                                    color={colors.background}
                                    size="small"
                                />
                            ) : (
                                <Save
                                    color={colors.background}
                                    size={18}
                                />
                            )}

                            <Text style={styles.primaryButtonText}>
                                {saving
                                    ? 'Saving Draft...'
                                    : 'Save Draft'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={openPreview}
                            activeOpacity={0.85}
                        >
                            <Sparkles
                                color={colors.gold}
                                size={18}
                            />

                            <Text style={styles.secondaryButtonText}>
                                Preview Before Publish
                            </Text>

                            <ArrowRight
                                color={colors.textSubtle}
                                size={18}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* SECURITY MESSAGE */}
                    <View style={styles.securityBanner}>
                        <LockKeyhole
                            color={colors.gold}
                            size={18}
                        />

                        <View style={styles.securityCopy}>
                            <Text style={styles.securityTitle}>
                                Protected publishing
                            </Text>

                            <Text style={styles.securityText}>
                                Publishing requires your secure shop-rate
                                PIN. The PIN is never stored in the app.
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.footerText}>
                        GoldKing Shop Rates • Admin workspace
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* PREVIEW MODAL */}
            <Modal
                visible={showPreview}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPreview(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.previewModal}>
                        <View style={styles.previewHandle} />

                        <View style={styles.previewHeader}>
                            <View>
                                <Text style={styles.previewEyebrow}>
                                    PUBLISH PREVIEW
                                </Text>

                                <Text style={styles.previewTitle}>
                                    {metal === 'gold'
                                        ? 'Gold'
                                        : 'Silver'}{' '}
                                    shop rate
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() =>
                                    setShowPreview(false)
                                }
                            >
                                <Text
                                    style={
                                        styles.closeButtonText
                                    }
                                >
                                    ×
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.previewRateBox}>
                            <Text style={styles.previewRateLabel}>
                                CUSTOMER SELL RATE
                            </Text>

                            <Text style={styles.previewRate}>
                                {formatRate(effectiveSellRate)}
                            </Text>

                            <Text style={styles.previewRateUnit}>
                                PKR / {unit}
                            </Text>
                        </View>

                        <View style={styles.previewRow}>
                            <Text style={styles.previewRowLabel}>
                                Buy rate
                            </Text>

                            <Text style={styles.previewRowValue}>
                                {formatRate(Number(buyRate))}
                            </Text>
                        </View>

                        <View style={styles.previewRow}>
                            <Text style={styles.previewRowLabel}>
                                Mode
                            </Text>

                            <Text style={styles.previewRowValue}>
                                {selectedMode.title}
                            </Text>
                        </View>

                        {metal === 'gold' && derivedPurities && (
                            <View style={styles.previewPurities}>
                                <Text
                                    style={
                                        styles.previewPurityHeading
                                    }
                                >
                                    GOLD PURITIES
                                </Text>

                                {(
                                    Object.keys(
                                        derivedPurities,
                                    ) as Array<keyof typeof derivedPurities>
                                ).map((purity) => (
                                    <View
                                        key={purity}
                                        style={
                                            styles.previewPurityRow
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.previewPurityName
                                            }
                                        >
                                            {purity}
                                        </Text>

                                        <Text
                                            style={
                                                styles.previewPurityValue
                                            }
                                        >
                                            {formatRate(
                                                derivedPurities[
                                                    purity
                                                ],
                                            )}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={styles.previewWarning}>
                            <ShieldCheck
                                color={colors.gold}
                                size={17}
                            />

                            <Text
                                style={styles.previewWarningText}
                            >
                                Save the draft first. Publishing will
                                require your shop-rate PIN.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.previewCloseButton}
                            onPress={() => setShowPreview(false)}
                            activeOpacity={0.85}
                        >
                            <Text
                                style={
                                    styles.previewCloseButtonText
                                }
                            >
                                Back to Rate Desk
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },

    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: spacing.xl,
    },

    loadingTitle: {
        color: colors.text,
        fontSize: 17,
        fontWeight: '800',
        marginTop: spacing.md,
    },

    loadingText: {
        color: colors.textSubtle,
        fontSize: 12,
        lineHeight: 18,
        marginTop: spacing.xs,
        textAlign: 'center',
    },

    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl * 2,
    },

    hero: {
        marginBottom: spacing.lg,
    },

    heroBadge: {
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#252015',
        borderColor: '#3A321F',
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: 'row',
        paddingHorizontal: spacing.sm,
        paddingVertical: 7,
    },

    heroBadgeText: {
        color: colors.gold,
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.2,
        marginLeft: 6,
    },

    heroTitle: {
        color: colors.text,
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: -0.7,
        marginTop: spacing.md,
    },

    heroSubtitle: {
        color: colors.textMuted,
        fontSize: 13,
        lineHeight: 20,
        marginTop: spacing.sm,
        maxWidth: 360,
    },

    segmentCard: {
        backgroundColor: '#181818',
        borderColor: colors.border,
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        marginBottom: spacing.md,
        padding: 4,
    },

    segment: {
        alignItems: 'center',
        borderRadius: radii.sm,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        minHeight: 48,
    },

    segmentActive: {
        backgroundColor: colors.gold,
    },

    segmentText: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '800',
        marginLeft: 7,
    },

    segmentTextActive: {
        color: colors.background,
    },

    silverDot: {
        backgroundColor: '#C7CCD3',
        borderRadius: 8,
        height: 16,
        width: 16,
    },

    rateGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },

    rateCard: {
        ...commonStyles.card,
        flex: 1,
        minHeight: 165,
        padding: spacing.md,
    },

    cardTopRow: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    cardEyebrow: {
        color: colors.textSubtle,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1.1,
    },

    cardLabel: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
        marginTop: 5,
    },

    liveBadge: {
        alignItems: 'center',
        backgroundColor: '#15251A',
        borderRadius: 999,
        flexDirection: 'row',
        paddingHorizontal: 7,
        paddingVertical: 4,
    },

    liveDot: {
        backgroundColor: '#63D471',
        borderRadius: 4,
        height: 7,
        width: 7,
    },

    liveText: {
        color: '#63D471',
        fontSize: 8,
        fontWeight: '900',
        marginLeft: 4,
    },

    bigRate: {
        color: colors.gold,
        fontSize: 22,
        fontWeight: '900',
        marginTop: spacing.lg,
    },

    rateUnit: {
        color: colors.textSubtle,
        fontSize: 10,
        marginTop: 3,
    },

    marketFooter: {
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: spacing.md,
    },

    marketFooterText: {
        color: colors.textSubtle,
        fontSize: 9,
        marginLeft: 5,
    },

    publishedMode: {
        color: colors.textSubtle,
        fontSize: 9,
        marginTop: spacing.md,
        textTransform: 'capitalize',
    },

    refreshButton: {
        alignItems: 'center',
        alignSelf: 'flex-start',
        flexDirection: 'row',
        marginBottom: spacing.xl,
        paddingVertical: 5,
    },

    refreshText: {
        color: colors.gold,
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 6,
    },

    sectionCard: {
        ...commonStyles.card,
        marginBottom: spacing.sm,
        padding: spacing.md,
    },

    inputLabel: {
        color: colors.textMuted,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.8,
        marginBottom: spacing.xs,
    },

    helperText: {
        color: colors.textSubtle,
        fontSize: 11,
        lineHeight: 16,
        marginBottom: spacing.sm,
    },

    unitRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },

    unitButton: {
        alignItems: 'center',
        backgroundColor: '#181818',
        borderColor: colors.border,
        borderRadius: radii.sm,
        borderWidth: 1,
        flex: 1,
        minHeight: 45,
        justifyContent: 'center',
    },

    unitButtonActive: {
        backgroundColor: '#252015',
        borderColor: '#6D5A20',
    },

    unitButtonText: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '800',
    },

    unitButtonTextActive: {
        color: colors.gold,
    },

    modeSelector: {
        alignItems: 'center',
        backgroundColor: '#181818',
        borderColor: colors.border,
        borderRadius: radii.sm,
        borderWidth: 1,
        flexDirection: 'row',
        minHeight: 62,
        paddingHorizontal: spacing.sm,
    },

    modeSelectorIcon: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderRadius: radii.sm,
        height: 40,
        justifyContent: 'center',
        width: 40,
    },

    modeSelectorCopy: {
        flex: 1,
        marginLeft: spacing.sm,
    },

    modeSelectorTitle: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '800',
    },

    modeSelectorSubtitle: {
        color: colors.textSubtle,
        fontSize: 10,
        marginTop: 3,
    },

    modeMenu: {
        backgroundColor: '#181818',
        borderColor: colors.border,
        borderRadius: radii.sm,
        borderWidth: 1,
        marginTop: spacing.xs,
        overflow: 'hidden',
    },

    modeOption: {
        alignItems: 'center',
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        flexDirection: 'row',
        minHeight: 65,
        paddingHorizontal: spacing.sm,
    },

    modeOptionActive: {
        backgroundColor: '#211D12',
    },

    modeOptionCopy: {
        flex: 1,
    },

    modeOptionTitle: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '800',
    },

    modeOptionTitleActive: {
        color: colors.gold,
    },

    modeOptionSubtitle: {
        color: colors.textSubtle,
        fontSize: 10,
        marginTop: 3,
    },

    inputShell: {
        alignItems: 'center',
        backgroundColor: '#181818',
        borderColor: '#3A321F',
        borderRadius: radii.sm,
        borderWidth: 1,
        flexDirection: 'row',
        minHeight: 52,
        paddingHorizontal: spacing.md,
    },

    inputShellError: {
        borderColor: '#7A3434',
    },

    inputPrefix: {
        color: colors.gold,
        fontSize: 11,
        fontWeight: '900',
        marginRight: spacing.sm,
    },

    rateInput: {
        color: colors.text,
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
        minHeight: 50,
        paddingVertical: 0,
    },

    sellPreview: {
        alignItems: 'center',
        backgroundColor: '#211D12',
        borderColor: '#55471E',
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
        padding: spacing.md,
    },

    sellPreviewEyebrow: {
        color: colors.gold,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },

    sellPreviewRate: {
        color: colors.text,
        fontSize: 25,
        fontWeight: '900',
        marginTop: 5,
    },

    sellPreviewUnit: {
        color: colors.textSubtle,
        fontSize: 10,
        marginTop: 2,
    },

    upBadge: {
        alignItems: 'center',
        backgroundColor: '#15251A',
        borderRadius: 999,
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 6,
    },

    upBadgeText: {
        color: '#63D471',
        fontSize: 9,
        fontWeight: '800',
        marginLeft: 3,
    },

    downBadge: {
        alignItems: 'center',
        backgroundColor: '#291818',
        borderRadius: 999,
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 6,
    },

    downBadgeText: {
        color: '#FF9A9A',
        fontSize: 9,
        fontWeight: '800',
        marginLeft: 3,
    },

    buyHeader: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },

    buyBadge: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderRadius: 999,
        flexDirection: 'row',
        paddingHorizontal: 7,
        paddingVertical: 5,
    },

    buyBadgeText: {
        color: colors.gold,
        fontSize: 8,
        fontWeight: '800',
        marginLeft: 4,
    },

    errorText: {
        color: '#FF8F8F',
        fontSize: 10,
        marginTop: 6,
    },

    validText: {
        color: '#63D471',
        fontSize: 10,
        marginTop: 6,
    },

    purityCard: {
        ...commonStyles.card,
        marginBottom: spacing.sm,
        padding: spacing.md,
    },

    purityRow: {
        alignItems: 'center',
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 48,
    },

    purityLeft: {
        alignItems: 'center',
        flexDirection: 'row',
    },

    purityDot: {
        backgroundColor: colors.gold,
        borderRadius: 5,
        height: 10,
        width: 10,
    },

    purityName: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '800',
        marginLeft: spacing.sm,
    },

    purityRate: {
        color: colors.gold,
        fontSize: 13,
        fontWeight: '900',
    },

    purityNote: {
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: spacing.md,
    },

    purityNoteText: {
        color: colors.textSubtle,
        flex: 1,
        fontSize: 10,
        lineHeight: 15,
        marginLeft: 6,
    },

    silverPreview: {
        alignItems: 'center',
        backgroundColor: '#181818',
        borderColor: colors.border,
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        marginBottom: spacing.sm,
        padding: spacing.md,
    },

    silverPreviewIcon: {
        alignItems: 'center',
        backgroundColor: '#242424',
        borderRadius: radii.sm,
        height: 45,
        justifyContent: 'center',
        width: 45,
    },

    silverLargeDot: {
        backgroundColor: '#C7CCD3',
        borderRadius: 11,
        height: 22,
        width: 22,
    },

    silverPreviewCopy: {
        flex: 1,
        marginLeft: spacing.md,
    },

    silverPreviewTitle: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '800',
    },

    silverPreviewText: {
        color: colors.textSubtle,
        fontSize: 11,
        lineHeight: 17,
        marginTop: 3,
    },

    draftStatus: {
        alignItems: 'center',
        backgroundColor: '#181818',
        borderColor: colors.border,
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        marginTop: spacing.md,
        padding: spacing.md,
    },

    draftStatusIcon: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderRadius: radii.sm,
        height: 38,
        justifyContent: 'center',
        width: 38,
    },

    draftStatusCopy: {
        flex: 1,
        marginHorizontal: spacing.sm,
    },

    draftStatusTitle: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '800',
    },

    draftStatusText: {
        color: colors.textSubtle,
        fontSize: 10,
        lineHeight: 15,
        marginTop: 3,
    },

    actionStack: {
        gap: spacing.sm,
        marginTop: spacing.md,
    },

    primaryButton: {
        alignItems: 'center',
        backgroundColor: colors.gold,
        borderRadius: radii.md,
        flexDirection: 'row',
        justifyContent: 'center',
        minHeight: 56,
        paddingHorizontal: spacing.md,
    },

    primaryButtonDisabled: {
        opacity: 0.65,
    },

    primaryButtonText: {
        color: colors.background,
        fontSize: 13,
        fontWeight: '900',
        marginLeft: 8,
    },

    secondaryButton: {
        alignItems: 'center',
        backgroundColor: '#181818',
        borderColor: '#3A321F',
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        minHeight: 54,
        paddingHorizontal: spacing.md,
    },

    secondaryButtonText: {
        color: colors.text,
        flex: 1,
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 8,
    },

    securityBanner: {
        alignItems: 'flex-start',
        backgroundColor: '#211D12',
        borderColor: '#55471E',
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        marginTop: spacing.md,
        padding: spacing.md,
    },

    securityCopy: {
        flex: 1,
        marginLeft: spacing.sm,
    },

    securityTitle: {
        color: colors.gold,
        fontSize: 12,
        fontWeight: '800',
    },

    securityText: {
        color: colors.textSubtle,
        fontSize: 10,
        lineHeight: 16,
        marginTop: 3,
    },

    footerText: {
        color: colors.textSubtle,
        fontSize: 9,
        marginTop: spacing.xl,
        textAlign: 'center',
    },

    modalOverlay: {
        backgroundColor: 'rgba(0,0,0,0.72)',
        flex: 1,
        justifyContent: 'flex-end',
    },

    previewModal: {
        backgroundColor: '#141414',
        borderColor: colors.border,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        borderWidth: 1,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },

    previewHandle: {
        alignSelf: 'center',
        backgroundColor: '#454545',
        borderRadius: 4,
        height: 4,
        marginBottom: spacing.lg,
        width: 42,
    },

    previewHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    previewEyebrow: {
        color: colors.gold,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },

    previewTitle: {
        color: colors.text,
        fontSize: 22,
        fontWeight: '900',
        marginTop: 4,
    },

    closeButton: {
        alignItems: 'center',
        backgroundColor: '#242424',
        borderRadius: 18,
        height: 36,
        justifyContent: 'center',
        width: 36,
    },

    closeButtonText: {
        color: colors.textMuted,
        fontSize: 25,
        fontWeight: '300',
        lineHeight: 28,
    },

    previewRateBox: {
        backgroundColor: '#211D12',
        borderColor: '#55471E',
        borderRadius: radii.md,
        borderWidth: 1,
        marginTop: spacing.lg,
        padding: spacing.lg,
    },

    previewRateLabel: {
        color: colors.gold,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },

    previewRate: {
        color: colors.text,
        fontSize: 32,
        fontWeight: '900',
        marginTop: 6,
    },

    previewRateUnit: {
        color: colors.textSubtle,
        fontSize: 11,
        marginTop: 3,
    },

    previewRow: {
        alignItems: 'center',
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 50,
    },

    previewRowLabel: {
        color: colors.textMuted,
        fontSize: 11,
    },

    previewRowValue: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'capitalize',
    },

    previewPurities: {
        backgroundColor: '#181818',
        borderColor: colors.border,
        borderRadius: radii.sm,
        borderWidth: 1,
        marginTop: spacing.md,
        padding: spacing.md,
    },

    previewPurityHeading: {
        color: colors.textSubtle,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },

    previewPurityRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 30,
    },

    previewPurityName: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '700',
    },

    previewPurityValue: {
        color: colors.gold,
        fontSize: 11,
        fontWeight: '900',
    },

    previewWarning: {
        alignItems: 'center',
        backgroundColor: '#211D12',
        borderRadius: radii.sm,
        flexDirection: 'row',
        marginTop: spacing.md,
        padding: spacing.sm,
    },

    previewWarningText: {
        color: colors.textSubtle,
        flex: 1,
        fontSize: 10,
        lineHeight: 15,
        marginLeft: 6,
    },

    previewCloseButton: {
        alignItems: 'center',
        borderColor: '#3A321F',
        borderRadius: radii.md,
        borderWidth: 1,
        marginTop: spacing.md,
        minHeight: 50,
        justifyContent: 'center',
    },

    previewCloseButtonText: {
        color: colors.gold,
        fontSize: 12,
        fontWeight: '800',
    },
});

export default ShopRatesScreen;