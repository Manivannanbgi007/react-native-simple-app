import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../constants/theme';
import type { SessionChange, User } from '../types/User';
import { getInitials } from '../utils/formatters';
import IconButton from './IconButton';

interface UserCardProps {
  user: User;
  /** Set when the user was created/edited in this session (shows a badge). */
  sessionChange?: SessionChange;
  /** True while the DELETE request for this user is running. */
  isDeleting?: boolean;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

/**
 * One row of the user list.
 *
 * The card does not know HOW to view, edit or delete a user. It only calls
 * the functions it received as props. The parent screen (HomeScreen) decides
 * what happens. This keeps the card simple and reusable.
 */
export default function UserCard({
  user,
  sessionChange,
  isDeleting = false,
  onView,
  onEdit,
  onDelete,
}: UserCardProps) {
  return (
    <Pressable
      onPress={() => onView(user)}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${user.name}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          {sessionChange === 'created' ? <Badge label="New" variant="new" /> : null}
          {sessionChange === 'updated' ? <Badge label="Edited" variant="edited" /> : null}
        </View>
        <Text style={styles.username} numberOfLines={1}>
          @{user.username}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {user.email}
        </Text>
        <Text style={styles.viewDetails}>View details ›</Text>
      </View>

      <View style={styles.actions}>
        <IconButton
          icon="create-outline"
          label={`Edit ${user.name}`}
          color={colors.primary}
          onPress={() => onEdit(user)}
          disabled={isDeleting}
        />
        {isDeleting ? (
          <View style={styles.deleting}>
            <ActivityIndicator size="small" color={colors.danger} />
          </View>
        ) : (
          <IconButton
            icon="trash-outline"
            label={`Delete ${user.name}`}
            color={colors.danger}
            onPress={() => onDelete(user)}
          />
        )}
      </View>
    </Pressable>
  );
}

/** Small label next to the name. Only used inside this file. */
function Badge({ label, variant }: { label: string; variant: 'new' | 'edited' }) {
  const isNew = variant === 'new';
  return (
    <View style={[styles.badge, { backgroundColor: isNew ? colors.successLight : colors.warningLight }]}>
      <Text style={[styles.badgeText, { color: isNew ? colors.success : colors.warning }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    backgroundColor: colors.primaryLight,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    marginTop: 2,
    fontSize: 14,
    color: colors.textSecondary,
  },
  email: {
    marginTop: 2,
    fontSize: 14,
    color: colors.textSecondary,
  },
  viewDetails: {
    marginTop: spacing.xs + 2,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  actions: {
    marginLeft: spacing.sm,
    gap: spacing.xs,
  },
  deleting: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
