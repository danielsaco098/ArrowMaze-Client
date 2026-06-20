import type { IHttpClient } from '../../application/ports/IHttpClient';
import type { AuthCredentials, AuthSession, IAuthApi } from '../../application/ports/IAuthApi';

/** Talks to the backend `/auth/register` and `/auth/login` endpoints. */
export class RestAuthApi implements IAuthApi {
  constructor(private readonly http: IHttpClient) {}

  register(credentials: AuthCredentials): Promise<AuthSession> {
    return this.http.post<AuthSession>('/auth/register', credentials);
  }

  login(credentials: AuthCredentials): Promise<AuthSession> {
    return this.http.post<AuthSession>('/auth/login', credentials);
  }
}
