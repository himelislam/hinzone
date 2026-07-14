import type { ApiErrorResponse, ApiSuccessResponse } from 'shared-types';

// supertest's Response.body is typed `any` - every integration test reading it
// would otherwise trip @typescript-eslint/no-unsafe-member-access. These just
// assert the shape apps/server/src/shared/response/response.helpers.ts actually
// produces (shared-types' envelope), rather than proving it at runtime -
// asserting the HTTP status code alongside a call remains each test's job.
export const successBody = <T>(body: unknown): ApiSuccessResponse<T> =>
  body as ApiSuccessResponse<T>;

export const errorBody = (body: unknown): ApiErrorResponse => body as ApiErrorResponse;
