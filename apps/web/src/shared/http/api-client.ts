import { env } from '../config/env';

type RequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;
      const message = Array.isArray(payload?.message)
        ? payload.message.join(', ')
        : payload?.message;

      throw new Error(message || 'Ocurrio un error al consultar la API');
    }

    const message = await response.text();
    throw new Error(message || 'Ocurrio un error al consultar la API');
  }

  return (await response.json()) as T;
}
