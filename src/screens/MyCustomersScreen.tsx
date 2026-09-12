import React, { useCallback, useEffect, useState } from 'react';
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
    ArrowLeft,
    Plus,
    UserRound,
    Phone,
    Mail,
    MapPin,
    RefreshCw,
    X,
} from 'lucide-react-native';

import ScreenHeader from './components/ScreenHeader';
import { colors, commonStyles, radii, spacing } from '../theme';
import { supabase } from '../lib/supabase';

type Customer = {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    address: string | null;
    status: string;
    role: string;
    admin_id: string | null;
    created_at: string;
};

type FormState = {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    password: string;
};

const INITIAL_FORM: FormState = {
    fullName: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    password: '',
};

const MyCustomersScreen = ({ navigation }: any) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [savingCustomer, setSavingCustomer] = useState(false);

    const [form, setForm] = useState<FormState>(INITIAL_FORM);

    const loadCustomers = useCallback(async () => {
        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                throw new Error('No active admin session found.');
            }

            const { data, error } = await supabase
                .from('profiles')
                .select(
                    'id, full_name, email, phone, city, address, status, role, admin_id, created_at',
                )
                .eq('role', 'customer')
                .eq('admin_id', user.id)
                .order('full_name', {
                    ascending: true,
                });

            if (error) {
                throw error;
            }

            setCustomers((data || []) as Customer[]);
        } catch (error: any) {
            console.error('LOAD MY CUSTOMERS ERROR:', error);

            Alert.alert(
                'Unable to Load Customers',
                error?.message ||
                    'Could not load your customers. Please try again.',
            );
        } finally {
            setLoadingCustomers(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadCustomers();
    };

    const closeAddModal = () => {
        if (savingCustomer) {
            return;
        }

        setShowAddModal(false);
        setForm(INITIAL_FORM);
    };

    const updateField = (
        field: keyof FormState,
        value: string,
    ) => {
        setForm(current => ({
            ...current,
            [field]: value,
        }));
    };

    const validateForm = () => {
        if (!form.fullName.trim()) {
            Alert.alert(
                'Name Required',
                'Please enter the customer full name.',
            );
            return false;
        }

        if (!form.email.trim()) {
            Alert.alert(
                'Email Required',
                'Please enter the customer email.',
            );
            return false;
        }

        if (!form.phone.trim()) {
            Alert.alert(
                'Phone Required',
                'Please enter the customer phone number.',
            );
            return false;
        }

        if (!form.city.trim()) {
            Alert.alert(
                'City Required',
                'Please enter the customer city.',
            );
            return false;
        }

        if (!form.address.trim()) {
            Alert.alert(
                'Address Required',
                'Please enter the customer address.',
            );
            return false;
        }

        if (form.password.length < 6) {
            Alert.alert(
                'Password Too Short',
                'Customer password must contain at least 6 characters.',
            );
            return false;
        }

        return true;
    };

    const handleAddCustomer = async () => {
        if (!validateForm()) {
            return;
        }

        setSavingCustomer(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                throw new Error('No active admin session found.');
            }

            const { data, error } =
                await supabase.functions.invoke(
                    'create-customer',
                    {
                        body: {
                            fullName: form.fullName.trim(),
                            email: form.email.trim().toLowerCase(),
                            phone: form.phone.trim(),
                            city: form.city.trim(),
                            address: form.address.trim(),
                            password: form.password,
                        },
                    },
                );

            if (error) {
                throw new Error(
                    error.message ||
                        'Customer creation request failed.',
                );
            }

            if (!data?.success) {
                throw new Error(
                    data?.error ||
                        'Customer could not be created.',
                );
            }

            setShowAddModal(false);
            setForm(INITIAL_FORM);

            Alert.alert(
                'Customer Added',
                `${form.fullName.trim()} has been added to your shop successfully.`,
            );

            await loadCustomers();
        } catch (error: any) {
            console.error('ADD CUSTOMER ERROR:', error);

            Alert.alert(
                'Customer Creation Failed',
                error?.message ||
                    'Could not create the customer. Please try again.',
            );
        } finally {
            setSavingCustomer(false);
        }
    };

    const handleViewCustomer = (customer: Customer) => {
        Alert.alert(
            customer.full_name || 'Customer',
            [
                `Email: ${customer.email || 'Not provided'}`,
                `Phone: ${customer.phone || 'Not provided'}`,
                `City: ${customer.city || 'Not provided'}`,
                `Address: ${customer.address || 'Not provided'}`,
                `Status: ${customer.status}`,
            ].join('\n'),
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="MY CUSTOMERS"
                subtitle="Customers connected to your shop"
                navigation={navigation}
                home
            />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.pageHeader}>
                    <View style={styles.pageHeaderCopy}>
                        <Text style={styles.eyebrow}>
                            SHOP CUSTOMERS
                        </Text>

                        <Text style={styles.title}>
                            Your customers
                        </Text>

                        <Text style={styles.subtitle}>
                            Customers added from your account belong
                            automatically to your shop.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={handleRefresh}
                        disabled={refreshing}
                        activeOpacity={0.8}
                    >
                        {refreshing ? (
                            <ActivityIndicator
                                size="small"
                                color={colors.gold}
                            />
                        ) : (
                            <RefreshCw
                                color={colors.gold}
                                size={19}
                            />
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                    activeOpacity={0.82}
                >
                    <View style={styles.addIcon}>
                        <Plus
                            color={colors.background}
                            size={20}
                        />
                    </View>

                    <View style={styles.addCopy}>
                        <Text style={styles.addTitle}>
                            Add Customer
                        </Text>

                        <Text style={styles.addText}>
                            Create a customer for your shop
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>
                            Customers
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                            {customers.length}{' '}
                            {customers.length === 1
                                ? 'customer'
                                : 'customers'}
                        </Text>
                    </View>

                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>
                            {customers.length}
                        </Text>
                    </View>
                </View>

                {loadingCustomers ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="large"
                            color={colors.gold}
                        />

                        <Text style={styles.loadingText}>
                            Loading your customers...
                        </Text>
                    </View>
                ) : customers.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIcon}>
                            <UserRound
                                color={colors.gold}
                                size={25}
                            />
                        </View>

                        <Text style={styles.emptyTitle}>
                            No Customers Yet
                        </Text>

                        <Text style={styles.emptyText}>
                            Add your first customer and they will
                            automatically belong to your shop.
                        </Text>

                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => setShowAddModal(true)}
                            activeOpacity={0.82}
                        >
                            <Plus
                                color={colors.background}
                                size={17}
                            />

                            <Text style={styles.emptyButtonText}>
                                ADD CUSTOMER
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    customers.map(customer => (
                        <View
                            key={customer.id}
                            style={styles.customerCard}
                        >
                            <View style={styles.customerHeader}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {customer.full_name
                                            ?.charAt(0)
                                            ?.toUpperCase() || 'C'}
                                    </Text>
                                </View>

                                <View style={styles.customerInfo}>
                                    <Text
                                        style={
                                            styles.customerName
                                        }
                                        numberOfLines={1}
                                    >
                                        {customer.full_name ||
                                            'Unnamed Customer'}
                                    </Text>

                                    <Text
                                        style={
                                            styles.customerEmail
                                        }
                                        numberOfLines={1}
                                    >
                                        {customer.email ||
                                            'No email'}
                                    </Text>
                                </View>

                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>
                                        ● {customer.status}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.detail}>
                                <Phone
                                    color={colors.textSubtle}
                                    size={13}
                                />{' '}
                                {customer.phone ||
                                    'No phone number'}
                            </Text>

                            <Text style={styles.detail}>
                                <MapPin
                                    color={colors.textSubtle}
                                    size={13}
                                />{' '}
                                {customer.city || 'No city'}
                            </Text>

                            <Text
                                style={styles.detail}
                                numberOfLines={2}
                            >
                                <Mail
                                    color={colors.textSubtle}
                                    size={13}
                                />{' '}
                                {customer.email ||
                                    'No email address'}
                            </Text>

                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() =>
                                    handleViewCustomer(
                                        customer,
                                    )
                                }
                                activeOpacity={0.82}
                            >
                                <Text
                                    style={
                                        styles.viewButtonText
                                    }
                                >
                                    VIEW CUSTOMER
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal
                visible={showAddModal}
                transparent
                animationType="slide"
                onRequestClose={closeAddModal}
            >
                <KeyboardAvoidingView
                    style={styles.modalRoot}
                    behavior={
                        Platform.OS === 'ios'
                            ? 'padding'
                            : undefined
                    }
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        Add Customer
                                    </Text>

                                    <Text
                                        style={
                                            styles.modalSubtitle
                                        }
                                    >
                                        This customer will belong
                                        to your shop.
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={
                                        styles.modalCloseButton
                                    }
                                    onPress={closeAddModal}
                                    disabled={savingCustomer}
                                >
                                    <X
                                        color={colors.textMuted}
                                        size={20}
                                    />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={styles.formScroll}
                                showsVerticalScrollIndicator={
                                    false
                                }
                                keyboardShouldPersistTaps="handled"
                            >
                                <Text style={styles.inputLabel}>
                                    Full Name
                                </Text>

                                <TextInput
                                    value={form.fullName}
                                    onChangeText={value =>
                                        updateField(
                                            'fullName',
                                            value,
                                        )
                                    }
                                    placeholder="Customer full name"
                                    placeholderTextColor={
                                        colors.textSubtle
                                    }
                                    style={styles.input}
                                    editable={!savingCustomer}
                                />

                                <Text style={styles.inputLabel}>
                                    Email
                                </Text>

                                <TextInput
                                    value={form.email}
                                    onChangeText={value =>
                                        updateField(
                                            'email',
                                            value,
                                        )
                                    }
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholder="customer@email.com"
                                    placeholderTextColor={
                                        colors.textSubtle
                                    }
                                    style={styles.input}
                                    editable={!savingCustomer}
                                />

                                <Text style={styles.inputLabel}>
                                    Phone
                                </Text>

                                <TextInput
                                    value={form.phone}
                                    onChangeText={value =>
                                        updateField(
                                            'phone',
                                            value,
                                        )
                                    }
                                    keyboardType="phone-pad"
                                    placeholder="03XX XXXXXXX"
                                    placeholderTextColor={
                                        colors.textSubtle
                                    }
                                    style={styles.input}
                                    editable={!savingCustomer}
                                />

                                <Text style={styles.inputLabel}>
                                    City
                                </Text>

                                <TextInput
                                    value={form.city}
                                    onChangeText={value =>
                                        updateField(
                                            'city',
                                            value,
                                        )
                                    }
                                    placeholder="City"
                                    placeholderTextColor={
                                        colors.textSubtle
                                    }
                                    style={styles.input}
                                    editable={!savingCustomer}
                                />

                                <Text style={styles.inputLabel}>
                                    Address
                                </Text>

                                <TextInput
                                    value={form.address}
                                    onChangeText={value =>
                                        updateField(
                                            'address',
                                            value,
                                        )
                                    }
                                    placeholder="Customer address"
                                    placeholderTextColor={
                                        colors.textSubtle
                                    }
                                    style={[
                                        styles.input,
                                        styles.multilineInput,
                                    ]}
                                    multiline
                                    textAlignVertical="top"
                                    editable={!savingCustomer}
                                />

                                <Text style={styles.inputLabel}>
                                    Temporary Password
                                </Text>

                                <TextInput
                                    value={form.password}
                                    onChangeText={value =>
                                        updateField(
                                            'password',
                                            value,
                                        )
                                    }
                                    placeholder="Minimum 6 characters"
                                    placeholderTextColor={
                                        colors.textSubtle
                                    }
                                    style={styles.input}
                                    secureTextEntry
                                    editable={!savingCustomer}
                                />

                                <View
                                    style={
                                        styles.assignmentNotice
                                    }
                                >
                                    <UserRound
                                        color={colors.gold}
                                        size={17}
                                    />

                                    <Text
                                        style={
                                            styles.assignmentText
                                        }
                                    >
                                        This customer will
                                        automatically be assigned
                                        to your admin account.
                                    </Text>
                                </View>

                                <View
                                    style={
                                        styles.modalActions
                                    }
                                >
                                    <TouchableOpacity
                                        style={
                                            styles.cancelButton
                                        }
                                        onPress={closeAddModal}
                                        disabled={
                                            savingCustomer
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.cancelButtonText
                                            }
                                        >
                                            CANCEL
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={
                                            styles.saveButton
                                        }
                                        onPress={
                                            handleAddCustomer
                                        }
                                        disabled={
                                            savingCustomer
                                        }
                                    >
                                        {savingCustomer ? (
                                            <ActivityIndicator
                                                size="small"
                                                color={
                                                    colors.background
                                                }
                                            />
                                        ) : (
                                            <>
                                                <Plus
                                                    color={
                                                        colors.background
                                                    }
                                                    size={17}
                                                />

                                                <Text
                                                    style={
                                                        styles.saveButtonText
                                                    }
                                                >
                                                    CREATE
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },

    pageHeader: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        marginBottom: spacing.lg,
    },

    pageHeaderCopy: {
        flex: 1,
    },

    eyebrow: {
        ...commonStyles.eyebrow,
        marginBottom: spacing.xs,
    },

    title: {
        ...commonStyles.title,
        fontSize: 28,
    },

    subtitle: {
        ...commonStyles.body,
        fontSize: 13,
        lineHeight: 19,
        marginTop: spacing.sm,
    },

    refreshButton: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderColor: '#3A321F',
        borderRadius: radii.sm,
        borderWidth: 1,
        height: 44,
        justifyContent: 'center',
        marginLeft: spacing.sm,
        width: 44,
    },

    addButton: {
        ...commonStyles.card,
        alignItems: 'center',
        borderColor: '#4A3B19',
        flexDirection: 'row',
        marginBottom: spacing.xl,
        padding: spacing.md,
    },

    addIcon: {
        alignItems: 'center',
        backgroundColor: colors.gold,
        borderRadius: radii.sm,
        height: 44,
        justifyContent: 'center',
        width: 44,
    },

    addCopy: {
        flex: 1,
        marginLeft: spacing.md,
    },

    addTitle: {
        color: colors.gold,
        fontSize: 15,
        fontWeight: '800',
    },

    addText: {
        color: colors.textSubtle,
        fontSize: 12,
        marginTop: 4,
    },

    sectionHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },

    sectionTitle: {
        color: colors.text,
        fontSize: 17,
        fontWeight: '800',
    },

    sectionSubtitle: {
        color: colors.textSubtle,
        fontSize: 11,
        marginTop: 3,
    },

    countBadge: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderRadius: 18,
        height: 36,
        justifyContent: 'center',
        width: 36,
    },

    countBadgeText: {
        color: colors.gold,
        fontSize: 13,
        fontWeight: '800',
    },

    loadingContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },

    loadingText: {
        color: colors.textSubtle,
        fontSize: 12,
        marginTop: spacing.md,
    },

    emptyCard: {
        ...commonStyles.card,
        alignItems: 'center',
        padding: spacing.xl,
    },

    emptyIcon: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderRadius: 28,
        height: 56,
        justifyContent: 'center',
        width: 56,
    },

    emptyTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '800',
        marginTop: spacing.md,
    },

    emptyText: {
        color: colors.textSubtle,
        fontSize: 12,
        lineHeight: 18,
        marginTop: spacing.xs,
        textAlign: 'center',
    },

    emptyButton: {
        alignItems: 'center',
        backgroundColor: colors.gold,
        borderRadius: radii.sm,
        flexDirection: 'row',
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },

    emptyButtonText: {
        color: colors.background,
        fontSize: 11,
        fontWeight: '900',
        marginLeft: spacing.xs,
    },

    customerCard: {
        ...commonStyles.card,
        marginBottom: spacing.sm,
        padding: spacing.md,
    },

    customerHeader: {
        alignItems: 'center',
        flexDirection: 'row',
    },

    avatar: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderRadius: 24,
        height: 48,
        justifyContent: 'center',
        width: 48,
    },

    avatarText: {
        color: colors.gold,
        fontSize: 17,
        fontWeight: '900',
    },

    customerInfo: {
        flex: 1,
        marginLeft: spacing.sm,
    },

    customerName: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '800',
    },

    customerEmail: {
        color: colors.textSubtle,
        fontSize: 11,
        marginTop: 3,
    },

    statusBadge: {
        backgroundColor: '#15251A',
        borderColor: '#285D32',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },

    statusText: {
        color: '#63D471',
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
    },

    divider: {
        backgroundColor: colors.border,
        height: 1,
        marginVertical: spacing.md,
    },

    detail: {
        color: colors.textMuted,
        fontSize: 11,
        marginBottom: spacing.xs,
    },

    viewButton: {
        alignItems: 'center',
        borderColor: '#3A321F',
        borderRadius: radii.sm,
        borderWidth: 1,
        marginTop: spacing.sm,
        minHeight: 42,
        justifyContent: 'center',
    },

    viewButtonText: {
        color: colors.gold,
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.6,
    },

    modalRoot: {
        flex: 1,
    },

    modalOverlay: {
        backgroundColor: 'rgba(0,0,0,0.72)',
        flex: 1,
        justifyContent: 'flex-end',
    },

    modalCard: {
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        maxHeight: '92%',
        padding: spacing.lg,
    },

    modalHeader: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },

    modalTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '900',
    },

    modalSubtitle: {
        color: colors.textSubtle,
        fontSize: 11,
        lineHeight: 17,
        marginTop: 4,
        maxWidth: 280,
    },

    modalCloseButton: {
        alignItems: 'center',
        backgroundColor: '#202020',
        borderRadius: 20,
        height: 38,
        justifyContent: 'center',
        width: 38,
    },

    formScroll: {
        marginBottom: spacing.sm,
    },

    inputLabel: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '800',
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },

    input: {
        backgroundColor: '#181818',
        borderColor: '#3A321F',
        borderRadius: radii.sm,
        borderWidth: 1,
        color: colors.text,
        fontSize: 14,
        minHeight: 48,
        paddingHorizontal: spacing.md,
    },

    multilineInput: {
        minHeight: 82,
        paddingTop: spacing.md,
    },

    assignmentNotice: {
        alignItems: 'center',
        backgroundColor: '#252015',
        borderColor: '#3A321F',
        borderRadius: radii.sm,
        borderWidth: 1,
        flexDirection: 'row',
        marginTop: spacing.lg,
        padding: spacing.md,
    },

    assignmentText: {
        color: colors.textMuted,
        flex: 1,
        fontSize: 11,
        lineHeight: 17,
        marginLeft: spacing.sm,
    },

    modalActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.lg,
    },

    cancelButton: {
        alignItems: 'center',
        borderColor: colors.border,
        borderRadius: radii.sm,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        minHeight: 48,
    },

    cancelButtonText: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '900',
    },

    saveButton: {
        alignItems: 'center',
        backgroundColor: colors.gold,
        borderRadius: radii.sm,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        minHeight: 48,
    },

    saveButtonText: {
        color: colors.background,
        fontSize: 11,
        fontWeight: '900',
        marginLeft: spacing.xs,
    },
});

export default MyCustomersScreen;