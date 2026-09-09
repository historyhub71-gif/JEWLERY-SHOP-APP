import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Activity,
    ArrowRight,
    Calculator,
    CheckCircle2,
    Gem,
    ShieldCheck,
    Users,
    XCircle,
} from 'lucide-react-native';
import ScreenHeader from '../components/ScreenHeader';
import SectionHeader from '../components/SectionHeader';
import { colors, commonStyles, radii, spacing } from '../../theme';
import { supabase } from '../../lib/supabase';

type TestStepStatus = 'pending' | 'running' | 'passed' | 'failed';

type TestStep = {
    label: string;
    status: TestStepStatus;
    detail?: string;
};

const INITIAL_STEPS: TestStep[] = [
    { label: 'Admin authentication', status: 'pending' },
    { label: 'Live market access', status: 'pending' },
    { label: 'Published rates access', status: 'pending' },
    { label: 'Create / update rate PIN', status: 'pending' },
    { label: 'Save Gold draft', status: 'pending' },
    { label: 'Read Gold draft', status: 'pending' },
    { label: 'Reject wrong PIN', status: 'pending' },
    { label: 'Publish Gold rate', status: 'pending' },
    { label: 'Read published Gold rate', status: 'pending' },
    { label: 'Read audit history', status: 'pending' },
];

const AdminDashboardScreen = ({ navigation }: any) => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [pin, setPin] = useState('2580');
    const [steps, setSteps] = useState<TestStep[]>(INITIAL_STEPS);
    const [testFinished, setTestFinished] = useState(false);

    const updateStep = (
        index: number,
        status: TestStepStatus,
        detail?: string,
    ) => {
        setSteps((current) =>
            current.map((step, stepIndex) =>
                stepIndex === index
                    ? {
                          ...step,
                          status,
                          detail,
                      }
                    : step,
            ),
        );
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

                return JSON.stringify(body);
            }

            if (error.context?.text) {
                const text = await error.context.text();

                if (text) {
                    return text;
                }
            }
        } catch {
            // Ignore response parsing failure and use error.message below.
        }

        return error.message || fallback;
    };

    const verifyShopRatesOverall = async () => {
        if (isVerifying) {
            return;
        }

        const cleanPin = pin.trim();

        if (!/^\d{4,6}$/.test(cleanPin)) {
            Alert.alert(
                'Invalid Test PIN',
                'PIN must contain 4 to 6 digits.',
            );
            return;
        }

        setIsVerifying(true);
        setTestFinished(false);
        setSteps(INITIAL_STEPS);

        try {
            console.log('======================================');
            console.log('SHOP RATES FULL VERIFICATION START');
            console.log('======================================');

            // ---------------------------------------------------------
            // STEP 1: AUTHENTICATION
            // ---------------------------------------------------------
            updateStep(0, 'running');

            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                throw new Error(
                    `Authentication check failed: ${sessionError.message}`,
                );
            }

            if (!session) {
                throw new Error('No active Admin session found.');
            }

            console.log('1. Authentication: OK');

            updateStep(0, 'passed', 'Active Supabase session found.');

            // ---------------------------------------------------------
            // STEP 2: LIVE MARKET
            // ---------------------------------------------------------
            updateStep(1, 'running');

            const {
                data: marketData,
                error: marketError,
            } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'get_live_market',
                },
            });

            if (marketError) {
                const message = await getFunctionError(
                    marketError,
                    'Live market request failed.',
                );

                throw new Error(`Live market test failed: ${message}`);
            }

            if (!marketData?.success) {
                throw new Error(
                    marketData?.error ||
                        'Live market test returned an unsuccessful response.',
                );
            }

            const marketCount = Array.isArray(marketData.quotes)
                ? marketData.quotes.length
                : 0;

            console.log('2. Live market: OK');
            console.log('Market response:', marketData);

            updateStep(
                1,
                'passed',
                `${marketCount} market quotes returned.`,
            );

            // ---------------------------------------------------------
            // STEP 3: CURRENT PUBLISHED RATES
            // ---------------------------------------------------------
            updateStep(2, 'running');

            const {
                data: publishedBeforeData,
                error: publishedBeforeError,
            } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'get_published',
                },
            });

            if (publishedBeforeError) {
                const message = await getFunctionError(
                    publishedBeforeError,
                    'Published rates request failed.',
                );

                throw new Error(
                    `Published rates test failed: ${message}`,
                );
            }

            if (!publishedBeforeData?.success) {
                throw new Error(
                    publishedBeforeData?.error ||
                        'Published rates request returned an unsuccessful response.',
                );
            }

            const publishedBeforeCount = Array.isArray(
                publishedBeforeData.rates,
            )
                ? publishedBeforeData.rates.length
                : 0;

            console.log(
                '3. Published rates access: OK',
                publishedBeforeData,
            );

            updateStep(
                2,
                'passed',
                `${publishedBeforeCount} currently published rate(s).`,
            );

            // ---------------------------------------------------------
            // STEP 4: SET PIN
            // ---------------------------------------------------------
            updateStep(3, 'running');

            const {
                data: pinData,
                error: pinError,
            } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'set_pin',
                    pin: cleanPin,
                },
            });

            if (pinError) {
                const message = await getFunctionError(
                    pinError,
                    'PIN setup failed.',
                );

                throw new Error(
                    `PIN setup failed: ${message}`,
                );
            }

            if (!pinData?.success) {
                throw new Error(
                    pinData?.error ||
                        'PIN setup returned an unsuccessful response.',
                );
            }

            console.log('4. PIN: OK');
            console.log('PIN response:', pinData);

            updateStep(
                3,
                'passed',
                'Rate PIN created/updated successfully.',
            );

            // ---------------------------------------------------------
            // STEP 5: GET CURRENT 24K GOLD LIVE RATE
            //
            // We use the existing authenticated read access to metal_rates.
            // No fake/hardcoded Gold rate is used.
            // ---------------------------------------------------------
            const {
                data: liveGoldData,
                error: liveGoldError,
            } = await supabase
                .from('metal_rates')
                .select('rate_per_tola')
                .eq('metal', 'gold')
                .eq('purity', 24)
                .maybeSingle();

            if (liveGoldError) {
                throw new Error(
                    `Live Gold rate lookup failed: ${liveGoldError.message}`,
                );
            }

            const liveGoldRate = Number(
                liveGoldData?.rate_per_tola,
            );

            if (
                !Number.isFinite(liveGoldRate) ||
                liveGoldRate <= 0
            ) {
                throw new Error(
                    'Current 24K Gold tola rate is unavailable or invalid.',
                );
            }

            const testBuyRate = Math.max(
                0,
                Math.round(liveGoldRate - 1000),
            );

            console.log('Current 24K Gold rate:', liveGoldRate);
            console.log('Test buy rate:', testBuyRate);

            // ---------------------------------------------------------
            // STEP 6: SAVE GOLD DRAFT
            // ---------------------------------------------------------
            updateStep(4, 'running');

            const {
                data: draftData,
                error: draftError,
            } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'save_draft',
                    metal: 'gold',
                    unit: 'tola',
                    mode: 'follow_live',
                    offset_amount: null,
                    fixed_rate: null,
                    buy_rate: testBuyRate,
                    enabled: true,
                },
            });

            if (draftError) {
                const message = await getFunctionError(
                    draftError,
                    'Draft save failed.',
                );

                throw new Error(
                    `Save draft failed: ${message}`,
                );
            }

            if (!draftData?.success || !draftData?.draft) {
                throw new Error(
                    draftData?.error ||
                        'Draft save returned no draft.',
                );
            }

            console.log('5. Save draft: OK');
            console.log('Draft:', draftData.draft);

            updateStep(
                4,
                'passed',
                `Gold draft saved at ${liveGoldRate.toLocaleString()} / tola.`,
            );

            // ---------------------------------------------------------
            // STEP 7: READ GOLD DRAFT
            // ---------------------------------------------------------
            updateStep(5, 'running');

            const {
                data: readDraftData,
                error: readDraftError,
            } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'get_draft',
                    metal: 'gold',
                },
            });

            if (readDraftError) {
                const message = await getFunctionError(
                    readDraftError,
                    'Draft read failed.',
                );

                throw new Error(
                    `Read draft failed: ${message}`,
                );
            }

            if (
                !readDraftData?.success ||
                !readDraftData?.draft
            ) {
                throw new Error(
                    readDraftData?.error ||
                        'Saved Gold draft could not be read back.',
                );
            }

            console.log('6. Read draft: OK');
            console.log('Read draft:', readDraftData.draft);

            updateStep(
                5,
                'passed',
                'Saved Gold draft was read back successfully.',
            );

            // ---------------------------------------------------------
            // STEP 8: WRONG PIN MUST FAIL
            // ---------------------------------------------------------
            updateStep(6, 'running');

            const wrongPin =
                cleanPin === '9999'
                    ? '8888'
                    : '9999';

            const {
                data: wrongPinData,
                error: wrongPinError,
            } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'publish',
                    metal: 'gold',
                    pin: wrongPin,
                },
            });

            if (!wrongPinError && wrongPinData?.success) {
                throw new Error(
                    'SECURITY TEST FAILED: Wrong PIN was accepted.',
                );
            }

            console.log(
                '7. Wrong PIN correctly rejected:',
                wrongPinError?.message,
            );

            updateStep(
                6,
                'passed',
                'Wrong PIN was rejected as expected.',
            );

            // ---------------------------------------------------------
            // STEP 9: CORRECT PIN PUBLISH
            // ---------------------------------------------------------
            updateStep(7, 'running');

            const {
                data: publishData,
                error: publishError,
            } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'publish',
                    metal: 'gold',
                    pin: cleanPin,
                },
            });

            if (publishError) {
                const message = await getFunctionError(
                    publishError,
                    'Publish failed.',
                );

                throw new Error(
                    `Publish failed: ${message}`,
                );
            }

            if (!publishData?.success) {
                throw new Error(
                    publishData?.error ||
                        'Publish returned an unsuccessful response.',
                );
            }

            console.log('8. Publish: OK');
            console.log('Published rate:', publishData.rate);

            updateStep(
                7,
                'passed',
                'Gold shop rate published successfully.',
            );

            // ---------------------------------------------------------
            // STEP 10: READ PUBLISHED GOLD RATE
            // ---------------------------------------------------------
            updateStep(8, 'running');

            const {
                data: publishedAfterData,
                error: publishedAfterError,
            } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'get_published',
                },
            });

            if (publishedAfterError) {
                const message = await getFunctionError(
                    publishedAfterError,
                    'Published rate read failed.',
                );

                throw new Error(
                    `Read published rate failed: ${message}`,
                );
            }

            if (
                !publishedAfterData?.success ||
                !Array.isArray(publishedAfterData.rates)
            ) {
                throw new Error(
                    publishedAfterData?.error ||
                        'Published rates response is invalid.',
                );
            }

            const goldPublished = publishedAfterData.rates.find(
                (rate: any) => rate.metal === 'gold',
            );

            if (!goldPublished) {
                throw new Error(
                    'Published Gold rate was not found after publish.',
                );
            }

            console.log(
                '9. Read published Gold rate: OK',
                goldPublished,
            );

            updateStep(
                8,
                'passed',
                `Gold sell rate: ${Number(
                    goldPublished.sell_rate,
                ).toLocaleString()} / ${goldPublished.unit}.`,
            );

            // ---------------------------------------------------------
            // STEP 11: AUDIT
            // ---------------------------------------------------------
            updateStep(9, 'running');

            const {
                data: auditData,
                error: auditError,
            } = await supabase.functions.invoke('shop-rates', {
                body: {
                    action: 'get_audit',
                },
            });

            if (auditError) {
                const message = await getFunctionError(
                    auditError,
                    'Audit lookup failed.',
                );

                throw new Error(
                    `Audit test failed: ${message}`,
                );
            }

            if (
                !auditData?.success ||
                !Array.isArray(auditData.audit)
            ) {
                throw new Error(
                    auditData?.error ||
                        'Audit response is invalid.',
                );
            }

            if (auditData.audit.length === 0) {
                throw new Error(
                    'Publish succeeded but no audit record was found.',
                );
            }

            console.log('10. Audit: OK');
            console.log('Audit:', auditData.audit);

            updateStep(
                9,
                'passed',
                `${auditData.audit.length} audit record(s) found.`,
            );

            setTestFinished(true);

            console.log('======================================');
            console.log('SHOP RATES FULL VERIFICATION PASSED');
            console.log('======================================');

            Alert.alert(
                '🎉 Full Verification Passed',
                [
                    'Authentication: OK',
                    'Live Market: OK',
                    'Published Rates: OK',
                    'PIN: OK',
                    'Draft Save: OK',
                    'Draft Read: OK',
                    'Wrong PIN Rejection: OK',
                    'Publish: OK',
                    'Published Rate Read: OK',
                    'Audit: OK',
                    '',
                    'Slice 2 backend flow is verified.',
                ].join('\n'),
            );
        } catch (error) {
            console.error(
                'SHOP RATES FULL VERIFICATION FAILED:',
                error,
            );

            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown verification error.';

            const failedIndex = steps.findIndex(
                (step) => step.status === 'running',
            );

            if (failedIndex >= 0) {
                updateStep(
                    failedIndex,
                    'failed',
                    message,
                );
            }

            Alert.alert(
                'Backend Verification Failed',
                message,
            );
        } finally {
            setIsVerifying(false);
        }
    };

    const renderStepIcon = (status: TestStepStatus) => {
        if (status === 'running') {
            return (
                <ActivityIndicator
                    color={colors.gold}
                    size="small"
                />
            );
        }

        if (status === 'passed') {
            return (
                <CheckCircle2
                    color="#63D471"
                    size={19}
                />
            );
        }

        if (status === 'failed') {
            return (
                <XCircle
                    color="#FF6B6B"
                    size={19}
                />
            );
        }

        return (
            <View style={styles.pendingDot} />
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="ADMIN DESK"
                subtitle="GoldKing business operations"
                navigation={navigation}
                home
            />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.eyebrow}>
                    GOOD TO SEE YOU
                </Text>

                <Text style={styles.title}>
                    Run the day beautifully.
                </Text>

                <Text style={styles.subtitle}>
                    Keep your rates, calculations, and customer
                    experience close at hand.
                </Text>

                <View style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                        <Gem
                            color={colors.background}
                            size={25}
                        />
                    </View>

                    <View style={styles.featureCopy}>
                        <Text style={styles.featureTitle}>
                            Today at the shop
                        </Text>

                        <Text style={styles.featureText}>
                            Review live-looking rate views and prepare
                            precise jewellery quotations.
                        </Text>
                    </View>
                </View>

                <SectionHeader
                    title="Quick actions"
                    subtitle="Common tools for your counter team"
                />

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() =>
                        navigation.navigate('Home')
                    }
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
                            Gold & silver rates
                        </Text>

                        <Text style={styles.actionText}>
                            Check purity and unit pricing.
                        </Text>
                    </View>

                    <ArrowRight
                        color={colors.textSubtle}
                        size={20}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() =>
                        navigation.navigate('Calculator')
                    }
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
                            Jeweller calculator
                        </Text>

                        <Text style={styles.actionText}>
                            Build accurate customer quotations.
                        </Text>
                    </View>

                    <ArrowRight
                        color={colors.textSubtle}
                        size={20}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() =>
                        navigation.navigate('Profile')
                    }
                    activeOpacity={0.82}
                >
                    <View style={styles.actionIcon}>
                        <Users
                            color={colors.gold}
                            size={21}
                        />
                    </View>

                    <View style={styles.actionCopy}>
                        <Text style={styles.actionTitle}>
                            Your account
                        </Text>

                        <Text style={styles.actionText}>
                            Keep your profile details within reach.
                        </Text>
                    </View>

                    <ArrowRight
                        color={colors.textSubtle}
                        size={20}
                    />
                </TouchableOpacity>

                {/* TEMPORARY FULL BACKEND VERIFICATION */}
                <SectionHeader
                    title="Developer verification"
                    subtitle="Temporary Slice 2 end-to-end backend test"
                />

                <View style={styles.testPanel}>
                    <View style={styles.testHeader}>
                        <View style={styles.testHeaderIcon}>
                            <ShieldCheck
                                color={colors.gold}
                                size={21}
                            />
                        </View>

                        <View style={styles.testHeaderCopy}>
                            <Text style={styles.testTitle}>
                                Shop Rates Full Test
                            </Text>

                            <Text style={styles.testSubtitle}>
                                PIN → Draft → Security → Publish → Audit
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.inputLabel}>
                        Temporary Test PIN
                    </Text>

                    <TextInput
                        value={pin}
                        onChangeText={(value) =>
                            setPin(
                                value.replace(/\D/g, '').slice(0, 6),
                            )
                        }
                        keyboardType="number-pad"
                        maxLength={6}
                        secureTextEntry
                        editable={!isVerifying}
                        placeholder="4-6 digit PIN"
                        placeholderTextColor={colors.textSubtle}
                        style={styles.pinInput}
                    />

                    <Text style={styles.warningText}>
                        This test will create/update the Admin rate PIN,
                        save a Gold draft, publish it, and create an
                        audit record.
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.verifyCard,
                            isVerifying &&
                                styles.verifyCardDisabled,
                        ]}
                        onPress={verifyShopRatesOverall}
                        activeOpacity={0.82}
                        disabled={isVerifying}
                    >
                        <View style={styles.verifyIcon}>
                            {isVerifying ? (
                                <ActivityIndicator
                                    color={colors.gold}
                                    size="small"
                                />
                            ) : (
                                <Activity
                                    color={colors.gold}
                                    size={21}
                                />
                            )}
                        </View>

                        <View style={styles.actionCopy}>
                            <Text style={styles.verifyTitle}>
                                {isVerifying
                                    ? 'Running Full Test...'
                                    : 'Run Full Shop Rates Test'}
                            </Text>

                            <Text style={styles.verifyText}>
                                Runs all Slice 2 backend operations
                                automatically.
                            </Text>
                        </View>

                        {!isVerifying && (
                            <ArrowRight
                                color={colors.textSubtle}
                                size={20}
                            />
                        )}
                    </TouchableOpacity>

                    <View style={styles.stepsContainer}>
                        {steps.map((step, index) => (
                            <View
                                key={`${step.label}-${index}`}
                                style={styles.stepRow}
                            >
                                <View
                                    style={[
                                        styles.stepIcon,
                                        step.status === 'passed' &&
                                            styles.stepIconPassed,
                                        step.status === 'failed' &&
                                            styles.stepIconFailed,
                                        step.status === 'running' &&
                                            styles.stepIconRunning,
                                    ]}
                                >
                                    {renderStepIcon(
                                        step.status,
                                    )}
                                </View>

                                <View style={styles.stepCopy}>
                                    <Text
                                        style={[
                                            styles.stepLabel,
                                            step.status === 'passed' &&
                                                styles.stepLabelPassed,
                                            step.status === 'failed' &&
                                                styles.stepLabelFailed,
                                        ]}
                                    >
                                        {index + 1}. {step.label}
                                    </Text>

                                    {step.detail ? (
                                        <Text style={styles.stepDetail}>
                                            {step.detail}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                        ))}
                    </View>

                    {testFinished ? (
                        <View style={styles.successBanner}>
                            <CheckCircle2
                                color="#63D471"
                                size={21}
                            />

                            <View style={styles.successCopy}>
                                <Text style={styles.successTitle}>
                                    Slice 2 verified
                                </Text>

                                <Text style={styles.successText}>
                                    Admin shop-rate backend flow passed
                                    end-to-end.
                                </Text>
                            </View>
                        </View>
                    ) : null}
                </View>
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

    featureCard: {
        ...commonStyles.card,
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: spacing.xl,
        padding: spacing.md,
    },

    featureIcon: {
        alignItems: 'center',
        backgroundColor: colors.gold,
        borderRadius: radii.md,
        height: 52,
        justifyContent: 'center',
        width: 52,
    },

    featureCopy: {
        flex: 1,
        marginLeft: spacing.md,
    },

    featureTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '800',
    },

    featureText: {
        color: colors.textMuted,
        fontSize: 13,
        lineHeight: 19,
        marginTop: 4,
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

    testPanel: {
        ...commonStyles.card,
        marginBottom: spacing.sm,
        padding: spacing.md,
    },

    testHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: spacing.md,
    },

    testHeaderIcon: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderRadius: radii.sm,
        height: 44,
        justifyContent: 'center',
        width: 44,
    },

    testHeaderCopy: {
        flex: 1,
        marginLeft: spacing.md,
    },

    testTitle: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '800',
    },

    testSubtitle: {
        color: colors.textSubtle,
        fontSize: 12,
        marginTop: 4,
    },

    inputLabel: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },

    pinInput: {
        backgroundColor: '#181818',
        borderColor: '#3A321F',
        borderRadius: radii.sm,
        borderWidth: 1,
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 4,
        minHeight: 48,
        paddingHorizontal: spacing.md,
    },

    warningText: {
        color: colors.textSubtle,
        fontSize: 11,
        lineHeight: 17,
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },

    verifyCard: {
        alignItems: 'center',
        backgroundColor: '#181818',
        borderColor: '#3A321F',
        borderRadius: radii.sm,
        borderWidth: 1,
        flexDirection: 'row',
        minHeight: 76,
        padding: spacing.md,
    },

    verifyCardDisabled: {
        opacity: 0.7,
    },

    verifyIcon: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderRadius: radii.sm,
        height: 42,
        justifyContent: 'center',
        width: 42,
    },

    verifyTitle: {
        color: colors.gold,
        fontSize: 14,
        fontWeight: '800',
    },

    verifyText: {
        color: colors.textSubtle,
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4,
    },

    stepsContainer: {
        marginTop: spacing.lg,
    },

    stepRow: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },

    stepIcon: {
        alignItems: 'center',
        backgroundColor: '#202020',
        borderRadius: 18,
        height: 32,
        justifyContent: 'center',
        width: 32,
    },

    stepIconPassed: {
        backgroundColor: '#15251A',
    },

    stepIconFailed: {
        backgroundColor: '#291818',
    },

    stepIconRunning: {
        backgroundColor: '#252015',
    },

    pendingDot: {
        backgroundColor: colors.textSubtle,
        borderRadius: 4,
        height: 8,
        width: 8,
    },

    stepCopy: {
        flex: 1,
        marginLeft: spacing.sm,
        paddingTop: 3,
    },

    stepLabel: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '700',
    },

    stepLabelPassed: {
        color: '#63D471',
    },

    stepLabelFailed: {
        color: '#FF6B6B',
    },

    stepDetail: {
        color: colors.textSubtle,
        fontSize: 10,
        lineHeight: 15,
        marginTop: 2,
    },

    successBanner: {
        alignItems: 'center',
        backgroundColor: '#15251A',
        borderColor: '#285D32',
        borderRadius: radii.sm,
        borderWidth: 1,
        flexDirection: 'row',
        marginTop: spacing.md,
        padding: spacing.md,
    },

    successCopy: {
        flex: 1,
        marginLeft: spacing.sm,
    },

    successTitle: {
        color: '#63D471',
        fontSize: 13,
        fontWeight: '800',
    },

    successText: {
        color: '#A5C9AA',
        fontSize: 11,
        lineHeight: 16,
        marginTop: 2,
    },
});

export default AdminDashboardScreen;