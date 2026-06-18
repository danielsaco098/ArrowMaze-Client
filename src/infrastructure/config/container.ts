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

/** Everything the UI needs, behind the {@link UseCase} abstraction. */
export interface AppContainer {
  readonly levels: ILevelRepository;
  readonly eventBus: InMemoryEventBus;
  readonly loadLevel: UseCase<LoadLevelInput, LoadLevelOutput>;
  readonly tapCell: UseCase<TapCellInput, TapResult>;
  readonly recordResult: UseCase<RecordLevelResultInput, RecordLevelResultOutput>;
  readonly getProgress: UseCase<void, PlayerProgress>;
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
  const levels = new BundledLevelRepository(BUNDLED_LEVELS);
  const progress = new LocalProgressRepository(new AsyncStorageKeyValue());
  const scoring = new StandardScoringStrategy();

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
  };
}
