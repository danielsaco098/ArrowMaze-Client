export interface HttpRequestOptions {
  /** Bearer token to send in the Authorization header. */
  readonly token?: string;
  /** Query parameters appended to the URL. */
  readonly query?: Record<string, string | number>;
}

/** Raised when the server responds with a non-2xx status. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Port for talking to the backend over HTTP (Dependency Inversion). Adapters
 * (REST repositories/APIs) depend on this abstraction; the concrete fetch-based
 * client lives in Layer 4 and is injected at the composition root.
 */
export interface IHttpClient {
  get<T>(path: string, options?: HttpRequestOptions): Promise<T>;
  post<T>(path: string, body: unknown, options?: HttpRequestOptions): Promise<T>;
  put<T>(path: string, body: unknown, options?: HttpRequestOptions): Promise<T>;
}
