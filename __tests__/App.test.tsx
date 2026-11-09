/**
 * Integration tests: render the WHOLE app (navigation, context, screens,
 * form) and click through each CRUD workflow like a real user would.
 *
 * Only the network layer (userService) is replaced with fakes, so the tests
 * are fast and do not depend on the internet. `Alert.alert` is replaced too,
 * because there is no real dialog in a test: our fake simply "taps" one of the
 * dialog's buttons.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError } from 'axios';
import { Alert, type AlertButton } from 'react-native';

import App from '../App';
import * as userService from '../src/services/userService';
import { johnSmith, leanne, sampleUsers } from '../src/test-utils/fixtures';
import { MESSAGES } from '../src/utils/errorHandling';

jest.mock('../src/services/userService');
const service = jest.mocked(userService);

type AlertFn = (title: string, message?: string, buttons?: AlertButton[]) => void;

/** By default our fake user taps the LAST button: "OK", "Delete" or "Reload". */
const tapLastButton: AlertFn = (_title, _message, buttons) => {
  buttons?.[buttons.length - 1]?.onPress?.();
};

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  service.getUsers.mockResolvedValue(sampleUsers);
  service.getUserById.mockImplementation(async (id) => {
    const user = sampleUsers.find((candidate) => candidate.id === id);
    if (!user) throw new Error('not found');
    return user;
  });
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(tapLastButton as typeof Alert.alert);
});

afterEach(() => {
  alertSpy.mockRestore();
});

/** Starts the app and waits until the first list has been rendered. */
async function renderApp() {
  await render(<App />);
  await screen.findByText('Leanne Graham');
}

async function fillUserForm(values: Record<string, string>) {
  for (const [label, text] of Object.entries(values)) {
    await fireEvent.changeText(await screen.findByLabelText(label), text);
  }
}

describe('Workflow 1: load users', () => {
  it('loads users from the API on start-up and renders them', async () => {
    await renderApp();

    expect(service.getUsers).toHaveBeenCalledTimes(1);
    expect(screen.getByText('2 users')).toBeOnTheScreen();
    expect(screen.getByText('Ervin Howell')).toBeOnTheScreen();
    expect(screen.getByText('@Bret')).toBeOnTheScreen();
    expect(screen.getByText('Sincere@april.biz')).toBeOnTheScreen();
  });

  it('shows the error and a working "Try again" button when loading fails', async () => {
    service.getUsers.mockRejectedValueOnce(new AxiosError('Network Error', AxiosError.ERR_NETWORK));
    await render(<App />);

    expect(await screen.findByText('Could not load users')).toBeOnTheScreen();
    expect(screen.getByText(MESSAGES.network)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Leanne Graham')).toBeOnTheScreen();
    expect(service.getUsers).toHaveBeenCalledTimes(2);
  });
});

describe('Workflow 2: create user', () => {
  it('validates, sends POST and shows the new user on the Home screen', async () => {
    service.createUser.mockResolvedValue({ ...johnSmith, id: 11 });
    await renderApp();

    await fireEvent.press(screen.getByRole('button', { name: 'Add user' }));

    // Invalid data is rejected before any request is sent.
    await fireEvent.press(await screen.findByRole('button', { name: 'Save User' }));
    expect(screen.getByText('Name is required.')).toBeOnTheScreen();
    expect(service.createUser).not.toHaveBeenCalled();

    await fillUserForm({
      Name: johnSmith.name,
      Username: johnSmith.username,
      Email: johnSmith.email,
      Phone: johnSmith.phone,
      Website: johnSmith.website,
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Save User' }));

    expect(service.createUser).toHaveBeenCalledWith(johnSmith);
    expect(alertSpy).toHaveBeenCalledWith('User created', expect.stringContaining('John Smith'), expect.any(Array));

    // Back on Home (the alert's OK button navigated back): the list grew.
    expect(await screen.findByText('3 users')).toBeOnTheScreen();
    expect(screen.getByText('John Smith')).toBeOnTheScreen();
    expect(screen.getByText('New')).toBeOnTheScreen();
  });

  it('keeps the form open and shows an error when the API fails', async () => {
    service.createUser.mockRejectedValue(new AxiosError('timeout of 10000ms exceeded', AxiosError.ECONNABORTED));
    await renderApp();

    await fireEvent.press(screen.getByRole('button', { name: 'Add user' }));
    await fillUserForm({
      Name: johnSmith.name,
      Username: johnSmith.username,
      Email: johnSmith.email,
      Phone: johnSmith.phone,
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Save User' }));

    expect(alertSpy).toHaveBeenCalledWith('Could not create user', MESSAGES.timeout);
    expect(screen.getByLabelText('Name')).toHaveDisplayValue('John Smith');
  });
});

describe('Read: user details', () => {
  it('loads the full record with GET /users/{id}', async () => {
    await renderApp();

    await fireEvent.press(screen.getByRole('button', { name: 'View details for Ervin Howell' }));

    expect(await screen.findByText('Deckow-Crist')).toBeOnTheScreen();
    expect(service.getUserById).toHaveBeenCalledWith(2);
    expect(screen.getByText('Source: GET /users/2')).toBeOnTheScreen();
    expect(screen.getByText('Shanna@melissa.tv')).toBeOnTheScreen();
  });
});

describe('Workflow 3: update user', () => {
  it('pre-fills the form, sends PUT and shows the updated values', async () => {
    service.updateUser.mockImplementation(async (id, body) => ({ ...body, id }));
    await renderApp();

    await fireEvent.press(screen.getByRole('button', { name: 'Edit Leanne Graham' }));

    const nameInput = await screen.findByLabelText('Name');
    expect(nameInput).toHaveDisplayValue('Leanne Graham');
    expect(screen.getByLabelText('Email')).toHaveDisplayValue('Sincere@april.biz');

    await fireEvent.changeText(nameInput, 'Leanne Smith');
    await fireEvent.press(screen.getByRole('button', { name: 'Update User' }));

    expect(service.updateUser).toHaveBeenCalledWith(1, {
      name: 'Leanne Smith',
      username: leanne.username,
      email: leanne.email,
      phone: leanne.phone,
      website: leanne.website,
    });
    expect(await screen.findByText('Leanne Smith')).toBeOnTheScreen();
    expect(screen.getByText('Edited')).toBeOnTheScreen();
  });

  it('shows the edited copy on the details screen instead of re-fetching old server data', async () => {
    service.updateUser.mockImplementation(async (id, body) => ({ ...body, id }));
    await renderApp();

    await fireEvent.press(screen.getByRole('button', { name: 'Edit Leanne Graham' }));
    await fireEvent.changeText(await screen.findByLabelText('Name'), 'Leanne Smith');
    await fireEvent.press(screen.getByRole('button', { name: 'Update User' }));
    await screen.findByText('Leanne Smith');

    await fireEvent.press(screen.getByRole('button', { name: 'View details for Leanne Smith' }));

    expect(await screen.findByText('Source: app memory (this session)')).toBeOnTheScreen();
    expect(service.getUserById).not.toHaveBeenCalled();
    // Address and company survived the update (PUT only returns the edited fields).
    expect(screen.getByText('Romaguera-Crona')).toBeOnTheScreen();
  });
});

describe('Workflow 4: delete user', () => {
  it('asks for confirmation, sends DELETE and removes the user', async () => {
    service.deleteUser.mockResolvedValue(undefined);
    await renderApp();

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Leanne Graham' }));

    expect(alertSpy).toHaveBeenCalledWith('Delete user?', expect.stringContaining('Leanne Graham'), expect.any(Array));
    expect(service.deleteUser).toHaveBeenCalledWith(1);
    await waitFor(() => expect(screen.queryByText('Leanne Graham')).not.toBeOnTheScreen());
    expect(screen.getByText('1 user')).toBeOnTheScreen();
    expect(alertSpy).toHaveBeenCalledWith('User deleted', expect.stringContaining('Leanne Graham'));
  });

  it('does nothing when the user cancels the confirmation', async () => {
    await renderApp();
    alertSpy.mockImplementationOnce(((_t, _m, buttons) => buttons?.[0]?.onPress?.()) as typeof Alert.alert);

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Leanne Graham' }));

    expect(service.deleteUser).not.toHaveBeenCalled();
    expect(screen.getByText('Leanne Graham')).toBeOnTheScreen();
  });

  it('keeps the user and shows an error when the API fails', async () => {
    service.deleteUser.mockRejectedValue(new AxiosError('timeout of 10000ms exceeded', AxiosError.ECONNABORTED));
    await renderApp();

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Leanne Graham' }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('Delete failed', expect.stringContaining(MESSAGES.timeout)),
    );
    expect(screen.getByText('Leanne Graham')).toBeOnTheScreen();
    expect(screen.getByText('2 users')).toBeOnTheScreen();
  });
});

describe('Refresh', () => {
  it('warns about session changes, then reloads the original data', async () => {
    service.deleteUser.mockResolvedValue(undefined);
    await renderApp();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete Leanne Graham' }));
    await screen.findByText('1 user');

    await fireEvent.press(screen.getByRole('button', { name: 'Refresh' }));

    expect(alertSpy).toHaveBeenCalledWith('Reload original data?', expect.any(String), expect.any(Array));
    expect(await screen.findByText('Leanne Graham')).toBeOnTheScreen();
    expect(screen.getByText('2 users')).toBeOnTheScreen();
    expect(service.getUsers).toHaveBeenCalledTimes(2);
  });
});
