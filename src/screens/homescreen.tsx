import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const HomeScreen = ({ navigation }: any) => {
    const [selectedKarat, setSelectedKarat] = useState('24K');
    const [goldUnit, setGoldUnit] = useState('Tola');
    const [silverUnit, setSilverUnit] = useState('Tola');

    // Temporary rates
    // API connect hone ke baad ye values API se aayengi.
    const goldRates: any = {
        '24K': {
            tola: '520,000',
            gram: '44,585',
        },
        '22K': {
            tola: '476,667',
            gram: '40,857',
        },
        '21K': {
            tola: '455,000',
            gram: '39,000',
        },
        '18K': {
            tola: '390,000',
            gram: '33,429',
        },
    };

    const silverRates: any = {
        tola: '6,200',
        gram: '531',
    };

    const selectedGoldRate =
        goldUnit === 'Tola'
            ? goldRates[selectedKarat].tola
            : goldRates[selectedKarat].gram;

    const selectedSilverRate =
        silverUnit === 'Tola'
            ? silverRates.tola
            : silverRates.gram;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => navigation.openDrawer()}
                >
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>GOLD KING</Text>

                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcome}>Welcome to</Text>

                    <Text style={styles.title}>GOLD KING</Text>

                    <Text style={styles.subtitle}>
                        Jewellery & Gold
                    </Text>
                </View>

                {/* GOLD RATES */}
                <View style={styles.rateCard}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.cardTitle}>GOLD RATES</Text>
                            <Text style={styles.cardSubtitle}>
                                Select gold purity
                            </Text>
                        </View>

                        
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.karatContainer}
                    >
                        {['24K', '22K', '21K', '18K'].map(karat => (
                            <TouchableOpacity
                                key={karat}
                                style={[
                                    styles.karatButton,
                                    selectedKarat === karat &&
                                        styles.selectedKaratButton,
                                ]}
                                onPress={() => setSelectedKarat(karat)}
                            >
                                <Text
                                    style={[
                                        styles.karatText,
                                        selectedKarat === karat &&
                                            styles.selectedKaratText,
                                    ]}
                                >
                                    {karat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.selectedInfo}>
                        <Text style={styles.selectedLabel}>
                            {selectedKarat} GOLD
                        </Text>

                        <Text style={styles.rateValue}>
                            Rs. {selectedGoldRate}
                        </Text>

                        <Text style={styles.unitLabel}>
                            Per {goldUnit}
                        </Text>
                    </View>

                    <View style={styles.unitSelector}>
                        <TouchableOpacity
                            style={[
                                styles.unitButton,
                                goldUnit === 'Tola' &&
                                    styles.selectedUnitButton,
                            ]}
                            onPress={() => setGoldUnit('Tola')}
                        >
                            <Text
                                style={[
                                    styles.unitText,
                                    goldUnit === 'Tola' &&
                                        styles.selectedUnitText,
                                ]}
                            >
                                PER TOLA
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.unitButton,
                                goldUnit === 'Gram' &&
                                    styles.selectedUnitButton,
                            ]}
                            onPress={() => setGoldUnit('Gram')}
                        >
                            <Text
                                style={[
                                    styles.unitText,
                                    goldUnit === 'Gram' &&
                                        styles.selectedUnitText,
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
                            <Text style={styles.cardSubtitle}>
                                Current silver price
                            </Text>
                        </View>


                    </View>

                    <View style={styles.selectedInfo}>
                        <Text style={styles.selectedLabel}>
                            SILVER
                        </Text>

                        <Text style={styles.rateValue}>
                            Rs. {selectedSilverRate}
                        </Text>

                        <Text style={styles.unitLabel}>
                            Per {silverUnit}
                        </Text>
                    </View>

                    <View style={styles.unitSelector}>
                        <TouchableOpacity
                            style={[
                                styles.unitButton,
                                silverUnit === 'Tola' &&
                                    styles.selectedUnitButton,
                            ]}
                            onPress={() => setSilverUnit('Tola')}
                        >
                            <Text
                                style={[
                                    styles.unitText,
                                    silverUnit === 'Tola' &&
                                        styles.selectedUnitText,
                                ]}
                            >
                                PER TOLA
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.unitButton,
                                silverUnit === 'Gram' &&
                                    styles.selectedUnitButton,
                            ]}
                            onPress={() => setSilverUnit('Gram')}
                        >
                            <Text
                                style={[
                                    styles.unitText,
                                    silverUnit === 'Gram' &&
                                        styles.selectedUnitText,
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

                        <View style={styles.liveDot} />
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Gold</Text>

                        <Text style={styles.infoValue}>
                            {selectedKarat} • Per {goldUnit}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Silver</Text>

                        <Text style={styles.infoValue}>
                            Per {silverUnit}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.updateText}>
                        Rates will be updated automatically when live API is connected.
                    </Text>
                </View>

                <Text style={styles.footerText}>
                    GOLD KING • Jewellery & Gold
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },

    header: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#292929',
    },

    menuButton: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },

    menuIcon: {
        fontSize: 30,
        color: '#D4AF37',
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: '#D4AF37',
    },

    headerRight: {
        width: 45,
    },

    scrollView: {
        flex: 1,
    },

    content: {
        paddingHorizontal: 18,
        paddingTop: 25,
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


    
    silverIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#C0C0C0',
        justifyContent: 'center',
        alignItems: 'center',
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

    footerText: {
        color: '#555555',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 5,
        letterSpacing: 1,
    },
});

export default HomeScreen;