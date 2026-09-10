import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, Home, Menu } from 'lucide-react-native';
import { colors, spacing } from '../../theme';

type Props = {
    title: string;
    subtitle?: string;
    navigation: any;
    back?: boolean;
    home?: boolean;
};

const ScreenHeader = ({ title, subtitle, navigation, back = false, home = false }: Props) => (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity
                accessibilityLabel={back ? 'Go back' : 'Open menu'}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => (back ? navigation.goBack() : navigation.openDrawer())}
                style={styles.iconButton}
            >
                {back ? (
                    <ArrowLeft color={colors.gold} size={22} />
                ) : (
                    <Menu color={colors.gold} size={24} />
                )}
            </TouchableOpacity>
            <View style={styles.heading}>
                <Text numberOfLines={1} style={styles.title}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text numberOfLines={1} style={styles.subtitle}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            {home ? (
                <TouchableOpacity
                    accessibilityLabel="Open home"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() =>
                        navigation.navigate('Dashboard', {
                            screen: 'Home',
                        })
                    }
                    style={styles.iconButton}
                >
                    <Home color={colors.gold} size={21} />
                </TouchableOpacity>
            ) : (
                <View style={styles.iconButton} />
            )}
        </View>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    safeArea: { backgroundColor: colors.background },
    header: {
        alignItems: 'center',
        borderBottomColor: colors.borderSoft,
        borderBottomWidth: 1,
        flexDirection: 'row',
        minHeight: 72,
        paddingHorizontal: spacing.md,
    },
    iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
    heading: { flex: 1, marginHorizontal: spacing.sm },
    title: { color: colors.gold, fontSize: 16, fontWeight: '800', letterSpacing: 1.4 },
    subtitle: { color: colors.textSubtle, fontSize: 11, marginTop: 4 },
});

export default ScreenHeader;
