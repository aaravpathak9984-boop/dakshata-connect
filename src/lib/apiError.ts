import { AxiosError } from "axios";
import type { ProblemDetails } from "@/types/auth";

/** Extracts a user-facing message from an API or Firebase error, falling back to a generic message. */
export function getApiErrorMessage(error: any, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;

  if (error.message) {
    return error.message;
  }

  if (error instanceof AxiosError) {
    const problem = error.response?.data as ProblemDetails | undefined;

    if (problem?.errors) {
      const firstField = Object.values(problem.errors)[0];
      if (firstField?.length) {
        return firstField[0];
      }
    }

    return problem?.detail ?? problem?.title ?? error.message ?? fallback;
  }

  return fallback;
}
