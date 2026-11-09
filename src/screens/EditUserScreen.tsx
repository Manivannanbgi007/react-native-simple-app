import { Alert } from 'react-native';

import EmptyState from '../components/EmptyState';
import UserForm from '../components/UserForm';
import { useUsersContext } from '../context/UsersContext';
import type { EditUserScreenProps } from '../navigation/types';
import type { UserRequest } from '../types/User';
import { getErrorMessage } from '../utils/errorHandling';
import { toFormValues } from '../utils/validation';

/** Workflow 3: update an existing user. */
export default function EditUserScreen({ route, navigation }: EditUserScreenProps) {
  const { userId } = route.params;
  const { findUser, editUser, sessionChanges } = useUsersContext();

  // Load the existing user from the shared state. That copy already contains
  // any edits made in this session (the fake server would return old data).
  const user = findUser(userId);

  if (!user) {
    return (
      <EmptyState
        icon="person-remove-outline"
        title="User not found"
        message="This user may have been deleted."
        actionLabel="Back to list"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const handleUpdate = async (values: UserRequest) => {
    try {
      const updatedUser = await editUser(userId, values); // PUT /users/{id}, then updated in state
      Alert.alert('User updated', `${updatedUser.name} was updated.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Update failed', `${getErrorMessage(err)}\n\nYour changes were not applied.`);
    }
  };

  const notice =
    sessionChanges[userId] === 'created'
      ? 'This user only exists in this app session, so the fake API cannot update it ' +
        '(PUT would return 404). Your changes will be applied locally only.'
      : undefined;

  return (
    <UserForm
      initialValues={toFormValues(user)} // pre-fills the form with the current values
      submitLabel="Update User"
      onSubmit={handleUpdate}
      notice={notice}
    />
  );
}
