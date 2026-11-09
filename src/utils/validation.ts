import type { User, UserRequest } from '../types/User';

/**
 * Form validation for the Add User and Edit User screens.
 *
 * These are plain functions with no React code, which makes them easy to
 * unit-test (see src/utils/__tests__/validation.test.ts).
 *
 * Rules:
 *  - name      required, 2-60 characters
 *  - username  required, 3-30 characters, letters / numbers / dots / underscores
 *  - email     required, must look like name@example.com
 *  - phone     required, digits plus + - ( ) . spaces and "x" (for extensions), 7-20 digits
 *  - website   optional, but if filled in it must look like example.com
 *
 * The patterns deliberately accept the real JSONPlaceholder data
 * (e.g. phone "1-770-736-8031 x56442", username "Leopoldo_Corkery"),
 * so existing users can be edited without fighting the validator.
 */

/** The form has exactly the same fields as the API request body. */
export type UserFormValues = UserRequest;
export type UserFormField = keyof UserFormValues;
/** One optional error message per field, e.g. { email: 'Email is required.' } */
export type UserFormErrors = Partial<Record<UserFormField, string>>;

export const USER_FORM_FIELDS: UserFormField[] = ['name', 'username', 'email', 'phone', 'website'];

export const EMPTY_USER_FORM: UserFormValues = {
  name: '',
  username: '',
  email: '',
  phone: '',
  website: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._]+$/;
const PHONE_PATTERN = /^[0-9+().\-\sx]+$/i;
const WEBSITE_PATTERN = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export const isValidEmail = (email: string): boolean => EMAIL_PATTERN.test(email.trim());

/**
 * Validates ONE field and returns an error message, or `undefined` when valid.
 * Used both on submit (all fields) and while typing (fields already showing an error).
 */
export function validateField(field: UserFormField, rawValue: string): string | undefined {
  const value = rawValue.trim();

  switch (field) {
    case 'name':
      if (!value) return 'Name is required.';
      if (value.length < 2) return 'Name must be at least 2 characters.';
      if (value.length > 60) return 'Name must be 60 characters or fewer.';
      return undefined;

    case 'username':
      if (!value) return 'Username is required.';
      if (value.length < 3) return 'Username must be at least 3 characters.';
      if (value.length > 30) return 'Username must be 30 characters or fewer.';
      if (!USERNAME_PATTERN.test(value)) {
        return 'Username can only contain letters, numbers, dots and underscores.';
      }
      return undefined;

    case 'email':
      if (!value) return 'Email is required.';
      if (!isValidEmail(value)) return 'Enter a valid email address, e.g. name@example.com.';
      return undefined;

    case 'phone': {
      if (!value) return 'Phone is required.';
      if (!PHONE_PATTERN.test(value)) {
        return 'Phone can only contain digits, spaces and + - ( ) . x';
      }
      const digitCount = value.replace(/\D/g, '').length;
      if (digitCount < 7) return 'Phone must contain at least 7 digits.';
      if (digitCount > 20) return 'Phone must contain 20 digits or fewer.';
      return undefined;
    }

    case 'website':
      if (!value) return undefined; // optional field
      if (!WEBSITE_PATTERN.test(value)) return 'Enter a valid website, e.g. example.com.';
      return undefined;

    default:
      return undefined;
  }
}

/** Validates every field and collects the messages for the invalid ones. */
export function validateUserForm(values: UserFormValues): UserFormErrors {
  const errors: UserFormErrors = {};
  for (const field of USER_FORM_FIELDS) {
    const message = validateField(field, values[field]);
    if (message) {
      errors[field] = message;
    }
  }
  return errors;
}

/** True when at least one field has an error message. */
export const hasErrors = (errors: UserFormErrors): boolean => Object.values(errors).some(Boolean);

/** Removes surrounding spaces before the data is sent to the API. */
export function toUserRequest(values: UserFormValues): UserRequest {
  return {
    name: values.name.trim(),
    username: values.username.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    website: values.website.trim(),
  };
}

/** Copies the editable fields of an existing user into form values. */
export function toFormValues(user: User): UserFormValues {
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    website: user.website,
  };
}
