# 06 · React Native Components and Hooks

A reference for every React / React Native building block used in this app, with small examples
**taken from this project**. Open the linked file to see each example in context.

---

## 1. Functional components

A component is a **function** that receives props and returns JSX.

```tsx
// src/components/InfoRow.tsx
interface InfoRowProps {
  icon: IconName;
  label: string;
  value: string;
}

export default function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={colors.primary} style={styles.icon} />
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} selectable>{value || 'Not provided'}</Text>
      </View>
    </View>
  );
}
```

- `{ icon, label, value }` **destructures** the props object.
- `{value || 'Not provided'}`: curly braces put a JavaScript expression inside JSX.
- `StyleSheet.create` at the bottom of the file defines the styles.

Small helpers used by only one file can live in that file, like `Badge` in `UserCard.tsx` or `Section`
in `UserDetailsScreen.tsx`.

## 2. Props

Props are the **inputs** of a component (read-only). They can be data **or functions**.

```tsx
// src/components/CustomButton.tsx: optional props with default values
export default function CustomButton({
  title,
  onPress,
  variant = 'primary',     // default if the parent does not pass it
  icon,
  loading = false,
  disabled = false,
  style,
}: CustomButtonProps) { ... }

// Usage in HomeScreen.tsx
<CustomButton title="Refresh" icon="refresh" variant="secondary" onPress={handleRefresh} loading={isRefreshing} />
```

**Extending built-in props.** `CustomInput` accepts *all* normal `TextInput` props plus its own, and
forwards the rest with the **rest/spread** syntax:

```tsx
interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export default function CustomInput({ label, error, hint, required = false, style, onFocus, onBlur, ...inputProps }: CustomInputProps) {
  return <TextInput {...inputProps} ... />;   // keyboardType, autoCapitalize... are passed through
}
```

## 3. `useState`

Stores a value that **survives re-renders**. Calling the setter **triggers a re-render**.

```tsx
// src/components/UserForm.tsx
const [values, setValues] = useState<UserFormValues>(initialValues);
const [errors, setErrors] = useState<UserFormErrors>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

**Updating objects:** always create a **new** object. Copy the old one with `...`:

```tsx
setValues((current) => ({ ...current, [field]: text }));
```

- `(current) => ...` is the **functional update** form: React gives you the latest value.
  Use it whenever the new state depends on the old state.
- `[field]: text` is a *computed property name*: it sets `name`, `email`... depending on `field`.

## 4. `useEffect`

Runs code **after** React has rendered, for "side effects" such as fetching data, timers or subscriptions.

```tsx
// src/screens/HomeScreen.tsx: run once when the screen mounts
useEffect(() => {
  loadUsers();
}, [loadUsers]);
```

The **dependency array** (`[loadUsers]`) controls *when* it runs:

| Dependency array | When the effect runs |
|---|---|
| `[]` | Once, after the first render |
| `[a, b]` | After the first render, and again whenever `a` or `b` changes |
| *(omitted)* | After **every** render (rarely what you want) |

**Cleanup:** return a function to undo or cancel work. React calls it before re-running the effect
and when the component **unmounts**:

```tsx
// src/hooks/useUserDetails.ts
useEffect(() => {
  let isActive = true;
  // ... start loading, and only call setState if isActive ...
  return () => {
    isActive = false;   // the screen closed: ignore late responses
  };
}, [userId, hasLocalChanges, reloadKey]);
```

See the lifecycle diagram in [03 · G](03-application-workflows.md#g-react-component-lifecycle).

## 5. `useCallback`

Every render creates **new** function objects. `useCallback` returns the **same** function until its
dependencies change.

```tsx
// src/hooks/useUsers.ts
const loadUsers = useCallback(() => fetchUsers('initial'), [fetchUsers]);
```

Why it matters here: Home's effect depends on `loadUsers`. Without `useCallback`, `loadUsers` would be
a new function after every state change, the effect would run again, it would load again, change state
again... an **infinite loop** of requests.

```tsx
// src/screens/HomeScreen.tsx: stable handlers for every list row
const openEdit = useCallback(
  (user: User) => navigation.navigate('EditUser', { userId: user.id }),
  [navigation],
);
```

## 6. `useContext` and custom hooks

**Context** shares a value with every component below a provider, without passing props by hand.
**Custom hooks** are functions starting with `use` that combine other hooks.

```tsx
// Provide (src/context/UsersContext.tsx)
export function UsersProvider({ children }: { children: ReactNode }) {
  const usersState = useUsers();
  return <UsersContext value={usersState}>{children}</UsersContext>;
}

// Consume (any screen)
const { users, addUser, removeUser } = useUsersContext();
```

> In React 19, `<UsersContext value={...}>` is the provider. Older tutorials write
> `<UsersContext.Provider value={...}>`, which does the same thing.

## 7. `FlatList`

Renders long lists **efficiently**: only rows near the screen are rendered, and rows are recycled while
scrolling. The requirements ask for it instead of `ScrollView` + `.map()`, which renders **every** row at once.

```tsx
// src/screens/HomeScreen.tsx
<FlatList
  data={users}                                  // the array
  keyExtractor={(item) => String(item.id)}      // unique, stable key per row
  renderItem={renderUser}                       // how to draw ONE row
  refreshing={isRefreshing}                     // pull-to-refresh spinner
  onRefresh={handleRefresh}                     // called when the user pulls down
  ListHeaderComponent={<>...summary card...</>} // scrolls together with the list
  ListEmptyComponent={<EmptyState ... />}       // shown when data is []
  contentContainerStyle={[styles.listContent, { paddingBottom: 96 + insets.bottom }]}
/>
```

## 8. `TextInput`

The text field. In this app it is **controlled**: its text always comes from React state.

```tsx
// src/components/UserForm.tsx → CustomInput → TextInput
<CustomInput
  label="Email"
  required
  value={values.email}                              // state → field
  onChangeText={(text) => handleChange('email', text)} // field → state
  error={errors.email}
  keyboardType="email-address"                      // shows the @ key
  autoCapitalize="none"
  autoCorrect={false}
  autoComplete="email"
/>
```

Useful props: `keyboardType` (`email-address`, `phone-pad`, `url`, `numeric`), `autoCapitalize`,
`secureTextEntry` (passwords), `placeholder`, `onFocus`, `onBlur`.

## 9. `Pressable`

Makes anything tappable. The `style` prop can be a **function** of the pressed state:

```tsx
// src/components/CustomButton.tsx
<Pressable
  onPress={onPress}
  disabled={isDisabled}
  accessibilityRole="button"
  accessibilityLabel={title}
  accessibilityState={{ disabled: isDisabled, busy: loading }}
  style={({ pressed }) => [styles.base, variantStyles[variant], pressed && styles.pressed, isDisabled && styles.disabled, style]}
>
```

- `disabled` blocks presses (used while submitting or deleting).
- `hitSlop={8}` in `IconButton` enlarges the touch area of small icons.
- `accessibilityRole` / `accessibilityLabel` make it usable with screen readers, and let tests find
  it with `getByRole('button', { name: 'Save User' })`.

## 10. `ActivityIndicator`

The native spinning loader.

```tsx
// src/components/LoadingIndicator.tsx: full-screen loading
<ActivityIndicator size="large" color={colors.primary} />

// src/components/UserCard.tsx: small spinner while one user is being deleted
{isDeleting ? <ActivityIndicator size="small" color={colors.danger} /> : <IconButton icon="trash-outline" ... />}
```

## 11. `Alert`

Shows a **native dialog**. It does not wait: the code continues immediately, and button callbacks
run later.

```tsx
// Confirmation with two buttons (src/screens/HomeScreen.tsx)
Alert.alert('Delete user?', `Are you sure you want to delete ${user.name}?`, [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Delete', style: 'destructive', onPress: () => deleteConfirmed(user) },
]);

// Success, then navigate when OK is tapped (src/screens/AddUserScreen.tsx)
Alert.alert('User created', `${createdUser.name} was added to the list (id ${createdUser.id}).`, [
  { text: 'OK', onPress: () => navigation.goBack() },
]);

// Simple error (no buttons array: a single OK button is added automatically)
Alert.alert('Could not create user', getErrorMessage(err));
```

`style: 'destructive'` shows the button in red on iOS. `Alert` only works on Android and iOS, not on the web.

## 12. Navigation

```tsx
// 1. Declare screens and their params (src/navigation/types.ts)
export type RootStackParamList = {
  Home: undefined;
  UserDetails: { userId: number };
  AddUser: undefined;
  EditUser: { userId: number };
};

// 2. Create the stack (src/navigation/AppNavigator.tsx)
const Stack = createNativeStackNavigator<RootStackParamList>();

<NavigationContainer>
  <Stack.Navigator initialRouteName="Home" screenOptions={{ headerStyle: { backgroundColor: colors.primary }, ... }}>
    <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'User Manager' }} />
    ...
  </Stack.Navigator>
</NavigationContainer>

// 3. Each screen receives `navigation` and `route` as props (typed)
export default function UserDetailsScreen({ route, navigation }: UserDetailsScreenProps) {
  const { userId } = route.params;
  navigation.navigate('EditUser', { userId });
  navigation.goBack();
}
```

The **native stack** uses the platform's real navigation views, so screens animate and swipe exactly
like other apps on that phone, and the header back button is added automatically.

## 13. State management in this app

| Kind of state | Where it lives | Example |
|---|---|---|
| **Local UI state** (only one component cares) | `useState` in that component | `isFocused` in `CustomInput`, `deletingId` in `HomeScreen`, form `values` in `UserForm` |
| **Screen data** loaded for one screen | A custom hook used by that screen | `useUserDetails`: `serverUser`, `isLoading`, `error` |
| **Shared app state** (several screens) | `useUsers`, shared once via Context | `users`, `sessionChanges`, `addUser()`... |
| **Navigation state** | React Navigation | Which screens are in the stack, their params |

**Rule:** keep state **as low as possible** in the tree. Only "lift it up" (to a parent or a context)
when several components need it. That is why only the user list is global, and everything else is local.

**Why no Redux?** Redux shines in large apps with many features sharing complex state. Here, one
context with one hook is simpler and enough. The requirements also explicitly ask not to use Redux.

## 14. Other building blocks used

| Building block | Where | Purpose |
|---|---|---|
| `View`, `Text`, `ScrollView` | Everywhere | Layout boxes, text, scrollable content (Details, form) |
| `StyleSheet.create` | Bottom of each file | Styles (Flexbox, colours, spacing) |
| `KeyboardAvoidingView` | `UserForm.tsx` | Pushes the form up when the keyboard opens (`behavior="padding"`) |
| `useHeaderHeight` | `UserForm.tsx` | Header height, so the keyboard offset is exact |
| `SafeAreaProvider` / `useSafeAreaInsets` | `App.tsx`, screens | Keeps content away from notches and the Android navigation bar |
| `Ionicons` (`@expo/vector-icons`) | Buttons, cards, rows | Icons: `trash-outline`, `create-outline`, `add`... |
| `StatusBar` (`expo-status-bar`) | `App.tsx` | Light status-bar icons on the dark header |

---

**Next:** [07 · Project Setup and Execution →](07-project-setup-and-execution.md)
