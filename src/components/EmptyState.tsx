import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../constants/theme';
import type { IconName } from '../types/icon';
import CustomButton from './CustomButton';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  /** When both are given, a button is shown (e.g. "Try again"). */
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * A centred message with an icon. Used for:
 *  - an empty list ("No users yet"),
 *  - a failed request ("Could not load users" + Try again),
 *  - a missing record ("User not found").
 */
export default function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <CustomButton title={actionLabel} onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
