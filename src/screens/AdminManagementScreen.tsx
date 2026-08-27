import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import SweetAlert from 'react-native-sweet-alert';
import { supabase } from '../lib/supabase';

const AdminManagementScreen = ({ navigation }: any) => {
    const [showForm, setShowForm] = useState(false);
    const [shopName, setShopName] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState<any>(null);

    const [loading, setLoading] = useState(false);
    const [admins, setAdmins] = useState<any[]>([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);

    const loadAdmins = async () => {
        setLoadingAdmins(true);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone, city, address,shop_name, status, role')
                .eq('role', 'admin')
                .order('full_name', { ascending: true });

            if (error) {
                throw error;
            }

            setAdmins(data || []);
        } catch (error: any) {
            console.error('LOAD ADMINS ERROR:', error);

            await SweetAlert.showAlert({
                style: 'error',
                title: 'Unable to Load Admins',
                subTitle: error?.message || 'Could not load administrators.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
        } finally {
            setLoadingAdmins(false);
        }
    };
    useEffect(() => {
        loadAdmins();
    }, []);

    const handleExitCreateAdmin = async () => {
        const hasChanges =
            shopName.trim() !== '' ||
            fullName.trim() !== '' ||
            email.trim() !== '' ||
            phone.trim() !== '' ||
            city.trim() !== '' ||
            address.trim() !== '' ||
            password !== '';

        if (!hasChanges) {
            setShowForm(false);
            return;
        }

        const result = await SweetAlert.showAlert({
            style: 'warning',
            title: 'Discard Changes?',
            subTitle: 'You have unsaved changes. Are you sure you want to discard them?',
            confirmButtonTitle: 'DISCARD',
            confirmButtonColor: '#D4AF37',
        });

        if (result) {
            setShopName('');
            setFullName('');
            setEmail('');
            setPhone('');
            setCity('');
            setAddress('');
            setPassword('');

            setShowForm(false);
        }
    };

    const handleEditAdmin = (admin: any) => {
        setEditingAdminId(admin.id);
        setEditMode(true);

        setShopName(admin.shop_name || '');
        setFullName(admin.full_name || '');
        setEmail(admin.email || '');
        setPhone(admin.phone || '');
        setCity(admin.city || '');
        setAddress(admin.address || '');
        setPassword('');

        setShowForm(true);
    };

    const handleCreateAdmin = async () => {
        if (!shopName.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Shop Name Required',
                subTitle: 'Please enter the shop name.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }
        if (!fullName.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Name Required',
                subTitle: 'Please enter the admin full name.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (!email.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Email Required',
                subTitle: 'Please enter the admin email.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (!phone.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Phone Required',
                subTitle: 'Please enter the admin phone number.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (!city.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'City Required',
                subTitle: 'Please enter the admin city.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (!address.trim()) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Address Required',
                subTitle: 'Please enter the admin address.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        if (password.length < 6) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Password Too Short',
                subTitle: 'Password must contain at least 6 characters.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('create-admin', {
                body: {
                    shopName: shopName.trim(),
                    fullName: fullName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    city: city.trim(),
                    address: address.trim(),
                    password,
                },
            });

            if (error) {
                throw new Error(error.message || 'Failed to create admin.');
            }

            if (!data?.success) {
                throw new Error(data?.error || 'Failed to create admin.');
            }

            await SweetAlert.showAlert({
                style: 'success',
                title: 'Admin Created',
                subTitle: 'The new admin account has been created successfully.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            setShopName('');
            setFullName('');
            setEmail('');
            setPhone('');
            setCity('');
            setAddress('');
            setPassword('');
            setShowForm(false);

            await loadAdmins();
        } catch (error: any) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Error',
                subTitle: error?.message || 'Something went wrong. Please try again.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAdmin = async () => {
        if (!editingAdminId) {
            return;
        }

        if (
            !shopName.trim() ||
            !fullName.trim() ||
            !email.trim() ||
            !phone.trim() ||
            !city.trim() ||
            !address.trim()
        ) {
            await SweetAlert.showAlert({
                style: 'warning',
                title: 'Missing Information',
                subTitle: 'Please complete all administrator fields.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    shop_name: shopName.trim(),
                    full_name: fullName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    city: city.trim(),
                    address: address.trim(),
                })
                .eq('id', editingAdminId);

            if (error) {
                throw error;
            }

            await SweetAlert.showAlert({
                style: 'success',
                title: 'Admin Updated',
                subTitle: 'The administrator has been updated successfully.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });

            setEditMode(false);
            setEditingAdminId(null);
            setShowForm(false);
            setPassword('');
            await loadAdmins();
        } catch (error: any) {
            await SweetAlert.showAlert({
                style: 'error',
                title: 'Error',
                subTitle: error?.message || 'Something went wrong. Please try again.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
        } finally {
            setLoading(false);
        }
    };
    const handleDeleteAdmin = (admin: any) => {
        setAdminToDelete(admin);
        setDeleteModalVisible(true);
    };

    const confirmDeleteAdmin = async () => {
        if (!adminToDelete?.id) {
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('delete-admin', {
                body: {
                    adminId: adminToDelete.id,
                },
            });

            console.log('DELETE FUNCTION DATA:', data);
            console.log('DELETE FUNCTION ERROR:', error);

            if (error) {
                console.error('DELETE FUNCTION ERROR DETAILS:', JSON.stringify(error, null, 2));
                throw new Error(error.message || 'Failed to delete admin.');
            }

            if (!data?.success) {
                throw new Error(data?.error || 'Failed to delete admin.');
            }

            setDeleteModalVisible(false);
            setAdminToDelete(null);

            await SweetAlert.showAlert({
                style: 'success',
                title: 'Admin Deleted',
                subTitle: 'The administrator has been deleted successfully.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });

            await loadAdmins();
        } catch (error: any) {
            console.error('DELETE ADMIN ERROR:', error);

            await SweetAlert.showAlert({
                style: 'error',
                title: 'Delete Failed',
                subTitle: error?.message || 'Could not delete administrator.',
                confirmButtonTitle: 'OK',
                confirmButtonColor: '#D4AF37',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!showForm) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()}>
                        <Text style={styles.menuButton}>☰</Text>
                    </TouchableOpacity>

                    <View>
                        <Text style={styles.title}>Admin Management</Text>

                        <Text style={styles.subtitle}>Manage GoldKing administrators</Text>
                    </View>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.adminScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.heading}>Administrators</Text>

                            <Text style={styles.countText}>{admins.length} administrators</Text>
                        </View>

                        <View style={styles.totalBadge}>
                            <Text style={styles.totalBadgeText}>{admins.length}</Text>
                        </View>
                    </View>

                    {loadingAdmins ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#D4AF37" />

                            <Text style={styles.loadingText}>Loading administrators...</Text>
                        </View>
                    ) : admins.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>No Administrators</Text>

                            <Text style={styles.emptyText}>
                                No admin accounts have been created yet.
                            </Text>
                        </View>
                    ) : (
                        admins.map((admin: any) => (
                            <View key={admin.id} style={styles.adminCard}>
                                <View style={styles.adminHeader}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {admin.full_name?.charAt(0)?.toUpperCase() || 'A'}
                                        </Text>
                                    </View>

                                    <View style={styles.adminInfo}>
                                        <Text style={styles.adminName}>
                                            {admin.full_name || 'Unnamed Admin'}
                                        </Text>

                                        <Text style={styles.adminEmail}>{admin.email}</Text>
                                    </View>

                                    <View style={styles.statusBadge}>
                                        <Text style={styles.statusText}>● {admin.status}</Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <Text style={styles.adminDetail}>📞 {admin.phone}</Text>

                                <Text style={styles.adminShop}>
                                    🏪 {admin.shop_name || 'No Shop Name'}
                                </Text>

                                <Text style={styles.adminDetail}>📍 {admin.city}</Text>

                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={styles.viewButton}
                                        onPress={() =>
                                            SweetAlert.showAlert({
                                                style: 'normal',
                                                title: admin.full_name || 'Unnamed Admin',
                                                subTitle: `${admin.email}\n${admin.phone}\n${admin.city}`,
                                                confirmButtonTitle: 'OK',
                                                confirmButtonColor: '#D4AF37',
                                            })
                                        }
                                    >
                                        <Text style={styles.viewButtonText}>VIEW</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => handleEditAdmin(admin)}
                                    >
                                        <Text style={styles.editButtonText}>EDIT</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDeleteAdmin(admin)}
                                    >
                                        <Text style={styles.deleteButtonText}>DELETE</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>

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
                            <Text style={styles.deleteModalTitle}>Delete Admin?</Text>

                            <Text style={styles.deleteModalText}>
                                Are you sure you want to delete{' '}
                                {adminToDelete?.full_name || 'this administrator'}?
                            </Text>

                            <View style={styles.deleteModalActions}>
                                <TouchableOpacity
                                    style={styles.cancelDeleteButton}
                                    onPress={() => {
                                        setDeleteModalVisible(false);
                                        setAdminToDelete(null);
                                    }}
                                >
                                    <Text style={styles.cancelDeleteText}>CANCEL</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.confirmDeleteButton}
                                    onPress={confirmDeleteAdmin}
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

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        setEditMode(false);
                        setShowForm(true);
                    }}
                >
                    <Text style={styles.addButtonText}>+ CREATE ADMIN</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.formContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formHeader}>
                        <TouchableOpacity
                            style={styles.backButtonContainer}
                            onPress={handleExitCreateAdmin}
                        >
                            <Text style={styles.backButton}>‹</Text>
                        </TouchableOpacity>

                        <View style={styles.formTitleContainer}>
                            <Text style={styles.title}>
                                {editMode ? 'Edit Admin' : 'Create Admin'}
                            </Text>

                            <Text style={styles.subtitle}>
                                {editMode
                                    ? 'Update GoldKing administrator details'
                                    : 'Add a new GoldKing administrator'}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.exitButton} onPress={handleExitCreateAdmin}>
                            <Text style={styles.exitButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Full Name</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter full name"
                        placeholderTextColor="#777777"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                    <Text style={styles.label}>Shop Name</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter shop name"
                        placeholderTextColor="#777777"
                        value={shopName}
                        onChangeText={setShopName}
                    />

                    <Text style={styles.label}>Email</Text>

                    <TextInput
                        style={[styles.input, editMode && styles.disabledInput]}
                        placeholder="Enter email"
                        placeholderTextColor="#777777"
                        value={email}
                        onChangeText={editMode ? undefined : setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!editMode}
                    />
                    <Text style={styles.label}>Phone</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter phone number"
                        placeholderTextColor="#777777"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>City</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter city"
                        placeholderTextColor="#777777"
                        value={city}
                        onChangeText={setCity}
                    />

                    <Text style={styles.label}>Exact Address</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter address"
                        placeholderTextColor="#777777"
                        value={address}
                        onChangeText={setAddress}
                    />

                    {!editMode && (
                        <>
                            <Text style={styles.label}>Password</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Enter password"
                                placeholderTextColor="#777777"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </>
                    )}
                    <TouchableOpacity
                        style={[styles.createButton, loading && styles.disabledButton]}
                        onPress={editMode ? handleUpdateAdmin : handleCreateAdmin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#111111" />
                        ) : (
                            <Text style={styles.createButtonText}>
                                {editMode ? 'SAVE CHANGES' : 'CREATE ADMIN'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    adminListContainer: {
        flex: 1,
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
    flex: {
        flex: 1,
    },

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

    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    backButtonContainer: {
        width: 52,
        height: 52,
        borderRadius: 21,
        borderWidth: 0,
        borderColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    formTitleContainer: {
        flex: 1,
    },

    exitButton: {
        width: 32,
        height: 32,
        borderRadius: 21,
        borderColor: '#555555',
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
    },

    exitButtonText: {
        color: '#D4AF37',
        fontSize: 20,
        fontWeight: '700',
    },

    menuButton: {
        color: '#D4AF37',
        fontSize: 30,
        marginRight: 18,
    },

    backButton: {
        color: '#D4AF37',
        fontSize: 42,
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

    adminScrollContent: {
        paddingBottom: 140,
    },

    formContent: {
        padding: 24,
        paddingBottom: 50,
    },

    heading: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 1,
    },

    label: {
        color: '#D4AF37',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
    },

    input: {
        height: 54,
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        color: '#FFFFFF',
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 20,
    },

    addButton: {
        position: 'absolute',
        bottom: 15,
        left: 24,
        right: 24,
        height: 55,
        borderRadius: 12,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
    },

    addButtonText: {
        color: '#111111',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 1,
    },

    createButton: {
        height: 56,
        borderRadius: 12,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },

    createButtonText: {
        color: '#111111',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },

    disabledButton: {
        opacity: 0.6,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },

    disabledInput: {
        backgroundColor: '#151515',
        color: '#666666',
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

    adminCard: {
        backgroundColor: '#181818',
        borderWidth: 1,
        borderColor: '#2D2D2D',
        borderRadius: 15,
        padding: 10,
        marginBottom: 10,
    },

    adminHeader: {
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

    adminInfo: {
        flex: 1,
    },

    adminName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    adminEmail: {
        color: '#777777',
        fontSize: 11,
        marginTop: 4,
    },

    statusBadge: {
        backgroundColor: '#17301F',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 10,
    },

    statusText: {
        color: '#55C878',
        fontSize: 10,
        fontWeight: '700',
    },

    divider: {
        height: 1,
        backgroundColor: '#292929',
        marginVertical: 14,
    },

    adminDetail: {
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
        height: 30,
        borderWidth: 1,
        borderColor: '#D4AF37',
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },

    viewButtonText: {
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: '800',
    },

    editButton: {
        flex: 1,
        height: 30,
        backgroundColor: '#D4AF37',
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },

    editButtonText: {
        color: '#111111',
        fontSize: 11,
        fontWeight: '800',
    },
    adminShop: {
        color: '#D4AF37',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
    deleteButton: {
        flex: 1,
        height: 30,
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
});

export default AdminManagementScreen;
