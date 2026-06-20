import type { ILevelRepository } from '../../application/ports/ILevelRepository';
import type { ILevelBuilder, LevelData } from '../../application/ports/ILevelBuilder';
import type { IHttpClient } from '../../application/ports/IHttpClient';
import { JsonLevelBuilder } from '../builders/JsonLevelBuilder';
import { Level } from '../../domain/entities/Level';
import { LevelNotFoundError } from '../../application/errors';
import { HttpError } from '../../application/ports/IHttpClient';

/**
 * {@link ILevelRepository} backed by the backend REST API (`GET /levels`,
 * `GET /levels/:id`). The backend returns the same `LevelData` shape the
 * {@link ILevelBuilder} consumes, so the repository just fetches and builds —
 * a remote drop-in replacement for the bundled repository (Strategy/Adapter).
 */
export class RestLevelRepository implements ILevelRepository {
  constructor(
    private readonly http: IHttpClient,
    private readonly builder: ILevelBuilder = new JsonLevelBuilder(),
  ) {}

  async getById(id: number): Promise<Level> {
    try {
      const data = await this.http.get<LevelData>(`/levels/${id}`);
      return this.builder.build(data);
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) {
        throw new LevelNotFoundError(id);
      }
      throw error;
    }
  }

  async getAll(): Promise<Level[]> {
    const data = await this.http.get<LevelData[]>('/levels');
    return data.map((definition) => this.builder.build(definition));
  }
}
