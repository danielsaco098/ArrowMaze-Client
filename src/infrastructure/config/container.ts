import type { UseCase } from '../../application/ports/UseCase';
import type { ILevelRepository } from '../../application/ports/ILevelRepository';
import { LoadLevelUseCase, LoadLevelInput, LoadLevelOutput } from '../../application/use-cases/LoadLevelUseCase';
import { TapCellUseCase, TapCellInput } from '../../application/use-cases/TapCellUseCase';
import {
  RecordLevelResultUseCase,
  RecordLevelResultInput,
  RecordLevelResultOutput,
} from '../../application/use-cases/RecordLevelResultUseCase';
import { GetProgressUseCase } from '../../application/use-cases/GetProgressUseCase';
import { LoggingUseCaseDecorator } from '../../application/decorators/LoggingUseCaseDecorator';
import { MetricsUseCaseDecorator } from '../../application/decorators/MetricsUseCaseDecorator';
import { ExceptionHandlingUseCaseDecorator } from '../../application/decorators/ExceptionHandlingUseCaseDecorator';
import { BundledLevelRepository } from '../../adapters/repositories/BundledLevelRepository';
import { LocalProgressRepository } from '../../adapters/repositories/LocalProgressRepository';
import { InMemoryEventBus } from '../../adapters/events/InMemoryEventBus';
import { StandardScoringStrategy } from '../../domain/services/StandardScoringStrategy';
import type { TapResult } from '../../domain/entities/GameStatus';
import type { PlayerProgress } from '../../domain/entities/PlayerProgress';
import { AudioObserver } from '../../adapters/observers/AudioObserver';
import { BUNDLED_LEVELS } from '../data/bundledLevels';
import { SystemClock } from '../observability/SystemClock';
import { ConsoleLogger } from '../observability/ConsoleLogger';
import { ConsoleMetricsRecorder } from '../observability/ConsoleMetricsRecorder';
import { AsyncStorageKeyValue } from '../storage/AsyncStorageKeyValue';
import { AudioManager } from '../audio/AudioManager';
import type { IAuthApi } from '../../application/ports/IAuthApi';
import type { ILeaderboardApi } from '../../application/ports/ILeaderboardApi';
import type { IProgressApi } from '../../application/ports/IProgressApi';
import { FetchHttpClient } from '../http/FetchHttpClient';
import { RestAuthApi } from '../../adapters/api/RestAuthApi';
import { RestLeaderboardApi } from '../../adapters/api/RestLeaderboardApi';
import { RestProgressApi } from '../../adapters/api/RestProgressApi';
import { SessionStore } from '../../adapters/session/SessionStore';
import { apiConfig } from './apiConfig';

/** Everything the UI needs, behind the {@link UseCase} abstraction. */
export interface AppContainer {
  readonly levels: ILevelRepository;
  readonly eventBus: InMemoryEventBus;
  readonly loadLevel: UseCase<LoadLevelInput, LoadLevelOutput>;
  readonly tapCell: UseCase<TapCellInput, TapResult>;
  readonly recordResult: UseCase<RecordLevelResultInput, RecordLevelResultOutput>;
  readonly getProgress: UseCase<void, PlayerProgress>;
  /** Backend API clients (online features: auth, leaderboard, progress sync). */
  readonly authApi: IAuthApi;
  readonly leaderboardApi: ILeaderboardApi;
  readonly progressApi: IProgressApi;
  /** Persisted authentication session (token + user). */
  readonly session: SessionStore;
}

/**
 * Composition Root (Layer 4): the single place where concrete implementations
 * are created and wired together. Every use case is wrapped with the AOP
 * decorators here, so the business code stays free of cross-cutting concerns and
 * the rest of the app depends only on the {@link AppContainer} abstractions.
 */
export function createContainer(): AppContainer {
  const logger = new ConsoleLogger();
  const clock = new SystemClock();
  const metrics = new ConsoleMetricsRecorder();

  const eventBus = new InMemoryEventBus();
  // Levels play offline from the bundled set by default; swap in
  // `new RestLevelRepository(http)` to load them from the backend instead.
  const levels = new BundledLevelRepository(BUNDLED_LEVELS);
  const storage = new AsyncStorageKeyValue();
  const progress = new LocalProgressRepository(storage);
  const scoring = new StandardScoringStrategy();

  // Backend HTTP clients (online features).
  const http = new FetchHttpClient(apiConfig.baseUrl);

  // Audio reacts to game events through the bus (Observer), gated by the
  // AudioManager singleton's mute flag.
  eventBus.subscribe(new AudioObserver(AudioManager.getInstance()));

  const withAspects = <I, O>(useCase: UseCase<I, O>, name: string): UseCase<I, O> =>
    new ExceptionHandlingUseCaseDecorator(
      new MetricsUseCaseDecorator(
        new LoggingUseCaseDecorator(useCase, name, logger, clock),
        name,
        metrics,
        clock,
      ),
      name,
    );

  return {
    levels,
    eventBus,
    loadLevel: withAspects(new LoadLevelUseCase(levels), 'LoadLevel'),
    tapCell: withAspects(new TapCellUseCase(eventBus), 'TapCell'),
    recordResult: withAspects(new RecordLevelResultUseCase(scoring, progress), 'RecordLevelResult'),
    getProgress: withAspects(new GetProgressUseCase(progress), 'GetProgress'),
    authApi: new RestAuthApi(http),
    leaderboardApi: new RestLeaderboardApi(http),
    progressApi: new RestProgressApi(http),
    session: new SessionStore(storage),
  };
}
