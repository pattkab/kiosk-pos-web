const DEFAULT_USER_ERROR =
  "Something went wrong. Please try again in a moment.";

function normalizeMessage(value: unknown) {
  if (!value) return "";
  return String(value).trim();
}

export function getUserErrorMessage(
  error: unknown,
  fallback = DEFAULT_USER_ERROR,
) {
  const raw =
    typeof error === "string"
      ? error
      : normalizeMessage((error as { message?: unknown })?.message);
  const lower = raw.toLowerCase();

  if (!raw) return fallback;
  if (
    lower.includes("unexpected end of json") ||
    lower.includes("json") ||
    lower.includes("networkerror") ||
    lower.includes("failed to fetch") ||
    lower.includes("network request failed")
  ) {
    return "We could not reach the server. Check your connection and try again.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please verify your email address before signing in.";
  }
  if (lower.includes("jwt") || lower.includes("session")) {
    return "Your session expired. Please sign in again.";
  }
  if (lower.includes("permission") || lower.includes("not allowed")) {
    return "You do not have permission to perform this action.";
  }
  if (
    lower.includes("duplicate") ||
    lower.includes("already exists") ||
    lower.includes("already been registered")
  ) {
    return "That record already exists.";
  }
  if (lower.includes("invalid") || lower.includes("expired")) {
    return "This request is no longer valid. Please try again.";
  }

  return fallback;
}
