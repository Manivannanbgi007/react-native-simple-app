# 04 · API Communication

How does a phone app "talk" to a server? This document explains REST, HTTP and Axios using the
**real** requests this app sends. Every response below was captured from the live JSONPlaceholder API.

---

## 1. What is a REST API?

An **API** (Application Programming Interface) is a way for one program to ask another program for
data or actions. A **REST API** does this over **HTTP**, the same protocol your browser uses, following
a few simple conventions:

- Data is organised as **resources** with **URLs**: `/users` is the collection, `/users/1` is one user.
- The **HTTP method** says *what to do* with the resource: read, create, replace, delete.
- Data travels as **JSON** text.
- Each request is **independent**: the server does not remember previous requests.

**JSONPlaceholder** (`https://jsonplaceholder.typicode.com`) is a free **fake** REST API for learning.
It behaves like a real one, but **never saves changes** (see
[02 §9](02-application-architecture.md#9-strategy-for-the-fake-api)).

### The CRUD ↔ HTTP mapping used in this app

| CRUD | HTTP method | URL | Service function | Success status |
|---|---|---|---|---|
| **R**ead all | `GET` | `/users` | `getUsers()` | `200 OK` |
| **R**ead one | `GET` | `/users/{id}` | `getUserById(id)` | `200 OK` |
| **C**reate | `POST` | `/users` | `createUser(user)` | `201 Created` |
| **U**pdate | `PUT` | `/users/{id}` | `updateUser(id, user)` | `200 OK` |
| **D**elete | `DELETE` | `/users/{id}` | `deleteUser(id)` | `200 OK` |

## 2. The HTTP methods

### HTTP GET: read data

Asks the server to **send** data. It has **no body** and changes nothing on the server.

```http
GET /users/1 HTTP/1.1
Host: jsonplaceholder.typicode.com
Accept: application/json
```

Real response (shortened only where marked):

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```

```json
{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "Gwenborough",
    "zipcode": "92998-3874",
    "geo": { "lat": "-37.3159", "lng": "81.1496" }
  },
  "phone": "1-770-736-8031 x56442",
  "website": "hildegard.org",
  "company": {
    "name": "Romaguera-Crona",
    "catchPhrase": "Multi-layered client-server neural-net",
    "bs": "harness real-time e-markets"
  }
}
```

`GET /users` returns an **array** of 10 such objects.

### HTTP POST: create data

Sends a **body** with the new data. The server creates the resource and returns it, usually with a
new `id`.

```http
POST /users HTTP/1.1
Host: jsonplaceholder.typicode.com
Content-Type: application/json
Accept: application/json
```

```json
{
  "name": "John Smith",
  "username": "johnsmith",
  "email": "john@example.com",
  "phone": "9876543210",
  "website": "johnsmith.com"
}
```

Real response:

```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: https://jsonplaceholder.typicode.com/users/11
```

```json
{
  "name": "John Smith",
  "username": "johnsmith",
  "email": "john@example.com",
  "phone": "9876543210",
  "website": "johnsmith.com",
  "id": 11
}
```

> ⚠️ **Fake API:** the id is **always 11**, and `GET /users/11` afterwards returns `404`. Nothing was stored.

### HTTP PUT: replace data

Sends the **new version** of an existing resource to its URL.

```http
PUT /users/1 HTTP/1.1
Content-Type: application/json
```

Same JSON body as the POST above. Real response:

```http
HTTP/1.1 200 OK
```

```json
{
  "name": "John Smith",
  "username": "johnsmith",
  "email": "john@example.com",
  "phone": "9876543210",
  "website": "johnsmith.com",
  "id": 1
}
```

Notice that `address` and `company` are **missing** from the response: `PUT` *replaces* the
resource with what we sent. That is why `editUser` **merges** the response into the existing user.
(`PATCH` is the method for changing *only some* fields, but this app uses `PUT` as required.)

`PUT /users/11` (a user created in the app) returns **`404 Not Found`** with body `{}`.

### HTTP DELETE: remove data

No body. Real response:

```http
DELETE /users/1 HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```

```json
{}
```

## 3. What is Axios?

**Axios** is a popular JavaScript library for sending HTTP requests. Compared with the built-in `fetch`:

| Feature | `fetch` | Axios |
|---|---|---|
| Converts JSON for you | Manually (`await res.json()`, `JSON.stringify(body)`) | Automatically |
| Treats `404`/`500` as errors | No, you must check `res.ok` | Yes, it throws |
| Timeout | Needs an `AbortController` | `timeout: 10000` option |
| Shared config (base URL, headers) | Write your own wrapper | `axios.create({...})` |
| Interceptors (run code for every request) | Not built in | Built in |

### The shared client: [`src/services/apiClient.ts`](../src/services/apiClient.ts)

```ts
export const apiClient = axios.create({
  baseURL: API_BASE_URL,          // 'https://jsonplaceholder.typicode.com'
  timeout: API_TIMEOUT_MS,        // 10_000 ms
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
```

Now `apiClient.get('/users')` automatically means
`GET https://jsonplaceholder.typicode.com/users` with JSON headers and a 10-second timeout.

**Interceptors** run for every request and response. This app uses them for logging in development:

```ts
apiClient.interceptors.request.use((config) => {
  if (shouldLogRequests) console.log(`[API] -> ${config.method?.toUpperCase()} ${config.url}`, config.data ?? '');
  return config;   // must return the config, or the request is never sent
});
```

Real apps also use a request interceptor to attach a login token (`Authorization: Bearer ...`).

## 4. Request headers

**Headers** are key/value metadata sent along with a request or response.

| Header | Sent by | Meaning |
|---|---|---|
| `Content-Type: application/json` | App (POST/PUT) | "My **body** is JSON." Without it, many servers cannot read the body. |
| `Accept: application/json` | App | "Please **answer** in JSON." |
| `Content-Type: application/json; charset=utf-8` | Server | "My answer is JSON text in UTF-8." |
| `Location: .../users/11` | Server (after POST) | URL of the newly created resource |
| `Authorization: Bearer <token>` | (not used here) | Proves who you are, in apps with login |

## 5. Request bodies

The **body** is the data sent with `POST` and `PUT`. In the app it is a typed object:

```ts
// src/services/userService.ts
export const createUser = async (user: UserRequest): Promise<UserResponse> => {
  const response = await apiClient.post<UserResponse>(API_ENDPOINTS.users, user);
  return ensureUser(response.data);
};
```

Axios converts `user` to JSON text (`JSON.stringify`) and sends it. The body is built from the form
by `toUserRequest(values)`, which also **trims spaces** first. `GET` and `DELETE` have no body.

## 6. API responses

Axios wraps every answer in a **response object**:

```ts
const response = await apiClient.get('/users/1');
response.status;   // 200
response.headers;  // { 'content-type': 'application/json; charset=utf-8', ... }
response.data;     // the parsed JSON body, e.g. { id: 1, name: 'Leanne Graham', ... }
```

The service returns only `response.data`, after checking its shape, so the hooks and screens work
with clean `User` objects:

```ts
export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>(API_ENDPOINTS.users);
  const data: unknown = response.data;
  if (!Array.isArray(data) || !data.every(isUserLike)) {
    throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
  }
  return data as User[];
};
```

> `apiClient.get<User[]>` is only a *promise to TypeScript* about the type. It does not check
> anything at runtime. That is why `isUserLike` exists.

## 7. HTTP status codes

| Code | Name | Meaning | Where you meet it here |
|---|---|---|---|
| **200** | OK | Success | GET, PUT, DELETE |
| **201** | Created | A new resource was created | POST /users |
| 204 | No Content | Success, empty body | (common in real APIs for DELETE) |
| 400 | Bad Request | The server could not understand the request | Message: *"The request was rejected..."* |
| 401 / 403 | Unauthorized / Forbidden | Not logged in / not allowed | (not used by JSONPlaceholder) |
| **404** | Not Found | The resource does not exist | `GET` or `PUT /users/11` |
| 500 | Internal Server Error | The server crashed | Message: *"The server had a problem (HTTP 500)..."* |
| 503 | Service Unavailable | Server down / overloaded | Same 5xx message |

Rule of thumb: **2xx** = success, **4xx** = the *request* was wrong, **5xx** = the *server* had a problem.

## 8. How errors are handled

Axios throws an error for network problems, timeouts and any non-2xx status. The error travels up:

```text
Axios throws  ─►  userService (does not catch: passes it on)
              ─►  useUsers hook
                    • loadUsers/refreshUsers: catches it, stores getErrorMessage(err) in `error`
                    • addUser/editUser/removeUser: lets it through (state unchanged)
              ─►  Screen
                    • shows a full-screen error, a banner, or an Alert with getErrorMessage(err)
```

[`getErrorMessage`](../src/utils/errorHandling.ts) decides the text:

```ts
if (isAxiosError(error)) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return MESSAGES.timeout;
  if (!error.response) return MESSAGES.network;           // never reached the server
  const { status } = error.response;
  if (status === 404) return MESSAGES.notFound;
  if (status >= 500) return `The server had a problem (HTTP ${status}). Please try again later.`;
  return `The request was rejected by the server (HTTP ${status}).`;
}
if (error instanceof Error && error.message) return error.message;
return MESSAGES.unknown;
```

The error-handling diagram is in [03 · H](03-application-workflows.md#h-error-handling).

## 9. How to inspect requests (debugging tools)

### a) The Metro terminal (easiest)

While developing, every request is logged by the interceptors in `apiClient.ts`. In the terminal
where `npx expo start` runs you will see lines like:

```text
[API] -> GET /users
[API] <- 200 /users
[API] -> POST /users { name: 'John Smith', username: 'johnsmith', ... }
[API] <- 201 /users
[API] -> DELETE /users/3
[API] <- 200 /users/3
```

### b) React Native DevTools

Press **`j`** in the Expo terminal, or open the developer menu (shake the phone, or `Ctrl+M` on the
Android emulator) and choose **Open DevTools**. You get:

- **Console**: the same `[API]` logs, plus any errors.
- **Sources**: set breakpoints in `userService.ts` and inspect `response.data`.
- **Network** panel (in recent React Native versions): every request with headers, body and timing.

### c) Try the API without the app

Paste a URL in a browser: <https://jsonplaceholder.typicode.com/users/1>. Or use `curl` in a
terminal (Git Bash / macOS / Linux):

```bash
curl https://jsonplaceholder.typicode.com/users/1

curl -i -X POST https://jsonplaceholder.typicode.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith","username":"johnsmith","email":"john@example.com","phone":"9876543210","website":"johnsmith.com"}'
```

In Windows **PowerShell**:

```powershell
Invoke-RestMethod https://jsonplaceholder.typicode.com/users/1

Invoke-RestMethod -Method Post -Uri https://jsonplaceholder.typicode.com/users `
  -ContentType 'application/json' `
  -Body '{"name":"John Smith","username":"johnsmith","email":"john@example.com","phone":"9876543210","website":"johnsmith.com"}'
```

Tools such as **Postman**, **Insomnia** or VS Code's **REST Client** extension do the same with a UI.

### d) The live API tests

```bash
npm run test:live
```

This runs [`userService.live.test.ts`](../src/services/__tests__/userService.live.test.ts), which calls
the real API through **this app's own service code** and checks every behaviour described above.

---

**Next:** [05 · CRUD Internal Implementation →](05-crud-internal-implementation.md)
