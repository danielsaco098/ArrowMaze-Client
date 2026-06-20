import type { IHttpClient } from '../../application/ports/IHttpClient';
import type {
  IProgressApi,
  LevelResult,
  RemoteProgressRecord,
} from '../../application/ports/IProgressApi';

/** Talks to the JWT-protected backend `/progress` endpoints. */
export class RestProgressApi implements IProgressApi {
  constructor(private readonly http: IHttpClient) {}

  sync(token: string, results: LevelResult[]): Promise<RemoteProgressRecord[]> {
    return this.http.post<RemoteProgressRecord[]>('/progress/sync', { results }, { token });
  }

  getProgress(token: string): Promise<RemoteProgressRecord[]> {
    return this.http.get<RemoteProgressRecord[]>('/progress', { token });
  }
}
