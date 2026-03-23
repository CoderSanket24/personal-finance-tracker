import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Category } from '../types/finance';
import { AppColors } from '../theme';

interface CategoryBadgeProps {
  category: Category;
  selected?: boolean;
  onPress?: () => void;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  selected = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.badge,
        { borderColor: category.color, backgroundColor: selected ? category.color + '33' : 'transparent' },
      ]}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{category.icon}</Text>
      <Text style={[styles.label, { color: selected ? category.color : AppColors.textSecondary }]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  icon: { fontSize: 14, marginRight: 5 },
  label: { fontSize: 12, fontWeight: '600' },
});
