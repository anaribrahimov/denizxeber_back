export interface AppApiResponse<T> {
  message?: string | null;
  data: T;
}
