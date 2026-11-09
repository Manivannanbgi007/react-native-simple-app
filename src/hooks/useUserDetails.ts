import { useCallback, useEffect, useState } from 'react';

import { useUsersContext } from '../context/UsersContext';
import { getUserById } from '../services/userService';
import type { SessionChange, User } from '../types/User';
import { getErrorMessage } from '../utils/errorHandling';

/**
 * useUserDetails: loads ONE user for the User Details screen.
 *
 * Which copy of the user do we show?
 *  - Unchanged users: we call `GET /users/{id}` to fetch the full record
 *    from the server (this is the "Read" in CRUD).
 *  - Users created or edited in this session: the fake server does not know
 *    about those changes (it would return 404 or the old data), so we show
 *    the copy kept in the app's shared state instead and skip the request.
 */

export interface UserDetailsState {
  user: User | undefined;
  isLoading: boolean;
  error: string | null;
  /** 'created' / 'updated' when the record only exists like this in the app. */
  sessionChange: SessionChange | undefined;
  /** Where the displayed data came from, shown on screen for learning purposes. */
  source: 'server' | 'session';
  reload: () => void;
}

export function useUserDetails(userId: number): UserDetailsState {
  const { findUser, sessionChanges } = useUsersContext();
  const sessionUser = findUser(userId);
  const sessionChange = sessionChanges[userId];
  const hasLocalChanges = sessionChange === 'created' || sessionChange === 'updated';

  const [serverUser, setServerUser] = useState<User | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!hasLocalChanges);
  const [error, setError] = useState<string | null>(null);
  // Changing this number re-runs the effect below (used by the "Try again" button).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (hasLocalChanges) {
      return; // nothing to fetch, see the explanation above
    }

    // `isActive` becomes false when the screen unmounts (user pressed Back)
    // or the effect re-runs. We then ignore the late response, so we never
    // update the state of a screen that is no longer shown.
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getUserById(userId); // GET /users/{id}
        if (isActive) setServerUser(data);
      } catch (err) {
        if (isActive) setError(getErrorMessage(err));
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    load();

    // Cleanup function: React calls it before the next run and on unmount.
    return () => {
      isActive = false;
    };
  }, [userId, hasLocalChanges, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return {
    user: hasLocalChanges ? sessionUser : (serverUser ?? sessionUser),
    isLoading: !hasLocalChanges && isLoading,
    error: hasLocalChanges ? null : error,
    sessionChange,
    source: hasLocalChanges ? 'session' : 'server',
    reload,
  };
}
