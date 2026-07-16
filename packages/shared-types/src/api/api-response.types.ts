// Mirrors apps/server/src/shared/response/response.helpers.ts's JSON envelope
// (coding_rules.md #20) so client and server never drift on the response shape.
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  errors?: ApiErrorDetail[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Mirrors apps/server/src/shared/response/response.helpers.ts's
// paginationResponse() envelope - distinct from ApiSuccessResponse above
// because it has no `message` field and its payload is always an array.
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}
