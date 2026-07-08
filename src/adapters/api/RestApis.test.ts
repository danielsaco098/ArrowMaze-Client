import { RestAuthApi } from './RestAuthApi';
import { RestLeaderboardApi } from './RestLeaderboardApi';
import { RestProgressApi } from './RestProgressApi';
import { FakeHttpClient } from '../../test-support/FakeHttpClient';

describe('RestAuthApi', () => {
  it('should_post_the_credentials_when_registering', async () => {
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

  it('should_post_the_credentials_when_logging_in', async () => {
    const http = new FakeHttpClient(() => ({ accessToken: 't', user: { id: '1', username: 'a', role: 'user' } }));
    const api = new RestAuthApi(http);

    await api.login({ username: 'a', password: 'secret123' });

    expect(http.calls[0]).toMatchObject({ method: 'POST', path: '/auth/login' });
  });
});

describe('RestLeaderboardApi', () => {
  it('should_send_the_limit_when_requesting_a_level_top', async () => {
    const http = new FakeHttpClient(() => [{ levelId: 1, username: 'a', score: 900, achievedAt: 'x' }]);
    const api = new RestLeaderboardApi(http);

    const top = await api.topForLevel(1, 5);

    expect(http.calls[0]).toMatchObject({ method: 'GET', path: '/leaderboard/1', options: { query: { limit: 5 } } });
    expect(top[0].score).toBe(900);
  });

  it('should_call_the_overall_endpoint_when_requesting_the_ranking', async () => {
    const http = new FakeHttpClient(() => [{ username: 'a', totalScore: 4200, levelsPlayed: 5 }]);
    const api = new RestLeaderboardApi(http);

    const overall = await api.topOverall(5);

    expect(http.calls[0]).toMatchObject({ method: 'GET', path: '/leaderboard', options: { query: { limit: 5 } } });
    expect(overall[0].totalScore).toBe(4200);
  });
});

describe('RestProgressApi', () => {
  it('should_send_the_bearer_token_when_syncing_results', async () => {
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

  it('should_send_the_bearer_token_when_getting_progress', async () => {
    const http = new FakeHttpClient(() => []);
    const api = new RestProgressApi(http);

    await api.getProgress('jwt-token');

    expect(http.calls[0]).toMatchObject({ method: 'GET', path: '/progress', options: { token: 'jwt-token' } });
  });
});
