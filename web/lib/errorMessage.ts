import { ApiRequestError } from "./api";

export const errorMessage = (e: unknown): string => {
  if (e instanceof ApiRequestError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
};
