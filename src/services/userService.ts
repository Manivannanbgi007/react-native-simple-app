import { API_ENDPOINTS } from '../constants/apiConstants';
import type { User, UserRequest, UserResponse } from '../types/User';
import { apiClient } from './apiClient';

/**
 * The user service is the ONLY place in the app that knows the API URLs
 * and HTTP methods for users. Screens and hooks call these functions and
 * never touch Axios directly.
 *
 * Each function:
 *  1. sends one HTTP request through the shared `apiClient`,
 *  2. checks that the response looks like what we expect,
 *  3. returns plain typed data (not the whole Axios response object).
 *
 * If anything fails, the error is thrown to the caller (the hook), which
 * decides what to show the user.
 */

export const UNEXPECTED_RESPONSE_MESSAGE = 'The server sent data in an unexpected format.';

/**
 * TypeScript types disappear when the app runs, so the compiler cannot check
 * what the server REALLY sent. This small runtime check protects the UI from
 * rendering garbage if the API ever returns something unexpected.
 */
function isUserLike(data: unknown): data is UserResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.name === 'string' &&
    typeof candidate.username === 'string' &&
    typeof candidate.email === 'string'
  );
}

function ensureUser<T extends UserResponse>(data: unknown): T {
  if (!isUserLike(data)) {
    throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
  }
  return data as T;
}

/** GET /users -> the full list of users. */
export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>(API_ENDPOINTS.users);
  const data: unknown = response.data;

  if (!Array.isArray(data) || !data.every(isUserLike)) {
    throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
  }
  return data as User[];
};

/** GET /users/{id} -> one user with all details (address, company...). */
export const getUserById = async (id: number): Promise<User> => {
  const response = await apiClient.get<User>(API_ENDPOINTS.userById(id));
  return ensureUser<User>(response.data);
};

/**
 * POST /users -> asks the server to create a user.
 * JSONPlaceholder answers `201 Created` with our data plus `id: 11`,
 * but it does NOT really store the user (it is a fake API).
 */
export const createUser = async (user: UserRequest): Promise<UserResponse> => {
  const response = await apiClient.post<UserResponse>(API_ENDPOINTS.users, user);
  return ensureUser(response.data);
};

/**
 * PUT /users/{id} -> replaces a user's editable fields.
 * The response only contains the fields we sent (no address/company),
 * so the hook merges it into the existing record.
 */
export const updateUser = async (id: number, user: UserRequest): Promise<UserResponse> => {
  const response = await apiClient.put<UserResponse>(API_ENDPOINTS.userById(id), user);
  return ensureUser(response.data);
};

/** DELETE /users/{id} -> the server answers `200 OK` with an empty object `{}`. */
export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.userById(id));
};
