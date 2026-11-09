# 05 · CRUD Internal Implementation

This document follows each CRUD operation **through the code**, from the moment a finger touches the
screen until the UI shows the result. Every operation follows the same chain:

```text
Button Click
    │
    ▼
Screen Function        (src/screens/...)       what the user wants to do
    │
    ▼
Custom Hook            (src/hooks/useUsers.ts) state + business rules
    │
    ▼
User Service           (src/services/userService.ts)   which URL / method
    │
    ▼
Axios Client           (src/services/apiClient.ts)     sends the HTTP request
    │
    ▼
Fake REST API          (jsonplaceholder.typicode.com)
    │
    ▼
Response               (JSON → JavaScript object, shape checked)
    │
    ▼
React State Update     (setUsers / setSessionChanges ...)
    │
    ▼
UI Re-render           (React calls the screens again, the phone shows the change)
```

---

## 1. READ: loading the list (`GET /users`)

### Step 1 · Trigger: the screen appears

There is no button for the first load: it starts when Home **mounts**.

```tsx
// src/screens/HomeScreen.tsx
useEffect(() => {
  loadUsers();
}, [loadUsers]);
```

`useEffect` runs **after** the first render (which shows the spinner, because `isLoading` starts as
`true`). `loadUsers` is wrapped in `useCallback` in the hook, so its identity never changes and the
effect runs **once**.

### Step 2 · Custom hook

```ts
// src/hooks/useUsers.ts
const fetchUsers = useCallback(async (mode: 'initial' | 'refresh') => {
  const setBusy = mode === 'initial' ? setIsLoading : setIsRefreshing;
  setBusy(true);
  setError(null);
  try {
    const data = await userService.getUsers(); // GET /users
    setUsers(data);
    setSessionChanges({});
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setBusy(false);
  }
}, []);

const loadUsers = useCallback(() => fetchUsers('initial'), [fetchUsers]);
```

- `await` pauses **this function** (not the app) until the answer arrives.
- `try / catch / finally` guarantees the spinner always stops, even on failure.

### Step 3 · User service

```ts
// src/services/userService.ts
export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>(API_ENDPOINTS.users);   // '/users'
  const data: unknown = response.data;
  if (!Array.isArray(data) || !data.every(isUserLike)) {
    throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
  }
  return data as User[];
};
```

### Step 4 · Axios client → fake API → response

`apiClient.get('/users')` combines the base URL, headers and timeout, logs `[API] -> GET /users`,
and sends `GET https://jsonplaceholder.typicode.com/users`. The API answers `200 OK` with a JSON
array, and Axios parses it into `response.data`.

### Step 5 · React state update → re-render

`setUsers(data)` and `setBusy(false)` schedule a re-render of `UsersProvider`. Its context value
changes, so **every** screen using `useUsersContext()` re-renders. HomeScreen now passes the array to
`FlatList`:

```tsx
<FlatList
  data={users}
  keyExtractor={(item) => String(item.id)}
  renderItem={renderUser}
  refreshing={isRefreshing}
  onRefresh={handleRefresh}
  ...
/>
```

`keyExtractor` gives each row a stable **key** (the id), so React knows which row is which when the
list changes later. That is one reason duplicate ids would be a bug (see Create).

---

## 2. READ: one user's details (`GET /users/{id}`)

| Step | Code |
|---|---|
| **Click** | Tapping a card calls `onView(user)` → Home's `openDetails` → `navigation.navigate('UserDetails', { userId: user.id })` |
| **Screen** | `UserDetailsScreen` reads `route.params.userId` and calls `useUserDetails(userId)` |
| **Hook** | `useUserDetails` decides whether to fetch (only for users **not** changed in this session), then calls `getUserById(userId)` inside `useEffect` |
| **Service** | `apiClient.get<User>(API_ENDPOINTS.userById(id))` → `'/users/2'`, then `ensureUser(response.data)` |
| **API** | `GET /users/2` → `200 OK` + full JSON including `address` and `company` |
| **State** | `setServerUser(data)`, `setIsLoading(false)` (only if `isActive`, i.e. the screen is still open) |
| **Re-render** | The screen switches from `<LoadingIndicator>` to the details sections |

Which copy is shown is decided in one line at the end of the hook:

```ts
user: hasLocalChanges ? sessionUser : (serverUser ?? sessionUser),
```

---

## 3. CREATE: add a user (`POST /users`)

### Step 1 · Button click

The **+** button on Home navigates to the form:

```tsx
<Pressable onPress={() => navigation.navigate('AddUser')} accessibilityLabel="Add user" ...>
```

On the form, **Save User** is a `CustomButton` whose `onPress` is the form's `handleSubmit`.

### Step 2 · Screen function (form + screen)

```tsx
// src/components/UserForm.tsx
const handleSubmit = async () => {
  const validationErrors = validateUserForm(values);
  setErrors(validationErrors);
  if (hasErrors(validationErrors)) {
    return;                       // stop: never send invalid data to the API
  }
  setIsSubmitting(true);          // disables the button, prevents double submits
  try {
    await onSubmit(toUserRequest(values));   // trimmed values
  } finally {
    setIsSubmitting(false);
  }
};
```

`onSubmit` is the screen's function:

```tsx
// src/screens/AddUserScreen.tsx
const handleCreate = async (values: UserRequest) => {
  try {
    const createdUser = await addUser(values);
    Alert.alert('User created', `${createdUser.name} was added to the list (id ${createdUser.id}).`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  } catch (err) {
    Alert.alert('Could not create user', getErrorMessage(err));
  }
};
```

### Step 3 · Custom hook

```ts
// src/hooks/useUsers.ts
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

    setUsers((current) => [newUser, ...current]);
    setSessionChanges((current) => ({ ...current, [newUser.id]: 'created' }));
    return newUser;
  },
  [users, sessionChanges],
);
```

Points to notice:

- The state is updated only **after** `await createUser(...)` succeeded. If it throws, nothing changes.
- `setUsers((current) => [...])` uses the **functional form**: React passes the latest state, which is
  safer than using a possibly stale variable.
- A **new array** is created (`[newUser, ...current]`). React only notices changes when it gets a
  **new** object or array; `users.push(newUser)` would mutate the old array and React would not re-render.

### Step 4 · Service → Axios → API

```ts
export const createUser = async (user: UserRequest): Promise<UserResponse> => {
  const response = await apiClient.post<UserResponse>(API_ENDPOINTS.users, user);
  return ensureUser(response.data);
};
```

`POST /users` with the JSON body → `201 Created` → `{ ...body, id: 11 }`.

### Step 5 · State update → re-render

The new user is at index 0 of `users`, and `sessionChanges[11] = 'created'`. When the user taps
**OK**, `goBack()` reveals Home, which re-renders with **one more card** and a green **"New"** badge
(`UserCard` receives `sessionChange={sessionChanges[item.id]}`).

---

## 4. UPDATE: edit a user (`PUT /users/{id}`)

### Step 1 · Button click

The pencil icon on a card (`onEdit` → `navigation.navigate('EditUser', { userId })`) or the
**Edit User** button on the details screen.

### Step 2 · Screen function

```tsx
// src/screens/EditUserScreen.tsx
const user = findUser(userId);            // load from shared state
// ...
const handleUpdate = async (values: UserRequest) => {
  try {
    const updatedUser = await editUser(userId, values);
    Alert.alert('User updated', `${updatedUser.name} was updated.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  } catch (err) {
    Alert.alert('Update failed', `${getErrorMessage(err)}\n\nYour changes were not applied.`);
  }
};

return <UserForm initialValues={toFormValues(user)} submitLabel="Update User" onSubmit={handleUpdate} notice={notice} />;
```

`toFormValues(user)` **pre-fills** the form. The form is the same `UserForm`, with the same validation.

### Step 3 · Custom hook

```ts
const editUser = useCallback(
  async (id: number, input: UserRequest): Promise<User> => {
    const existing = users.find((user) => user.id === id);
    if (!existing) throw new Error('This user is no longer in the list.');

    const wasCreatedLocally = sessionChanges[id] === 'created';
    const changes = wasCreatedLocally ? input : await userService.updateUser(id, input); // PUT

    const updatedUser: User = { ...existing, ...changes, id };   // merge: keeps address/company

    setUsers((current) => current.map((user) => (user.id === id ? updatedUser : user)));
    setSessionChanges((current) => ({
      ...current,
      [id]: current[id] === 'created' ? 'created' : 'updated',
    }));
    return updatedUser;
  },
  [users, sessionChanges],
);
```

- **Merge with spread:** `{ ...existing, ...changes }` starts with all old fields, then overwrites the
  ones that changed. `address` and `company` survive even though the PUT response does not contain them.
- **`.map()`** builds a new array where only the edited user is replaced.
- Users created in this session skip the request, because the fake server would answer `404`.

### Step 4 · Service → Axios → API

```ts
export const updateUser = async (id: number, user: UserRequest): Promise<UserResponse> => {
  const response = await apiClient.put<UserResponse>(API_ENDPOINTS.userById(id), user);
  return ensureUser(response.data);
};
```

`PUT /users/1` → `200 OK` → `{ ...body, id: 1 }`.

### Step 5 · State update → re-render

Home shows the new name and an amber **"Edited"** badge. If you open the details, the screen shows
*"Source: app memory (this session)"*, because re-fetching from the fake server would return the old name.

---

## 5. DELETE: remove a user (`DELETE /users/{id}`)

### Step 1 · Button click

The trash icon: `IconButton` → `onPress={() => onDelete(user)}` → Home's `confirmDelete(user)`.

### Step 2 · Screen functions (confirm, then delete)

```tsx
// src/screens/HomeScreen.tsx
const confirmDelete = useCallback((user: User) => {
  Alert.alert('Delete user?', `Are you sure you want to delete ${user.name}?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => deleteConfirmed(user) },
  ]);
}, [deleteConfirmed]);

const deleteConfirmed = useCallback(async (user: User) => {
  setDeletingId(user.id);                      // spinner on this card
  try {
    await removeUser(user.id);
    Alert.alert('User deleted', `${user.name} was removed from the list.`);
  } catch (err) {
    Alert.alert('Delete failed', `${getErrorMessage(err)}\n\n${user.name} was not removed.`);
  } finally {
    setDeletingId(null);
  }
}, [removeUser]);
```

`Alert.alert` does **not** wait. It shows the dialog and returns immediately. The actual deletion
happens later, inside the **Delete** button's `onPress`.

### Step 3 · Custom hook

```ts
const removeUser = useCallback(async (id: number): Promise<void> => {
  await userService.deleteUser(id);            // if this throws, nothing below runs

  setUsers((current) => current.filter((user) => user.id !== id));
  setSessionChanges((current) => {
    const next = { ...current };
    if (next[id] === 'created') delete next[id];
    else next[id] = 'deleted';
    return next;
  });
}, []);
```

`.filter()` returns a **new** array without the deleted user.

### Step 4 · Service → Axios → API

```ts
export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.userById(id));
};
```

`DELETE /users/1` → `200 OK` → `{}`.

### Step 5 · State update → re-render

`FlatList` receives a shorter array and removes the row. The header shows *"9 users"* and
*"1 unsaved change(s) in this session"*. On failure the user is still in the list, because state
was never touched.

---

## 6. REFRESH: back to the server's data

`handleRefresh` (Refresh button or pull-to-refresh) → if `sessionChanges` is not empty, show an
`Alert` explaining the fake API → `refreshUsers()` → the same `fetchUsers` as the first load, but with
`isRefreshing`. On success, `setSessionChanges({})` clears all badges, because the list is again
exactly what the server has.

---

## 7. Summary table

| Operation | Click | Screen function | Hook function | Service | HTTP | State change |
|---|---|---|---|---|---|---|
| List | (mount) | `useEffect` in `HomeScreen` | `loadUsers` | `getUsers` | `GET /users` | `setUsers(data)` |
| Details | Card | `UserDetailsScreen` | `useUserDetails` | `getUserById` | `GET /users/{id}` | `setServerUser` |
| Create | Save User | `handleCreate` | `addUser` | `createUser` | `POST /users` | prepend + `'created'` |
| Update | Update User | `handleUpdate` | `editUser` | `updateUser` | `PUT /users/{id}` | replace + `'updated'` |
| Delete | Trash → Delete | `confirmDelete` → `deleteConfirmed` | `removeUser` | `deleteUser` | `DELETE /users/{id}` | filter + `'deleted'` |
| Refresh | Refresh / pull | `handleRefresh` | `refreshUsers` | `getUsers` | `GET /users` | replace all, clear changes |

---

**Next:** [06 · React Native Components and Hooks →](06-react-native-components-and-hooks.md)
