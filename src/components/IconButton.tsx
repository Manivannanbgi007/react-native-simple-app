import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '../constants/theme';
import type { IconName } from '../types/icon';

interface IconButtonProps {
  icon: IconName;
  /** Read aloud by screen readers, and used to find the button in tests. */
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

/** A small round button that only shows an icon (used for edit / delete). */
export default function IconButton({
  icon,
  label,
  onPress,
  color = colors.textSecondary,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      // hitSlop enlarges the touch area so small icons are easier to tap.
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.background,
  },
});
