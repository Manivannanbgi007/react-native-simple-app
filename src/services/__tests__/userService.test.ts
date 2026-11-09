import type { AxiosResponse } from 'axios';

import { johnSmith, leanne, sampleUsers } from '../../test-utils/fixtures';
import { apiClient } from '../apiClient';
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  UNEXPECTED_RESPONSE_MESSAGE,
  updateUser,
} from '../userService';

// Replace the real Axios client with fake functions, so no real network
// request is made and we can check exactly which URL/method was used.
jest.mock('../apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockedClient = jest.mocked(apiClient);

/** Wraps data the way Axios does: the body is in `response.data`. */
const response = <T>(data: T) => ({ data, status: 200 }) as AxiosResponse<T>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('userService', () => {
  it('getUsers sends GET /users and returns the list', async () => {
    mockedClient.get.mockResolvedValue(response(sampleUsers));

    await expect(getUsers()).resolves.toEqual(sampleUsers);
    expect(mockedClient.get).toHaveBeenCalledWith('/users');
  });

  it('getUsers rejects when the server returns something that is not a user list', async () => {
    mockedClient.get.mockResolvedValue(response('<html>Maintenance</html>'));
    await expect(getUsers()).rejects.toThrow(UNEXPECTED_RESPONSE_MESSAGE);

    mockedClient.get.mockResolvedValue(response([{ id: 1 }])); // missing name/email...
    await expect(getUsers()).rejects.toThrow(UNEXPECTED_RESPONSE_MESSAGE);
  });

  it('getUserById sends GET /users/{id}', async () => {
    mockedClient.get.mockResolvedValue(response(leanne));

    await expect(getUserById(1)).resolves.toEqual(leanne);
    expect(mockedClient.get).toHaveBeenCalledWith('/users/1');
  });

  it('createUser sends POST /users with the form data as the body', async () => {
    mockedClient.post.mockResolvedValue(response({ ...johnSmith, id: 11 }));

    await expect(createUser(johnSmith)).resolves.toEqual({ ...johnSmith, id: 11 });
    expect(mockedClient.post).toHaveBeenCalledWith('/users', johnSmith);
  });

  it('updateUser sends PUT /users/{id} with the form data as the body', async () => {
    mockedClient.put.mockResolvedValue(response({ ...johnSmith, id: 1 }));

    await expect(updateUser(1, johnSmith)).resolves.toEqual({ ...johnSmith, id: 1 });
    expect(mockedClient.put).toHaveBeenCalledWith('/users/1', johnSmith);
  });

  it('deleteUser sends DELETE /users/{id}', async () => {
    mockedClient.delete.mockResolvedValue(response({}));

    await expect(deleteUser(1)).resolves.toBeUndefined();
    expect(mockedClient.delete).toHaveBeenCalledWith('/users/1');
  });

  it('passes network errors on to the caller', async () => {
    const networkError = new Error('Network Error');
    mockedClient.delete.mockRejectedValue(networkError);

    await expect(deleteUser(1)).rejects.toBe(networkError);
  });
});
