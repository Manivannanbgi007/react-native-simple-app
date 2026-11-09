import { useCallback, useState } from 'react';

import * as userService from '../services/userService';
import type { SessionChange, User, UserRequest } from '../types/User';
import { getErrorMessage } from '../utils/errorHandling';

/**
 * useUsers: the "brain" of the app.
 *
 * It owns the list of users in React state and exposes functions to
 * load, create, update and delete users. Each function:
 *   1. calls the user service (which sends the HTTP request),
 *   2. waits for a successful response,
 *   3. updates React state, which makes every screen using it re-render.
 *
 * ---------------------------------------------------------------------------
 * Working with a FAKE API (JSONPlaceholder)
 * ---------------------------------------------------------------------------
 * JSONPlaceholder answers POST/PUT/DELETE as if it worked, but it never saves
 * anything. If we fetched /users again after a change, we would get the
 * original 10 users back. So our strategy is:
 *
 *   - The `users` array in React state is the source of truth for this
 *     session. After a successful API call we apply the change locally.
 *   - `sessionChanges` remembers which records differ from the server
 *     (created / updated / deleted), so the UI can label them and warn
 *     before reloading the original data.
 *   - Everything resets when the app restarts or the list is refreshed,
 *     because the data then comes from the server again.
 *
 * Two quirks of the fake server are handled here:
 *   - POST always returns `id: 11`. Creating two users would give two
 *     users with the same id, so we pick a free id when 11 is taken.
 *   - Users created in this session do not exist on the server, so
 *     `PUT /users/{id}` answers 404 for them. We update them locally only.
 *
 * This hook is called ONCE, inside <UsersProvider> (src/context/UsersContext.tsx),
 * so all screens share the same list. Screens use `useUsersContext()`.
 */

export interface UsersState {
  users: User[];
  /** True while the first load is running (shows a full-screen spinner). */
  isLoading: boolean;
  /** True while a refresh is running (shows the pull-to-refresh spinner). */
  isRefreshing: boolean;
  /** Message of the last failed load/refresh, or null. */
  error: string | null;
  /** Which records were changed locally in this session, by user id. */
  sessionChanges: Record<number, SessionChange>;
  loadUsers: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  addUser: (input: UserRequest) => Promise<User>;
  editUser: (id: number, input: UserRequest) => Promise<User>;
  removeUser: (id: number) => Promise<void>;
  findUser: (id: number) => User | undefined;
}

/**
 * Picks an id that no current or previously deleted user has used.
 * Exported so it can be unit-tested.
 */
export function getNextLocalId(users: User[], usedIds: number[] = []): number {
  const allIds = [...users.map((user) => user.id), ...usedIds];
  return Math.max(0, ...allIds) + 1;
}

export function useUsers(): UsersState {
  const [users, setUsers] = useState<User[]>([]);
  // Starts as true because the Home screen begins loading as soon as it mounts.
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionChanges, setSessionChanges] = useState<Record<number, SessionChange>>({});

  /** Shared by loadUsers and refreshUsers; only the spinner differs. */
  const fetchUsers = useCallback(async (mode: 'initial' | 'refresh') => {
    const setBusy = mode === 'initial' ? setIsLoading : setIsRefreshing;
    setBusy(true);
    setError(null);
    try {
      const data = await userService.getUsers(); // GET /users
      setUsers(data);
      // Fresh server data replaces everything, so local changes are gone.
      setSessionChanges({});
    } catch (err) {
      // Keep whatever list we already had; just remember the error message.
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const loadUsers = useCallback(() => fetchUsers('initial'), [fetchUsers]);
  const refreshUsers = useCallback(() => fetchUsers('refresh'), [fetchUsers]);

  const addUser = useCallback(
    async (input: UserRequest): Promise<User> => {
      const created = await userService.createUser(input); // POST /users

      // JSONPlaceholder always answers id 11. Keep it if it is free, otherwise pick a new one.
      const usedIds = Object.keys(sessionChanges).map(Number);
      const isIdTaken = users.some((user) => user.id === created.id) || usedIds.includes(created.id);
      const newUser: User = {
        ...created,
        id: isIdTaken ? getNextLocalId(users, usedIds) : created.id,
      };

      // Add to the top of the list so the user sees it immediately.
      setUsers((current) => [newUser, ...current]);
      setSessionChanges((current) => ({ ...current, [newUser.id]: 'created' }));
      return newUser;
    },
    [users, sessionChanges],
  );

  const editUser = useCallback(
    async (id: number, input: UserRequest): Promise<User> => {
      const existing = users.find((user) => user.id === id);
      if (!existing) {
        throw new Error('This user is no longer in the list.');
      }

      const wasCreatedLocally = sessionChanges[id] === 'created';
      // The server has never heard of users created in this session (PUT would
      // answer 404), so for them we skip the request and update locally only.
      const changes = wasCreatedLocally ? input : await userService.updateUser(id, input); // PUT /users/{id}

      // PUT returns only the fields we sent, so merge them into the existing
      // record to keep fields like address and company.
      const updatedUser: User = { ...existing, ...changes, id };

      setUsers((current) => current.map((user) => (user.id === id ? updatedUser : user)));
      setSessionChanges((current) => ({
        ...current,
        [id]: current[id] === 'created' ? 'created' : 'updated',
      }));
      return updatedUser;
    },
    [users, sessionChanges],
  );

  const removeUser = useCallback(async (id: number): Promise<void> => {
    // If this request fails, it throws and the lines below never run,
    // so the user stays in the list (the screen shows the error).
    await userService.deleteUser(id); // DELETE /users/{id}

    setUsers((current) => current.filter((user) => user.id !== id));
    setSessionChanges((current) => {
      const next = { ...current };
      if (next[id] === 'created') {
        delete next[id]; // never existed on the server, nothing left to track
      } else {
        next[id] = 'deleted';
      }
      return next;
    });
  }, []);

  const findUser = useCallback((id: number) => users.find((user) => user.id === id), [users]);

  return {
    users,
    isLoading,
    isRefreshing,
    error,
    sessionChanges,
    loadUsers,
    refreshUsers,
    addUser,
    editUser,
    removeUser,
    findUser,
  };
}
