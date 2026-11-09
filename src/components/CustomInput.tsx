import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing } from '../constants/theme';

/**
 * We extend the normal TextInput props, so screens can still pass things like
 * `keyboardType` or `autoCapitalize`, and add our own: label, error, hint.
 */
interface CustomInputProps extends TextInputProps {
  label: string;
  /** Field-level validation message. When set, the input turns red. */
  error?: string;
  /** Grey helper text shown when there is no error. */
  hint?: string;
  required?: boolean;
}

export default function CustomInput({
  label,
  error,
  hint,
  required = false,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: CustomInputProps) {
  // Local UI state: only this input needs to know whether it is focused.
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          isFocused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          style,
        ]}
      />

      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs + 2,
  },
  required: {
    color: colors.danger,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FFFBFB',
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.danger,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textMuted,
  },
});
