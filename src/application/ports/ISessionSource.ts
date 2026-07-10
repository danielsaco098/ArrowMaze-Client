/**
 * Port exposing the current authentication state to the application layer.
 * Implemented by the session adapter (Layer 3); consumed by auth-required use
 * cases and by the authentication aspect, so neither depends on how or where
 * the session is stored.
 */
export interface ISessionSource {
  /** The active access token, or `null` when nobody is signed in. */
  getToken(): Promise<string | null>;
  /** The signed-in user's id, or `null` when playing as a guest. */
  getUserId(): Promise<string | null>;
}
