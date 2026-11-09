import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * The list of screens in the stack and the parameters each one needs.
 *
 * `undefined` means "no parameters". For UserDetails and EditUser we pass
 * only the user's id, never the whole user object: screens look the user up
 * in the shared state, so they always show the latest version.
 *
 * Because of this type, TypeScript reports an error if we write
 * navigation.navigate('EditUser') without a userId, or misspell a screen name.
 */
export type RootStackParamList = {
  Home: undefined;
  UserDetails: { userId: number };
  AddUser: undefined;
  EditUser: { userId: number };
};

/** Props (navigation + route) received by each screen component. */
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type UserDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'UserDetails'>;
export type AddUserScreenProps = NativeStackScreenProps<RootStackParamList, 'AddUser'>;
export type EditUserScreenProps = NativeStackScreenProps<RootStackParamList, 'EditUser'>;
