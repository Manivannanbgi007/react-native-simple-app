# 07 · Project Setup and Execution

Exact commands to install, run, test, debug and stop the app. Commands are shown for **Windows
(PowerShell or Git Bash)**. They are identical on macOS/Linux unless noted.

> **Verified versions** (this project was built and tested with them):
> Node.js 24.21.0 · npm 11.19.0 · Expo SDK 58 (`expo` 58.0.23) · React Native 0.88.1 · React 19.3.0 ·
> TypeScript 6.0 · React Navigation 7 · Axios 1.21

---

## 1. Install Node.js

Expo SDK 58 requires **Node.js `^22.13.0`, `^24.3.0` or `>=26`**.

1. Download the **LTS** installer from <https://nodejs.org> and run it (keep the default options).
2. Open a **new** terminal and check:

```bash
node --version    # e.g. v24.21.0
npm --version     # e.g. 11.19.0
```

> Optional: [Git](https://git-scm.com/) to clone the project, and [VS Code](https://code.visualstudio.com/) as an editor.

## 2. Expo setup

There is **nothing to install globally**. The Expo CLI is part of the project and runs with `npx expo ...`.

On your phone, install **Expo Go** (it must support **SDK 58**; install or update to the latest version):

- Android: [Google Play: Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
- iOS: [App Store: Expo Go](https://apps.apple.com/app/expo-go/id982107779)

## 3. Project creation (how this project was made)

You do **not** need to do this to run the app. It documents how the project was created, for learning.

```bash
# 1. Create an Expo app with the blank TypeScript template
npx create-expo-app@latest react-native-crud-app --template blank-typescript
cd react-native-crud-app

# 2. Runtime libraries (expo install picks versions compatible with the SDK)
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/elements react-native-screens react-native-safe-area-context axios @expo/vector-icons expo-font

# 3. Test tooling (development only)
npm install --save-dev jest-expo@~58.0.14 jest@~30.5.2 @types/jest@^30.0.0 @react-native/jest-preset@^0.88.1 @testing-library/react-native@^14.1.0
```

Why each dependency exists:

| Package | Why |
|---|---|
| `@react-navigation/native`, `@react-navigation/native-stack` | Screen navigation (stack) |
| `react-native-screens`, `react-native-safe-area-context` | Required by React Navigation (native screens, safe areas) |
| `@react-navigation/elements` | `useHeaderHeight()` for keyboard positioning (already pulled in by native-stack; declared because we import it) |
| `axios` | HTTP client |
| `@expo/vector-icons` + `expo-font` | Icons. `expo-font` is a **required peer** of the icons (reported by `npx expo-doctor`) |
| `jest`, `jest-expo`, `@react-native/jest-preset`, `@types/jest` | Test runner configured for Expo |
| `@testing-library/react-native` | Render components/hooks in tests and click through them |

## 4. Dependency installation

From the project folder:

```bash
cd "D:\Drive E\dev\react-native-simple-app"
npm install
```

This reads `package.json` / `package-lock.json` and downloads everything into `node_modules/`.
Then check that the project is healthy:

```bash
npx expo-doctor      # expected: "20/20 checks passed. No issues detected!"
```

## 5. Application startup

```bash
npx expo start
```

(`npm start` does the same.) This starts **Metro**, the JavaScript bundler and dev server, and prints a
**QR code** plus a menu:

```text
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

> ⚠️ **On this computer, port 8081 is already used by Docker Desktop** (`com.docker.backend`).
> In an interactive terminal Expo offers to use another port (answer **Y**). You can also choose one yourself:
>
> ```bash
> npx expo start --port 8082
> ```

What you should see in the app: a spinner (*"Loading users..."*), then **10 users** loaded from
JSONPlaceholder. In the terminal, the request log appears: `[API] -> GET /users` / `[API] <- 200 /users`.

## 6. Running on an Android emulator

You need **Android Studio** once, to get the emulator.

1. Install Android Studio from <https://developer.android.com/studio> (default options).
2. Open it → **More Actions → SDK Manager** → make sure these are installed:
   *Android SDK Platform* (latest), *Android SDK Platform-Tools*, *Android Emulator*.
3. Tell your terminal where the SDK is. **PowerShell** (run once, then open a **new** terminal):

   ```powershell
   [Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
   $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
   [Environment]::SetEnvironmentVariable('Path', "$userPath;$env:LOCALAPPDATA\Android\Sdk\platform-tools", 'User')
   ```

   Check in a new terminal: `adb --version`.
   (macOS: add `export ANDROID_HOME=$HOME/Library/Android/sdk` and
   `export PATH=$PATH:$ANDROID_HOME/platform-tools` to `~/.zshrc`.)
4. Android Studio → **More Actions → Virtual Device Manager → Create Device** → pick a phone (e.g. Pixel)
   → pick a recent system image (download it) → **Finish** → press ▶ to start the emulator.
5. With the emulator running:

   ```bash
   npx expo start      # then press  a
   ```

   (`npm run android` = `expo start --android`, which opens it directly.)
   Expo installs Expo Go on the emulator automatically and opens the app.

## 7. Running on a physical Android device

1. Install **Expo Go** from Google Play.
2. Connect the phone and the computer to the **same Wi-Fi network**.
3. Run `npx expo start`.
4. Open Expo Go → **Scan QR code** → scan the code in the terminal.
5. The first time, **Windows Firewall** may ask whether Node.js may accept connections: allow it on
   **Private networks**.

If the phone cannot connect (company/guest Wi-Fi, VPN, firewall), use a tunnel:

```bash
npx expo start --tunnel
```

(The first time, Expo asks to install `@expo/ngrok`: answer yes. Tunnels are slower but work across networks.)

USB alternative (Android): enable *Developer options → USB debugging* on the phone, connect it by
cable, check it is listed with `adb devices`, then press `a` in the Expo terminal.

## 8. Running on iOS

- **iPhone (works from Windows):** install **Expo Go** from the App Store, run `npx expo start`,
  then scan the QR code with the iPhone's **Camera** app and tap the banner.
- **iOS Simulator (macOS only):** install **Xcode** from the Mac App Store, open it once to accept the
  license, then:

  ```bash
  npx expo start      # then press  i
  ```

  (`npm run ios`.) The iOS Simulator is **not available on Windows**.

## 9. Running the tests

```bash
npm test               # 62 unit + integration tests (no internet needed)
npm run test:live      # 6 tests against the REAL JSONPlaceholder API (needs internet)
npm run typecheck      # TypeScript compiler, no output = no errors
npx expo-doctor        # dependency / config health check
```

| Test file | What it checks |
|---|---|
| `src/utils/__tests__/validation.test.ts` | Every form rule, including all 10 real users' data being accepted |
| `src/utils/__tests__/errorHandling.test.ts` | Timeout, offline, 404, 5xx, 4xx and unexpected-format messages |
| `src/services/__tests__/userService.test.ts` | Correct URL, HTTP method and body for each CRUD call; bad responses rejected |
| `src/hooks/__tests__/useUsers.test.ts` | Load, create (unique ids), update (merge, local-only users), delete (kept on failure), refresh |
| `src/components/__tests__/UserForm.test.tsx` | Field errors, errors clearing, trimmed submit, pre-filled values |
| `src/components/__tests__/CustomButton.test.tsx` | Press works, loading button is disabled (no double submit) |
| `__tests__/App.test.tsx` | The **whole app**: every CRUD workflow, navigation, dialogs, error states |
| `src/services/__tests__/userService.live.test.ts` | Real API behaviour (id 11, nothing persisted, PUT on created user = 404) |

Run one file or one test by name:

```bash
npx jest src/hooks
npx jest -t "deletes the user"
npx jest --watch       # re-run tests when files change
```

## 10. Debugging

| Tool | How to open | Use it for |
|---|---|---|
| **Metro terminal** | Where `npx expo start` runs | `console.log` output, the `[API]` request log, red bundling errors |
| **Developer menu** | Press `m` in the terminal, shake the phone, or `Ctrl+M` (Android emulator) / `Cmd+D` (iOS simulator) | Reload, open DevTools, performance monitor, element inspector |
| **React Native DevTools** | Press `j` in the terminal | Console, breakpoints (Sources), React component tree, Network panel |
| **Reload** | Press `r` in the terminal | Restart the JS app (your session data resets) |
| **Fast Refresh** | Automatic when you save a file | Updates the UI without losing state |
| **Red / yellow boxes** | Appear on the device | Red = crash with stack trace; yellow (LogBox) = warning |

Tips:

- Put `console.log('users', users)` in a component to see values on every render.
- Set a **breakpoint** in `src/hooks/useUsers.ts` (e.g. inside `addUser`) via DevTools → Sources,
  then create a user and step through the code.
- Clear Metro's cache if something looks "stuck": `npx expo start --clear`.

## 11. Stopping the application

- **Stop the dev server:** press **`Ctrl + C`** in the terminal running `npx expo start`.
- **Close the app on the phone:** swipe it away in the app switcher (Expo Go keeps it in its
  "Recently opened" list).
- **Stop the Android emulator:** close its window, or Device Manager → ■ Stop.

If a port stays busy after a crash (Windows):

```powershell
netstat -ano | findstr :8082          # find the PID listening on the port
Get-Process -Id <PID>                  # check it really is node.exe before stopping it
Stop-Process -Id <PID>
```

---

**Next:** [08 · Troubleshooting →](08-troubleshooting.md)
