import { act, renderHook } from '@testing-library/react-native';
import { AxiosError } from 'axios';

import * as userService from '../../services/userService';
import { ervin, johnSmith, leanne, sampleUsers } from '../../test-utils/fixtures';
import { MESSAGES } from '../../utils/errorHandling';
import { getNextLocalId, useUsers } from '../useUsers';

// Automatic mock: every function exported by userService becomes a jest.fn().
jest.mock('../../services/userService');
const service = jest.mocked(userService);

/** Renders the hook and performs the initial load, like HomeScreen does. */
async function renderLoadedHook() {
  service.getUsers.mockResolvedValue(sampleUsers);
  const hook = await renderHook(() => useUsers());
  await act(() => hook.result.current.loadUsers());
  return hook;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useUsers - loading', () => {
  it('starts in the loading state and then shows the users', async () => {
    service.getUsers.mockResolvedValue(sampleUsers);
    const { result } = await renderHook(() => useUsers());

    expect(result.current.isLoading).toBe(true);

    await act(() => result.current.loadUsers());

    expect(service.getUsers).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.users).toEqual(sampleUsers);
    expect(result.current.error).toBeNull();
  });

  it('stores a friendly message when loading fails', async () => {
    service.getUsers.mockRejectedValue(new AxiosError('Network Error', AxiosError.ERR_NETWORK));
    const { result } = await renderHook(() => useUsers());

    await act(() => result.current.loadUsers());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBe(MESSAGES.network);
  });
});

describe('useUsers - create', () => {
  it('sends the new user to the API and adds it to the top of the list', async () => {
    const { result } = await renderLoadedHook();
    service.createUser.mockResolvedValue({ ...johnSmith, id: 11 });

    let created;
    await act(async () => {
      created = await result.current.addUser(johnSmith);
    });

    expect(service.createUser).toHaveBeenCalledWith(johnSmith);
    expect(created).toEqual({ ...johnSmith, id: 11 });
    expect(result.current.users.map((u) => u.id)).toEqual([11, 1, 2]);
    expect(result.current.sessionChanges).toEqual({ 11: 'created' });
  });

  it('gives each created user a unique id even though the fake API always returns 11', async () => {
    const { result } = await renderLoadedHook();
    service.createUser.mockResolvedValue({ ...johnSmith, id: 11 });

    await act(() => result.current.addUser(johnSmith));
    await act(() => result.current.addUser({ ...johnSmith, username: 'second' }));

    const ids = result.current.users.map((u) => u.id);
    expect(ids).toEqual([12, 11, 1, 2]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('leaves the list unchanged when the API call fails', async () => {
    const { result } = await renderLoadedHook();
    service.createUser.mockRejectedValue(new Error('boom'));

    await act(async () => {
      await expect(result.current.addUser(johnSmith)).rejects.toThrow('boom');
    });

    expect(result.current.users).toEqual(sampleUsers);
    expect(result.current.sessionChanges).toEqual({});
  });
});

describe('useUsers - update', () => {
  it('sends PUT and merges the response, keeping address and company', async () => {
    const { result } = await renderLoadedHook();
    // Like the real API: the PUT response contains only the fields we sent.
    service.updateUser.mockResolvedValue({ ...johnSmith, id: 1 });

    await act(() => result.current.editUser(1, johnSmith));

    expect(service.updateUser).toHaveBeenCalledWith(1, johnSmith);
    const updated = result.current.findUser(1);
    expect(updated).toEqual({ ...leanne, ...johnSmith, id: 1 });
    expect(updated?.address).toEqual(leanne.address);
    expect(updated?.company).toEqual(leanne.company);
    expect(result.current.sessionChanges).toEqual({ 1: 'updated' });
  });

  it('updates users created in this session locally, without calling PUT (the server would answer 404)', async () => {
    const { result } = await renderLoadedHook();
    service.createUser.mockResolvedValue({ ...johnSmith, id: 11 });
    await act(() => result.current.addUser(johnSmith));

    await act(() => result.current.editUser(11, { ...johnSmith, name: 'Johnny Smith' }));

    expect(service.updateUser).not.toHaveBeenCalled();
    expect(result.current.findUser(11)?.name).toBe('Johnny Smith');
    expect(result.current.sessionChanges[11]).toBe('created');
  });

  it('keeps the old data when the API call fails', async () => {
    const { result } = await renderLoadedHook();
    service.updateUser.mockRejectedValue(new Error('server down'));

    await act(async () => {
      await expect(result.current.editUser(1, johnSmith)).rejects.toThrow('server down');
    });

    expect(result.current.findUser(1)).toEqual(leanne);
    expect(result.current.sessionChanges).toEqual({});
  });
});

describe('useUsers - delete', () => {
  it('removes the user after the API confirms the deletion', async () => {
    const { result } = await renderLoadedHook();
    service.deleteUser.mockResolvedValue(undefined);

    await act(() => result.current.removeUser(1));

    expect(service.deleteUser).toHaveBeenCalledWith(1);
    expect(result.current.users).toEqual([ervin]);
    expect(result.current.sessionChanges).toEqual({ 1: 'deleted' });
  });

  it('keeps the user when the API call fails', async () => {
    const { result } = await renderLoadedHook();
    service.deleteUser.mockRejectedValue(new Error('timeout'));

    await act(async () => {
      await expect(result.current.removeUser(1)).rejects.toThrow('timeout');
    });

    expect(result.current.users).toEqual(sampleUsers);
  });
});

describe('useUsers - refresh', () => {
  it('reloads the original server data and forgets session changes', async () => {
    const { result } = await renderLoadedHook();
    service.deleteUser.mockResolvedValue(undefined);
    await act(() => result.current.removeUser(1));
    expect(result.current.users).toHaveLength(1);

    await act(() => result.current.refreshUsers());

    expect(service.getUsers).toHaveBeenCalledTimes(2);
    expect(result.current.users).toEqual(sampleUsers);
    expect(result.current.sessionChanges).toEqual({});
    expect(result.current.isRefreshing).toBe(false);
  });
});

describe('getNextLocalId', () => {
  it('returns one more than the highest id in use', () => {
    expect(getNextLocalId([])).toBe(1);
    expect(getNextLocalId(sampleUsers)).toBe(3);
    // Ids of deleted users are passed as usedIds so they are never reused.
    expect(getNextLocalId(sampleUsers, [10])).toBe(11);
  });
});
