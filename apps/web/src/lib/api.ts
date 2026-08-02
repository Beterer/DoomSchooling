import type {
  FeedRequest,
  GeneratedFeed,
  ContinueFeedRequest,
  FeedContinuation,
  BulbBooking,
  BulbBookingEntry,
  BulbBookingReceipt,
} from '@doomschooling/shared';

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
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

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

export async function continueFeed(request: ContinueFeedRequest): Promise<FeedContinuation> {
  return fetchApi<FeedContinuation>('/api/feeds/continue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}

export async function bookBulbVisit(booking: BulbBooking): Promise<BulbBookingReceipt> {
  return fetchApi<BulbBookingReceipt>('/api/becuri', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
}

export async function fetchBulbBookings(token: string): Promise<BulbBookingEntry[]> {
  // The token travels in a header so it never lands in the API request log.
  return fetchApi<BulbBookingEntry[]>('/api/becuri/answers', {
    method: 'GET',
    headers: { 'x-becuri-token': token },
  });
}
