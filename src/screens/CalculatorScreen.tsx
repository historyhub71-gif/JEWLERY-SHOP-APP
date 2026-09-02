import React, { useMemo, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type CalculatorMode =
    | 'menu'
    | 'goldToMoney'
    | 'moneyToGold'
    | 'jewelleryPrice'
    | 'goldPurchase';

const TOLA_GRAMS = 11.664;

const KARATS = [
    { label: '24K', value: 24 },
    { label: '22K', value: 22 },
    { label: '21K', value: 21 },
    { label: '18K', value: 18 },
];

const CalculatorScreen = ({ navigation }: any) => {
    const [mode, setMode] = useState<CalculatorMode>('menu');

    const [rate24, setRate24] = useState('');
    const [weight, setWeight] = useState('');
    const [money, setMoney] = useState('');
    const [makingPercent, setMakingPercent] = useState('');
    const [wastagePercent, setWastagePercent] = useState('');
    const [extraCharges, setExtraCharges] = useState('');
    const [deductionPercent, setDeductionPercent] = useState('');

    const [selectedKarat, setSelectedKarat] = useState(24);

    const numericRate24 = Number(rate24) || 0;
    const numericWeight = Number(weight) || 0;
    const numericMoney = Number(money) || 0;
    const numericMaking = Number(makingPercent) || 0;
    const numericWastage = Number(wastagePercent) || 0;
    const numericExtra = Number(extraCharges) || 0;
    const numericDeduction = Number(deductionPercent) || 0;

    const rateForKarat = useMemo(() => {
        return numericRate24 * (selectedKarat / 24);
    }, [numericRate24, selectedKarat]);

    const ratePerGram = useMemo(() => {
        return rateForKarat / TOLA_GRAMS;
    }, [rateForKarat]);

    const goldValue = useMemo(() => {
        return numericWeight / TOLA_GRAMS * rateForKarat;
    }, [numericWeight, rateForKarat]);

    const makingValue = useMemo(() => {
        return goldValue * (numericMaking / 100);
    }, [goldValue, numericMaking]);

    const wastageWeight = useMemo(() => {
        return numericWeight * (numericWastage / 100);
    }, [numericWeight, numericWastage]);

    const wastageValue = useMemo(() => {
        return wastageWeight * ratePerGram;
    }, [wastageWeight, ratePerGram]);

    const jewelleryTotal = useMemo(() => {
        return goldValue + makingValue + wastageValue + numericExtra;
    }, [goldValue, makingValue, wastageValue, numericExtra]);

    const moneyToGoldGrams = useMemo(() => {
        if (ratePerGram <= 0) {
            return 0;
        }

        return numericMoney / ratePerGram;
    }, [numericMoney, ratePerGram]);

    const moneyToGoldTola = useMemo(() => {
        return moneyToGoldGrams / TOLA_GRAMS;
    }, [moneyToGoldGrams]);

    const purchaseDeduction = useMemo(() => {
        return goldValue * (numericDeduction / 100);
    }, [goldValue, numericDeduction]);

    const purchaseTotal = useMemo(() => {
        return goldValue - purchaseDeduction;
    }, [goldValue, purchaseDeduction]);

    const formatMoney = (value: number) => {
        if (!Number.isFinite(value)) {
            return 'Rs. 0';
        }

        return `Rs. ${Math.round(value).toLocaleString('en-PK')}`;
    };

    const formatNumber = (value: number, decimals = 3) => {
        if (!Number.isFinite(value)) {
            return '0';
        }

        return value.toFixed(decimals);
    };

    const resetFields = () => {
        setRate24('');
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

            <View style={styles.headerRight} />
        </View>
    );

    const renderKaratSelector = () => (
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
                        onPress={() => setSelectedKarat(karat.value)}
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
                    <Text style={styles.inputSuffix}>
                        {suffix}
                    </Text>
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

    const renderMenu = () => {
        const calculatorModes = [
            {
                title: 'Gold → Money',
                description:
                    'Gold weight ko current rate ke mutabiq money mein calculate karein.',
                icon: 'G',
                target: 'goldToMoney' as CalculatorMode,
            },
            {
                title: 'Money → Gold',
                description:
                    'Available money se kitna gold purchase ho sakta hai calculate karein.',
                icon: 'M',
                target: 'moneyToGold' as CalculatorMode,
            },
            {
                title: 'Jewellery Price',
                description:
                    'Gold + making charges + wastage ke sath final jewellery price.',
                icon: 'J',
                target: 'jewelleryPrice' as CalculatorMode,
            },
            {
                title: 'Gold Purchase',
                description:
                    'Customer purchase ka complete gold calculation prepare karein.',
                icon: 'P',
                target: 'goldPurchase' as CalculatorMode,
            },
        ];

        return (
            <>
                <View style={styles.introSection}>
                    <View style={styles.calculatorIcon}>
                        <Text style={styles.calculatorIconText}>🧮</Text>
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

                <View style={styles.rateCard}>
                    <View>
                        <Text style={styles.rateLabel}>
                            STANDARD GOLD RATE
                        </Text>

                        <Text style={styles.rateValue}>
                            {rate24
                                ? formatMoney(numericRate24)
                                : 'Rs. XXXXX'}
                        </Text>

                        <Text style={styles.rateUnit}>
                            24K Gold / Tola
                        </Text>
                    </View>

                    <View style={styles.rateStatus}>
                        <View style={styles.statusDot} />

                        <Text style={styles.statusText}>
                            Manual Rate
                        </Text>
                    </View>
                </View>

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
                <Text style={styles.toolTitle}>Gold → Money</Text>
                <Text style={styles.toolDescription}>
                    Gold weight ki market value calculate karein.
                </Text>
            </View>

            {renderInput(
                '24K GOLD RATE / TOLA',
                rate24,
                setRate24,
                'e.g. 500000',
                'Rs.',
            )}

            {renderKaratSelector()}

            {renderInput(
                'GOLD WEIGHT',
                weight,
                setWeight,
                'e.g. 2.5',
                'Tola',
            )}

            <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>
                    RATE FOR {selectedKarat}K
                </Text>

                <Text style={styles.infoValue}>
                    {formatMoney(rateForKarat)} / Tola
                </Text>

                <Text style={styles.infoSubValue}>
                    {formatMoney(ratePerGram)} / Gram
                </Text>
            </View>

            <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                    CALCULATION RESULT
                </Text>

                {renderResultRow(
                    'Gold Weight',
                    `${formatNumber(numericWeight)} Tola`,
                )}

                {renderResultRow(
                    'Gold Weight',
                    `${formatNumber(numericWeight * TOLA_GRAMS)} Gram`,
                )}

                {renderResultRow(
                    'Purity',
                    `${selectedKarat}K`,
                )}

                {renderResultRow(
                    'Gold Value',
                    formatMoney(goldValue),
                    true,
                )}
            </View>
        </>
    );

    const renderMoneyToGold = () => (
        <>
            <View style={styles.toolIntro}>
                <Text style={styles.toolTitle}>Money → Gold</Text>
                <Text style={styles.toolDescription}>
                    Available budget ke against gold quantity calculate karein.
                </Text>
            </View>

            {renderInput(
                '24K GOLD RATE / TOLA',
                rate24,
                setRate24,
                'e.g. 500000',
                'Rs.',
            )}

            {renderKaratSelector()}

            {renderInput(
                'AVAILABLE MONEY',
                money,
                setMoney,
                'e.g. 250000',
                'Rs.',
            )}

            <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>
                    RATE FOR {selectedKarat}K
                </Text>

                <Text style={styles.infoValue}>
                    {formatMoney(rateForKarat)} / Tola
                </Text>

                <Text style={styles.infoSubValue}>
                    {formatMoney(ratePerGram)} / Gram
                </Text>
            </View>

            <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                    GOLD YOU CAN BUY
                </Text>

                {renderResultRow(
                    'Available Money',
                    formatMoney(numericMoney),
                )}

                {renderResultRow(
                    'Gold Weight',
                    `${formatNumber(moneyToGoldGrams)} Gram`,
                    true,
                )}

                {renderResultRow(
                    'Gold Weight',
                    `${formatNumber(moneyToGoldTola)} Tola`,
                    true,
                )}

                {renderResultRow(
                    'Purity',
                    `${selectedKarat}K`,
                )}
            </View>
        </>
    );

    const renderJewelleryPrice = () => (
        <>
            <View style={styles.toolIntro}>
                <Text style={styles.toolTitle}>Jewellery Price</Text>
                <Text style={styles.toolDescription}>
                    Gold, making, wastage aur additional charges ke sath final
                    price calculate karein.
                </Text>
            </View>

            {renderInput(
                '24K GOLD RATE / TOLA',
                rate24,
                setRate24,
                'e.g. 500000',
                'Rs.',
            )}

            {renderKaratSelector()}

            {renderInput(
                'GOLD WEIGHT',
                weight,
                setWeight,
                'e.g. 1.5',
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

            <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                    JEWELLERY QUOTATION
                </Text>

                {renderResultRow(
                    'Gold Value',
                    formatMoney(goldValue),
                )}

                {renderResultRow(
                    'Making Charges',
                    formatMoney(makingValue),
                )}

                {renderResultRow(
                    'Wastage Weight',
                    `${formatNumber(wastageWeight)} Gram`,
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
                <Text style={styles.toolTitle}>Gold Purchase</Text>
                <Text style={styles.toolDescription}>
                    Customer se gold purchase karte waqt deduction ke baad
                    payable amount calculate karein.
                </Text>
            </View>

            {renderInput(
                '24K GOLD RATE / TOLA',
                rate24,
                setRate24,
                'e.g. 500000',
                'Rs.',
            )}

            {renderKaratSelector()}

            {renderInput(
                'GOLD WEIGHT',
                weight,
                setWeight,
                'e.g. 2',
                'Tola',
            )}

            {renderInput(
                'PURCHASE DEDUCTION',
                deductionPercent,
                setDeductionPercent,
                'e.g. 2',
                '%',
            )}

            <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                    PURCHASE RESULT
                </Text>

                {renderResultRow(
                    'Gold Weight',
                    `${formatNumber(numericWeight)} Tola`,
                )}

                {renderResultRow(
                    'Gross Gold Value',
                    formatMoney(goldValue),
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

                {mode === 'goldToMoney' && renderGoldToMoney()}

                {mode === 'moneyToGold' && renderMoneyToGold()}

                {mode === 'jewelleryPrice' && renderJewelleryPrice()}

                {mode === 'goldPurchase' && renderGoldPurchase()}

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

    headerRight: {
        width: 45,
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
    },

    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#D4AF37',
        marginRight: 6,
    },

    statusText: {
        color: '#D4AF37',
        fontSize: 10,
        fontWeight: '700',
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