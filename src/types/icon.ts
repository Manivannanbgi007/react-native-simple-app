import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

/**
 * Every valid Ionicons icon name, e.g. 'trash-outline' or 'add'.
 * Using this type means a typo in an icon name is caught by TypeScript.
 * Browse the icons at https://icons.expo.fyi
 */
export type IconName = ComponentProps<typeof Ionicons>['name'];
