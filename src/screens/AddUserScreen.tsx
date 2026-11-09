import { Alert } from 'react-native';

import UserForm from '../components/UserForm';
import { useUsersContext } from '../context/UsersContext';
import type { AddUserScreenProps } from '../navigation/types';
import type { UserRequest } from '../types/User';
import { getErrorMessage } from '../utils/errorHandling';
import { EMPTY_USER_FORM } from '../utils/validation';

/** Workflow 2: create a new user. */
export default function AddUserScreen({ navigation }: AddUserScreenProps) {
  const { addUser } = useUsersContext();

  // UserForm calls this only after validation passed.
  const handleCreate = async (values: UserRequest) => {
    try {
      const createdUser = await addUser(values); // POST /users, then added to the shared list
      Alert.alert('User created', `${createdUser.name} was added to the list (id ${createdUser.id}).`, [
        // Go back to the list only after the user has read the message.
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Could not create user', getErrorMessage(err));
    }
  };

  return <UserForm initialValues={EMPTY_USER_FORM} submitLabel="Save User" onSubmit={handleCreate} />;
}
