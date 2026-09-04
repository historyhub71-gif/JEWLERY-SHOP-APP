import React from 'react';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme';

type Props = {
    icon: LucideIcon;
    size?: number;
    color?: string;
    strokeWidth?: number;
};

const GoldIcon = ({
    icon: Icon,
    size = 20,
    color = colors.gold,
    strokeWidth = 1.8,
}: Props) => <Icon size={size} color={color} strokeWidth={strokeWidth} />;

export default GoldIcon;
