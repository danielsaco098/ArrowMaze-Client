import { RestAuthApi } from './RestAuthApi';
import { RestLeaderboardApi } from './RestLeaderboardApi';
import { RestProgressApi } from './RestProgressApi';
import { FakeHttpClient } from '../../test-support/FakeHttpClient';

describe('RestAuthApi', () => {
  it('should_post_credentials_to_register', async () => {
    const http = new FakeHttpClient(() => ({ accessToken: 't', user: { id: '1', username: 'a', role: 'user' } }));
    const api = new RestAuthApi(http);

    const session = await api.register({ username: 'a', password: 'secret123' });

    expect(http.calls[0]).toMatchObject({
      method: 'POST',
      path: '/auth/register',
      body: { username: 'a', password: 'secret123' },
    });
    expect(session.accessToken).toBe('t');
  });

  it('should_post_credentials_to_login', async () => {
    const http = new FakeHttpClient(() => ({ accessToken: 't', user: { id: '1', username: 'a', role: 'user' } }));
    const api = new RestAuthApi(http);

    await api.login({ username: 'a', password: 'secret123' });

    expect(http.calls[0]).toMatchObject({ method: 'POST', path: '/auth/login' });
  });
});

describe('RestLeaderboardApi', () => {
  it('should_request_the_top_entries_for_a_level_with_a_limit', async () => {
    const http = new FakeHttpClient(() => [{ levelId: 1, username: 'a', score: 900, achievedAt: 'x' }]);
    const api = new RestLeaderboardApi(http);

    const top = await api.topForLevel(1, 5);

    expect(http.calls[0]).toMatchObject({ method: 'GET', path: '/leaderboard/1', options: { query: { limit: 5 } } });
    expect(top[0].score).toBe(900);
  });
});

describe('RestProgressApi', () => {
  it('should_post_results_with_the_bearer_token_on_sync', async () => {
    const http = new FakeHttpClient(() => [{ levelId: 1, bestScore: 880 }]);
    const api = new RestProgressApi(http);

    const progress = await api.sync('jwt-token', [{ levelId: 1, score: 880 }]);

    expect(http.calls[0]).toMatchObject({
      method: 'POST',
      path: '/progress/sync',
      body: { results: [{ levelId: 1, score: 880 }] },
      options: { token: 'jwt-token' },
    });
    expect(progress[0].bestScore).toBe(880);
  });

  it('should_get_progress_with_the_bearer_token', async () => {
    const http = new FakeHttpClient(() => []);
    const api = new RestProgressApi(http);

    await api.getProgress('jwt-token');

    expect(http.calls[0]).toMatchObject({ method: 'GET', path: '/progress', options: { token: 'jwt-token' } });
  });
});
