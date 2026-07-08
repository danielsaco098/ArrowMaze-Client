import path from 'path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { FetchHttpClient } from '../src/infrastructure/http/FetchHttpClient';
import { RestAuthApi } from '../src/adapters/api/RestAuthApi';
import { RestLeaderboardApi } from '../src/adapters/api/RestLeaderboardApi';
import { RestProgressApi } from '../src/adapters/api/RestProgressApi';
import { RestLevelRepository } from '../src/adapters/repositories/RestLevelRepository';

const { like, eachLike, integer, regex } = MatchersV3;

/**
 * Consumer-driven contract (Pact): these tests run the REAL client adapters
 * against a Pact mock provider and record every expectation into
 * pacts/ArrowMaze-Client-ArrowMaze-Backend.json. The backend then verifies the
 * generated pact against the real NestJS app (see the backend's test:pact), so
 * any breaking change on either side fails a CI build.
 */
const provider = new PactV3({
  consumer: 'ArrowMaze-Client',
  provider: 'ArrowMaze-Backend',
  dir: path.resolve(process.cwd(), 'pacts'),
});

const AUTH_BODY = {
  accessToken: like('jwt-token'),
  user: { id: like('4c6cf76a-0000-0000-0000-000000000000'), username: like('pact_user'), role: like('user') },
};

const BEARER = regex('Bearer .+', 'Bearer jwt-token');

describe('Pact — ArrowMaze-Client ⇄ ArrowMaze-Backend', () => {
  it('should_record_the_register_contract_when_the_username_is_available', async () => {
    provider
      .given('the username pact_user is available')
      .uponReceiving('a registration request')
      .withRequest({
        method: 'POST',
        path: '/auth/register',
        headers: { 'Content-Type': 'application/json' },
        body: { username: 'pact_user', password: 'secret123' },
      })
      .willRespondWith({ status: 201, body: AUTH_BODY });

    await provider.executeTest(async (server) => {
      const api = new RestAuthApi(new FetchHttpClient(server.url));
      const session = await api.register({ username: 'pact_user', password: 'secret123' });
      expect(session.accessToken).toBeTruthy();
      expect(session.user.username).toBe('pact_user');
    });
  });

  it('should_record_the_login_contract_when_the_user_exists', async () => {
    provider
      .given('a user pact_user with password secret123 exists')
      .uponReceiving('a login request')
      .withRequest({
        method: 'POST',
        path: '/auth/login',
        headers: { 'Content-Type': 'application/json' },
        body: { username: 'pact_user', password: 'secret123' },
      })
      .willRespondWith({ status: 200, body: AUTH_BODY });

    await provider.executeTest(async (server) => {
      const api = new RestAuthApi(new FetchHttpClient(server.url));
      const session = await api.login({ username: 'pact_user', password: 'secret123' });
      expect(session.accessToken).toBeTruthy();
    });
  });

  it('should_record_the_levels_contract_when_the_seed_is_loaded', async () => {
    provider
      .given('the level seed is loaded')
      .uponReceiving('a request for all level definitions')
      .withRequest({ method: 'GET', path: '/levels' })
      .willRespondWith({
        status: 200,
        body: eachLike({
          id: integer(1),
          name: like('First Steps'),
          difficulty: regex('EASY|MEDIUM|HARD', 'EASY'),
          rows: integer(3),
          cols: integer(3),
          // Only the keys every cell carries are part of the contract:
          // direction/arrowId/color exist only on some kinds (e.g. arrows),
          // so they cannot be required of walls, stars or empties.
          cells: eachLike({
            row: integer(0),
            col: integer(0),
            kind: regex('ARROW|WALL|EMPTY|EXIT|COLLECTIBLE', 'EMPTY'),
          }),
        }),
      });

    await provider.executeTest(async (server) => {
      const repo = new RestLevelRepository(new FetchHttpClient(server.url));
      const levels = await repo.getAll();
      // The contract data must be buildable by the client's own domain.
      expect(levels.length).toBeGreaterThan(0);
      expect(levels[0].board.rows).toBeGreaterThan(0);
    });
  });

  it('should_record_the_level_leaderboard_contract_when_scores_exist', async () => {
    provider
      .given('scores exist on level 1')
      .uponReceiving('a request for the level 1 leaderboard')
      .withRequest({ method: 'GET', path: '/leaderboard/1', query: { limit: '10' } })
      .willRespondWith({
        status: 200,
        body: eachLike({
          levelId: integer(1),
          username: like('pact_user'),
          score: integer(880),
          achievedAt: like('2026-07-01T12:00:00.000Z'),
        }),
      });

    await provider.executeTest(async (server) => {
      const api = new RestLeaderboardApi(new FetchHttpClient(server.url));
      const top = await api.topForLevel(1);
      expect(top[0].score).toBeGreaterThan(0);
    });
  });

  it('should_record_the_overall_leaderboard_contract_when_scores_exist', async () => {
    provider
      .given('scores exist on level 1')
      .uponReceiving('a request for the overall ranking')
      .withRequest({ method: 'GET', path: '/leaderboard', query: { limit: '10' } })
      .willRespondWith({
        status: 200,
        body: eachLike({
          username: like('pact_user'),
          totalScore: integer(880),
          levelsPlayed: integer(1),
        }),
      });

    await provider.executeTest(async (server) => {
      const api = new RestLeaderboardApi(new FetchHttpClient(server.url));
      const overall = await api.topOverall();
      expect(overall[0].totalScore).toBeGreaterThan(0);
    });
  });

  it('should_record_the_progress_sync_contract_when_the_player_is_authenticated', async () => {
    provider
      .given('an authenticated player exists')
      .uponReceiving('a progress sync request')
      .withRequest({
        method: 'POST',
        path: '/progress/sync',
        headers: { 'Content-Type': 'application/json', Authorization: BEARER },
        body: { results: [{ levelId: 1, score: 880 }] },
      })
      .willRespondWith({
        status: 201,
        body: eachLike({ levelId: integer(1), bestScore: integer(880) }),
      });

    await provider.executeTest(async (server) => {
      const api = new RestProgressApi(new FetchHttpClient(server.url));
      const records = await api.sync('jwt-token', [{ levelId: 1, score: 880 }]);
      expect(records[0].bestScore).toBe(880);
    });
  });

  it('should_record_the_get_progress_contract_when_the_player_is_authenticated', async () => {
    provider
      .given('an authenticated player exists')
      .uponReceiving('a request for the player progress')
      .withRequest({
        method: 'GET',
        path: '/progress',
        headers: { Authorization: BEARER },
      })
      .willRespondWith({
        status: 200,
        body: eachLike({ levelId: integer(1), bestScore: integer(880) }),
      });

    await provider.executeTest(async (server) => {
      const api = new RestProgressApi(new FetchHttpClient(server.url));
      const records = await api.getProgress('jwt-token');
      expect(records.length).toBeGreaterThan(0);
    });
  });
});
