/**
 * Data models (TypeScript interfaces) for the "users" resource.
 *
 * They describe exactly what JSONPlaceholder sends back, so the TypeScript
 * compiler can warn us when we read a field that does not exist
 * (for example `user.fullName`) or forget a required one.
 */

export interface Geo {
  lat: string;
  lng: string;
}

export interface Address {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: Geo;
}

export interface Company {
  name: string;
  catchPhrase: string;
  bs: string;
}

/** A user as returned by `GET /users` and `GET /users/{id}`. */
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  // Users created from our form have no address/company, so these are optional.
  address?: Address;
  company?: Company;
}

/** The request body we send for `POST /users` and `PUT /users/{id}`. */
export interface UserRequest {
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
}

/**
 * What `POST /users` and `PUT /users/{id}` answer with:
 * the fields we sent, plus the `id` chosen by the server.
 */
export interface UserResponse extends UserRequest {
  id: number;
}

/**
 * How a record differs from the fake server's original data in this app session.
 *
 * JSONPlaceholder never really saves anything, so the app remembers which
 * records it changed locally (see `useUsers.ts`). This drives the "New" and
 * "Edited" badges and the warning shown before reloading the original data.
 */
export type SessionChange = 'created' | 'updated' | 'deleted';
