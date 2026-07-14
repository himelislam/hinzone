import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from 'shared-types';

// Every form surfaces server-side failures the same way - a single place to
// unwrap axios' error shape into the message apiClient's error envelope actually
// carries (shared-types' ApiErrorResponse), falling back to a generic message for
// network failures or anything unexpected (ui_rules.md #19 - never expose
// technical details).
export const getErrorMessage = (error: unknown): string | null => {
  if (!error) {
    return null;
  }

  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data.message ?? 'Something went wrong. Please try again.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};
