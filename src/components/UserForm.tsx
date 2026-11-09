import { useHeaderHeight } from '@react-navigation/elements';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../constants/theme';
import type { UserRequest } from '../types/User';
import {
  hasErrors,
  toUserRequest,
  validateField,
  validateUserForm,
  type UserFormErrors,
  type UserFormField,
  type UserFormValues,
} from '../utils/validation';
import CustomButton from './CustomButton';
import CustomInput from './CustomInput';
import MessageBanner from './MessageBanner';

interface UserFormProps {
  initialValues: UserFormValues;
  submitLabel: string;
  /**
   * Called with clean (trimmed) values once validation passes.
   * The screen decides what to do: create or update. The form only
   * manages typing, validation and the "submitting" state.
   */
  onSubmit: (values: UserRequest) => Promise<void>;
  /** Optional information shown above the fields. */
  notice?: string;
}

/** The shared form used by both AddUserScreen and EditUserScreen. */
export default function UserForm({ initialValues, submitLabel, onSubmit, notice }: UserFormProps) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  // "Controlled inputs": the text of every field lives in React state.
  const [values, setValues] = useState<UserFormValues>(initialValues);
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: UserFormField, text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    // If this field is already showing an error, re-check it while the user
    // types, so the message disappears as soon as the value becomes valid.
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: validateField(field, text) }));
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateUserForm(values);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) {
      return; // stop here: never send invalid data to the API
    }

    setIsSubmitting(true); // disables the button, prevents double submits
    try {
      await onSubmit(toUserRequest(values));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Moves the form up when the keyboard opens, so inputs are not hidden.
    <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {notice ? <MessageBanner type="info" message={notice} /> : null}

        <CustomInput
          label="Name"
          required
          value={values.name}
          onChangeText={(text) => handleChange('name', text)}
          error={errors.name}
          placeholder="John Smith"
          autoCapitalize="words"
          autoComplete="name"
        />
        <CustomInput
          label="Username"
          required
          value={values.username}
          onChangeText={(text) => handleChange('username', text)}
          error={errors.username}
          placeholder="johnsmith"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
        />
        <CustomInput
          label="Email"
          required
          value={values.email}
          onChangeText={(text) => handleChange('email', text)}
          error={errors.email}
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
        />
        <CustomInput
          label="Phone"
          required
          value={values.phone}
          onChangeText={(text) => handleChange('phone', text)}
          error={errors.phone}
          placeholder="9876543210"
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        <CustomInput
          label="Website"
          value={values.website}
          onChangeText={(text) => handleChange('website', text)}
          error={errors.website}
          hint="Optional"
          placeholder="johnsmith.com"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <CustomButton
          title={isSubmitting ? 'Saving...' : submitLabel}
          icon="checkmark"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.submit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
