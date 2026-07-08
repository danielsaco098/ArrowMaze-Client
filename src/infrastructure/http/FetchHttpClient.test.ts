import { FetchHttpClient } from './FetchHttpClient';
import { HttpError } from '../../application/ports/IHttpClient';

function mockFetch(response: { ok: boolean; status: number; body?: unknown }) {
  const fn = jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: async () => response.body,
  });
  (globalThis as { fetch: unknown }).fetch = fn;
  return fn;
}

describe('FetchHttpClient', () => {
  it('should_build_the_url_and_parse_json_when_getting_with_query_params', async () => {
    // Arrange
    const fetchMock = mockFetch({ ok: true, status: 200, body: [{ id: 1 }] });
    const client = new FetchHttpClient('http://api.test');

    // Act
    const result = await client.get<{ id: number }[]>('/levels', { query: { limit: 5 } });

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/levels?limit=5',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual([{ id: 1 }]);
  });

  it('should_send_json_and_the_bearer_token_when_posting', async () => {
    // Arrange
    const fetchMock = mockFetch({ ok: true, status: 201, body: { accessToken: 't' } });
    const client = new FetchHttpClient('http://api.test');

    // Act
    await client.post('/auth/login', { username: 'a' }, { token: 'abc' });

    // Assert
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ username: 'a' }));
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('should_throw_HttpError_when_the_response_is_not_ok', async () => {
    // Arrange
    mockFetch({ ok: false, status: 401 });
    const client = new FetchHttpClient('http://api.test');

    // Act / Assert
    await expect(client.get('/progress', { token: 'bad' })).rejects.toMatchObject({
      name: 'HttpError',
      status: 401,
    });
    await expect(client.get('/progress')).rejects.toBeInstanceOf(HttpError);
  });
});
