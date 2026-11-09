import { AxiosError, AxiosHeaders } from 'axios';

import { getErrorMessage, MESSAGES } from '../errorHandling';

/** Builds the kind of error Axios throws when the server answers with an error status. */
function httpError(status: number): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_RESPONSE, config, {}, {
    status,
    statusText: '',
    data: {},
    headers: {},
    config,
  });
}

describe('getErrorMessage', () => {
  it('explains a timeout', () => {
    const error = new AxiosError('timeout of 10000ms exceeded', AxiosError.ECONNABORTED);
    expect(getErrorMessage(error)).toBe(MESSAGES.timeout);
  });

  it('explains a missing internet connection (no response at all)', () => {
    const error = new AxiosError('Network Error', AxiosError.ERR_NETWORK);
    expect(getErrorMessage(error)).toBe(MESSAGES.network);
  });

  it('explains a 404 Not Found', () => {
    expect(getErrorMessage(httpError(404))).toBe(MESSAGES.notFound);
  });

  it('explains a 5xx server error', () => {
    expect(getErrorMessage(httpError(500))).toBe('The server had a problem (HTTP 500). Please try again later.');
  });

  it('explains other HTTP errors', () => {
    expect(getErrorMessage(httpError(400))).toBe('The request was rejected by the server (HTTP 400).');
  });

  it('passes through the message of a normal Error (e.g. unexpected response format)', () => {
    expect(getErrorMessage(new Error('The server sent data in an unexpected format.'))).toBe(
      'The server sent data in an unexpected format.',
    );
  });

  it('falls back to a generic message for unknown values', () => {
    expect(getErrorMessage('something odd')).toBe(MESSAGES.unknown);
    expect(getErrorMessage(undefined)).toBe(MESSAGES.unknown);
  });
});
