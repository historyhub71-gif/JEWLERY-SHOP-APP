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
    calculateGoldPurityRates,
    calculateShopRate,
    validateBuySellRates,
} from '../utils/shopRateEngine';
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
    buy_offset_amount: number | null;
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

const formatDateTime = (value: string | undefined) => {
    if (!value) {
        return 'Saved draft';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Saved draft';
    }

    return date.toLocaleString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getFunctionError = async (error: any, fallback: string): Promise<string> => {
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
    const [publishedRate, setPublishedRate] = useState<PublishedRate | null>(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [showModeMenu, setShowModeMenu] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [publishPin, setPublishPin] = useState('');

    const selectedMode = useMemo(
        () => RATE_MODES.find(item => item.value === mode) ?? RATE_MODES[0],
        [mode],
    );

    const effectiveSellRate = useMemo(() => {
        if (liveRate === null || !Number.isFinite(liveRate)) {
            return null;
        }

        try {
            return calculateShopRate(liveRate, {
                metal,
                mode,
                offset: mode === 'offset' ? Number(offsetAmount) : undefined,
                fixedRate: mode === 'fixed' ? Number(fixedRate) : undefined,
                enabled: true,
            });
        } catch {
            return null;
        }
    }, [liveRate, metal, mode, offsetAmount, fixedRate]);

    const normalizedNumber = (value: string | number | null | undefined): number | null => {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const number = Number(value);

        return Number.isFinite(number) ? number : null;
    };

    const isDraftCurrent = useMemo(() => {
        if (!draft) {
            return false;
        }

        const currentOffset = mode === 'offset' ? normalizedNumber(offsetAmount) : null;

        const currentFixed = mode === 'fixed' ? normalizedNumber(fixedRate) : null;

        const currentBuyRate = normalizedNumber(buyRate);

        const draftOffset = draft.mode === 'offset' ? normalizedNumber(draft.offset_amount) : null;

        const draftFixed = draft.mode === 'fixed' ? normalizedNumber(draft.fixed_rate) : null;

        const draftBuyRate = normalizedNumber(draft.buy_rate);

        const currentBuyOffset =
            mode === 'follow_live' || mode === 'offset'
                ? normalizedNumber(
                      effectiveSellRate !== null && currentBuyRate !== null
                          ? Number((currentBuyRate - effectiveSellRate).toFixed(2))
                          : null,
                  )
                : null;

        const draftBuyOffset =
            draft.mode === 'follow_live' || draft.mode === 'offset'
                ? normalizedNumber(draft.buy_offset_amount)
                : null;

        return (
            draft.metal === metal &&
            draft.unit === unit &&
            draft.mode === mode &&
            draftOffset === currentOffset &&
            draftFixed === currentFixed &&
            draftBuyRate === currentBuyRate &&
            draftBuyOffset === currentBuyOffset &&
            draft.enabled === true
        );
    }, [
        draft,
        metal,
        unit,
        mode,
        offsetAmount,
        fixedRate,
        buyRate,
        effectiveSellRate,
    ]);

    const derivedPurities = useMemo(() => {
        if (metal !== 'gold' || effectiveSellRate === null) {
            return null;
        }

        try {
            return calculateGoldPurityRates(effectiveSellRate);
        } catch {
            return null;
        }
    }, [metal, effectiveSellRate]);

    const buySellError = useMemo(() => {
        if (!buyRate || effectiveSellRate === null) {
            return null;
        }

        const validation = validateBuySellRates(Number(buyRate), effectiveSellRate);

        return validation.valid ? null : validation.error || 'Invalid buy/sell rates.';
    }, [buyRate, effectiveSellRate]);

    const selectedQuote = useMemo(
        () => marketQuotes.find(quote => quote.metal === metal),
        [marketQuotes, metal],
    );

    const loadLiveRate = useCallback(async (selectedMetal: Metal, selectedUnit: RateUnit) => {
        const purity = selectedMetal === 'gold' ? 24 : 999;

        const column = selectedUnit === 'gram' ? 'rate_per_gram' : 'rate_per_tola';

        const { data, error } = await supabase
            .from('metal_rates')
            .select(column)
            .eq('metal', selectedMetal)
            .eq('purity', purity)
            .maybeSingle();

        if (error) {
            throw new Error(`Live ${selectedMetal} rate lookup failed: ${error.message}`);
        }

        const value = Number(data?.[column as keyof typeof data]);

        if (!Number.isFinite(value)) {
            throw new Error(`Live ${selectedMetal} rate is unavailable.`);
        }

        return value;
    }, []);

    const loadScreenData = useCallback(
        async (showRefresh = false) => {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const [marketResponse, publishedResponse, draftResponse] = await Promise.all([
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
                        await getFunctionError(marketResponse.error, 'Unable to load market data.'),
                    );
                }

                if (!marketResponse.data?.success) {
                    throw new Error(marketResponse.data?.error || 'Unable to load market data.');
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
                        publishedResponse.data?.error || 'Unable to load published rates.',
                    );
                }

                if (draftResponse.error) {
                    throw new Error(
                        await getFunctionError(draftResponse.error, 'Unable to load rate draft.'),
                    );
                }

                if (!draftResponse.data?.success) {
                    throw new Error(draftResponse.data?.error || 'Unable to load rate draft.');
                }

                const quotes = Array.isArray(marketResponse.data?.quotes)
                    ? marketResponse.data.quotes
                    : [];

                const published = Array.isArray(publishedResponse.data?.rates)
                    ? publishedResponse.data.rates.find(
                          (rate: PublishedRate) => rate.metal === metal,
                      ) ?? null
                    : null;

                const loadedDraft = draftResponse.data?.draft ?? null;

                const sourceConfig = loadedDraft ?? published;

                const resolvedUnit: RateUnit = sourceConfig?.unit ?? unit;

                const resolvedMode: RateMode = sourceConfig?.mode ?? 'follow_live';

                const resolvedOffset =
                    sourceConfig?.offset_amount !== null &&
                    sourceConfig?.offset_amount !== undefined
                        ? String(sourceConfig.offset_amount)
                        : '';

                const resolvedFixed =
                    sourceConfig?.fixed_rate !== null && sourceConfig?.fixed_rate !== undefined
                        ? String(sourceConfig.fixed_rate)
                        : '';

                const liveRateValue = await loadLiveRate(metal, resolvedUnit);

                const resolvedBuyOffset =
                    sourceConfig?.buy_offset_amount !== null &&
                    sourceConfig?.buy_offset_amount !== undefined
                        ? Number(sourceConfig.buy_offset_amount)
                        : null;

                const storedBuy =
                    sourceConfig?.buy_rate !== null && sourceConfig?.buy_rate !== undefined
                        ? Number(sourceConfig.buy_rate)
                        : null;

                const currentSellForConfig =
                    resolvedMode === 'offset'
                        ? liveRateValue + Number(resolvedOffset || 0)
                        : liveRateValue;

                const resolvedBuy =
                    (resolvedMode === 'follow_live' || resolvedMode === 'offset') &&
                    resolvedBuyOffset !== null &&
                    Number.isFinite(resolvedBuyOffset)
                        ? String(Number((currentSellForConfig + resolvedBuyOffset).toFixed(2)))
                        : storedBuy !== null && Number.isFinite(storedBuy)
                        ? String(storedBuy)
                        : '';

                setLiveRate(liveRateValue);
                setMarketQuotes(quotes);
                setPublishedRate(published);
                setDraft(loadedDraft);

                setUnit(resolvedUnit);
                setMode(resolvedMode);

                setOffsetAmount(resolvedOffset);
                setFixedRate(resolvedFixed);
                setBuyRate(resolvedBuy);
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
                error instanceof Error ? error.message : 'Unable to change rate unit.',
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
            Alert.alert('Incomplete Rate', 'Please configure a valid sell rate first.');
            return;
        }

        if (!buyRate || !Number.isFinite(buy)) {
            Alert.alert('Buy Rate Required', 'Please enter a valid buy rate.');
            return;
        }

        const buyOffset =
            mode === 'follow_live' || mode === 'offset' ? Number((buy - sell).toFixed(2)) : null;

        if (buySellError) {
            Alert.alert('Invalid Rates', buySellError);
            return;
        }

        if (mode === 'offset' && !Number.isFinite(Number(offsetAmount))) {
            Alert.alert('Offset Required', 'Please enter a valid offset amount.');
            return;
        }

        if (mode === 'fixed' && !Number.isFinite(Number(fixedRate))) {
            Alert.alert('Fixed Rate Required', 'Please enter a valid fixed rate.');
            return;
        }

        setSaving(true);

        try {
            const { data, error } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'save_draft',
                    metal,
                    unit,
                    mode,
                    offset_amount: mode === 'offset' ? Number(offsetAmount) : null,
                    fixed_rate: mode === 'fixed' ? Number(fixedRate) : null,
                    buy_rate: buy,
                    buy_offset_amount: buyOffset,
                    enabled: true,
                },
            });

            if (error) {
                throw new Error(await getFunctionError(error, 'Draft save failed.'));
            }

            if (!data?.success || !data?.draft) {
                throw new Error(data?.error || 'Draft save failed.');
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
                error instanceof Error ? error.message : 'Unable to save shop rate draft.',
            );
        } finally {
            setSaving(false);
        }
    };

    const openPreview = () => {
        if (!draft) {
            Alert.alert(
                'Draft Required',
                'Please save your current shop rate configuration as a draft before previewing.',
            );
            return;
        }

        if (!isDraftCurrent) {
            Alert.alert(
                'Save Draft First',
                'Your current configuration has changed since the last draft was saved. Please save the draft again before previewing.',
            );
            return;
        }

        if (!Number.isFinite(Number(draft.sell_rate))) {
            Alert.alert(
                'Preview Unavailable',
                'The saved draft does not contain a valid sell rate.',
            );
            return;
        }

        if (!Number.isFinite(Number(draft.buy_rate))) {
            Alert.alert(
                'Preview Unavailable',
                'The saved draft does not contain a valid buy rate.',
            );
            return;
        }

        setShowPreview(true);
    };

    const handleContinueToPublish = () => {
        if (!draft) {
            Alert.alert('Draft Required', 'Please save a draft before publishing.');
            return;
        }

        if (!isDraftCurrent) {
            Alert.alert(
                'Save Draft First',
                'Your current configuration has changed. Please save the draft again before publishing.',
            );
            return;
        }

        setShowPreview(false);
        setPublishPin('');
        setShowPinModal(true);
    };

    const handlePublish = async () => {
        if (publishing) {
            return;
        }

        if (!draft) {
            Alert.alert('Draft Required', 'Please save a draft before publishing.');
            return;
        }

        if (!isDraftCurrent) {
            Alert.alert(
                'Save Draft First',
                'Your current configuration has changed. Please save the draft again before publishing.',
            );
            return;
        }

        const pin = publishPin.trim();

        if (!/^\d{4,6}$/.test(pin)) {
            Alert.alert('Invalid PIN', 'Please enter your 4 to 6 digit shop-rate PIN.');
            return;
        }

        setPublishing(true);

        try {
            const { data, error } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'publish',
                    metal: draft.metal,
                    pin,
                },
            });

            if (error) {
                throw new Error(await getFunctionError(error, 'Unable to publish shop rate.'));
            }

            if (!data?.success || !data?.rate) {
                throw new Error(data?.error || 'Shop rate publishing failed.');
            }

            setShowPinModal(false);
            setPublishPin('');

            await loadScreenData();

            Alert.alert(
                'Published Successfully',
                `${
                    draft.metal === 'gold' ? 'Gold' : 'Silver'
                } shop rate is now published and visible to your assigned customers.`,
            );
        } catch (error) {
            console.error('SHOP RATE PUBLISH FAILED:', error);

            Alert.alert(
                'Publish Failed',
                error instanceof Error ? error.message : 'Unable to publish shop rate.',
            );
        } finally {
            setPublishing(false);
        }
    };

    const previewMode = useMemo(() => {
        if (!draft) {
            return RATE_MODES[0];
        }

        return RATE_MODES.find(item => item.value === draft.mode) ?? RATE_MODES[0];
    }, [draft]);

    const previewPurities = useMemo(() => {
        if (!draft || draft.metal !== 'gold') {
            return null;
        }

        return {
            '24K': draft.gold_24k,
            '22K': draft.gold_22k,
            '21K': draft.gold_21k,
            '18K': draft.gold_18k,
        };
    }, [draft]);

    const previewSellRate = draft?.sell_rate ?? null;
    const previewBuyRate = draft?.buy_rate ?? null;

    const previewOffset = draft?.mode === 'offset' ? draft.offset_amount : null;

    const previewFixedRate = draft?.mode === 'fixed' ? draft.fixed_rate : null;

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
                <ActivityIndicator color={colors.gold} size="large" />

                <Text style={styles.loadingTitle}>Loading Shop Rates</Text>

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
                            <Sparkles color={colors.gold} size={14} />

                            <Text style={styles.heroBadgeText}>ADMIN RATE DESK</Text>
                        </View>

                        <Text style={styles.heroTitle}>Set your shop's rate.</Text>

                        <Text style={styles.heroSubtitle}>
                            Market data stays live. Your published shop rate is what your customers
                            see.
                        </Text>
                    </View>

                    {/* METAL SWITCH */}
                    <View style={styles.segmentCard}>
                        <TouchableOpacity
                            style={[styles.segment, metal === 'gold' && styles.segmentActive]}
                            onPress={() => handleMetalChange('gold')}
                            activeOpacity={0.85}
                        >
                            <Gem
                                color={metal === 'gold' ? colors.background : colors.textMuted}
                                size={18}
                            />

                            <Text
                                style={[
                                    styles.segmentText,
                                    metal === 'gold' && styles.segmentTextActive,
                                ]}
                            >
                                Gold
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.segment, metal === 'silver' && styles.segmentActive]}
                            onPress={() => handleMetalChange('silver')}
                            activeOpacity={0.85}
                        >
                            <View style={styles.silverDot} />

                            <Text
                                style={[
                                    styles.segmentText,
                                    metal === 'silver' && styles.segmentTextActive,
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
                                    <Text style={styles.cardEyebrow}>MARKET RATE</Text>

                                    <Text style={styles.cardLabel}>
                                        Live {metal === 'gold' ? '24K' : '999'}
                                    </Text>
                                </View>

                                <View style={styles.liveBadge}>
                                    <View style={styles.liveDot} />

                                    <Text style={styles.liveText}>LIVE</Text>
                                </View>
                            </View>

                            <Text style={styles.bigRate}>{formatRate(liveRate)}</Text>

                            <Text style={styles.rateUnit}>PKR / {unit}</Text>

                            <View style={styles.marketFooter}>
                                <TrendingUp color="#63D471" size={15} />

                                <Text style={styles.marketFooterText}>
                                    Source: live market feed
                                </Text>
                            </View>
                        </View>

                        <View style={styles.rateCard}>
                            <View style={styles.cardTopRow}>
                                <View>
                                    <Text style={styles.cardEyebrow}>PUBLISHED SHOP RATE</Text>

                                    <Text style={styles.cardLabel}>Customer-facing</Text>
                                </View>

                                <CheckCircle2
                                    color={publishedRate ? '#6ff97f' : colors.textSubtle}
                                    size={19}
                                />
                            </View>

                            <Text style={styles.bigRate}>
                                {publishedRate ? formatRate(publishedRate.sell_rate) : '—'}
                            </Text>

                            <Text style={styles.rateUnit}>PKR / {publishedRate?.unit ?? unit}</Text>

                            <Text style={styles.publishedMode}>
                                {publishedRate
                                    ? publishedRate.mode.replace('_', ' ')
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
                            <ActivityIndicator color={colors.gold} size="small" />
                        ) : (
                            <RefreshCw color={colors.gold} size={17} />
                        )}

                        <Text style={styles.refreshText}>
                            {refreshing ? 'Refreshing...' : 'Refresh market data'}
                        </Text>
                    </TouchableOpacity>

                    <SectionHeader
                        title="Rate configuration"
                        subtitle="Build the rate you want customers to see"
                    />

                    {/* UNIT */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.inputLabel}>RATE UNIT</Text>

                        <View style={styles.unitRow}>
                            <TouchableOpacity
                                style={[
                                    styles.unitButton,
                                    unit === 'tola' && styles.unitButtonActive,
                                ]}
                                onPress={() => handleUnitChange('tola')}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.unitButtonText,
                                        unit === 'tola' && styles.unitButtonTextActive,
                                    ]}
                                >
                                    Per Tola
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.unitButton,
                                    unit === 'gram' && styles.unitButtonActive,
                                ]}
                                onPress={() => handleUnitChange('gram')}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.unitButtonText,
                                        unit === 'gram' && styles.unitButtonTextActive,
                                    ]}
                                >
                                    Per Gram
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* MODE */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.inputLabel}>SELL RATE MODE</Text>

                        <TouchableOpacity
                            style={styles.modeSelector}
                            onPress={() => setShowModeMenu(value => !value)}
                            activeOpacity={0.85}
                        >
                            <View style={styles.modeSelectorIcon}>
                                <TrendingUp color={colors.gold} size={19} />
                            </View>

                            <View style={styles.modeSelectorCopy}>
                                <Text style={styles.modeSelectorTitle}>{selectedMode.title}</Text>

                                <Text style={styles.modeSelectorSubtitle}>
                                    {selectedMode.subtitle}
                                </Text>
                            </View>

                            <ChevronDown color={colors.textMuted} size={20} />
                        </TouchableOpacity>

                        {showModeMenu && (
                            <View style={styles.modeMenu}>
                                {RATE_MODES.map(item => (
                                    <TouchableOpacity
                                        key={item.value}
                                        style={[
                                            styles.modeOption,
                                            mode === item.value && styles.modeOptionActive,
                                        ]}
                                        onPress={() => {
                                            setMode(item.value);
                                            setShowModeMenu(false);
                                        }}
                                        activeOpacity={0.85}
                                    >
                                        <View style={styles.modeOptionCopy}>
                                            <Text
                                                style={[
                                                    styles.modeOptionTitle,
                                                    mode === item.value &&
                                                        styles.modeOptionTitleActive,
                                                ]}
                                            >
                                                {item.title}
                                            </Text>

                                            <Text style={styles.modeOptionSubtitle}>
                                                {item.subtitle}
                                            </Text>
                                        </View>

                                        {mode === item.value && (
                                            <CheckCircle2 color={colors.gold} size={19} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* OFFSET / FIXED */}
                    {mode === 'offset' && (
                        <View style={styles.sectionCard}>
                            <Text style={styles.inputLabel}>OFFSET AMOUNT</Text>

                            <Text style={styles.helperText}>
                                Positive adds to the live rate. Negative reduces it.
                            </Text>

                            <View style={styles.inputShell}>
                                <Text style={styles.inputPrefix}>PKR</Text>

                                <TextInput
                                    value={offsetAmount}
                                    onChangeText={value =>
                                        setOffsetAmount(value.replace(/[^0-9.-]/g, ''))
                                    }
                                    keyboardType="decimal-pad"
                                    placeholder="e.g. 500"
                                    placeholderTextColor={colors.textSubtle}
                                    style={styles.rateInput}
                                />
                            </View>
                        </View>
                    )}

                    {mode === 'fixed' && (
                        <View style={styles.sectionCard}>
                            <Text style={styles.inputLabel}>FIXED SELL RATE</Text>

                            <Text style={styles.helperText}>
                                This rate stays fixed until you publish another configuration.
                            </Text>

                            <View style={styles.inputShell}>
                                <Text style={styles.inputPrefix}>PKR</Text>

                                <TextInput
                                    value={fixedRate}
                                    onChangeText={value =>
                                        setFixedRate(value.replace(/[^0-9.]/g, ''))
                                    }
                                    keyboardType="decimal-pad"
                                    placeholder="Enter fixed rate"
                                    placeholderTextColor={colors.textSubtle}
                                    style={styles.rateInput}
                                />
                            </View>
                        </View>
                    )}

                    {/* SELL PREVIEW */}
                    <View style={styles.sellPreview}>
                        <View>
                            <Text style={styles.sellPreviewEyebrow}>EFFECTIVE SELL RATE</Text>

                            <Text style={styles.sellPreviewRate}>
                                {formatRate(effectiveSellRate)}
                            </Text>

                            <Text style={styles.sellPreviewUnit}>PKR / {unit}</Text>
                        </View>

                        {effectiveSellRate !== null &&
                            liveRate !== null &&
                            effectiveSellRate > liveRate && (
                                <View style={styles.upBadge}>
                                    <ArrowUp color="#63D471" size={15} />

                                    <Text style={styles.upBadgeText}>Above live</Text>
                                </View>
                            )}

                        {effectiveSellRate !== null &&
                            liveRate !== null &&
                            effectiveSellRate < liveRate && (
                                <View style={styles.downBadge}>
                                    <ArrowDown color="#FF9A9A" size={15} />

                                    <Text style={styles.downBadgeText}>Below live</Text>
                                </View>
                            )}
                    </View>

                    {/* BUY RATE */}
                    <View style={styles.sectionCard}>
                        <View style={styles.buyHeader}>
                            <View>
                                <Text style={styles.inputLabel}>BUY RATE</Text>

                                <Text style={styles.helperText}>
                                    Must not exceed your sell rate.
                                </Text>
                            </View>

                            <View style={styles.buyBadge}>
                                <ShieldCheck color={colors.gold} size={14} />

                                <Text style={styles.buyBadgeText}>Margin protected</Text>
                            </View>
                        </View>

                        <View style={[styles.inputShell, buySellError && styles.inputShellError]}>
                            <Text style={styles.inputPrefix}>PKR</Text>

                            <TextInput
                                value={buyRate}
                                onChangeText={value => setBuyRate(value.replace(/[^0-9.]/g, ''))}
                                keyboardType="decimal-pad"
                                placeholder="Enter buy rate"
                                placeholderTextColor={colors.textSubtle}
                                style={styles.rateInput}
                            />
                        </View>

                        {buySellError ? (
                            <Text style={styles.errorText}>{buySellError}</Text>
                        ) : (
                            <Text style={styles.validText}>Buy rate is valid.</Text>
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
                                    Object.keys(derivedPurities) as Array<
                                        keyof typeof derivedPurities
                                    >
                                ).map(purity => (
                                    <View key={purity} style={styles.purityRow}>
                                        <View style={styles.purityLeft}>
                                            <View style={styles.purityDot} />

                                            <Text style={styles.purityName}>{purity}</Text>
                                        </View>

                                        <Text style={styles.purityRate}>
                                            {formatRate(derivedPurities[purity])}
                                        </Text>
                                    </View>
                                ))}

                                <View style={styles.purityNote}>
                                    <Gem color={colors.gold} size={14} />

                                    <Text style={styles.purityNoteText}>
                                        Derived automatically from the effective 24K sell rate.
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
                                <Text style={styles.silverPreviewTitle}>Silver 999</Text>

                                <Text style={styles.silverPreviewText}>
                                    Your effective sell rate applies to Silver 999.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* DRAFT STATUS */}
                    <View style={styles.draftStatus}>
                        <View style={styles.draftStatusIcon}>
                            <Save color={colors.gold} size={17} />
                        </View>

                        <View style={styles.draftStatusCopy}>
                            <Text style={styles.draftStatusTitle}>
                                {!draft
                                    ? 'No saved draft yet'
                                    : isDraftCurrent
                                    ? 'Draft ready'
                                    : 'Unsaved changes'}
                            </Text>

                            <Text style={styles.draftStatusText}>
                                {!draft
                                    ? 'Save your configuration before previewing or publishing.'
                                    : isDraftCurrent
                                    ? 'Your current configuration matches the saved draft.'
                                    : 'Your current configuration has changed. Save the draft again before previewing.'}
                            </Text>
                        </View>

                        {draft && isDraftCurrent && <CheckCircle2 color="#63D471" size={19} />}

                        {draft && !isDraftCurrent && <RefreshCw color={colors.gold} size={19} />}
                    </View>

                    {/* ACTIONS */}
                    <View style={styles.actionStack}>
                        <TouchableOpacity
                            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
                            onPress={handleSaveDraft}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            {saving ? (
                                <ActivityIndicator color={colors.background} size="small" />
                            ) : (
                                <Save color={colors.background} size={18} />
                            )}

                            <Text style={styles.primaryButtonText}>
                                {saving ? 'Saving Draft...' : 'Save Draft'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={openPreview}
                            activeOpacity={0.85}
                        >
                            <Sparkles color={colors.gold} size={18} />

                            <Text style={styles.secondaryButtonText}>Preview Before Publish</Text>

                            <ArrowRight color={colors.textSubtle} size={18} />
                        </TouchableOpacity>
                    </View>

                    {/* SECURITY MESSAGE */}
                    <View style={styles.securityBanner}>
                        <LockKeyhole color={colors.gold} size={18} />

                        <View style={styles.securityCopy}>
                            <Text style={styles.securityTitle}>Protected publishing</Text>

                            <Text style={styles.securityText}>
                                Publishing requires your secure shop-rate PIN. The PIN is never
                                stored in the app.
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.footerText}>GoldKing Shop Rates • Admin workspace</Text>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ========================================================= */}
            {/* STEP 3 — PRODUCTION PUBLISH PREVIEW                     */}
            {/* ========================================================= */}
            <Modal
                visible={showPreview}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPreview(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.previewModal}>
                        <View style={styles.previewHandle} />

                        <ScrollView
                            style={styles.previewScroll}
                            contentContainerStyle={styles.previewScrollContent}
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}
                        >
                        {/* HEADER */}
                        <View style={styles.previewHeader}>
                            <View style={styles.previewHeaderCopy}>
                                <Text style={styles.previewEyebrow}>PUBLISH REVIEW</Text>

                                <Text style={styles.previewTitle}>
                                    {draft?.metal === 'gold' ? 'Gold' : 'Silver'} shop rate
                                </Text>

                                <Text style={styles.previewSubtitle}>
                                    Review the saved draft before publishing it to customers.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowPreview(false)}
                                hitSlop={8}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.closeButtonText}>×</Text>
                            </TouchableOpacity>
                        </View>

                        {/* SAVED DRAFT BADGE */}
                        <View style={styles.previewStatusBadge}>
                            <CheckCircle2 color="#63D471" size={15} />

                            <Text style={styles.previewStatusText}>SAVED DRAFT • READY</Text>
                        </View>

                        {/* CUSTOMER-FACING RATE */}
                        <View style={styles.previewRateBox}>
                            <View style={styles.previewRateBoxTop}>
                                <Text style={styles.previewRateLabel}>CUSTOMER SELL RATE</Text>

                                <View style={styles.previewCustomerBadge}>
                                    <Text style={styles.previewCustomerBadgeText}>
                                        CUSTOMER VIEW
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.previewRate}>{formatRate(previewSellRate)}</Text>

                            <Text style={styles.previewRateUnit}>PKR / {draft?.unit ?? unit}</Text>

                            <Text style={styles.previewRateDescription}>
                                This is the sell rate stored in the saved draft.
                            </Text>
                        </View>

                        {/* SUMMARY */}
                        <View style={styles.previewSection}>
                            <Text style={styles.previewSectionTitle}>RATE SUMMARY</Text>

                            <View style={styles.previewRow}>
                                <Text style={styles.previewRowLabel}>Metal</Text>

                                <Text style={styles.previewRowValue}>
                                    {draft?.metal === 'gold' ? 'Gold' : 'Silver'}
                                </Text>
                            </View>

                            <View style={styles.previewRow}>
                                <Text style={styles.previewRowLabel}>Rate unit</Text>

                                <Text style={styles.previewRowValue}>
                                    {draft?.unit === 'gram' ? 'Per Gram' : 'Per Tola'}
                                </Text>
                            </View>

                            <View style={styles.previewRow}>
                                <Text style={styles.previewRowLabel}>Sell mode</Text>

                                <Text style={styles.previewRowValue}>{previewMode.title}</Text>
                            </View>

                            <View style={styles.previewRow}>
                                <Text style={styles.previewRowLabel}>Buy rate</Text>

                                <Text style={styles.previewRowValueGold}>
                                    PKR {formatRate(previewBuyRate)}
                                </Text>
                            </View>

                            {draft?.mode === 'offset' && (
                                <View style={styles.previewRow}>
                                    <Text style={styles.previewRowLabel}>Offset</Text>

                                    <Text style={styles.previewRowValue}>
                                        PKR {formatRate(previewOffset)}
                                    </Text>
                                </View>
                            )}

                            {draft?.mode === 'fixed' && (
                                <View style={styles.previewRow}>
                                    <Text style={styles.previewRowLabel}>Fixed rate</Text>

                                    <Text style={styles.previewRowValue}>
                                        PKR {formatRate(previewFixedRate)}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* MARKET CONTEXT */}
                        <View style={styles.previewMarketCard}>
                            <View style={styles.previewMarketIcon}>
                                <TrendingUp color={colors.gold} size={17} />
                            </View>

                            <View style={styles.previewMarketCopy}>
                                <Text style={styles.previewMarketTitle}>
                                    Current market context
                                </Text>

                                <Text style={styles.previewMarketText}>
                                    Live {draft?.metal === 'gold' ? '24K Gold' : '999 Silver'} is
                                    currently{' '}
                                    <Text style={styles.previewMarketStrong}>
                                        PKR {formatRate(liveRate)}
                                    </Text>{' '}
                                    per {draft?.unit ?? unit}.
                                </Text>
                            </View>
                        </View>

                        {/* DYNAMIC MODE NOTICE */}
                        {draft?.mode === 'follow_live' && (
                            <View style={styles.previewInfoBanner}>
                                <RefreshCw color={colors.gold} size={16} />

                                <Text style={styles.previewInfoText}>
                                    Follow Live is linked to market pricing. The saved draft above
                                    is the configuration being reviewed; the live market can move
                                    independently.
                                </Text>
                            </View>
                        )}

                        {/* GOLD PURITIES */}
                        {draft?.metal === 'gold' && previewPurities && (
                            <View style={styles.previewPurities}>
                                <View style={styles.previewPuritiesHeader}>
                                    <View>
                                        <Text style={styles.previewPurityHeading}>
                                            GOLD PURITIES
                                        </Text>

                                        <Text style={styles.previewPuritySubheading}>
                                            Saved customer rates
                                        </Text>
                                    </View>

                                    <Gem color={colors.gold} size={18} />
                                </View>

                                {(
                                    Object.keys(previewPurities) as Array<
                                        keyof typeof previewPurities
                                    >
                                ).map(purity => (
                                    <View key={purity} style={styles.previewPurityRow}>
                                        <View style={styles.previewPurityNameWrap}>
                                            <View style={styles.previewPurityDot} />

                                            <Text style={styles.previewPurityName}>{purity}</Text>
                                        </View>

                                        <Text style={styles.previewPurityValue}>
                                            PKR {formatRate(previewPurities[purity])}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* SILVER PREVIEW */}
                        {draft?.metal === 'silver' && (
                            <View style={styles.previewSilverCard}>
                                <View style={styles.previewSilverIcon}>
                                    <View style={styles.previewSilverDot} />
                                </View>

                                <View style={styles.previewSilverCopy}>
                                    <Text style={styles.previewSilverTitle}>Silver 999</Text>

                                    <Text style={styles.previewSilverText}>
                                        The saved shop rate applies to 999 purity silver.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* DRAFT METADATA */}
                        <View style={styles.previewDraftMeta}>
                            <View style={styles.previewDraftMetaIcon}>
                                <Save color={colors.gold} size={15} />
                            </View>

                            <View style={styles.previewDraftMetaCopy}>
                                <Text style={styles.previewDraftMetaTitle}>
                                    Saved configuration
                                </Text>

                                <Text style={styles.previewDraftMetaText}>
                                    {draft?.id ? `Draft ID: ${draft.id}` : 'Saved draft'}
                                </Text>
                            </View>

                            <Text style={styles.previewDraftMetaDate}>
                                {formatDateTime(
                                    (
                                        draft as Draft & {
                                            created_at?: string;
                                            updated_at?: string;
                                        }
                                    )?.updated_at ??
                                        (
                                            draft as Draft & {
                                                created_at?: string;
                                            }
                                        )?.created_at,
                                )}
                            </Text>
                        </View>

                        {/* SECURITY */}
                        <View style={styles.previewWarning}>
                            <ShieldCheck color={colors.gold} size={18} />

                            <View style={styles.previewWarningCopy}>
                                <Text style={styles.previewWarningTitle}>Secure publishing</Text>

                                <Text style={styles.previewWarningText}>
                                    This preview is based on the saved draft. Publishing requires
                                    your shop-rate PIN and is a separate protected action.
                                </Text>
                            </View>
                        </View>
                        </ScrollView>

                        {/* ACTIONS */}
                        <View style={styles.previewActions}>
                            <TouchableOpacity
                                style={styles.previewBackButton}
                                onPress={() => setShowPreview(false)}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.previewBackButtonText}>Back to Rate Desk</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.previewPublishButton}
                                onPress={handleContinueToPublish}
                                activeOpacity={0.85}
                            >
                                <ShieldCheck color={colors.background} size={17} />

                                <Text style={styles.previewPublishButtonText}>
                                    Continue to Publish
                                </Text>

                                <ArrowRight color={colors.background} size={17} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ========================================================= */}
            {/* STEP 4 — SECURE PUBLISH PIN                              */}
            {/* ========================================================= */}
            <Modal
                visible={showPinModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!publishing) {
                        setShowPinModal(false);
                        setPublishPin('');
                    }
                }}
            >
                <View style={styles.pinModalOverlay}>
                    <View style={styles.pinModal}>
                        <View style={styles.pinIcon}>
                            <LockKeyhole color={colors.gold} size={24} />
                        </View>

                        <Text style={styles.pinTitle}>Confirm Publishing</Text>

                        <Text style={styles.pinSubtitle}>
                            Enter your shop-rate PIN to publish this{' '}
                            {draft?.metal === 'gold' ? 'Gold' : 'Silver'} rate to customers.
                        </Text>

                        <View style={styles.pinRatePreview}>
                            <Text style={styles.pinRateLabel}>CUSTOMER SELL RATE</Text>

                            <Text style={styles.pinRateValue}>
                                PKR {formatRate(previewSellRate)}
                            </Text>

                            <Text style={styles.pinRateUnit}>per {draft?.unit ?? unit}</Text>
                        </View>

                        <Text style={styles.pinInputLabel}>SHOP-RATE PIN</Text>

                        <View style={styles.pinInputShell}>
                            <LockKeyhole color={colors.gold} size={17} />

                            <TextInput
                                value={publishPin}
                                onChangeText={value =>
                                    setPublishPin(value.replace(/[^0-9]/g, '').slice(0, 6))
                                }
                                keyboardType="number-pad"
                                secureTextEntry
                                maxLength={6}
                                placeholder="Enter 4–6 digit PIN"
                                placeholderTextColor={colors.textSubtle}
                                style={styles.pinInput}
                                editable={!publishing}
                            />
                        </View>

                        <Text style={styles.pinSecurityText}>
                            Your PIN is verified securely by GoldKing. It is never stored in the
                            app.
                        </Text>

                        <View style={styles.pinActions}>
                            <TouchableOpacity
                                style={styles.pinCancelButton}
                                onPress={() => {
                                    if (publishing) {
                                        return;
                                    }

                                    setShowPinModal(false);
                                    setPublishPin('');
                                }}
                                disabled={publishing}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.pinCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.pinPublishButton,
                                    publishing && styles.pinPublishButtonDisabled,
                                ]}
                                onPress={handlePublish}
                                disabled={publishing}
                                activeOpacity={0.85}
                            >
                                {publishing ? (
                                    <ActivityIndicator color={colors.background} size="small" />
                                ) : (
                                    <ShieldCheck color={colors.background} size={17} />
                                )}

                                <Text style={styles.pinPublishText}>
                                    {publishing ? 'Publishing...' : 'Publish Rate'}
                                </Text>
                            </TouchableOpacity>
                        </View>
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

    /* ========================================================= */
    /* STEP 3 PREVIEW                                            */
    /* ========================================================= */

    modalOverlay: {
        backgroundColor: 'rgba(0,0,0,0.78)',
        flex: 1,
        justifyContent: 'flex-end',
    },

    previewModal: {
        backgroundColor: '#121212',
        borderColor: '#302A1A',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        maxHeight: '94%',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
    },

    previewScroll: {
        flexShrink: 1,
    },

    previewScrollContent: {
        paddingBottom: spacing.md,
    },

    previewHandle: {
        alignSelf: 'center',
        backgroundColor: '#454545',
        borderRadius: 4,
        height: 4,
        marginBottom: spacing.lg,
        width: 44,
    },

    previewHeader: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    previewHeaderCopy: {
        flex: 1,
        paddingRight: spacing.md,
    },

    previewEyebrow: {
        color: colors.gold,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1.4,
    },

    previewTitle: {
        color: colors.text,
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.4,
        marginTop: 4,
    },

    previewSubtitle: {
        color: colors.textSubtle,
        fontSize: 10,
        lineHeight: 15,
        marginTop: 5,
    },

    closeButton: {
        alignItems: 'center',
        backgroundColor: '#242424',
        borderColor: '#333333',
        borderRadius: 18,
        borderWidth: 1,
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

    previewStatusBadge: {
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#15251A',
        borderColor: '#24462C',
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: 'row',
        marginTop: spacing.md,
        paddingHorizontal: 9,
        paddingVertical: 6,
    },

    previewStatusText: {
        color: '#63D471',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.8,
        marginLeft: 5,
    },

    previewRateBox: {
        backgroundColor: '#211D12',
        borderColor: '#665522',
        borderRadius: radii.md,
        borderWidth: 1,
        marginTop: spacing.md,
        padding: spacing.lg,
    },

    previewRateBoxTop: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    previewRateLabel: {
        color: colors.gold,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1.2,
    },

    previewCustomerBadge: {
        backgroundColor: '#181818',
        borderColor: '#4B4020',
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 7,
        paddingVertical: 4,
    },

    previewCustomerBadgeText: {
        color: colors.textSubtle,
        fontSize: 7,
        fontWeight: '900',
        letterSpacing: 0.6,
    },

    previewRate: {
        color: colors.text,
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: -0.7,
        marginTop: 8,
    },

    previewRateUnit: {
        color: colors.gold,
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },

    previewRateDescription: {
        color: colors.textSubtle,
        fontSize: 9,
        lineHeight: 14,
        marginTop: 8,
    },

    previewSection: {
        marginTop: spacing.md,
    },

    previewSectionTitle: {
        color: colors.textSubtle,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1.1,
        marginBottom: spacing.xs,
    },

    previewRow: {
        alignItems: 'center',
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 43,
    },

    previewRowLabel: {
        color: colors.textMuted,
        fontSize: 10,
    },

    previewRowValue: {
        color: colors.text,
        fontSize: 11,
        fontWeight: '800',
    },

    previewRowValueGold: {
        color: colors.gold,
        fontSize: 12,
        fontWeight: '900',
    },

    previewMarketCard: {
        alignItems: 'center',
        backgroundColor: '#181818',
        borderColor: colors.border,
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        marginTop: spacing.md,
        padding: spacing.md,
    },

    previewMarketIcon: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderRadius: radii.sm,
        height: 38,
        justifyContent: 'center',
        width: 38,
    },

    previewMarketCopy: {
        flex: 1,
        marginLeft: spacing.sm,
    },

    previewMarketTitle: {
        color: colors.text,
        fontSize: 11,
        fontWeight: '800',
    },

    previewMarketText: {
        color: colors.textSubtle,
        fontSize: 9,
        lineHeight: 14,
        marginTop: 3,
    },

    previewMarketStrong: {
        color: colors.gold,
        fontWeight: '900',
    },

    previewInfoBanner: {
        alignItems: 'flex-start',
        backgroundColor: '#211D12',
        borderColor: '#55471E',
        borderRadius: radii.sm,
        borderWidth: 1,
        flexDirection: 'row',
        marginTop: spacing.sm,
        padding: spacing.sm,
    },

    previewInfoText: {
        color: colors.textSubtle,
        flex: 1,
        fontSize: 9,
        lineHeight: 14,
        marginLeft: 7,
    },

    previewPurities: {
        backgroundColor: '#181818',
        borderColor: colors.border,
        borderRadius: radii.md,
        borderWidth: 1,
        marginTop: spacing.md,
        padding: spacing.md,
    },

    previewPuritiesHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },

    previewPurityHeading: {
        color: colors.gold,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1.1,
    },

    previewPuritySubheading: {
        color: colors.textSubtle,
        fontSize: 9,
        marginTop: 2,
    },

    previewPurityRow: {
        alignItems: 'center',
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 36,
    },

    previewPurityNameWrap: {
        alignItems: 'center',
        flexDirection: 'row',
    },

    previewPurityDot: {
        backgroundColor: colors.gold,
        borderRadius: 4,
        height: 8,
        width: 8,
    },

    previewPurityName: {
        color: colors.textMuted,
        fontSize: 10,
        fontWeight: '800',
        marginLeft: 7,
    },

    previewPurityValue: {
        color: colors.gold,
        fontSize: 10,
        fontWeight: '900',
    },

    previewSilverCard: {
        alignItems: 'center',
        backgroundColor: '#181818',
        borderColor: colors.border,
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        marginTop: spacing.md,
        padding: spacing.md,
    },

    previewSilverIcon: {
        alignItems: 'center',
        backgroundColor: '#242424',
        borderRadius: radii.sm,
        height: 42,
        justifyContent: 'center',
        width: 42,
    },

    previewSilverDot: {
        backgroundColor: '#C7CCD3',
        borderRadius: 10,
        height: 20,
        width: 20,
    },

    previewSilverCopy: {
        flex: 1,
        marginLeft: spacing.sm,
    },

    previewSilverTitle: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '800',
    },

    previewSilverText: {
        color: colors.textSubtle,
        fontSize: 9,
        lineHeight: 14,
        marginTop: 3,
    },

    previewDraftMeta: {
        alignItems: 'center',
        backgroundColor: '#181818',
        borderColor: colors.border,
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        marginTop: spacing.md,
        padding: spacing.sm,
    },

    previewDraftMetaIcon: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderRadius: radii.sm,
        height: 34,
        justifyContent: 'center',
        width: 34,
    },

    previewDraftMetaCopy: {
        flex: 1,
        marginLeft: spacing.sm,
    },

    previewDraftMetaTitle: {
        color: colors.text,
        fontSize: 10,
        fontWeight: '800',
    },

    previewDraftMetaText: {
        color: colors.textSubtle,
        fontSize: 8,
        marginTop: 2,
    },

    previewDraftMetaDate: {
        color: colors.textSubtle,
        fontSize: 8,
        maxWidth: 105,
        textAlign: 'right',
    },

    previewWarning: {
        alignItems: 'flex-start',
        backgroundColor: '#211D12',
        borderColor: '#55471E',
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        marginTop: spacing.md,
        padding: spacing.md,
    },

    previewWarningCopy: {
        flex: 1,
        marginLeft: spacing.sm,
    },

    previewWarningTitle: {
        color: colors.gold,
        fontSize: 11,
        fontWeight: '800',
    },

    previewWarningText: {
        color: colors.textSubtle,
        fontSize: 9,
        lineHeight: 14,
        marginTop: 3,
    },

    previewActions: {
        gap: spacing.sm,
        marginTop: spacing.md,
    },

    previewBackButton: {
        alignItems: 'center',
        borderColor: '#3A321F',
        borderRadius: radii.md,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 48,
    },

    previewBackButtonText: {
        color: colors.gold,
        fontSize: 11,
        fontWeight: '800',
    },

    previewPublishButton: {
        alignItems: 'center',
        backgroundColor: colors.gold,
        borderRadius: radii.md,
        flexDirection: 'row',
        justifyContent: 'center',
        minHeight: 52,
        paddingHorizontal: spacing.md,
    },

    previewPublishButtonText: {
        color: colors.background,
        fontSize: 12,
        fontWeight: '900',
        marginHorizontal: 7,
    },
    /* ========================================================= */
    /* STEP 4 SECURE PUBLISH PIN                                */
    /* ========================================================= */

    pinModalOverlay: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.82)',
        flex: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },

    pinModal: {
        backgroundColor: '#121212',
        borderColor: '#3A321F',
        borderRadius: 24,
        borderWidth: 1,
        padding: spacing.lg,
        width: '100%',
        maxWidth: 420,
    },

    pinIcon: {
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: '#252015',
        borderColor: '#55471E',
        borderRadius: 24,
        borderWidth: 1,
        height: 48,
        justifyContent: 'center',
        width: 48,
    },

    pinTitle: {
        color: colors.text,
        fontSize: 22,
        fontWeight: '900',
        marginTop: spacing.md,
        textAlign: 'center',
    },

    pinSubtitle: {
        color: colors.textSubtle,
        fontSize: 11,
        lineHeight: 17,
        marginTop: spacing.xs,
        textAlign: 'center',
    },

    pinRatePreview: {
        backgroundColor: '#211D12',
        borderColor: '#55471E',
        borderRadius: radii.md,
        borderWidth: 1,
        marginTop: spacing.lg,
        padding: spacing.md,
    },

    pinRateLabel: {
        color: colors.gold,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1.1,
    },

    pinRateValue: {
        color: colors.text,
        fontSize: 25,
        fontWeight: '900',
        marginTop: 6,
    },

    pinRateUnit: {
        color: colors.textSubtle,
        fontSize: 10,
        marginTop: 2,
    },

    pinInputLabel: {
        color: colors.textMuted,
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.9,
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
    },

    pinInputShell: {
        alignItems: 'center',
        backgroundColor: '#181818',
        borderColor: '#3A321F',
        borderRadius: radii.md,
        borderWidth: 1,
        flexDirection: 'row',
        minHeight: 56,
        paddingHorizontal: spacing.md,
    },

    pinInput: {
        color: colors.text,
        flex: 1,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 5,
        minHeight: 54,
        paddingHorizontal: spacing.sm,
        paddingVertical: 0,
    },

    pinSecurityText: {
        color: colors.textSubtle,
        fontSize: 9,
        lineHeight: 14,
        marginTop: spacing.sm,
    },

    pinActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.lg,
    },

    pinCancelButton: {
        alignItems: 'center',
        borderColor: '#3A321F',
        borderRadius: radii.md,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        minHeight: 52,
    },

    pinCancelText: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '800',
    },

    pinPublishButton: {
        alignItems: 'center',
        backgroundColor: colors.gold,
        borderRadius: radii.md,
        flex: 1.35,
        flexDirection: 'row',
        justifyContent: 'center',
        minHeight: 52,
        paddingHorizontal: spacing.sm,
    },

    pinPublishButtonDisabled: {
        opacity: 0.65,
    },

    pinPublishText: {
        color: colors.background,
        fontSize: 11,
        fontWeight: '900',
        marginLeft: 7,
    },
});

export default ShopRatesScreen;
