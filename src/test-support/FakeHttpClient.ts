import type { HttpRequestOptions, IHttpClient } from '../application/ports/IHttpClient';

interface RecordedCall {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  body?: unknown;
  options?: HttpRequestOptions;
}

type Handler = (call: RecordedCall) => unknown;

/** Records requests and returns canned responses, for adapter tests. */
export class FakeHttpClient implements IHttpClient {
  readonly calls: RecordedCall[] = [];

  constructor(private readonly handler: Handler = () => undefined) {}

  get<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    return this.record<T>({ method: 'GET', path, options });
  }

  post<T>(path: string, body: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.record<T>({ method: 'POST', path, body, options });
  }

  put<T>(path: string, body: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.record<T>({ method: 'PUT', path, body, options });
  }

  private async record<T>(call: RecordedCall): Promise<T> {
    this.calls.push(call);
    return this.handler(call) as T;
  }
}
