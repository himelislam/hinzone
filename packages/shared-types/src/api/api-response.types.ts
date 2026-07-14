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
