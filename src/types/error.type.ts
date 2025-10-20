export interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: number;
}
