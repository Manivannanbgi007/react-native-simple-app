/**
 * Everything the app needs to know about *where* the API lives.
 * Keeping these values in one file means that switching to a real backend
 * later only requires changing this file.
 */

/** JSONPlaceholder: a free fake REST API for learning and prototyping. */
export const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

/** Give up on a request after 10 seconds instead of waiting forever. */
export const API_TIMEOUT_MS = 10_000;

/** Paths are relative to API_BASE_URL. */
export const API_ENDPOINTS = {
  users: '/users',
  userById: (id: number) => `/users/${id}`,
} as const;
