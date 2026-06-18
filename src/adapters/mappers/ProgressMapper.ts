import { PlayerProgress } from '../../domain/entities/PlayerProgress';

interface ProgressEntryDto {
  readonly levelId: number;
  readonly points: number;
}

export interface ProgressDto {
  readonly version: number;
  readonly bestScores: ReadonlyArray<ProgressEntryDto>;
}

/**
 * Maps {@link PlayerProgress} to/from its serialized DTO form, keeping the
 * storage format (JSON shape, version) out of the domain entity.
 */
export class ProgressMapper {
  private static readonly VERSION = 1;

  toDto(progress: PlayerProgress): ProgressDto {
    return {
      version: ProgressMapper.VERSION,
      bestScores: progress.entries().map(([levelId, points]) => ({ levelId, points })),
    };
  }

  toDomain(dto: ProgressDto): PlayerProgress {
    return PlayerProgress.fromEntries(dto.bestScores.map((e) => [e.levelId, e.points] as const));
  }

  serialize(progress: PlayerProgress): string {
    return JSON.stringify(this.toDto(progress));
  }

  deserialize(raw: string): PlayerProgress {
    const dto = JSON.parse(raw) as ProgressDto;
    if (!dto || !Array.isArray(dto.bestScores)) {
      throw new Error('Malformed progress payload.');
    }
    return this.toDomain(dto);
  }
}
