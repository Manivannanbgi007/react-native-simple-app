import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '../components/CustomButton';
import EmptyState from '../components/EmptyState';
import InfoRow from '../components/InfoRow';
import LoadingIndicator from '../components/LoadingIndicator';
import MessageBanner from '../components/MessageBanner';
import { colors, radius, spacing } from '../constants/theme';
import { useUserDetails } from '../hooks/useUserDetails';
import type { UserDetailsScreenProps } from '../navigation/types';
import { formatAddress, getInitials } from '../utils/formatters';

/** Shows every field of one user. Reached by tapping a card on the Home screen. */
export default function UserDetailsScreen({ route, navigation }: UserDetailsScreenProps) {
  // The id was passed by HomeScreen: navigation.navigate('UserDetails', { userId })
  const { userId } = route.params;
  const { user, isLoading, error, sessionChange, source, reload } = useUserDetails(userId);
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return <LoadingIndicator message="Loading user details..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Could not load this user"
        message={error}
        actionLabel="Try again"
        onAction={reload}
      />
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon="person-remove-outline"
        title="User not found"
        message="This user may have been deleted."
        actionLabel="Back to list"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const sessionNotice =
    sessionChange === 'created'
      ? 'This user was created in this session. JSONPlaceholder did not really store it, ' +
        'so these details come from the app memory and disappear after a refresh or restart.'
      : sessionChange === 'updated'
        ? 'You edited this user in this session. The fake API did not save the change, ' +
          'so these details come from the app memory, not from the server.'
        : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
    >
      {/* Header card: avatar, name and username */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.source}>
          {source === 'server' ? `Source: GET /users/${user.id}` : 'Source: app memory (this session)'}
        </Text>
      </View>

      {sessionNotice ? <MessageBanner type="info" message={sessionNotice} /> : null}

      <Section title="Contact">
        <InfoRow icon="finger-print-outline" label="User ID" value={String(user.id)} />
        <InfoRow icon="mail-outline" label="Email" value={user.email} />
        <InfoRow icon="call-outline" label="Phone" value={user.phone} />
        <InfoRow icon="globe-outline" label="Website" value={user.website} />
      </Section>

      <Section title="Address">
        <InfoRow icon="location-outline" label="Address" value={formatAddress(user.address)} />
      </Section>

      <Section title="Company">
        <InfoRow icon="business-outline" label="Company" value={user.company?.name ?? 'Not provided'} />
        {user.company ? (
          <InfoRow icon="chatbubble-outline" label="Catch phrase" value={user.company.catchPhrase} />
        ) : null}
      </Section>

      <CustomButton
        title="Edit User"
        icon="create-outline"
        onPress={() => navigation.navigate('EditUser', { userId: user.id })}
        style={styles.button}
      />
      <CustomButton
        title="Back to list"
        icon="arrow-back"
        variant="secondary"
        onPress={() => navigation.goBack()}
        style={styles.button}
      />
    </ScrollView>
  );
}

/** A white card with a heading. Only used on this screen. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  headerCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  username: {
    marginTop: 2,
    fontSize: 15,
    color: colors.textSecondary,
  },
  source: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
  },
  section: {
    padding: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  button: {
    marginBottom: spacing.md,
  },
});
