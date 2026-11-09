import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '../components/CustomButton';
import EmptyState from '../components/EmptyState';
import LoadingIndicator from '../components/LoadingIndicator';
import MessageBanner from '../components/MessageBanner';
import UserCard from '../components/UserCard';
import { colors, radius, spacing } from '../constants/theme';
import { useUsersContext } from '../context/UsersContext';
import type { HomeScreenProps } from '../navigation/types';
import type { User } from '../types/User';
import { getErrorMessage } from '../utils/errorHandling';

/**
 * Home screen: shows the list of users and is the starting point of every
 * CRUD flow (add, view, edit, delete, refresh).
 */
export default function HomeScreen({ navigation }: HomeScreenProps) {
  const {
    users,
    isLoading,
    isRefreshing,
    error,
    sessionChanges,
    loadUsers,
    refreshUsers,
    removeUser,
  } = useUsersContext();
  const insets = useSafeAreaInsets();

  // Which user is being deleted right now (to show a spinner on that card).
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Workflow 1: load the users once, when this screen first appears ("mounts").
  // loadUsers never changes (it is wrapped in useCallback), so this runs once.
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const sessionChangeCount = Object.keys(sessionChanges).length;

  const handleRefresh = useCallback(() => {
    if (sessionChangeCount === 0) {
      refreshUsers();
      return;
    }
    // Be honest with the user: the fake API never stored their changes.
    Alert.alert(
      'Reload original data?',
      `You made ${sessionChangeCount} change(s) in this session. JSONPlaceholder is a fake API ` +
        'and did not really save them, so reloading brings back the original users.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reload', style: 'destructive', onPress: () => refreshUsers() },
      ],
    );
  }, [sessionChangeCount, refreshUsers]);

  const openDetails = useCallback(
    (user: User) => navigation.navigate('UserDetails', { userId: user.id }),
    [navigation],
  );

  const openEdit = useCallback(
    (user: User) => navigation.navigate('EditUser', { userId: user.id }),
    [navigation],
  );

  /** Runs only after the user confirmed the dialog. */
  const deleteConfirmed = useCallback(
    async (user: User) => {
      setDeletingId(user.id);
      try {
        await removeUser(user.id); // DELETE /users/{id}, then removed from state
        Alert.alert('User deleted', `${user.name} was removed from the list.`);
      } catch (err) {
        // The record is still in the list because removeUser threw before updating state.
        Alert.alert('Delete failed', `${getErrorMessage(err)}\n\n${user.name} was not removed.`);
      } finally {
        setDeletingId(null);
      }
    },
    [removeUser],
  );

  // Workflow 4, step 2: ask for confirmation before deleting anything.
  const confirmDelete = useCallback(
    (user: User) => {
      Alert.alert('Delete user?', `Are you sure you want to delete ${user.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteConfirmed(user) },
      ]);
    },
    [deleteConfirmed],
  );

  // FlatList calls this for each visible row only (not all rows at once).
  const renderUser = useCallback(
    ({ item }: { item: User }) => (
      <UserCard
        user={item}
        sessionChange={sessionChanges[item.id]}
        isDeleting={deletingId === item.id}
        onView={openDetails}
        onEdit={openEdit}
        onDelete={confirmDelete}
      />
    ),
    [sessionChanges, deletingId, openDetails, openEdit, confirmDelete],
  );

  // ----- Render: pick the right state to show -----

  if (isLoading) {
    return <LoadingIndicator message="Loading users..." />;
  }

  if (error && users.length === 0) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Could not load users"
        message={error}
        actionLabel="Try again"
        onAction={loadUsers}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderUser}
        // Pull down on the list to refresh.
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={[styles.listContent, { paddingBottom: 96 + insets.bottom }]}
        ListHeaderComponent={
          <>
            <View style={styles.summary}>
              <View style={styles.summaryText}>
                <Text style={styles.summaryCount}>
                  {users.length} {users.length === 1 ? 'user' : 'users'}
                </Text>
                <Text style={styles.summaryCaption}>
                  {sessionChangeCount > 0
                    ? `${sessionChangeCount} unsaved change(s) in this session`
                    : 'Loaded from JSONPlaceholder (fake API)'}
                </Text>
              </View>
              <CustomButton
                title="Refresh"
                icon="refresh"
                variant="secondary"
                onPress={handleRefresh}
                loading={isRefreshing}
              />
            </View>
            {error ? <MessageBanner type="error" message={`Could not refresh: ${error}`} /> : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No users yet"
            message="Tap the + button to add a user, or Refresh to reload the original data."
          />
        }
      />

      {/* Floating "Add user" button. Workflow 2 starts here. */}
      <Pressable
        onPress={() => navigation.navigate('AddUser')}
        accessibilityRole="button"
        accessibilityLabel="Add user"
        style={({ pressed }) => [
          styles.fab,
          { bottom: spacing.xl + insets.bottom },
          pressed && styles.fabPressed,
        ]}
      >
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryText: {
    flex: 1,
    marginRight: spacing.md,
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  summaryCaption: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow: elevation on Android, shadow* on iOS.
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabPressed: {
    backgroundColor: colors.primaryPressed,
  },
});
