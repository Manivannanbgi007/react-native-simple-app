import { johnSmith } from '../../test-utils/fixtures';
import {
  EMPTY_USER_FORM,
  hasErrors,
  isValidEmail,
  toUserRequest,
  validateField,
  validateUserForm,
} from '../validation';

describe('validateUserForm', () => {
  it('accepts a complete, valid form', () => {
    expect(validateUserForm(johnSmith)).toEqual({});
  });

  it('reports every required field when the form is empty', () => {
    const errors = validateUserForm(EMPTY_USER_FORM);

    expect(errors).toEqual({
      name: 'Name is required.',
      username: 'Username is required.',
      email: 'Email is required.',
      phone: 'Phone is required.',
    });
    // Website is optional, so it has no error.
    expect(errors.website).toBeUndefined();
  });

  it('treats a value made only of spaces as empty', () => {
    expect(validateField('name', '    ')).toBe('Name is required.');
  });

  it('accepts the editable fields of all 10 real JSONPlaceholder users', () => {
    // Copied from GET https://jsonplaceholder.typicode.com/users
    const realUsers = [
      ['Leanne Graham', 'Bret', 'Sincere@april.biz', '1-770-736-8031 x56442', 'hildegard.org'],
      ['Ervin Howell', 'Antonette', 'Shanna@melissa.tv', '010-692-6593 x09125', 'anastasia.net'],
      ['Clementine Bauch', 'Samantha', 'Nathan@yesenia.net', '1-463-123-4447', 'ramiro.info'],
      ['Patricia Lebsack', 'Karianne', 'Julianne.OConner@kory.org', '493-170-9623 x156', 'kale.biz'],
      ['Chelsey Dietrich', 'Kamren', 'Lucio_Hettinger@annie.ca', '(254)954-1289', 'demarco.info'],
      ['Mrs. Dennis Schulist', 'Leopoldo_Corkery', 'Karley_Dach@jasper.info', '1-477-935-8478 x6430', 'ola.org'],
      ['Kurtis Weissnat', 'Elwyn.Skiles', 'Telly.Hoeger@billy.biz', '210.067.6132', 'elvis.io'],
      ['Nicholas Runolfsdottir V', 'Maxime_Nienow', 'Sherwood@rosamond.me', '586.493.6943 x140', 'jacynthe.com'],
      ['Glenna Reichert', 'Delphine', 'Chaim_McDermott@dana.io', '(775)976-6794 x41206', 'conrad.com'],
      ['Clementina DuBuque', 'Moriah.Stanton', 'Rey.Padberg@karina.biz', '024-648-3804', 'ambrose.net'],
    ];

    for (const [name, username, email, phone, website] of realUsers) {
      expect(validateUserForm({ name, username, email, phone, website })).toEqual({});
    }
  });
});

describe('email validation', () => {
  it.each(['john@example.com', 'Julianne.OConner@kory.org', 'a_b@sub.domain.io'])(
    'accepts %s',
    (email) => {
      expect(isValidEmail(email)).toBe(true);
      expect(validateField('email', email)).toBeUndefined();
    },
  );

  it.each(['john', 'john@', 'john@example', '@example.com', 'john smith@example.com', 'john@example.c'])(
    'rejects %s',
    (email) => {
      expect(isValidEmail(email)).toBe(false);
      expect(validateField('email', email)).toBe('Enter a valid email address, e.g. name@example.com.');
    },
  );
});

describe('field rules', () => {
  it('rejects a too-short name', () => {
    expect(validateField('name', 'J')).toBe('Name must be at least 2 characters.');
  });

  it('rejects usernames with spaces or symbols', () => {
    expect(validateField('username', 'john smith')).toMatch(/letters, numbers, dots and underscores/);
    expect(validateField('username', 'john#1')).toMatch(/letters, numbers, dots and underscores/);
  });

  it('rejects phone numbers with letters or too few digits', () => {
    expect(validateField('phone', 'call me')).toMatch(/only contain digits/);
    expect(validateField('phone', '12-34')).toBe('Phone must contain at least 7 digits.');
  });

  it('allows an empty website but rejects an invalid one', () => {
    expect(validateField('website', '')).toBeUndefined();
    expect(validateField('website', 'https://johnsmith.com/about')).toBeUndefined();
    expect(validateField('website', 'not a website')).toBe('Enter a valid website, e.g. example.com.');
  });
});

describe('helpers', () => {
  it('hasErrors ignores fields whose error was cleared', () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ email: undefined })).toBe(false);
    expect(hasErrors({ email: 'Email is required.' })).toBe(true);
  });

  it('toUserRequest trims surrounding spaces', () => {
    expect(
      toUserRequest({
        name: '  John Smith ',
        username: ' johnsmith',
        email: 'john@example.com  ',
        phone: ' 9876543210 ',
        website: ' johnsmith.com ',
      }),
    ).toEqual(johnSmith);
  });
});
