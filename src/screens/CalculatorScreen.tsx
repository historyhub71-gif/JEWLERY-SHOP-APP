
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type CalculatorMode =
    | 'menu'
    | 'goldToMoney'
    | 'moneyToGold'
    | 'jewelleryPrice'
    | 'goldPurchase';

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

const TOLA_GRAMS = 11.664;

const KARATS = [
    { label: '24K', value: 24 },
    { label: '22K', value: 22 },
    { label: '21K', value: 21 },
    { label: '18K', value: 18 },
];

const CalculatorScreen = ({ navigation }: any) => {
    const [mode, setMode] = useState<CalculatorMode>('menu');

    const [metal, setMetal] = useState<Metal>('gold');

    const [metalRates, setMetalRates] = useState<MetalRate[]>([]);
    const [loadingRates, setLoadingRates] = useState(true);
    const [ratesError, setRatesError] = useState('');

    const [weight, setWeight] = useState('');
    const [money, setMoney] = useState('');
    const [makingPercent, setMakingPercent] = useState('');
    const [wastagePercent, setWastagePercent] = useState('');
    const [extraCharges, setExtraCharges] = useState('');
    const [deductionPercent, setDeductionPercent] = useState('');

    const [selectedKarat, setSelectedKarat] = useState(24);

    const numericWeight = Number(weight) || 0;
    const numericMoney = Number(money) || 0;
    const numericMaking = Number(makingPercent) || 0;
    const numericWastage = Number(wastagePercent) || 0;
    const numericExtra = Number(extraCharges) || 0;
    const numericDeduction = Number(deductionPercent) || 0;

    /**
     * Fetch latest rates already stored in Supabase.
     *
     * HomeScreen is responsible for refreshing live API rates.
     * Calculator reads the same central `metal_rates` table.
     */
    const fetchMetalRates = async () => {
        try {
            setLoadingRates(true);
            setRatesError('');

            const { data, error } = await supabase
                .from('metal_rates')
                .select(
                    'id, metal, purity, rate_per_gram, rate_per_tola, currency, source, source_updated_at, updated_at',
                )
                .order('metal')
                .order('purity', { ascending: false });

            if (error) {
                throw error;
            }

            setMetalRates((data as MetalRate[]) || []);
        } catch (error: any) {
            console.error('Calculator rate fetch error:', error);

            setRatesError(
                error?.message || 'Unable to load live rates.',
            );
        } finally {
            setLoadingRates(false);
        }
    };

    useEffect(() => {
        fetchMetalRates();
    }, []);

    const goldRate = useMemo(() => {
        return (
            metalRates.find(
                rate =>
                    rate.metal === 'gold' &&
                    Number(rate.purity) === selectedKarat,
            ) || null
        );
    }, [metalRates, selectedKarat]);

    const silverRate = useMemo(() => {
        return (
            metalRates.find(
                rate =>
                    rate.metal === 'silver' &&
                    Number(rate.purity) === 999,
            ) || null
        );
    }, [metalRates]);

    /**
     * This is the actual selected metal rate from Supabase.
     *
     * Gold:
     *   selectedKarat directly maps to 24K/22K/21K/18K row.
     *
     * Silver:
     *   999 purity row is used.
     */
    const selectedRate = metal === 'gold' ? goldRate : silverRate;

    const ratePerTola = selectedRate
        ? Number(selectedRate.rate_per_tola) || 0
        : 0;

    const ratePerGram = selectedRate
        ? Number(selectedRate.rate_per_gram) || 0
        : 0;

    const metalValue = useMemo(() => {
        return (numericWeight / TOLA_GRAMS) * ratePerTola;
    }, [numericWeight, ratePerTola]);

    const makingValue = useMemo(() => {
        return metalValue * (numericMaking / 100);
    }, [metalValue, numericMaking]);

    const wastageWeight = useMemo(() => {
        return numericWeight * (numericWastage / 100);
    }, [numericWeight, numericWastage]);

    const wastageValue = useMemo(() => {
        return wastageWeight * ratePerGram;
    }, [wastageWeight, ratePerGram]);

    const jewelleryTotal = useMemo(() => {
        return metalValue + makingValue + wastageValue + numericExtra;
    }, [metalValue, makingValue, wastageValue, numericExtra]);

    const moneyTometalGrams = useMemo(() => {
        if (ratePerGram <= 0) {
            return 0;
        }

        return numericMoney / ratePerGram;
    }, [numericMoney, ratePerGram]);

    const moneyTometalTola = useMemo(() => {
        return moneyTometalGrams / TOLA_GRAMS;
    }, [moneyTometalGrams]);

    const purchaseDeduction = useMemo(() => {
        return metalValue * (numericDeduction / 100);
    }, [metalValue, numericDeduction]);

    const purchaseTotal = useMemo(() => {
        return metalValue - purchaseDeduction;
    }, [metalValue, purchaseDeduction]);

    const formatMoney = (value: number) => {
        if (!Number.isFinite(value)) {
            return 'Rs. 0';
        }

        return `Rs. ${Math.round(value).toLocaleString('en-PK')}`;
    };

    const formatRate = (value: number) => {
        if (!Number.isFinite(value)) {
            return 'Rs. 0.00';
        }

        return `Rs. ${value.toLocaleString('en-PK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatNumber = (value: number, decimals = 3) => {
        if (!Number.isFinite(value)) {
            return '0';
        }

        return value.toFixed(decimals);
    };

    const resetFields = () => {
        setWeight('');
        setMoney('');
        setMakingPercent('');
        setWastagePercent('');
        setExtraCharges('');
        setDeductionPercent('');
        setSelectedKarat(24);
    };

    const openMode = (newMode: CalculatorMode) => {
        resetFields();
        setMode(newMode);
    };

    const goBack = () => {
        if (mode === 'menu') {
            navigation.goBack();
        } else {
            resetFields();
            setMode('menu');
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={goBack}
                activeOpacity={0.7}
            >
                <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>
                    JEWELLER CALCULATOR
                </Text>

                <Text style={styles.headerSubtitle}>
                    Professional GoldKing Tool
                </Text>
            </View>

            <View style={styles.metalSwitchContainer}>
                <Text
                    style={[
                        styles.metalLabel,
                        metal === 'gold' && styles.metalLabelActive,
                    ]}
                >
                    GOLD
                </Text>

                <Switch
                    value={metal === 'silver'}
                    onValueChange={value =>
                        setMetal(value ? 'silver' : 'gold')
                    }
                    trackColor={{
                        false: '#3A321D',
                        true: '#3A321D',
                    }}
                    thumbColor="#D4AF37"
                    ios_backgroundColor="#3A321D"
                />

                <Text
                    style={[
                        styles.metalLabel,
                        metal === 'silver' && styles.metalLabelActive,
                    ]}
                >
                    SILVER
                </Text>
            </View>
        </View>
    );

    const renderKaratSelector = () => {
        if (metal === 'silver') {
            return null;
        }

        return (
            <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>GOLD PURITY</Text>

                <View style={styles.karatRow}>
                    {KARATS.map(karat => (
                        <TouchableOpacity
                            key={karat.value}
                            style={[
                                styles.karatButton,
                                selectedKarat === karat.value &&
                                    styles.karatButtonActive,
                            ]}
                            onPress={() =>
                                setSelectedKarat(karat.value)
                            }
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.karatText,
                                    selectedKarat === karat.value &&
                                        styles.karatTextActive,
                                ]}
                            >
                                {karat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const renderInput = (
        label: string,
        value: string,
        setter: (value: string) => void,
        placeholder: string,
        suffix?: string,
    ) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>

            <View style={styles.inputWrapper}>
                <TextInput
                    value={value}
                    onChangeText={setter}
                    placeholder={placeholder}
                    placeholderTextColor="#555555"
                    keyboardType="decimal-pad"
                    style={styles.input}
                />

                {suffix ? (
                    <Text style={styles.inputSuffix}>{suffix}</Text>
                ) : null}
            </View>
        </View>
    );

    const renderResultRow = (
        label: string,
        value: string,
        highlight = false,
    ) => (
        <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{label}</Text>

            <Text
                style={[
                    styles.resultValue,
                    highlight && styles.resultValueHighlight,
                ]}
            >
                {value}
            </Text>
        </View>
    );

    const renderLiveRateCard = () => (
        <View style={styles.rateCard}>
            {loadingRates ? (
                <View style={styles.rateLoadingContainer}>
                    <ActivityIndicator
                        size="small"
                        color="#D4AF37"
                    />

                    <Text style={styles.rateLoadingText}>
                        Loading live rate...
                    </Text>
                </View>
            ) : (
                <>
                    <View style={styles.rateMain}>
                        <Text style={styles.rateLabel}>
                            {metal === 'gold'
                                ? `${selectedKarat}K GOLD RATE`
                                : 'STANDARD SILVER RATE'}
                        </Text>

                        <Text style={styles.rateValue}>
                            {selectedRate
                                ? formatMoney(ratePerTola)
                                : 'Rate unavailable'}
                        </Text>

                        <Text style={styles.rateUnit}>
                            {metal === 'gold'
                                ? `${selectedKarat}K Gold / Tola`
                                : '999 Silver / Tola'}
                        </Text>
                    </View>

                    <View style={styles.rateStatus}>
                        <View
                            style={[
                                styles.statusDot,
                                !selectedRate &&
                                    styles.statusDotError,
                            ]}
                        />

                        <Text
                            style={[
                                styles.statusText,
                                !selectedRate &&
                                    styles.statusTextError,
                            ]}
                        >
                            {selectedRate ? 'LIVE RATE' : 'NO RATE'}
                        </Text>
                    </View>
                </>
            )}
        </View>
    );

    const renderRateInfo = () => (
        <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>
                {metal === 'gold'
                    ? `RATE FOR ${selectedKarat}K`
                    : 'RATE FOR 999 SILVER'}
            </Text>

            <Text style={styles.infoValue}>
                {formatMoney(ratePerTola)} / Tola
            </Text>

            <Text style={styles.infoSubValue}>
                {formatRate(ratePerGram)} / Gram
            </Text>
        </View>
    );

    const renderMenu = () => {
        const calculatorModes = [
            {
                title:
                    metal === 'gold'
                        ? 'Gold → Money'
                        : 'Silver → Money',
                description:
                    metal === 'gold'
                        ? 'Gold weight ko current live rate ke mutabiq money mein calculate karein.'
                        : 'Silver weight ko current live rate ke mutabiq money mein calculate karein.',
                icon: 'G',
                target: 'goldToMoney' as CalculatorMode,
            },
            {
                title:
                    metal === 'gold'
                        ? 'Money → Gold'
                        : 'Money → Silver',
                description:
                    metal === 'gold'
                        ? 'Available money se kitna gold purchase ho sakta hai calculate karein.'
                        : 'Available money se kitna silver purchase ho sakta hai calculate karein.',
                icon: 'M',
                target: 'moneyToGold' as CalculatorMode,
            },
            {
                title:
                    metal === 'gold'
                        ? 'Jewellery Price'
                        : 'Jewellery Price (Silver)',
                description:
                    metal === 'gold'
                        ? 'Gold + making charges + wastage ke sath final jewellery price.'
                        : 'Silver + making charges + wastage ke sath final jewellery price.',
                icon: 'J',
                target: 'jewelleryPrice' as CalculatorMode,
            },
            {
                title:
                    metal === 'gold'
                        ? 'Gold Purchase'
                        : 'Silver Purchase',
                description:
                    metal === 'gold'
                        ? 'Customer purchase ka complete gold calculation prepare karein.'
                        : 'Customer purchase ka complete silver calculation prepare karein.',
                icon: 'P',
                target: 'goldPurchase' as CalculatorMode,
            },
        ];

        return (
            <>
                <View style={styles.introSection}>
                    <View style={styles.calculatorIcon}>
                        <Text style={styles.calculatorIconText}>
                            🧮
                        </Text>
                    </View>

                    <View style={styles.introTextContainer}>
                        <Text style={styles.introTitle}>
                            Jeweller Calculator
                        </Text>

                        <Text style={styles.introDescription}>
                            Fast and accurate calculations for everyday
                            jewellery business operations.
                        </Text>
                    </View>
                </View>

                {renderLiveRateCard()}

                {ratesError ? (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorText}>
                            {ratesError}
                        </Text>

                        <TouchableOpacity
                            onPress={fetchMetalRates}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retryText}>
                                TAP TO RETRY
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Calculate
                    </Text>

                    <Text style={styles.sectionSubtitle}>
                        Select a calculation type
                    </Text>
                </View>

                {calculatorModes.map(item => (
                    <TouchableOpacity
                        key={item.title}
                        style={styles.modeCard}
                        activeOpacity={0.75}
                        onPress={() => openMode(item.target)}
                    >
                        <View style={styles.modeIcon}>
                            <Text style={styles.modeIconText}>
                                {item.icon}
                            </Text>
                        </View>

                        <View style={styles.modeInfo}>
                            <Text style={styles.modeTitle}>
                                {item.title}
                            </Text>

                            <Text style={styles.modeDescription}>
                                {item.description}
                            </Text>
                        </View>

                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                ))}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Recent Calculations
                    </Text>

                    <Text style={styles.sectionSubtitle}>
                        Your latest calculations will appear here.
                    </Text>
                </View>

                <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>∑</Text>

                    <Text style={styles.emptyTitle}>
                        No calculations yet
                    </Text>

                    <Text style={styles.emptyText}>
                        Start a calculation above and your recent
                        calculations will appear here.
                    </Text>
                </View>
            </>
        );
    };

    const renderGoldToMoney = () => (
        <>
            <View style={styles.toolIntro}>
                <Text style={styles.toolTitle}>
                    {metal === 'gold'
                        ? 'Gold → Money'
                        : 'Silver → Money'}
                </Text>

                <Text style={styles.toolDescription}>
                    {metal === 'gold'
                        ? 'Gold weight ki live market value calculate karein.'
                        : 'Silver weight ki live market value calculate karein.'}
                </Text>
            </View>

            {renderKaratSelector()}

            {renderInput(
                metal === 'gold'
                    ? 'GOLD WEIGHT'
                    : 'SILVER WEIGHT',
                weight,
                setWeight,
                metal === 'gold' ? 'e.g. 2.5' : 'e.g. 10',
                'Tola',
            )}

            {renderRateInfo()}

            <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                    CALCULATION RESULT
                </Text>

                {renderResultRow(
                    metal === 'gold'
                        ? 'Gold Weight'
                        : 'Silver Weight',
                    `${formatNumber(numericWeight)} Tola`,
                )}

                {renderResultRow(
                    metal === 'gold'
                        ? 'Gold Weight'
                        : 'Silver Weight',
                    `${formatNumber(
                        numericWeight * TOLA_GRAMS,
                    )} Gram`,
                )}

                {metal === 'gold'
                    ? renderResultRow(
                          'Purity',
                          `${selectedKarat}K`,
                      )
                    : renderResultRow('Purity', '999')}

                {renderResultRow(
                    metal === 'gold'
                        ? 'Gold Value'
                        : 'Silver Value',
                    formatMoney(metalValue),
                    true,
                )}
            </View>
        </>
    );

    const renderMoneyToGold = () => (
        <>
            <View style={styles.toolIntro}>
                <Text style={styles.toolTitle}>
                    {metal === 'gold'
                        ? 'Money → Gold'
                        : 'Money → Silver'}
                </Text>

                <Text style={styles.toolDescription}>
                    {metal === 'gold'
                        ? 'Available budget ke against gold quantity calculate karein.'
                        : 'Available budget ke against silver quantity calculate karein.'}
                </Text>
            </View>

            {renderKaratSelector()}

            {renderInput(
                'AVAILABLE MONEY',
                money,
                setMoney,
                'e.g. 250000',
                'Rs.',
            )}

            {renderRateInfo()}

            <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                    {metal === 'gold'
                        ? 'GOLD YOU CAN BUY'
                        : 'SILVER YOU CAN BUY'}
                </Text>

                {renderResultRow(
                    'Available Money',
                    formatMoney(numericMoney),
                )}

                {renderResultRow(
                    metal === 'gold'
                        ? 'Gold Weight'
                        : 'Silver Weight',
                    `${formatNumber(
                        moneyTometalGrams,
                    )} Gram`,
                    true,
                )}

                {renderResultRow(
                    metal === 'gold'
                        ? 'Gold Weight'
                        : 'Silver Weight',
                    `${formatNumber(
                        moneyTometalTola,
                    )} Tola`,
                    true,
                )}

                {metal === 'gold'
                    ? renderResultRow(
                          'Purity',
                          `${selectedKarat}K`,
                      )
                    : renderResultRow('Purity', '999')}
            </View>
        </>
    );

    const renderJewelleryPrice = () => (
        <>
            <View style={styles.toolIntro}>
                <Text style={styles.toolTitle}>
                    {metal === 'gold'
                        ? 'Jewellery Price'
                        : 'Jewellery Price (Silver)'}
                </Text>

                <Text style={styles.toolDescription}>
                    {metal === 'gold'
                        ? 'Gold, making, wastage aur additional charges ke sath final price calculate karein.'
                        : 'Silver, making, wastage aur additional charges ke sath final price calculate karein.'}
                </Text>
            </View>

            {renderKaratSelector()}

            {renderInput(
                metal === 'gold'
                    ? 'GOLD WEIGHT'
                    : 'SILVER WEIGHT',
                weight,
                setWeight,
                metal === 'gold' ? 'e.g. 1.5' : 'e.g. 10',
                'Tola',
            )}

            {renderInput(
                'MAKING CHARGES',
                makingPercent,
                setMakingPercent,
                'e.g. 8',
                '%',
            )}

            {renderInput(
                'WASTAGE / KASS',
                wastagePercent,
                setWastagePercent,
                'e.g. 5',
                '%',
            )}

            {renderInput(
                'STONES / OTHER CHARGES',
                extraCharges,
                setExtraCharges,
                'e.g. 5000',
                'Rs.',
            )}

            {renderRateInfo()}

            <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                    JEWELLERY QUOTATION
                </Text>

                {renderResultRow(
                    metal === 'gold'
                        ? 'Gold Value'
                        : 'Silver Value',
                    formatMoney(metalValue),
                )}

                {renderResultRow(
                    'Making Charges',
                    formatMoney(makingValue),
                )}

                {renderResultRow(
                    'Wastage Weight',
                    `${formatNumber(
                        wastageWeight,
                    )} Gram`,
                )}

                {renderResultRow(
                    'Wastage Value',
                    formatMoney(wastageValue),
                )}

                {renderResultRow(
                    'Other Charges',
                    formatMoney(numericExtra),
                )}

                <View style={styles.resultDivider} />

                {renderResultRow(
                    'FINAL PRICE',
                    formatMoney(jewelleryTotal),
                    true,
                )}
            </View>
        </>
    );

    const renderGoldPurchase = () => (
        <>
            <View style={styles.toolIntro}>
                <Text style={styles.toolTitle}>
                    {metal === 'gold'
                        ? 'Gold Purchase'
                        : 'Silver Purchase'}
                </Text>

                <Text style={styles.toolDescription}>
                    {metal === 'gold'
                        ? 'Customer se gold purchase karte waqt deduction ke baad payable amount calculate karein.'
                        : 'Customer se silver purchase karte waqt deduction ke baad payable amount calculate karein.'}
                </Text>
            </View>

            {renderKaratSelector()}

            {renderInput(
                metal === 'gold'
                    ? 'GOLD WEIGHT'
                    : 'SILVER WEIGHT',
                weight,
                setWeight,
                metal === 'gold' ? 'e.g. 2' : 'e.g. 10',
                'Tola',
            )}

            {renderInput(
                'PURCHASE DEDUCTION',
                deductionPercent,
                setDeductionPercent,
                'e.g. 2',
                '%',
            )}

            {renderRateInfo()}

            <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                    PURCHASE RESULT
                </Text>

                {renderResultRow(
                    metal === 'gold'
                        ? 'Gold Weight'
                        : 'Silver Weight',
                    `${formatNumber(
                        numericWeight,
                    )} Tola`,
                )}

                {renderResultRow(
                    metal === 'gold'
                        ? 'Gross Gold Value'
                        : 'Gross Silver Value',
                    formatMoney(metalValue),
                )}

                {renderResultRow(
                    'Deduction',
                    `${numericDeduction}%`,
                )}

                {renderResultRow(
                    'Deduction Amount',
                    formatMoney(purchaseDeduction),
                )}

                <View style={styles.resultDivider} />

                {renderResultRow(
                    'PAYABLE AMOUNT',
                    formatMoney(purchaseTotal),
                    true,
                )}
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {mode === 'menu' && renderMenu()}

                {mode === 'goldToMoney' &&
                    renderGoldToMoney()}

                {mode === 'moneyToGold' &&
                    renderMoneyToGold()}

                {mode === 'jewelleryPrice' &&
                    renderJewelleryPrice()}

                {mode === 'goldPurchase' &&
                    renderGoldPurchase()}

                {mode !== 'menu' && (
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={resetFields}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.resetButtonText}>
                            CLEAR CALCULATION
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },

    header: {
        height: 76,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#292929',
    },

    backButton: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },

    backIcon: {
        color: '#D4AF37',
        fontSize: 38,
        fontWeight: '300',
        lineHeight: 40,
    },

    headerTitleContainer: {
        flex: 1,
        marginLeft: 8,
    },

    headerTitle: {
        color: '#D4AF37',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1.5,
    },

    headerSubtitle: {
        color: '#777777',
        fontSize: 11,
        marginTop: 3,
    },

    metalSwitchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },

    metalLabel: {
        color: '#666666',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    metalLabelActive: {
        color: '#f0e02d',
    },

    content: {
        paddingHorizontal: 18,
        paddingTop: 22,
        paddingBottom: 40,
    },

    introSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 22,
    },

    calculatorIcon: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
    },

    calculatorIconText: {
        fontSize: 27,
    },

    introTextContainer: {
        flex: 1,
        marginLeft: 14,
    },

    introTitle: {
        color: '#FFFFFF',
        fontSize: 21,
        fontWeight: '800',
    },

    introDescription: {
        color: '#777777',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4,
    },

    rateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#D4AF37',
        borderRadius: 16,
        padding: 17,
        marginBottom: 28,
        minHeight: 92,
    },

    rateMain: {
        flex: 1,
    },

    rateLoadingContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },

    rateLoadingText: {
        color: '#888888',
        fontSize: 12,
        marginLeft: 10,
    },

    rateLabel: {
        color: '#888888',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },

    rateValue: {
        color: '#D4AF37',
        fontSize: 24,
        fontWeight: '800',
        marginTop: 5,
    },

    rateUnit: {
        color: '#777777',
        fontSize: 11,
        marginTop: 2,
    },

    rateStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#252015',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
        marginLeft: 10,
    },

    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#95db33',
        marginRight: 6,
    },

    statusDotError: {
        backgroundColor: '#777777',
    },

    statusText: {
        color: '#95db33',
        fontSize: 10,
        fontWeight: '700',
    },

    statusTextError: {
        color: '#888888',
    },

    errorCard: {
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#4A2929',
        borderRadius: 13,
        padding: 13,
        marginTop: -16,
        marginBottom: 20,
    },

    errorText: {
        color: '#AA7777',
        fontSize: 11,
        lineHeight: 17,
    },

    retryText: {
        color: '#D4AF37',
        fontSize: 10,
        fontWeight: '800',
        marginTop: 8,
        letterSpacing: 0.8,
    },

    sectionHeader: {
        marginBottom: 13,
    },

    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },

    sectionSubtitle: {
        color: '#777777',
        fontSize: 12,
        marginTop: 4,
    },

    modeCard: {
        minHeight: 88,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#292929',
        borderRadius: 16,
        paddingHorizontal: 14,
        marginBottom: 12,
    },

    modeIcon: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modeIconText: {
        color: '#111111',
        fontSize: 17,
        fontWeight: '900',
    },

    modeInfo: {
        flex: 1,
        marginLeft: 14,
    },

    modeTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    modeDescription: {
        color: '#777777',
        fontSize: 11,
        lineHeight: 16,
        marginTop: 4,
    },

    arrow: {
        color: '#D4AF37',
        fontSize: 30,
        fontWeight: '300',
        marginLeft: 8,
    },

    emptyCard: {
        alignItems: 'center',
        backgroundColor: '#151515',
        borderWidth: 1,
        borderColor: '#292929',
        borderRadius: 16,
        paddingHorizontal: 25,
        paddingVertical: 30,
        marginTop: 2,
    },

    emptyIcon: {
        color: '#D4AF37',
        fontSize: 30,
        fontWeight: '700',
    },

    emptyTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        marginTop: 10,
    },

    emptyText: {
        color: '#777777',
        fontSize: 11,
        lineHeight: 17,
        textAlign: 'center',
        marginTop: 5,
    },

    toolIntro: {
        marginBottom: 24,
    },

    toolTitle: {
        color: '#FFFFFF',
        fontSize: 23,
        fontWeight: '800',
    },

    toolDescription: {
        color: '#777777',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 5,
    },

    fieldContainer: {
        marginBottom: 18,
    },

    fieldLabel: {
        color: '#999999',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 8,
    },

    inputWrapper: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#292929',
        borderRadius: 13,
        paddingHorizontal: 14,
    },

    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 0,
    },

    inputSuffix: {
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 8,
    },

    karatRow: {
        flexDirection: 'row',
        gap: 8,
    },

    karatButton: {
        flex: 1,
        height: 44,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#292929',
        backgroundColor: '#181818',
        justifyContent: 'center',
        alignItems: 'center',
    },

    karatButtonActive: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },

    karatText: {
        color: '#999999',
        fontSize: 13,
        fontWeight: '800',
    },

    karatTextActive: {
        color: '#111111',
    },

    infoBox: {
        backgroundColor: '#181818',
        borderLeftWidth: 3,
        borderLeftColor: '#D4AF37',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },

    infoLabel: {
        color: '#777777',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },

    infoValue: {
        color: '#D4AF37',
        fontSize: 18,
        fontWeight: '800',
        marginTop: 5,
    },

    infoSubValue: {
        color: '#888888',
        fontSize: 11,
        marginTop: 3,
    },

    resultCard: {
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#D4AF37',
        borderRadius: 16,
        padding: 17,
        marginTop: 4,
    },

    resultTitle: {
        color: '#D4AF37',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 14,
    },

    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 9,
    },

    resultLabel: {
        color: '#888888',
        fontSize: 12,
        flex: 1,
    },

    resultValue: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'right',
    },

    resultValueHighlight: {
        color: '#D4AF37',
        fontSize: 18,
        fontWeight: '900',
    },

    resultDivider: {
        height: 1,
        backgroundColor: '#292929',
        marginVertical: 8,
    },

    resetButton: {
        height: 50,
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 18,
    },

    resetButtonText: {
        color: '#999999',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
});

export default CalculatorScreen;
