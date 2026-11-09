import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../constants/theme';
import type { IconName } from '../types/icon';

type BannerType = 'info' | 'error';

interface MessageBannerProps {
  type: BannerType;
  message: string;
}

const bannerConfig: Record<BannerType, { icon: IconName; color: string; background: string }> = {
  info: { icon: 'information-circle-outline', color: colors.info, background: colors.infoLight },
  error: { icon: 'alert-circle-outline', color: colors.danger, background: colors.dangerLight },
};

/** An inline coloured message, e.g. "Could not refresh" above the list. */
export default function MessageBanner({ type, message }: MessageBannerProps) {
  const config = bannerConfig[type];

  return (
    <View
      style={[styles.banner, { backgroundColor: config.background }]}
      accessibilityRole={type === 'error' ? 'alert' : 'text'}
    >
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
