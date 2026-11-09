import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../constants/theme';
import type { IconName } from '../types/icon';

interface InfoRowProps {
  icon: IconName;
  label: string;
  value: string;
}

/** One "label: value" line on the User Details screen. */
export default function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={colors.primary} style={styles.icon} />
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} selectable>
          {value || 'Not provided'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  icon: {
    marginTop: 2,
    marginRight: spacing.md,
  },
  texts: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  value: {
    marginTop: 2,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
});
