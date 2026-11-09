import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../constants/theme';
import AddUserScreen from '../screens/AddUserScreen';
import EditUserScreen from '../screens/EditUserScreen';
import HomeScreen from '../screens/HomeScreen';
import UserDetailsScreen from '../screens/UserDetailsScreen';
import type { RootStackParamList } from './types';

/**
 * A "stack" works like a pile of cards: navigate() puts a new screen on top,
 * goBack() (or the back arrow / Android back button) removes the top one.
 *
 *   Home  ->  UserDetails  ->  EditUser
 *   Home  ->  AddUser
 *   Home  ->  EditUser
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    // NavigationContainer holds the navigation state. It must wrap all navigators.
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'User Manager' }} />
        <Stack.Screen name="UserDetails" component={UserDetailsScreen} options={{ title: 'User Details' }} />
        <Stack.Screen name="AddUser" component={AddUserScreen} options={{ title: 'Add User' }} />
        <Stack.Screen name="EditUser" component={EditUserScreen} options={{ title: 'Edit User' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
