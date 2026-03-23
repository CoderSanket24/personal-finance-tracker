import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppColors } from '../theme';

export const PrivacyBadge: React.FC = () => (
  <View style={styles.badge}>
    <Text style={styles.icon}>🔒</Text>
    <Text style={styles.text}>On-Device AI · No cloud · 100% private</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.accentGreen + '15',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: AppColors.accentGreen + '44',
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 13, marginRight: 6 },
  text: {
    fontSize: 11,
    color: AppColors.accentGreen,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
