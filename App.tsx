import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UsersProvider } from './src/context/UsersContext';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * The root component. index.ts registers it as the app's entry point.
 *
 * The order of the wrappers matters:
 *  1. SafeAreaProvider  - measures notches / system bars for every screen
 *  2. UsersProvider     - creates the shared user list (one instance for the app)
 *  3. AppNavigator      - the screens, which can all read the user list
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <UsersProvider>
        <AppNavigator />
        {/* Light status-bar icons, because the header is dark blue. */}
        <StatusBar style="light" />
      </UsersProvider>
    </SafeAreaProvider>
  );
}
