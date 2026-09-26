import { toast } from "@/components/ui/toast";

const STATUS_MESSAGES: Record<number, string> = {
  400: "Please check your input and try again",
  401: "Your session has expired. Please sign in again",
  403: "You don't have permission to perform this action",
  404: "The requested resource was not found",
  409: "This conflicts with existing data",
  422: "Some fields need correction",
  429: "Too many requests. Please wait and try again",
};

export const getErrorMessage = (status: number): string => {
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status >= 500) return "Something went wrong. Please try again";
  return "An unexpected error occurred";
};

const shownErrors = new Set<string>();

const clearError = (fingerprint: string) => {
  setTimeout(() => shownErrors.delete(fingerprint), 10000);
};

export const handleApiError = (error: unknown, context?: string) => {
  if (!error) return;

  const isFetchError =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "data" in error;

  if (isFetchError) {
    const fetchError = error as { status: number; data: unknown };
    const status = fetchError.status;
    const data = fetchError.data as any;

    if (status < 400) return;

    let message: string | undefined;
    let errorCode: string | undefined;

    if (data) {
      if (typeof data === "string") {
        message = data;
      } else if (typeof data === "object") {
        message = data.message;
        errorCode = data.code;
      }
    }

    const backendMessage =
      message && typeof message === "string" && message.length > 0 && message.length < 200
        ? message
        : undefined;
    const errorMessage = backendMessage || getErrorMessage(status);

    const fingerprint = `${context || "api"}:${status}:${errorCode || ""}`;

    if (shownErrors.has(fingerprint)) return;

    shownErrors.add(fingerprint);
    clearError(fingerprint);

    toast.error(errorMessage);

    if (status === 401) {
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }
  } else if (error instanceof Error) {
    const err = error as Error;
    const isNetworkError =
      err.message.includes("Failed to fetch") ||
      err.message.includes("NetworkError") ||
      err.message.includes("ECONNREFUSED") ||
      err.message.includes("timeout");

    if (isNetworkError) {
      toast.error("Unable to connect. Check your network and try again");
    } else {
      toast.error("Something went wrong. Please try again");
    }
  }
};
