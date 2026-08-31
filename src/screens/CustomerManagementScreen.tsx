import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import SweetAlert from 'react-native-sweet-alert';
import { supabase } from '../lib/supabase';

const CustomerManagementScreen = ({ navigation }: any) => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loading, setLoading] = useState(false);

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<any>(null);
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [customerToApprove, setCustomerToApprove] = useState<any>(null);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [customerToReject, setCustomerToReject] = useState<any>(null);

    const loadCustomers = async () => {
        setLoadingCustomers(true);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone, city, address, status, role, created_at')
                .eq('role', 'customer')
                .order('full_name', { ascending: true });

            if (error) {
                throw error;
            }

            setCustomers(data || []);
        } catch (error: any) {
            console.error('LOAD CUSTOMERS ERROR:', error);

            await SweetAlert.showAlert({
                style: 'error',
                title: 'Unable to Load Customers',
                subTitle: error?.message || 'Could not load customers.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
        } finally {
            setLoadingCustomers(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const handleViewCustomer = async (customer: any) => {
        await SweetAlert.showAlert({
            style: 'normal',
            title: customer.full_name || 'Customer',
            subTitle:
                `Email: ${customer.email || 'N/A'}\n\n` +
                `Phone: ${customer.phone || 'N/A'}\n\n` +
                `City: ${customer.city || 'N/A'}\n\n` +
                `Address: ${customer.address || 'N/A'}\n\n` +
                `Status: ${customer.status || 'N/A'}`,
            confirmButtonTitle: 'OK',
            confirmButtonColor: '#D4AF37',
        });
    };

    const handleApproveCustomer = async (customer: any) => {
        if (!customer?.id) {
            return;
        }

        if (customer.status === 'approved') {
            await SweetAlert.showAlert({
                style: 'normal',
                title: 'Already Approved',
                subTitle: 'This customer account is already approved.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });

            return;
        }
        setCustomerToApprove(customer);
        setApproveModalVisible(true);
        return;
    };

    const handleRejectCustomer = (customer: any) => {
        if (!customer?.id) {
            return;
        }
        setCustomerToReject(customer);
        setRejectModalVisible(true);
    };

    const confirmApproveCustomer = async () => {
        if (!customerToApprove?.id) {
            return;
        }

        setApproveModalVisible(false);
        setLoading(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Super Admin session not found.');
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: user.id,
                    rejection_reason: null,
                })
                .eq('id', customerToApprove.id)
                .eq('role', 'customer');

            if (error) {
                throw error;
            }

            await SweetAlert.showAlert({
                style: 'success',
                title: 'Customer Approved',
                subTitle: `${
                    customerToApprove.full_name || 'Customer'
                } has been approved successfully.`,
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });

            setCustomerToApprove(null);
            await loadCustomers();
        } catch (error: any) {
            console.error('APPROVE CUSTOMER ERROR:', error);

            await SweetAlert.showAlert({
                style: 'error',
                title: 'Approval Failed',
                subTitle: error?.message || 'Could not approve this customer.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmRejectCustomer = async () => {
        if (!customerToReject?.id) {
            return;
        }
        setRejectModalVisible(false);
        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    status: 'rejected',
                })
                .eq('id', customerToReject.id)
                .eq('role', 'customer');

            if (error) {
                throw error;
            }

            setCustomerToReject(null);

            await SweetAlert.showAlert({
                style: 'success',
                title: 'Customer Rejected',
                subTitle: `${customerToReject.full_name || 'Customer'} has been rejected.`,
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });

            await loadCustomers();
        } catch (error: any) {
            console.error('REJECT CUSTOMER ERROR:', error);

            await SweetAlert.showAlert({
                style: 'error',
                title: 'Rejection Failed',
                subTitle: error?.message || 'Could not reject this customer.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
        } finally {
            setLoading(false);
        }

    };
    const handleDeleteCustomer = (customer: any) => {
        setCustomerToDelete(customer);
        setDeleteModalVisible(true);
    };

    const confirmDeleteCustomer = async () => {
        if (!customerToDelete?.id) {
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', customerToDelete.id)
                .eq('role', 'customer');

            if (error) {
                throw error;
            }

            setDeleteModalVisible(false);
            setCustomerToDelete(null);

            await SweetAlert.showAlert({
                style: 'success',
                title: 'Customer Deleted',
                subTitle: 'The customer profile has been deleted successfully.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });

            await loadCustomers();
        } catch (error: any) {
            console.error('DELETE CUSTOMER ERROR:', error);

            await SweetAlert.showAlert({
                style: 'error',
                title: 'Delete Failed',
                subTitle: error?.message || 'Could not delete this customer.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        if (status === 'approved') {
            return styles.approvedBadge;
        }

        if (status === 'rejected') {
            return styles.rejectedBadge;
        }

        return styles.pendingBadge;
    };

    const getStatusTextStyle = (status: string) => {
        if (status === 'approved') {
            return styles.approvedText;
        }

        if (status === 'rejected') {
            return styles.rejectedText;
        }

        return styles.pendingText;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.openDrawer()}>
                    <Text style={styles.menuButton}>☰</Text>
                </TouchableOpacity>

                <View>
                    <Text style={styles.title}>Customer Management</Text>

                    <Text style={styles.subtitle}>Manage GoldKing customers</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.customerScrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.heading}>Customers</Text>

                        <Text style={styles.countText}>{customers.length} customers</Text>
                    </View>

                    <View style={styles.totalBadge}>
                        <Text style={styles.totalBadgeText}>{customers.length}</Text>
                    </View>
                </View>

                {loadingCustomers ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#D4AF37" />

                        <Text style={styles.loadingText}>Loading customers...</Text>
                    </View>
                ) : customers.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>No Customers</Text>

                        <Text style={styles.emptyText}>
                            No customer accounts have been registered yet.
                        </Text>
                    </View>
                ) : (
                    customers.map((customer: any) => (
                        <View key={customer.id} style={styles.customerCard}>
                            <View style={styles.customerHeader}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {customer.full_name?.charAt(0)?.toUpperCase() || 'C'}
                                    </Text>
                                </View>

                                <View style={styles.customerInfo}>
                                    <Text style={styles.customerName}>
                                        {customer.full_name || 'Unnamed Customer'}
                                    </Text>

                                    <Text style={styles.customerEmail}>
                                        {customer.email || 'No email'}
                                    </Text>
                                </View>

                                <View style={getStatusStyle(customer.status)}>
                                    <Text style={getStatusTextStyle(customer.status)}>
                                        ● {customer.status}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.customerDetail}>
                                📞 {customer.phone || 'No phone'}
                            </Text>

                            <Text style={styles.customerDetail}>
                                📍 {customer.city || 'No city'}
                            </Text>

                            <Text style={styles.customerDetail}>
                                ⌂ {customer.address || 'No address'}
                            </Text>

                            <View style={styles.actionRow}>
                                {customer.status === 'approved' && (
                                    <TouchableOpacity
                                        style={styles.viewButton}
                                        onPress={() => handleViewCustomer(customer)}
                                    >
                                        <Text style={styles.viewButtonText}>VIEW</Text>
                                    </TouchableOpacity>
                                )}

                                {customer.status === 'pending' && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.approveButton}
                                            onPress={() => handleApproveCustomer(customer)}
                                            disabled={loading}
                                        >
                                            <Text style={styles.approveButtonText}>APPROVE</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.rejectButton}
                                            onPress={() => handleRejectCustomer(customer)}
                                            disabled={loading}
                                        >
                                            <Text style={styles.rejectButtonText}>REJECT</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDeleteCustomer(customer)}
                                >
                                    <Text style={styles.deleteButtonText}>DELETE</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal
                visible={approveModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setApproveModalVisible(false);
                    setCustomerToApprove(null);
                }}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        setApproveModalVisible(false);
                        setCustomerToApprove(null);
                    }}
                >
                    <TouchableOpacity
                        style={styles.deleteModal}
                        activeOpacity={1}
                        onPress={e => e.stopPropagation()}
                    >
                        <Text style={styles.deleteModalTitle}>Approve Customer?</Text>

                        <Text style={styles.deleteModalText}>
                            Are you sure you want to approve{' '}
                            {customerToApprove?.full_name || 'this customer'}?
                        </Text>

                        <View style={styles.deleteModalActions}>
                            <TouchableOpacity
                                style={styles.cancelDeleteButton}
                                onPress={() => {
                                    setApproveModalVisible(false);
                                    setCustomerToApprove(null);
                                }}
                            >
                                <Text style={styles.cancelDeleteText}>CANCEL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.approveButton}
                                onPress={confirmApproveCustomer}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#111111" />
                                ) : (
                                    <Text style={styles.approveButtonText}>APPROVE</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={rejectModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setRejectModalVisible(false);
                    setCustomerToReject(null);
                }}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        setRejectModalVisible(false);
                        setCustomerToReject(null);
                    }}
                >
                    <TouchableOpacity
                        style={styles.deleteModal}
                        activeOpacity={1}
                        onPress={e => e.stopPropagation()}
                    >
                        <Text style={styles.deleteModalTitle}>Reject Customer?</Text>

                        <Text style={styles.deleteModalText}>
                            Are you sure you want to reject{' '}
                            {customerToReject?.full_name || 'this customer'}?
                        </Text>

                        <View style={styles.deleteModalActions}>
                            <TouchableOpacity
                                style={styles.cancelDeleteButton}
                                onPress={() => {
                                    setRejectModalVisible(false);
                                    setCustomerToReject(null);
                                }}
                            >
                                <Text style={styles.cancelDeleteText}>CANCEL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmDeleteButton}
                                onPress={confirmRejectCustomer}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmDeleteText}>REJECT</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setDeleteModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.deleteModal}
                        activeOpacity={1}
                        onPress={e => e.stopPropagation()}
                    >
                        <Text style={styles.deleteModalTitle}>Delete Customer?</Text>

                        <Text style={styles.deleteModalText}>
                            Are you sure you want to delete{' '}
                            {customerToDelete?.full_name || 'this customer'}?
                        </Text>

                        <View style={styles.deleteModalActions}>
                            <TouchableOpacity
                                style={styles.cancelDeleteButton}
                                onPress={() => {
                                    setDeleteModalVisible(false);
                                    setCustomerToDelete(null);
                                }}
                            >
                                <Text style={styles.cancelDeleteText}>CANCEL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmDeleteButton}
                                onPress={confirmDeleteCustomer}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmDeleteText}>DELETE</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#292929',
    },

    menuButton: {
        color: '#D4AF37',
        fontSize: 30,
        marginRight: 18,
    },

    title: {
        color: '#D4AF37',
        fontSize: 22,
        fontWeight: '800',
    },

    subtitle: {
        color: '#888888',
        fontSize: 13,
        marginTop: 1,
    },

    content: {
        padding: 14,
    },

    customerScrollContent: {
        paddingBottom: 30,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },

    heading: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 1,
    },

    countText: {
        color: '#777777',
        fontSize: 13,
    },

    totalBadge: {
        width: 35,
        height: 35,
        borderRadius: 23,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
    },

    totalBadgeText: {
        color: '#111111',
        fontSize: 13,
        fontWeight: '800',
    },

    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },

    loadingText: {
        color: '#888888',
        fontSize: 14,
        marginTop: 12,
    },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },

    emptyTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },

    emptyText: {
        color: '#777777',
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
    },

    customerCard: {
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#2D2D2D',
        borderRadius: 15,
        padding: 10,
        marginBottom: 10,
    },

    customerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    avatarText: {
        color: '#111111',
        fontSize: 20,
        fontWeight: '800',
    },

    customerInfo: {
        flex: 1,
    },

    customerName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    customerEmail: {
        color: '#777777',
        fontSize: 11,
        marginTop: 4,
    },

    approvedBadge: {
        backgroundColor: '#17301F',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 10,
    },

    pendingBadge: {
        backgroundColor: '#332D15',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 10,
    },

    rejectedBadge: {
        backgroundColor: '#351818',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 10,
    },

    approvedText: {
        color: '#55C878',
        fontSize: 10,
        fontWeight: '700',
    },

    pendingText: {
        color: '#D4AF37',
        fontSize: 10,
        fontWeight: '700',
    },

    rejectedText: {
        color: '#FF5252',
        fontSize: 10,
        fontWeight: '700',
    },

    divider: {
        height: 1,
        backgroundColor: '#292929',
        marginVertical: 14,
    },

    customerDetail: {
        color: '#BBBBBB',
        fontSize: 13,
        marginBottom: 8,
    },

    actionRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 6,
    },

    viewButton: {
        flex: 1,
        height: 32,
        borderWidth: 1,
        borderColor: '#D4AF37',
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },

    viewButtonText: {
        color: '#D4AF37',
        fontSize: 11,
        fontWeight: '800',
    },

    approveButton: {
        flex: 1,
        height: 32,
        backgroundColor: '#D4AF37',
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },

    approveButtonText: {
        color: '#111111',
        fontSize: 10,
        fontWeight: '800',
    },

    deleteButton: {
        flex: 1,
        height: 32,
        backgroundColor: '#8B1E1E',
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },

    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    deleteModal: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#2D2D2D',
        borderRadius: 16,
        padding: 20,
    },

    deleteModalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 10,
    },

    deleteModalText: {
        color: '#BBBBBB',
        fontSize: 14,
        lineHeight: 20,
    },

    deleteModalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        gap: 10,
    },

    cancelDeleteButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#444444',
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
    },

    cancelDeleteText: {
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: '800',
    },

    confirmDeleteButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#8B1E1E',
        justifyContent: 'center',
        alignItems: 'center',
    },

    confirmDeleteText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    rejectButton: {
        flex: 1,
        height: 32,
        backgroundColor: '#8B1E1E',
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },

    rejectButtonText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    confirmApproveButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
    },

    confirmApproveText: {
        color: '#111111',
        fontSize: 12,
        fontWeight: '800',
    },
});

export default CustomerManagementScreen;
