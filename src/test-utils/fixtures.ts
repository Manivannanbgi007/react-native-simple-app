import type { User, UserRequest } from '../types/User';

/** Shared test data. These two users are copied from the real JSONPlaceholder API. */

export const leanne: User = {
  id: 1,
  name: 'Leanne Graham',
  username: 'Bret',
  email: 'Sincere@april.biz',
  phone: '1-770-736-8031 x56442',
  website: 'hildegard.org',
  address: {
    street: 'Kulas Light',
    suite: 'Apt. 556',
    city: 'Gwenborough',
    zipcode: '92998-3874',
    geo: { lat: '-37.3159', lng: '81.1496' },
  },
  company: {
    name: 'Romaguera-Crona',
    catchPhrase: 'Multi-layered client-server neural-net',
    bs: 'harness real-time e-markets',
  },
};

export const ervin: User = {
  id: 2,
  name: 'Ervin Howell',
  username: 'Antonette',
  email: 'Shanna@melissa.tv',
  phone: '010-692-6593 x09125',
  website: 'anastasia.net',
  address: {
    street: 'Victor Plains',
    suite: 'Suite 879',
    city: 'Wisokyburgh',
    zipcode: '90566-7771',
    geo: { lat: '-43.9509', lng: '-34.4618' },
  },
  company: {
    name: 'Deckow-Crist',
    catchPhrase: 'Proactive didactic contingency',
    bs: 'synergize scalable supply-chains',
  },
};

export const sampleUsers: User[] = [leanne, ervin];

/** The example request body from the requirements document. */
export const johnSmith: UserRequest = {
  name: 'John Smith',
  username: 'johnsmith',
  email: 'john@example.com',
  phone: '9876543210',
  website: 'johnsmith.com',
};
