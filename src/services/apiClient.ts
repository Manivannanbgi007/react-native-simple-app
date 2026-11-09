import axios from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '../constants/apiConstants';

/**
 * One shared, pre-configured Axios instance for the whole app.
 *
 * Every request made through `apiClient` automatically gets:
 *  - the base URL  -> we can write apiClient.get('/users') instead of the full URL
 *  - a timeout     -> the request fails after 10 s instead of hanging forever
 *  - JSON headers  -> the server knows we send and expect JSON
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Print network traffic to the Metro terminal while developing (never in tests
// or production builds). Watching these lines is the easiest way to see what
// the app sends to the API and what comes back.
const shouldLogRequests = __DEV__ && process.env.NODE_ENV !== 'test';

/**
 * Interceptors are functions Axios runs for EVERY request / response.
 * Here we only log; real apps also use them to attach auth tokens.
 */
apiClient.interceptors.request.use((config) => {
  if (shouldLogRequests) {
    console.log(`[API] -> ${config.method?.toUpperCase()} ${config.url}`, config.data ?? '');
  }
  return config; // always return the config, or the request is never sent
});

apiClient.interceptors.response.use(
  (response) => {
    if (shouldLogRequests) {
      console.log(`[API] <- ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: unknown) => {
    if (shouldLogRequests) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[API] x request failed: ${message}`);
    }
    // Re-throw so the caller's try/catch still receives the error.
    return Promise.reject(error);
  },
);
