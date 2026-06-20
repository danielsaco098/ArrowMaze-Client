export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  user: { id: string; username: string; role: string };
}

/** Port for the backend authentication endpoints. */
export interface IAuthApi {
  register(credentials: AuthCredentials): Promise<AuthSession>;
  login(credentials: AuthCredentials): Promise<AuthSession>;
}
