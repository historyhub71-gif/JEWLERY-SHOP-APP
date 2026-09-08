import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type Metal = 'gold' | 'silver';

type MetalRate = {
    id: string;
    metal: Metal;
    purity: number;
    rate_per_gram: number;
    rate_per_tola: number;
    currency: string;
    source: string;
    source_updated_at: string | null;
    updated_at: string;
};

type MarketQuote = {
    id: string;
    metal: Metal;
    current_usd: number;
    high_usd: number | null;
    low_usd: number | null;
    change_usd: number | null;
    change_percent: number | null;
    source: string;
    source_updated_at: string | null;
    updated_at: string;
};

type GoldKarat = '24K' | '22K' | '21K' | '18K';

type Direction = 'up' | 'down' | 'same';

const GOLD_KARATS: GoldKarat[] = ['24K', '22K', '21K', '18K'];

/**
 * ============================================================
 * SIMULATION SETTINGS
 * ============================================================
 *
 * IMPORTANT:
 *
 * All simulated values are DISPLAY ONLY.
 *
 * Real values remain in Supabase and are used by Calculator.
 *
 * Every 1 second the visible number makes a tiny movement.
 */
const SIMULATION_INTERVAL = 1000;

/**
 * USD market simulation
 */
const GOLD_USD_STEPS = [-3, -2, -1, 1, 2, 3];

const SILVER_USD_STEPS = [-0.03, -0.02, -0.01, 0.01, 0.02, 0.03];

/**
 * PKR local-rate simulation.
 *
 * Gold is a large PKR number, so ±1 would be almost invisible.
 */
const GOLD_PKR_STEPS = [-30, -20, -10, 10, 20, 30];

const SILVER_PKR_STEPS = [-3, -2, -1, 1, 2, 3];

const GOLD_USD_MAX_DISTANCE = 5;
const SILVER_USD_MAX_DISTANCE = 0.05;

const GOLD_PKR_MAX_DISTANCE = 50;
const SILVER_PKR_MAX_DISTANCE = 5;

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

const roundTo = (value: number, decimals: number) => {
    const multiplier = Math.pow(10, decimals);

    return Math.round(value * multiplier) / multiplier;
};

const formatNumber = (value: number | null | undefined, decimals = 2) => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return '—';
    }

    return value.toLocaleString('en-PK', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleTimeString('en-PK', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const getRandomItem = <T,>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
};

const getDirection = (next: number, previous: number): Direction => {
    if (next > previous) {
        return 'up';
    }

    if (next < previous) {
        return 'down';
    }

    return 'same';
};

/**
 * ============================================================
 * USD SIMULATION
 * ============================================================
 */

const getInitialUsdPrice = (metal: Metal, basePrice: number) => {
    if (metal === 'gold') {
        return roundTo(basePrice + getRandomItem(GOLD_USD_STEPS), 2);
    }

    return roundTo(Math.max(0, basePrice + getRandomItem(SILVER_USD_STEPS)), 2);
};

const getNextUsdPrice = (metal: Metal, currentPrice: number, basePrice: number) => {
    if (metal === 'gold') {
        const movement = getRandomItem(GOLD_USD_STEPS);

        const nextPrice = currentPrice + movement;

        const boundedPrice = Math.min(
            Math.max(nextPrice, basePrice - GOLD_USD_MAX_DISTANCE),
            basePrice + GOLD_USD_MAX_DISTANCE,
        );

        return roundTo(boundedPrice, 2);
    }

    const movement = getRandomItem(SILVER_USD_STEPS);

    const nextPrice = currentPrice + movement;

    const boundedPrice = Math.min(
        Math.max(nextPrice, basePrice - SILVER_USD_MAX_DISTANCE),
        basePrice + SILVER_USD_MAX_DISTANCE,
    );

    return roundTo(Math.max(0, boundedPrice), 2);
};

/**
 * ============================================================
 * PKR SIMULATION
 * ============================================================
 */

const getInitialPkrPrice = (metal: Metal, basePrice: number) => {
    if (metal === 'gold') {
        return roundTo(basePrice + getRandomItem(GOLD_PKR_STEPS), 2);
    }

    return roundTo(Math.max(0, basePrice + getRandomItem(SILVER_PKR_STEPS)), 2);
};

const getNextPkrPrice = (metal: Metal, currentPrice: number, basePrice: number) => {
    if (metal === 'gold') {
        const movement = getRandomItem(GOLD_PKR_STEPS);

        const nextPrice = currentPrice + movement;

        const boundedPrice = Math.min(
            Math.max(nextPrice, basePrice - GOLD_PKR_MAX_DISTANCE),
            basePrice + GOLD_PKR_MAX_DISTANCE,
        );

        return roundTo(boundedPrice, 2);
    }

    const movement = getRandomItem(SILVER_PKR_STEPS);

    const nextPrice = currentPrice + movement;

    const boundedPrice = Math.min(
        Math.max(nextPrice, basePrice - SILVER_PKR_MAX_DISTANCE),
        basePrice + SILVER_PKR_MAX_DISTANCE,
    );

    return roundTo(Math.max(0, boundedPrice), 2);
};

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function HomeScreen() {
    const [selectedKarat, setSelectedKarat] = useState<GoldKarat>('24K');

    const [goldUnit, setGoldUnit] = useState<'tola' | 'gram'>('tola');

    const [silverUnit, setSilverUnit] = useState<'tola' | 'gram'>('tola');

    const [metalRates, setMetalRates] = useState<MetalRate[]>([]);

    const [marketQuotes, setMarketQuotes] = useState<MarketQuote[]>([]);

    const [loadingRates, setLoadingRates] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [ratesError, setRatesError] = useState<string | null>(null);

    const [refreshStatus, setRefreshStatus] = useState<string | null>(null);

    /**
     * ==========================================================
     * REAL USD BASE VALUES
     * ==========================================================
     */

    const realGoldMarketPriceRef = useRef<number | null>(null);

    const realSilverMarketPriceRef = useRef<number | null>(null);

    /**
     * ==========================================================
     * REAL PKR BASE VALUES
     * ==========================================================
     *
     * These come from metal_rates.
     *
     * They are NEVER modified by simulation.
     */

    const realGoldPkrPriceRef = useRef<number | null>(null);

    const realSilverPkrPriceRef = useRef<number | null>(null);

    /**
     * ==========================================================
     * DISPLAY USD VALUES
     * ==========================================================
     */

    const [displayGoldMarketPrice, setDisplayGoldMarketPrice] = useState<number | null>(null);

    const [displaySilverMarketPrice, setDisplaySilverMarketPrice] = useState<number | null>(null);

    /**
     * ==========================================================
     * DISPLAY PKR VALUES
     * ==========================================================
     */

    const [displayGoldPkrPrice, setDisplayGoldPkrPrice] = useState<number | null>(null);

    const [displaySilverPkrPrice, setDisplaySilverPkrPrice] = useState<number | null>(null);

    /**
     * ==========================================================
     * DIRECTIONS
     * ==========================================================
     */

    const [goldUsdDirection, setGoldUsdDirection] = useState<Direction>('same');

    const [silverUsdDirection, setSilverUsdDirection] = useState<Direction>('same');

    const [goldPkrDirection, setGoldPkrDirection] = useState<Direction>('same');

    const [silverPkrDirection, setSilverPkrDirection] = useState<Direction>('same');

    /**
     * ==========================================================
     * ANIMATION VALUES
     * ==========================================================
     */

    const goldUsdAnimation = useRef(new Animated.Value(1)).current;

    const silverUsdAnimation = useRef(new Animated.Value(1)).current;

    const goldPkrAnimation = useRef(new Animated.Value(1)).current;

    const silverPkrAnimation = useRef(new Animated.Value(1)).current;

    /**
     * ==========================================================
     * REFS
     * ==========================================================
     */

    const marketPollingRef = useRef(false);

    const refreshingRef = useRef(false);

    /**
     * ==========================================================
     * ANIMATION HELPER
     * ==========================================================
     */

    const animatePriceChange = (animation: Animated.Value) => {
        animation.stopAnimation();

        animation.setValue(1);

        Animated.sequence([
            Animated.timing(animation, {
                toValue: 1.035,
                duration: 140,
                useNativeDriver: true,
            }),

            Animated.timing(animation, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start();
    };

    /**
     * ==========================================================
     * FETCH PKR METAL RATES
     * ==========================================================
     */

    const fetchMetalRates = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                    refreshingRef.current = true;
                } else {
                    setLoadingRates(true);
                }

                setRatesError(null);

                const { data, error } = await supabase
                    .from('metal_rates')
                    .select('*')
                    .in('metal', ['gold', 'silver'])
                    .order('metal', {
                        ascending: true,
                    })
                    .order('purity', {
                        ascending: false,
                    });

                if (error) {
                    throw error;
                }

                const rates = (data ?? []) as MetalRate[];

                setMetalRates(rates);

                /**
                 * ======================================================
                 * Update REAL PKR base prices
                 * ======================================================
                 *
                 * Gold base = selected karat.
                 *
                 * Silver base = 999.
                 */

                const selectedGoldRate = rates.find(
                    rate =>
                        rate.metal === 'gold' &&
                        Number(rate.purity) === Number(selectedKarat.replace('K', '')),
                );

                const silverRate = rates.find(
                    rate => rate.metal === 'silver' && Number(rate.purity) === 999,
                );

                if (selectedGoldRate) {
                    const goldBase =
                        goldUnit === 'tola'
                            ? Number(selectedGoldRate.rate_per_tola)
                            : Number(selectedGoldRate.rate_per_gram);

                    if (Number.isFinite(goldBase)) {
                        realGoldPkrPriceRef.current = goldBase;

                        setDisplayGoldPkrPrice(current => {
                            if (current === null || !Number.isFinite(current)) {
                                return getInitialPkrPrice('gold', goldBase);
                            }

                            if (Math.abs(current - goldBase) > GOLD_PKR_MAX_DISTANCE) {
                                return getInitialPkrPrice('gold', goldBase);
                            }

                            return current;
                        });
                    }
                }

                if (silverRate) {
                    const silverBase =
                        silverUnit === 'tola'
                            ? Number(silverRate.rate_per_tola)
                            : Number(silverRate.rate_per_gram);

                    if (Number.isFinite(silverBase)) {
                        realSilverPkrPriceRef.current = silverBase;

                        setDisplaySilverPkrPrice(current => {
                            if (current === null || !Number.isFinite(current)) {
                                return getInitialPkrPrice('silver', silverBase);
                            }

                            if (Math.abs(current - silverBase) > SILVER_PKR_MAX_DISTANCE) {
                                return getInitialPkrPrice('silver', silverBase);
                            }

                            return current;
                        });
                    }
                }
            } catch (error) {
                console.error('fetchMetalRates error:', error);

                setRatesError(
                    error instanceof Error ? error.message : 'Unable to load metal rates.',
                );
            } finally {
                if (isRefresh) {
                    setRefreshing(false);
                    refreshingRef.current = false;
                } else {
                    setLoadingRates(false);
                }
            }
        },
        [selectedKarat, goldUnit, silverUnit],
    );

    /**
     * ==========================================================
     * FETCH USD MARKET QUOTES
     * ==========================================================
     */

    const fetchMarketQuotes = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('metal_market_quotes')
                .select('*')
                .in('metal', ['gold', 'silver']);

            if (error) {
                throw error;
            }

            const quotes = (data ?? []) as MarketQuote[];

            setMarketQuotes(quotes);

            const goldQuote = quotes.find(quote => quote.metal === 'gold');

            const silverQuote = quotes.find(quote => quote.metal === 'silver');

            if (goldQuote && Number.isFinite(goldQuote.current_usd)) {
                realGoldMarketPriceRef.current = goldQuote.current_usd;

                setDisplayGoldMarketPrice(current => {
                    if (current === null || !Number.isFinite(current)) {
                        return getInitialUsdPrice('gold', goldQuote.current_usd);
                    }

                    if (Math.abs(current - goldQuote.current_usd) > GOLD_USD_MAX_DISTANCE) {
                        return getInitialUsdPrice('gold', goldQuote.current_usd);
                    }

                    return current;
                });
            }

            if (silverQuote && Number.isFinite(silverQuote.current_usd)) {
                realSilverMarketPriceRef.current = silverQuote.current_usd;

                setDisplaySilverMarketPrice(current => {
                    if (current === null || !Number.isFinite(current)) {
                        return getInitialUsdPrice('silver', silverQuote.current_usd);
                    }

                    if (Math.abs(current - silverQuote.current_usd) > SILVER_USD_MAX_DISTANCE) {
                        return getInitialUsdPrice('silver', silverQuote.current_usd);
                    }

                    return current;
                });
            }
        } catch (error) {
            console.error('fetchMarketQuotes error:', error);
        }
    }, []);

    /**
     * ==========================================================
     * UPDATE MARKET API
     * ==========================================================
     */

    const updateMarketQuotesFromApi = useCallback(async () => {
        try {
            const { data, error } = await supabase.functions.invoke('live-market-quotes');

            if (error) {
                throw error;
            }

            if (data && typeof data === 'object' && 'success' in data && data.success === false) {
                throw new Error(data.error || 'Unable to update market quotes.');
            }

            await fetchMarketQuotes();
        } catch (error) {
            console.error('updateMarketQuotesFromApi error:', error);

            throw error;
        }
    }, [fetchMarketQuotes]);

    /**
     * ==========================================================
     * SILENT MARKET UPDATE
     * ==========================================================
     */

    const silentlyUpdateMarketQuotes = useCallback(async () => {
        if (marketPollingRef.current) {
            return;
        }

        if (refreshingRef.current) {
            return;
        }

        marketPollingRef.current = true;

        try {
            await updateMarketQuotesFromApi();
        } catch (error) {
            console.log('Silent market update skipped:', error);
        } finally {
            marketPollingRef.current = false;
        }
    }, [updateMarketQuotesFromApi]);

    /**
     * ==========================================================
     * INITIAL LOAD
     * ==========================================================
     */

    useEffect(() => {
        let mounted = true;

        const loadInitialData = async () => {
            try {
                await Promise.all([fetchMetalRates(false), fetchMarketQuotes()]);

                if (mounted) {
                    try {
                        await updateMarketQuotesFromApi();
                    } catch (error) {
                        console.log('Initial market update skipped:', error);
                    }
                }
            } catch (error) {
                console.error('Initial HomeScreen load error:', error);
            }
        };

        loadInitialData();

        return () => {
            mounted = false;
        };
    }, [fetchMetalRates, fetchMarketQuotes, updateMarketQuotesFromApi]);

    /**
     * ==========================================================
     * REFRESH PKR BASE WHEN KARAT / UNIT CHANGES
     * ==========================================================
     *
     * This ensures that:
     *
     * 24K -> 22K
     *
     * or
     *
     * Tola -> Gram
     *
     * immediately updates the simulation base.
     */

    useEffect(() => {
        const selectedGoldRate = metalRates.find(
            rate =>
                rate.metal === 'gold' &&
                Number(rate.purity) === Number(selectedKarat.replace('K', '')),
        );

        if (selectedGoldRate) {
            const goldBase =
                goldUnit === 'tola'
                    ? Number(selectedGoldRate.rate_per_tola)
                    : Number(selectedGoldRate.rate_per_gram);

            if (Number.isFinite(goldBase)) {
                realGoldPkrPriceRef.current = goldBase;

                setDisplayGoldPkrPrice(getInitialPkrPrice('gold', goldBase));

                setGoldPkrDirection('same');
            }
        }

        const silverRate = metalRates.find(
            rate => rate.metal === 'silver' && Number(rate.purity) === 999,
        );

        if (silverRate) {
            const silverBase =
                silverUnit === 'tola'
                    ? Number(silverRate.rate_per_tola)
                    : Number(silverRate.rate_per_gram);

            if (Number.isFinite(silverBase)) {
                realSilverPkrPriceRef.current = silverBase;

                setDisplaySilverPkrPrice(getInitialPkrPrice('silver', silverBase));

                setSilverPkrDirection('same');
            }
        }
    }, [selectedKarat, goldUnit, silverUnit, metalRates]);

    /**
     * ==========================================================
     * 1-SECOND SIMULATION
     * ==========================================================
     *
     * ALL FOUR CARDS MOVE:
     *
     * 1. Gold USD
     * 2. Silver USD
     * 3. Gold PKR
     * 4. Silver PKR
     */

    useEffect(() => {
        const interval = setInterval(() => {
            /**
             * ----------------------------------------------------
             * GOLD USD
             * ----------------------------------------------------
             */

            const goldUsdBase = realGoldMarketPriceRef.current;

            if (goldUsdBase !== null && Number.isFinite(goldUsdBase)) {
                setDisplayGoldMarketPrice(current => {
                    if (current === null || !Number.isFinite(current)) {
                        return getInitialUsdPrice('gold', goldUsdBase);
                    }

                    const nextPrice = getNextUsdPrice('gold', current, goldUsdBase);

                    setGoldUsdDirection(getDirection(nextPrice, current));

                    animatePriceChange(goldUsdAnimation);

                    return nextPrice;
                });
            }

            /**
             * ----------------------------------------------------
             * SILVER USD
             * ----------------------------------------------------
             */

            const silverUsdBase = realSilverMarketPriceRef.current;

            if (silverUsdBase !== null && Number.isFinite(silverUsdBase)) {
                setDisplaySilverMarketPrice(current => {
                    if (current === null || !Number.isFinite(current)) {
                        return getInitialUsdPrice('silver', silverUsdBase);
                    }

                    const nextPrice = getNextUsdPrice('silver', current, silverUsdBase);

                    setSilverUsdDirection(getDirection(nextPrice, current));

                    animatePriceChange(silverUsdAnimation);

                    return nextPrice;
                });
            }

            /**
             * ----------------------------------------------------
             * GOLD PKR
             * ----------------------------------------------------
             */

            const goldPkrBase = realGoldPkrPriceRef.current;

            if (goldPkrBase !== null && Number.isFinite(goldPkrBase)) {
                setDisplayGoldPkrPrice(current => {
                    if (current === null || !Number.isFinite(current)) {
                        return getInitialPkrPrice('gold', goldPkrBase);
                    }

                    const nextPrice = getNextPkrPrice('gold', current, goldPkrBase);

                    setGoldPkrDirection(getDirection(nextPrice, current));

                    animatePriceChange(goldPkrAnimation);

                    return nextPrice;
                });
            }

            /**
             * ----------------------------------------------------
             * SILVER PKR
             * ----------------------------------------------------
             */

            const silverPkrBase = realSilverPkrPriceRef.current;

            if (silverPkrBase !== null && Number.isFinite(silverPkrBase)) {
                setDisplaySilverPkrPrice(current => {
                    if (current === null || !Number.isFinite(current)) {
                        return getInitialPkrPrice('silver', silverPkrBase);
                    }

                    const nextPrice = getNextPkrPrice('silver', current, silverPkrBase);

                    setSilverPkrDirection(getDirection(nextPrice, current));

                    animatePriceChange(silverPkrAnimation);

                    return nextPrice;
                });
            }
        }, SIMULATION_INTERVAL);

        return () => {
            clearInterval(interval);
        };
    }, [goldUsdAnimation, silverUsdAnimation, goldPkrAnimation, silverPkrAnimation]);

    /**
     * ==========================================================
     * MANUAL REFRESH
     * ==========================================================
     */

    const handleRefresh = useCallback(async () => {
        if (refreshingRef.current) {
            return;
        }

        refreshingRef.current = true;

        setRefreshing(true);
        setRefreshStatus(null);

        try {
            /**
             * Update real PKR rates.
             */
            const { error: metalRateError } = await supabase.functions.invoke('live-rates');

            if (metalRateError) {
                throw metalRateError;
            }

            /**
             * Update real USD market quotes.
             */
            const { data: marketData, error: marketError } = await supabase.functions.invoke(
                'live-market-quotes',
            );

            if (marketError) {
                throw marketError;
            }

            if (
                marketData &&
                typeof marketData === 'object' &&
                'success' in marketData &&
                marketData.success === false
            ) {
                throw new Error(marketData.error || 'Market quote update failed.');
            }

            /**
             * Read both tables again.
             */
            await Promise.all([fetchMetalRates(false), fetchMarketQuotes()]);

            setRefreshStatus('✓ Live rates updated successfully');

            setTimeout(() => {
                setRefreshStatus(null);
            }, 3000);
        } catch (error) {
            console.error('handleRefresh error:', error);

            setRefreshStatus(
                error instanceof Error ? `⚠ ${error.message}` : '⚠ Unable to update live rates',
            );

            setTimeout(() => {
                setRefreshStatus(null);
            }, 5000);
        } finally {
            setRefreshing(false);
            refreshingRef.current = false;
        }
    }, [fetchMetalRates, fetchMarketQuotes]);

    /**
     * ==========================================================
     * SELECTED LOCAL RATES
     * ==========================================================
     */

    const selectedGoldRate = metalRates.find(
        rate =>
            rate.metal === 'gold' && Number(rate.purity) === Number(selectedKarat.replace('K', '')),
    );

    const silverRate = metalRates.find(
        rate => rate.metal === 'silver' && Number(rate.purity) === 999,
    );

    const selectedGoldPrice = selectedGoldRate
        ? goldUnit === 'tola'
            ? selectedGoldRate.rate_per_tola
            : selectedGoldRate.rate_per_gram
        : null;

    const selectedSilverPrice = silverRate
        ? silverUnit === 'tola'
            ? silverRate.rate_per_tola
            : silverRate.rate_per_gram
        : null;

    /**
     * ==========================================================
     * MARKET QUOTES
     * ==========================================================
     */

    const goldMarketQuote = marketQuotes.find(quote => quote.metal === 'gold');

    const silverMarketQuote = marketQuotes.find(quote => quote.metal === 'silver');

    const latestUpdatedAt =
        goldMarketQuote?.source_updated_at ||
        silverMarketQuote?.source_updated_at ||
        goldMarketQuote?.updated_at ||
        silverMarketQuote?.updated_at ||
        null;

    /**
     * ==========================================================
     * DIRECTION COLORS
     * ==========================================================
     */

    const getDirectionColor = (direction: Direction) => {
        if (direction === 'up') {
            return '#45C878';
        }

        if (direction === 'down') {
            return '#E85D5D';
        }

        return '#777777';
    };

    const getDirectionBackground = (direction: Direction) => {
        if (direction === 'up') {
            return 'rgba(69, 200, 120, 0.12)';
        }

        if (direction === 'down') {
            return 'rgba(232, 93, 93, 0.12)';
        }

        return '#242424';
    };

    const getDirectionSymbol = (direction: Direction) => {
        if (direction === 'up') {
            return '+';
        }

        if (direction === 'down') {
            return '-';
        }

        return '.';
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor="#D4AF37"
                    colors={['#D4AF37']}
                />
            }
        >
            {/* =====================================================
          HEADER
      ====================================================== */}

            <View style={styles.header}>
                <View>
                    <Text style={styles.brand}>GOLDKING</Text>

                    <Text style={styles.subtitle}>Premium Gold & Silver</Text>
                </View>

                <View style={styles.liveHeaderBadge}>
                    <View style={styles.liveDot} />

                    <Text style={styles.liveHeaderText}>LIVE</Text>
                </View>
            </View>

            {/* =====================================================
          REFRESH STATUS
      ====================================================== */}

            {refreshStatus ? (
                <View style={styles.statusCard}>
                    <Text style={styles.statusText}>{refreshStatus}</Text>
                </View>
            ) : null}

            {/* =====================================================
          USD MARKET
      ====================================================== */}

            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>Market</Text>

                    <Text style={styles.sectionSubtitle}>Live market movement</Text>
                </View>

                {latestUpdatedAt ? (
                    <Text style={styles.updatedText}>{formatDateTime(latestUpdatedAt)}</Text>
                ) : null}
            </View>

            {/* =====================================================
          GOLD USD
      ====================================================== */}

            <View style={styles.marketCard}>
                <View style={styles.marketTopRow}>
                    <View>
                        <View style={styles.marketNameRow}>
                            <Text style={styles.marketMetalName}>Gold</Text>

                            <View style={styles.smallLiveBadge}>
                                <View style={styles.liveDotSmall} />

                                <Text style={styles.smallLiveText}>LIVE</Text>
                            </View>
                        </View>

                        <Text style={styles.marketSymbol}>XAU / USD</Text>
                    </View>

                    <Text style={styles.marketUnit}>USD / oz</Text>
                </View>

                <View style={styles.marketPriceRow}>
                    <Animated.Text
                        style={[
                            styles.marketPrice,
                            {
                                transform: [
                                    {
                                        scale: goldUsdAnimation,
                                    },
                                ],
                                color:
                                    goldUsdDirection === 'same'
                                        ? '#FFFFFF'
                                        : getDirectionColor(goldUsdDirection),
                            },
                        ]}
                    >
                        {formatNumber(displayGoldMarketPrice, 2)}
                    </Animated.Text>

                    <View
                        style={[
                            styles.priceMovement,
                            {
                                backgroundColor: getDirectionBackground(goldUsdDirection),
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.priceMovementSymbol,
                                {
                                    color: getDirectionColor(goldUsdDirection),
                                },
                            ]}
                        >
                            {getDirectionSymbol(goldUsdDirection)}
                        </Text>
                    </View>
                </View>

                <View style={styles.marketStatsRow}>
                    <View style={styles.marketStat}>
                        <Text style={styles.marketStatLabel}>H</Text>

                        <Text style={styles.marketStatValue}>
                            {formatNumber(goldMarketQuote?.high_usd, 2)}
                        </Text>
                    </View>

                    <View style={styles.marketStat}>
                        <Text style={styles.marketStatLabel}>L</Text>

                        <Text style={styles.marketStatValue}>
                            {formatNumber(goldMarketQuote?.low_usd, 2)}
                        </Text>
                    </View>

                    <View style={styles.marketStat}>
                        <Text style={styles.marketStatLabel}>CHANGE</Text>

                        <Text
                            style={[
                                styles.marketStatValue,
                                goldMarketQuote?.change_usd !== null &&
                                goldMarketQuote?.change_usd !== undefined
                                    ? goldMarketQuote.change_usd >= 0
                                        ? styles.positive
                                        : styles.negative
                                    : null,
                            ]}
                        >
                            {goldMarketQuote?.change_usd !== null &&
                            goldMarketQuote?.change_usd !== undefined
                                ? `${goldMarketQuote.change_usd >= 0 ? '+' : ''}${formatNumber(
                                      goldMarketQuote.change_usd,
                                      2,
                                  )}`
                                : '—'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* =====================================================
          SILVER USD
      ====================================================== */}

            <View style={styles.marketCard}>
                <View style={styles.marketTopRow}>
                    <View>
                        <View style={styles.marketNameRow}>
                            <Text style={styles.marketMetalName}>Silver</Text>

                            <View style={styles.smallLiveBadge}>
                                <View style={styles.liveDotSmall} />

                                <Text style={styles.smallLiveText}>LIVE</Text>
                            </View>
                        </View>

                        <Text style={styles.marketSymbol}>XAG / USD</Text>
                    </View>

                    <Text style={styles.marketUnit}>USD / oz</Text>
                </View>

                <View style={styles.marketPriceRow}>
                    <Animated.Text
                        style={[
                            styles.marketPrice,
                            {
                                transform: [
                                    {
                                        scale: silverUsdAnimation,
                                    },
                                ],
                                color:
                                    silverUsdDirection === 'same'
                                        ? '#FFFFFF'
                                        : getDirectionColor(silverUsdDirection),
                            },
                        ]}
                    >
                        {formatNumber(displaySilverMarketPrice, 2)}
                    </Animated.Text>

                    <View
                        style={[
                            styles.priceMovement,
                            {
                                backgroundColor: getDirectionBackground(silverUsdDirection),
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.priceMovementSymbol,
                                {
                                    color: getDirectionColor(silverUsdDirection),
                                },
                            ]}
                        >
                            {getDirectionSymbol(silverUsdDirection)}
                        </Text>
                    </View>
                </View>

                <View style={styles.marketStatsRow}>
                    <View style={styles.marketStat}>
                        <Text style={styles.marketStatLabel}>H</Text>

                        <Text style={styles.marketStatValue}>
                            {formatNumber(silverMarketQuote?.high_usd, 2)}
                        </Text>
                    </View>

                    <View style={styles.marketStat}>
                        <Text style={styles.marketStatLabel}>L</Text>

                        <Text style={styles.marketStatValue}>
                            {formatNumber(silverMarketQuote?.low_usd, 2)}
                        </Text>
                    </View>

                    <View style={styles.marketStat}>
                        <Text style={styles.marketStatLabel}>CHANGE</Text>

                        <Text
                            style={[
                                styles.marketStatValue,
                                silverMarketQuote?.change_usd !== null &&
                                silverMarketQuote?.change_usd !== undefined
                                    ? silverMarketQuote.change_usd >= 0
                                        ? styles.positive
                                        : styles.negative
                                    : null,
                            ]}
                        >
                            {silverMarketQuote?.change_usd !== null &&
                            silverMarketQuote?.change_usd !== undefined
                                ? `${silverMarketQuote.change_usd >= 0 ? '+' : ''}${formatNumber(
                                      silverMarketQuote.change_usd,
                                      2,
                                  )}`
                                : '—'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* =====================================================
          LOCAL PKR RATES
      ====================================================== */}

            <View style={[styles.sectionHeader, styles.localSectionHeader]}>
                <View>
                    <Text style={styles.sectionTitle}>Local Rates</Text>

                    <Text style={styles.sectionSubtitle}>Live PKR market movement</Text>
                </View>

                <View style={styles.localLiveBadge}>
                    <View style={styles.liveDotSmall} />

                    <Text style={styles.localLiveText}>LIVE</Text>
                </View>
            </View>

            {/* =====================================================
          GOLD PKR
      ====================================================== */}

            <View style={styles.rateCard}>
                <View style={styles.rateCardHeader}>
                    <View>
                        <View style={styles.rateTitleRow}>
                            <Text style={styles.rateMetalTitle}>Gold</Text>

                            <View
                                style={[
                                    styles.rateMovementBadge,
                                    {
                                        backgroundColor: getDirectionBackground(goldPkrDirection),
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.rateMovementSymbol,
                                        {
                                            color: getDirectionColor(goldPkrDirection),
                                        },
                                    ]}
                                >
                                    {getDirectionSymbol(goldPkrDirection)}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.rateMetalSubtitle}>{selectedKarat} • PKR</Text>
                    </View>

                    <View style={styles.unitSwitchContainer}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setGoldUnit('tola')}
                            style={[
                                styles.unitButton,
                                goldUnit === 'tola' && styles.unitButtonActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.unitButtonText,
                                    goldUnit === 'tola' && styles.unitButtonTextActive,
                                ]}
                            >
                                Tola
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setGoldUnit('gram')}
                            style={[
                                styles.unitButton,
                                goldUnit === 'gram' && styles.unitButtonActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.unitButtonText,
                                    goldUnit === 'gram' && styles.unitButtonTextActive,
                                ]}
                            >
                                Gram
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.karatRow}>
                    {GOLD_KARATS.map(karat => (
                        <TouchableOpacity
                            key={karat}
                            activeOpacity={0.8}
                            onPress={() => setSelectedKarat(karat)}
                            style={[
                                styles.karatButton,
                                selectedKarat === karat && styles.karatButtonActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.karatText,
                                    selectedKarat === karat && styles.karatTextActive,
                                ]}
                            >
                                {karat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.rateMainRow}>
                    {loadingRates ? (
                        <ActivityIndicator size="small" color="#D4AF37" />
                    ) : (
                        <Animated.Text
                            style={[
                                styles.rateValue,
                                {
                                    transform: [
                                        {
                                            scale: goldPkrAnimation,
                                        },
                                    ],
                                    color:
                                        goldPkrDirection === 'same'
                                            ? '#FFFFFF'
                                            : getDirectionColor(goldPkrDirection),
                                },
                            ]}
                        >
                            {formatNumber(displayGoldPkrPrice, 2)}
                        </Animated.Text>
                    )}

                    {!loadingRates ? <Text style={styles.rateCurrency}>PKR</Text> : null}
                </View>

                <Text style={styles.rateUnitText}>per {goldUnit}</Text>
            </View>

            {/* =====================================================
          SILVER PKR
      ====================================================== */}

            <View style={styles.rateCard}>
                <View style={styles.rateCardHeader}>
                    <View>
                        <View style={styles.rateTitleRow}>
                            <Text style={styles.rateMetalTitle}>Silver</Text>

                            <View
                                style={[
                                    styles.rateMovementBadge,
                                    {
                                        backgroundColor: getDirectionBackground(silverPkrDirection),
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.rateMovementSymbol,
                                        {
                                            color: getDirectionColor(silverPkrDirection),
                                        },
                                    ]}
                                >
                                    {getDirectionSymbol(silverPkrDirection)}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.rateMetalSubtitle}>999 • PKR</Text>
                    </View>

                    <View style={styles.unitSwitchContainer}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setSilverUnit('tola')}
                            style={[
                                styles.unitButton,
                                silverUnit === 'tola' && styles.unitButtonActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.unitButtonText,
                                    silverUnit === 'tola' && styles.unitButtonTextActive,
                                ]}
                            >
                                Tola
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setSilverUnit('gram')}
                            style={[
                                styles.unitButton,
                                silverUnit === 'gram' && styles.unitButtonActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.unitButtonText,
                                    silverUnit === 'gram' && styles.unitButtonTextActive,
                                ]}
                            >
                                Gram
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.rateMainRow}>
                    {loadingRates ? (
                        <ActivityIndicator size="small" color="#D4AF37" />
                    ) : (
                        <Animated.Text
                            style={[
                                styles.rateValue,
                                {
                                    transform: [
                                        {
                                            scale: silverPkrAnimation,
                                        },
                                    ],
                                    color:
                                        silverPkrDirection === 'same'
                                            ? '#FFFFFF'
                                            : getDirectionColor(silverPkrDirection),
                                },
                            ]}
                        >
                            {formatNumber(displaySilverPkrPrice, 2)}
                        </Animated.Text>
                    )}

                    {!loadingRates ? <Text style={styles.rateCurrency}>PKR</Text> : null}
                </View>

                <Text style={styles.rateUnitText}>per {silverUnit}</Text>
            </View>

            {/* =====================================================
          ERROR
      ====================================================== */}

            {ratesError ? (
                <View style={styles.errorCard}>
                    <Text style={styles.errorTitle}>Unable to load rates</Text>

                    <Text style={styles.errorText}>{ratesError}</Text>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => fetchMetalRates(false)}
                        style={styles.retryButton}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* =====================================================
          SOURCE
      ====================================================== */}

            <View style={styles.sourceContainer}>
                <Text style={styles.sourceText}>Market source: Gold API</Text>

                <Text style={styles.sourceText}>PKR rates updated from live market feed</Text>
            </View>
        </ScrollView>
    );
}

/**
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },

    contentContainer: {
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 40,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 22,
    },

    brand: {
        color: '#D4AF37',
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 2,
    },

    subtitle: {
        color: '#8F8F8F',
        fontSize: 13,
        marginTop: 4,
    },

    liveHeaderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2C',
        borderRadius: 20,
        paddingHorizontal: 11,
        paddingVertical: 7,
        backgroundColor: '#181818',
    },

    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#D4AF37',
        marginRight: 6,
    },

    liveHeaderText: {
        color: '#D4AF37',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },

    statusCard: {
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#292929',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 11,
        marginBottom: 18,
    },

    statusText: {
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: '600',
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginTop: 4,
    },

    localSectionHeader: {
        alignItems: 'center',
        marginTop: 12,
    },

    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },

    sectionSubtitle: {
        color: '#777777',
        fontSize: 12,
        marginTop: 3,
    },

    updatedText: {
        color: '#666666',
        fontSize: 10,
    },

    localLiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#292929',
    },

    localLiveText: {
        color: '#D4AF37',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.7,
        marginLeft: 4,
    },

    marketCard: {
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#292929',
        borderRadius: 18,
        padding: 17,
        marginBottom: 12,
    },

    marketTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    marketNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    marketMetalName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },

    marketSymbol: {
        color: '#707070',
        fontSize: 11,
        marginTop: 4,
        letterSpacing: 0.6,
    },

    marketUnit: {
        color: '#707070',
        fontSize: 10,
        fontWeight: '600',
    },

    smallLiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },

    liveDotSmall: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#D4AF37',
        marginRight: 4,
    },

    smallLiveText: {
        color: '#D4AF37',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.7,
    },

    marketPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 17,
    },

    marketPrice: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    priceMovement: {
        marginLeft: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    priceMovementSymbol: {
        fontSize: 20,
        fontWeight: '900',
    },

    marketStatsRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#252525',
        paddingTop: 13,
    },

    marketStat: {
        flex: 1,
    },

    marketStatLabel: {
        color: '#626262',
        fontSize: 9,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: 0.7,
    },

    marketStatValue: {
        color: '#BEBEBE',
        fontSize: 12,
        fontWeight: '700',
    },

    positive: {
        color: '#45C878',
    },

    negative: {
        color: '#E85D5D',
    },

    rateCard: {
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#292929',
        borderRadius: 18,
        padding: 17,
        marginBottom: 12,
    },

    rateCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    rateTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    rateMetalTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },

    rateMetalSubtitle: {
        color: '#777777',
        fontSize: 11,
        marginTop: 3,
    },

    rateMovementBadge: {
        width: 27,
        height: 27,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },

    rateMovementSymbol: {
        fontSize: 17,
        fontWeight: '900',
    },

    unitSwitchContainer: {
        flexDirection: 'row',
        backgroundColor: '#101010',
        borderRadius: 9,
        padding: 3,
    },

    unitButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 7,
    },

    unitButtonActive: {
        backgroundColor: '#D4AF37',
    },

    unitButtonText: {
        color: '#777777',
        fontSize: 10,
        fontWeight: '700',
    },

    unitButtonTextActive: {
        color: '#111111',
    },

    karatRow: {
        flexDirection: 'row',
        marginTop: 17,
        marginBottom: 18,
    },

    karatButton: {
        flex: 1,
        marginRight: 7,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2B2B2B',
        backgroundColor: '#121212',
    },

    karatButtonActive: {
        borderColor: '#D4AF37',
        backgroundColor: '#D4AF37',
    },

    karatText: {
        color: '#777777',
        fontSize: 11,
        fontWeight: '800',
    },

    karatTextActive: {
        color: '#111111',
    },

    rateMainRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 3,
    },

    rateValue: {
        color: '#FFFFFF',
        fontSize: 29,
        fontWeight: '800',
    },

    rateCurrency: {
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 7,
    },

    rateUnitText: {
        color: '#666666',
        fontSize: 11,
        marginTop: 2,
    },

    errorCard: {
        backgroundColor: '#1B1515',
        borderWidth: 1,
        borderColor: '#4A2929',
        borderRadius: 14,
        padding: 15,
        marginTop: 4,
    },

    errorTitle: {
        color: '#E28A8A',
        fontSize: 14,
        fontWeight: '800',
    },

    errorText: {
        color: '#9A7777',
        fontSize: 11,
        marginTop: 5,
    },

    retryButton: {
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#D4AF37',
    },

    retryButtonText: {
        color: '#111111',
        fontSize: 11,
        fontWeight: '800',
    },

    sourceContainer: {
        alignItems: 'center',
        marginTop: 15,
    },

    sourceText: {
        color: '#4F4F4F',
        fontSize: 9,
        marginTop: 3,
    },
});
