import type { FeedRequest, GeneratedFeed } from '@doomschooling/shared';

type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

type ApiSuccess<T> = {
  data: T;
};

async function fetchApi<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const body = (await response.json()) as ApiError;
    throw new Error(body.error.message);
  }

  const body = (await response.json()) as ApiSuccess<T>;
  return body.data;
}

export async function generateFeed(request: FeedRequest): Promise<GeneratedFeed> {
  return fetchApi<GeneratedFeed>('/api/feeds/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}
