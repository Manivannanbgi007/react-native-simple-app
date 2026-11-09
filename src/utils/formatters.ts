import type { Address } from '../types/User';

/** "Leanne Graham" -> "LG", "Mrs. Dennis Schulist" -> "MD". Used for the avatar circle. */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '?';
  }
  const first = words[0][0] ?? '';
  const second = words.length > 1 ? words[1][0] : '';
  return (first + second).toUpperCase();
}

/** Formats an address over two lines, or a fallback when the user has none. */
export function formatAddress(address?: Address): string {
  if (!address) {
    return 'Not provided';
  }
  return `${address.street}, ${address.suite}\n${address.city} ${address.zipcode}`;
}
