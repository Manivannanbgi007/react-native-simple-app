# 08 · Troubleshooting

Common problems, what they mean, and how to fix them. Entries marked **⚑ seen in this project**
actually happened while this app was built and verified, with the exact message shown.

**First aid**, which fixes a surprising number of problems:

```bash
# 1. Stop Metro (Ctrl+C), then restart it with an empty cache
npx expo start --clear

# 2. Check dependencies and config
npx expo-doctor

# 3. Re-install packages from scratch (PowerShell)
Remove-Item -Recurse -Force node_modules
npm install
#    (Git Bash / macOS: rm -rf node_modules && npm install)
```

---

## 1. Metro bundler errors

| Symptom | Cause | Fix |
|---|---|---|
| **⚑** `Port 8081 is being used by another process` / `CommandError: Port 8081 is unavailable` | Another program uses Metro's default port. **On this computer it is Docker Desktop** (`com.docker.backend`). | Answer **Y** when Expo offers another port, or run `npx expo start --port 8082`. |
| `Unable to resolve module ./src/...` | Wrong import path, or file renamed / wrong letter case | Check the path and spelling. Paths are case-sensitive on Android/iOS even if Windows is not. |
| `Unable to resolve module some-package` | Package not installed | `npx expo install some-package`, then restart Metro |
| Changes do not appear / old code runs | Stale cache | `npx expo start --clear`, then press `r` |
| Red screen `SyntaxError` | Typo in a file you just saved | The message shows file and line; fix it and save |
| Phone shows "Could not connect to development server" | Phone cannot reach the PC | Same Wi-Fi, allow Node.js in Windows Firewall (private networks), or `npx expo start --tunnel` |

## 2. Dependency compatibility issues

| Symptom | Cause | Fix |
|---|---|---|
| `expo-doctor`: *"Some dependencies are incompatible with the installed expo version"* | A package was installed with `npm install` at a version that does not match SDK 58 | `npx expo install --fix` |
| **⚑** `expo-doctor`: *"Missing peer dependency: expo-font. Required by: @expo/vector-icons"* | Icons need `expo-font` installed **directly**. Expo Go hides the problem, but standalone builds may crash. | `npx expo install expo-font` (done in this project) |
| `npm ERR! ERESOLVE could not resolve` | Two packages want different versions of a shared dependency | Install with `npx expo install` (it picks compatible versions). Avoid `--force` / `--legacy-peer-deps` unless you understand the conflict. |
| Expo Go: *"Project is incompatible with this version of Expo Go"* | Expo Go supports only certain SDKs; this project uses **SDK 58** | Update Expo Go from the store. If you must stay on another SDK, upgrade the project with `npx expo install expo@latest --fix`. |
| `npm audit` reports *moderate* vulnerabilities | Inside development tools (Expo CLI, Jest) | Do **not** run `npm audit fix --force`: it can install incompatible versions. Wait for Expo/Jest updates. |
| **⚑** Jest: `Cannot find module 'expo-asset' from 'node_modules/expo-font/build/FontLoader.js'` | npm placed `expo-asset` inside `node_modules/expo/node_modules`. Metro finds it, plain Node/Jest does not. | Tests mock the icon set in `jest.setup.js`. The app itself is not affected. |

## 3. API connection failures

| Message in the app | Meaning | What to check |
|---|---|---|
| *"Cannot reach the server. Check your internet connection and try again."* | The request never reached the server (offline, DNS, blocked) | Phone has internet? Open <https://jsonplaceholder.typicode.com/users> in the phone's browser. Corporate proxies/firewalls may block it. |
| *"The request timed out..."* | No answer within 10 s (`API_TIMEOUT_MS`) | Slow network. Try again, or raise the timeout in `src/constants/apiConstants.ts`. |
| *"This user was not found on the server."* | HTTP 404 | Expected for ids above 10 on JSONPlaceholder |
| *"The server had a problem (HTTP 5xx)..."* | The API is down | Try later. Check <https://jsonplaceholder.typicode.com> in a browser. |
| *"The server sent data in an unexpected format."* | The response was not user JSON (e.g. a captive-portal / hotel Wi-Fi login page) | Log in to the Wi-Fi portal, or switch network |

**"My changes disappeared!"** This is **not a bug**. JSONPlaceholder is a fake API and never saves
anything. Changes live only in the app's memory until you restart or press **Refresh**. See
[02 §9](02-application-architecture.md#9-strategy-for-the-fake-api).

Debug any request by watching the `[API]` lines in the Metro terminal (see [04 §9](04-api-communication.md#9-how-to-inspect-requests-debugging-tools)).

## 4. Android emulator network issues

| Symptom | Fix |
|---|---|
| Emulator has no internet (*"Cannot reach the server"*, the emulator's Chrome cannot open websites) | Device Manager → ⋮ → **Cold Boot Now**. If it persists: **Wipe Data**. |
| Works on Wi-Fi, fails on VPN | Some VPNs break the emulator's DNS. Disconnect the VPN, or start the emulator with a public DNS: `emulator -avd <name> -dns-server 8.8.8.8` |
| Pressing `a` says *"No Android connected device found"* | Start the emulator **first**. Check with `adb devices`. If `adb` is unknown, set `ANDROID_HOME` / PATH ([07 §6](07-project-setup-and-execution.md#6-running-on-an-android-emulator)). |
| *"adb: device offline"* / emulator hangs | `adb kill-server` then `adb start-server`, or restart the emulator |
| Emulator is very slow | Enable hardware acceleration (Windows: *Windows Hypervisor Platform* feature, BIOS virtualization on). Use an x86_64 image. |

> Inside the emulator, `localhost` means *the emulator itself*. To reach a server running on your PC,
> use `10.0.2.2`. This app calls a public internet API, so it does not need this.

## 5. Navigation errors

| Message | Cause | Fix |
|---|---|---|
| *"The action 'NAVIGATE' with payload {"name":"EditUsers"} was not handled by any navigator"* | Misspelled screen name | Use the names in `src/navigation/types.ts`. TypeScript catches this if you keep the screen props typed. |
| *"Couldn't find a navigation object. Is your component inside NavigationContainer?"* | `useNavigation()` used outside the navigator | Only call it inside screens rendered by `AppNavigator` |
| *"Non-serializable values were found in the navigation state"* | Functions or class instances passed as params | Pass simple values such as `{ userId }` (this app's rule) |
| *"Couldn't find the header height"* | `useHeaderHeight()` used outside a stack screen (e.g. in a test) | Use it only inside screens. Tests mock it (see `UserForm.test.tsx`). |
| Screen shows "User not found" | The user was deleted, or the app restarted while on that screen | Go back to the list |

## 6. TypeScript compilation errors

Run `npm run typecheck` to list all errors at once.

| Error | Meaning | Fix |
|---|---|---|
| `Property 'x' does not exist on type 'User'` | Using a field that is not in the interface | Check `src/types/User.ts`. Add the field there if the API really sends it. |
| `Argument of type 'string \| undefined' is not assignable to parameter of type 'string'` | The value might be missing | Handle it: `value ?? ''`, `if (!value) return;`, or optional chaining `user.company?.name` |
| `Type '{ ... }' is missing the following properties from type 'UserRequest'` | An object lacks required fields | Provide all fields, or use the helper `toUserRequest(values)` |
| `Argument of type '"EditUser"' is not assignable ...` / `Expected 2 arguments` in `navigate` | Wrong screen name or missing params | Check `RootStackParamList` |
| **⚑** `Cannot find name 'describe'` / `Cannot find name 'expect'` in test files | **TypeScript 6** no longer loads every `@types/*` package automatically | `tsconfig.json` lists them: `"types": ["jest"]` (done) |
| `'React' refers to a UMD global...` | Using `React.ReactNode` without importing it | `import type { ReactNode } from 'react';` |

## 7. Application crashes

| Symptom | Likely cause | Fix |
|---|---|---|
| Red screen: *"Text strings must be rendered within a `<Text>` component"* | Text placed directly inside a `<View>`, or `{count && <X/>}` with `count = 0` | Wrap text in `<Text>`. Use `{count > 0 ? <X/> : null}`. |
| Red screen: *"Rendered more hooks than during the previous render"* | A hook is called inside an `if`, a loop, or after an early `return` | Move all hook calls to the top of the component |
| App freezes / requests repeat forever | `useEffect` dependency changes on every render (e.g. a function not wrapped in `useCallback`) | Wrap the function in `useCallback`, or fix the dependency array |
| *"Cannot read property 'name' of undefined"* | Data not loaded yet / user not found | Guard: `if (!user) return <EmptyState .../>`, or optional chaining `user?.name` |
| *"useUsersContext must be used inside `<UsersProvider>`"* | A component using the context is rendered outside `App.tsx`'s provider | Keep `UsersProvider` around `AppNavigator` |
| Duplicate-key warning in the list | Two users with the same id | Handled in `addUser` (JSONPlaceholder always returns id 11) |
| App closes immediately in Expo Go | Native module missing from Expo Go, or SDK mismatch | Run `npx expo-doctor`. Only use libraries supported by Expo Go, or create a development build. |

## 8. Expo configuration issues

| Symptom | Fix |
|---|---|
| Changes to `app.json` do not apply | Stop Metro and restart it (`Ctrl+C`, then `npx expo start`). Native settings (icons, name) need a new build to change in an installed app. |
| *"Invalid app.json"* / JSON parse error | A missing comma or quote. Validate the JSON (VS Code highlights it). |
| *"Plugin is an unexpected type"* / plugin not found | The plugin package is not installed. Use `npx expo install <package>`, which also adds its plugin. |
| Asset not found (icon, splash) | Paths in `app.json` are relative to the project root. Check the files exist in `assets/`. |
| `expo start --web` fails with missing `react-dom` / `react-native-web` | Web is not set up in this project (it targets Android/iOS, and `Alert` does not work on web). To try it: `npx expo install react-dom react-native-web @expo/metro-runtime`. |

## 9. Tests

| Symptom | Cause | Fix |
|---|---|---|
| **⚑** A test hangs until *"Exceeded timeout of 5000 ms"* after `await fireEvent.press(...)` | With Testing Library v14 + React 19, a press whose handler awaits a promise that **never resolves** keeps `act()` waiting | Let mocked async functions resolve (e.g. `mockResolvedValue`). The "disabled while saving" behaviour is tested on `CustomButton` directly. |
| *"Warning: An update to X inside a test was not wrapped in act(...)"* | State changed after the test stopped waiting | `await` every `render`, `fireEvent`, `renderHook` (they are async in v14). Use `findBy...` / `waitFor`. |
| Live tests fail | No internet, or JSONPlaceholder is down | They are separate on purpose: `npm test` never needs the network |

---

Still stuck? Read the full error message (the first red line is usually the real cause), search it
together with "Expo SDK 58", and check the official docs: <https://docs.expo.dev> and
<https://reactnavigation.org/docs/troubleshooting>.
