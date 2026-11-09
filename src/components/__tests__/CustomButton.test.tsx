import { fireEvent, render, screen } from '@testing-library/react-native';

import CustomButton from '../CustomButton';

describe('CustomButton', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<CustomButton title="Save User" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Save User' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // UserForm passes loading={isSubmitting}: this is what prevents double submits.
  it('is disabled and ignores presses while loading', async () => {
    const onPress = jest.fn();
    await render(<CustomButton title="Saving..." onPress={onPress} loading />);

    const button = screen.getByRole('button', { name: 'Saving...' });
    expect(button).toBeDisabled();
    expect(button).toBeBusy();

    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
