import { HttpError, HttpRequestOptions, IHttpClient } from '../../application/ports/IHttpClient';

/**
 * Layer 4 {@link IHttpClient} backed by the global `fetch`. Builds the URL from
 * the configured base, attaches the Bearer token and JSON headers, and turns any
 * non-2xx response into an {@link HttpError}.
 */
export class FetchHttpClient implements IHttpClient {
  constructor(private readonly baseUrl: string) {}

  get<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: HttpRequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, options?.query);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (options?.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new HttpError(response.status, `Request to ${path} failed with ${response.status}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  private buildUrl(path: string, query?: Record<string, string | number>): string {
    const url = `${this.baseUrl}${path}`;
    if (!query) {
      return url;
    }
    const params = Object.entries(query)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    return params ? `${url}?${params}` : url;
  }
}
