import { fireEvent, render, screen } from '@testing-library/react-native';

import { johnSmith } from '../../test-utils/fixtures';
import { EMPTY_USER_FORM } from '../../utils/validation';
import UserForm from '../UserForm';

// The form reads the navigation header height to position itself above the
// keyboard. There is no navigator in this test, so we return a fixed value.
jest.mock('@react-navigation/elements', () => ({ useHeaderHeight: () => 0 }));

async function fillForm(values: Record<string, string>) {
  for (const [label, text] of Object.entries(values)) {
    await fireEvent.changeText(screen.getByLabelText(label), text);
  }
}

describe('UserForm', () => {
  it('shows field-level errors and does not submit an empty form', async () => {
    const onSubmit = jest.fn();
    await render(<UserForm initialValues={EMPTY_USER_FORM} submitLabel="Save User" onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Save User' }));

    expect(screen.getByText('Name is required.')).toBeOnTheScreen();
    expect(screen.getByText('Username is required.')).toBeOnTheScreen();
    expect(screen.getByText('Email is required.')).toBeOnTheScreen();
    expect(screen.getByText('Phone is required.')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears an error as soon as the user fixes the field', async () => {
    await render(<UserForm initialValues={EMPTY_USER_FORM} submitLabel="Save User" onSubmit={jest.fn()} />);
    await fillForm({ Email: 'not-an-email' });
    await fireEvent.press(screen.getByRole('button', { name: 'Save User' }));

    expect(screen.getByText('Enter a valid email address, e.g. name@example.com.')).toBeOnTheScreen();

    await fillForm({ Email: 'john@example.com' });

    expect(screen.queryByText('Enter a valid email address, e.g. name@example.com.')).not.toBeOnTheScreen();
  });

  it('submits trimmed values once validation passes', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    await render(<UserForm initialValues={EMPTY_USER_FORM} submitLabel="Save User" onSubmit={onSubmit} />);

    await fillForm({
      Name: '  John Smith ',
      Username: 'johnsmith',
      Email: 'john@example.com',
      Phone: '9876543210',
      Website: 'johnsmith.com',
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Save User' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(johnSmith);
    // After saving finished, the button is usable again.
    expect(screen.getByRole('button', { name: 'Save User' })).toBeEnabled();
  });

  it('pre-fills the fields from initialValues (used by the Edit screen)', async () => {
    await render(<UserForm initialValues={johnSmith} submitLabel="Update User" onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('Name')).toHaveDisplayValue('John Smith');
    expect(screen.getByLabelText('Email')).toHaveDisplayValue('john@example.com');
  });
});
