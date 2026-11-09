/**
 * @jest-environment node
 *
 * LIVE tests: these call the real JSONPlaceholder API over the internet.
 * They are skipped by `npm test` and run only with `npm run test:live`.
 *
 * They prove that our service layer really works against the fake API and
 * document its "fake" behaviour (nothing is ever saved).
 */
import { getErrorMessage, MESSAGES } from '../../utils/errorHandling';
import { validateUserForm } from '../../utils/validation';
import { createUser, deleteUser, getUserById, getUsers, updateUser } from '../userService';

const newUser = {
  name: 'John Smith',
  username: 'johnsmith',
  email: 'john@example.com',
  phone: '9876543210',
  website: 'johnsmith.com',
};

jest.setTimeout(30_000);

describe('JSONPlaceholder (live network)', () => {
  it('GET /users returns 10 users, and all of them pass our form validation', async () => {
    const users = await getUsers();

    expect(users).toHaveLength(10);
    for (const user of users) {
      const { name, username, email, phone, website } = user;
      expect(validateUserForm({ name, username, email, phone, website })).toEqual({});
    }
  });

  it('GET /users/1 returns the full record including address and company', async () => {
    const user = await getUserById(1);

    expect(user.name).toBe('Leanne Graham');
    expect(user.address?.city).toBe('Gwenborough');
    expect(user.company?.name).toBe('Romaguera-Crona');
  });

  it('POST /users echoes our data with id 11, but does not really store it', async () => {
    const created = await createUser(newUser);
    expect(created).toEqual({ ...newUser, id: 11 });

    // The fake server never saved it:
    await expect(getUserById(11)).rejects.toMatchObject({ response: { status: 404 } });
    expect(await getUsers()).toHaveLength(10);
  });

  it('PUT /users/1 echoes our data (without address/company), but the server keeps the original', async () => {
    const updated = await updateUser(1, newUser);
    expect(updated).toEqual({ ...newUser, id: 1 });
    expect(updated).not.toHaveProperty('address');

    const afterUpdate = await getUserById(1);
    expect(afterUpdate.name).toBe('Leanne Graham');
  });

  it('PUT /users/11 fails with 404, because created users do not exist on the server', async () => {
    const error = await updateUser(11, newUser).catch((err: unknown) => err);
    expect(getErrorMessage(error)).toBe(MESSAGES.notFound);
  });

  it('DELETE /users/1 succeeds, but the user is still there afterwards', async () => {
    await expect(deleteUser(1)).resolves.toBeUndefined();
    expect((await getUserById(1)).name).toBe('Leanne Graham');
  });
});
