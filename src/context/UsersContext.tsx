import { createContext, useContext, type ReactNode } from 'react';

import { useUsers, type UsersState } from '../hooks/useUsers';

/**
 * Why do we need a Context?
 *
 * Every call to a hook creates its OWN separate state. If HomeScreen and
 * AddUserScreen each called `useUsers()`, they would hold two different
 * lists, and a user created on the Add screen would never appear on Home.
 *
 * So we call `useUsers()` exactly once, here in <UsersProvider>, and share the
 * result with every screen through React Context. Screens read it with
 * `useUsersContext()`. This is React's built-in way to share state, so we do
 * not need Redux or any other library for an app of this size.
 */
const UsersContext = createContext<UsersState | undefined>(undefined);

export function UsersProvider({ children }: { children: ReactNode }) {
  const usersState = useUsers();
  // React 19 lets us render the context itself as the provider.
  return <UsersContext value={usersState}>{children}</UsersContext>;
}

export function useUsersContext(): UsersState {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsersContext must be used inside <UsersProvider>.');
  }
  return context;
}
