import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenHeader from './components/ScreenHeader';
import { supabase } from '../lib/supabase';
import { colors, spacing } from '../theme';

type MetalRate = {
    metal: 'gold' | 'silver';
    purity: number;
    rate_per_gram: number;
    rate_per_tola: number;
    currency: string;
    source: string;
    source_updated_at: string | null;
    updated_at: string;
};

const GOLD_KARATS = ['24K', '22K', '21K', '18K'];

const HomeScreen = ({ navigation }: any) => {
    const [selectedKarat, setSelectedKarat] = useState('24K');
    const [goldUnit, setGoldUnit] = useState('Tola');
    const [silverUnit, setSilverUnit] = useState('Tola');

    const [metalRates, setMetalRates] = useState<MetalRate[]>([]);
    const [loadingRates, setLoadingRates] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [ratesError, setRatesError] = useState('');

    const fetchMetalRates = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoadingRates(true);
            }

            setRatesError('');

            const { data, error } = await supabase
                .from('metal_rates')
                .select(
                    'metal,purity,rate_per_gram,rate_per_tola,currency,source,source_updated_at,updated_at',
                )
                .in('metal', ['gold', 'silver'])
                .order('metal')
                .order('purity', { ascending: false });

            if (error) {
                throw error;
            }

            setMetalRates((data ?? []) as MetalRate[]);
        } catch (error) {
            console.error('HomeScreen rate fetch error:', error);
            setRatesError('Unable to load latest rates.');
        } finally {
            setLoadingRates(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMetalRates();
    }, []);

    const goldRates = useMemo(() => {
        return {
            '24K': metalRates.find(rate => rate.metal === 'gold' && rate.purity === 24),
            '22K': metalRates.find(rate => rate.metal === 'gold' && rate.purity === 22),
            '21K': metalRates.find(rate => rate.metal === 'gold' && rate.purity === 21),
            '18K': metalRates.find(rate => rate.metal === 'gold' && rate.purity === 18),
        };
    }, [metalRates]);

    const silverRate = useMemo(() => {
        return metalRates.find(rate => rate.metal === 'silver' && rate.purity === 999);
    }, [metalRates]);

    const selectedGoldRate = useMemo(() => {
        const rate = goldRates[selectedKarat as keyof typeof goldRates];

        if (!rate) {
            return null;
        }

        return goldUnit === 'Tola' ? rate.rate_per_tola : rate.rate_per_gram;
    }, [goldRates, selectedKarat, goldUnit]);

    const selectedSilverRate = useMemo(() => {
        if (!silverRate) {
            return null;
        }

        return silverUnit === 'Tola' ? silverRate.rate_per_tola : silverRate.rate_per_gram;
    }, [silverRate, silverUnit]);

    const latestUpdatedAt = useMemo(() => {
        if (!metalRates.length) {
            return null;
        }

        const timestamps = metalRates
            .map(rate => rate.source_updated_at || rate.updated_at)
            .filter(Boolean)
            .map(value => new Date(value).getTime())
            .filter(value => Number.isFinite(value));

        if (!timestamps.length) {
            return null;
        }

        return new Date(Math.max(...timestamps));
    }, [metalRates]);

    const formatRate = (value: number | null) => {
        if (value === null || !Number.isFinite(value)) {
            return '—';
        }

        return Math.round(value).toLocaleString('en-PK');
    };

    const formatUpdatedTime = () => {
        if (!latestUpdatedAt) {
            return '';
        }

        return latestUpdatedAt.toLocaleString('en-PK', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="GOLDKING"
                subtitle="Jewellery & gold rates"
                navigation={navigation}
                back
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchMetalRates(true)}
                        tintColor="#D4AF37"
                        colors={['#D4AF37']}
                    />
                }
            >
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcome}>Welcome to</Text>

                    <Text style={styles.title}>GOLD KING</Text>

                    <Text style={styles.subtitle}>Jewellery & Gold</Text>
                </View>

                {/* GOLD RATES */}
                <View style={styles.rateCard}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.cardTitle}>GOLD RATES</Text>

                            <Text style={styles.cardSubtitle}>Select gold purity</Text>
                        </View>
                        
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.karatContainer}
                    >
                        {GOLD_KARATS.map(karat => (
                            <TouchableOpacity
                                key={karat}
                                style={[
                                    styles.karatButton,
                                    selectedKarat === karat && styles.selectedKaratButton,
                                ]}
                                onPress={() => setSelectedKarat(karat)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.karatText,
                                        selectedKarat === karat && styles.selectedKaratText,
                                    ]}
                                >
                                    {karat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.selectedInfo}>
                        <Text style={styles.selectedLabel}>{selectedKarat} GOLD</Text>

                        <Text style={styles.rateValue}>
                            {loadingRates ? 'Loading...' : `Rs. ${formatRate(selectedGoldRate)}`}
                        </Text>

                        <Text style={styles.unitLabel}>Per {goldUnit}</Text>
                    </View>

                    <View style={styles.unitSelector}>
                        <TouchableOpacity
                            style={[
                                styles.unitButton,
                                goldUnit === 'Tola' && styles.selectedUnitButton,
                            ]}
                            onPress={() => setGoldUnit('Tola')}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.unitText,
                                    goldUnit === 'Tola' && styles.selectedUnitText,
                                ]}
                            >
                                PER TOLA
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.unitButton,
                                goldUnit === 'Gram' && styles.selectedUnitButton,
                            ]}
                            onPress={() => setGoldUnit('Gram')}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.unitText,
                                    goldUnit === 'Gram' && styles.selectedUnitText,
                                ]}
                            >
                                PER GRAM
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* SILVER RATES */}
                <View style={styles.rateCard}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.cardTitle}>SILVER RATES</Text>

                            <Text style={styles.cardSubtitle}>Current silver price</Text>
                        </View>
                    </View>

                    <View style={styles.selectedInfo}>
                        <Text style={styles.selectedLabel}>SILVER</Text>

                        <Text style={styles.rateValue}>
                            {loadingRates ? 'Loading...' : `Rs. ${formatRate(selectedSilverRate)}`}
                        </Text>

                        <Text style={styles.unitLabel}>Per {silverUnit}</Text>
                    </View>

                    <View style={styles.unitSelector}>
                        <TouchableOpacity
                            style={[
                                styles.unitButton,
                                silverUnit === 'Tola' && styles.selectedUnitButton,
                            ]}
                            onPress={() => setSilverUnit('Tola')}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.unitText,
                                    silverUnit === 'Tola' && styles.selectedUnitText,
                                ]}
                            >
                                PER TOLA
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.unitButton,
                                silverUnit === 'Gram' && styles.selectedUnitButton,
                            ]}
                            onPress={() => setSilverUnit('Gram')}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.unitText,
                                    silverUnit === 'Gram' && styles.selectedUnitText,
                                ]}
                            >
                                PER GRAM
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* RATE INFORMATION */}
                <View style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                        <Text style={styles.infoTitle}>RATE INFORMATION</Text>

                        <View style={[styles.liveDot, ratesError && styles.liveDotError]} />
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Gold</Text>

                        <Text style={styles.infoValue}>
                            {selectedKarat} • Per {goldUnit}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Silver</Text>

                        <Text style={styles.infoValue}>Per {silverUnit}</Text>
                    </View>

                    <View style={styles.divider} />

                    {ratesError ? (
                        <Text style={styles.updateText}>{ratesError}</Text>
                    ) : loadingRates ? (
                        <Text style={styles.updateText}>Loading latest market rates...</Text>
                    ) : (
                        <>
                            <Text style={styles.updateText}>
                                Live rates are synced automatically from GoldKing market data.
                            </Text>

                            {latestUpdatedAt ? (
                                <Text style={styles.updatedAtText}>
                                    Last updated: {formatUpdatedTime()}
                                </Text>
                            ) : null}
                        </>
                    )}
                </View>

                <Text style={styles.footerText}>GOLD KING • Jewellery & Gold</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    scrollView: {
        flex: 1,
    },

    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: 40,
    },

    welcomeSection: {
        alignItems: 'center',
        marginBottom: 28,
    },

    welcome: {
        color: '#AAAAAA',
        fontSize: 15,
        marginBottom: 5,
    },

    title: {
        color: '#D4AF37',
        fontSize: 34,
        fontWeight: 'bold',
        letterSpacing: 3,
    },

    subtitle: {
        color: '#FFFFFF',
        fontSize: 14,
        marginTop: 6,
        letterSpacing: 1,
    },

    rateCard: {
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#2D2D2D',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    cardTitle: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 1,
    },

    cardSubtitle: {
        color: '#777777',
        fontSize: 12,
        marginTop: 4,
    },

    karatContainer: {
        gap: 8,
        paddingBottom: 4,
    },

    karatButton: {
        minWidth: 72,
        height: 42,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#3A3A3A',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },

    selectedKaratButton: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },

    karatText: {
        color: '#AAAAAA',
        fontSize: 13,
        fontWeight: '800',
    },

    selectedKaratText: {
        color: '#111111',
    },

    selectedInfo: {
        alignItems: 'center',
        paddingVertical: 22,
        borderBottomWidth: 1,
        borderBottomColor: '#292929',
        marginBottom: 14,
    },

    selectedLabel: {
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
    },

    rateValue: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '800',
        marginTop: 7,
    },

    unitLabel: {
        color: '#777777',
        fontSize: 12,
        marginTop: 5,
    },

    unitSelector: {
        flexDirection: 'row',
        gap: 8,
    },

    unitButton: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#363636',
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },

    selectedUnitButton: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },

    unitText: {
        color: '#888888',
        fontSize: 11,
        fontWeight: '800',
    },

    selectedUnitText: {
        color: '#111111',
    },

    infoCard: {
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#2D2D2D',
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
    },

    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    infoTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },

    liveDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: '#55C878',
    },

    liveDotError: {
        backgroundColor: '#C85A5A',
    },

    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },

    infoLabel: {
        color: '#888888',
        fontSize: 13,
    },

    infoValue: {
        color: '#D4AF37',
        fontSize: 13,
        fontWeight: '700',
    },

    divider: {
        height: 1,
        backgroundColor: '#292929',
        marginVertical: 10,
    },

    updateText: {
        color: '#666666',
        fontSize: 11,
        lineHeight: 17,
        textAlign: 'center',
    },

    updatedAtText: {
        color: '#555555',
        fontSize: 10,
        lineHeight: 16,
        textAlign: 'center',
        marginTop: 5,
    },

    footerText: {
        color: '#555555',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 5,
        letterSpacing: 1,
    },
});

export default HomeScreen;
