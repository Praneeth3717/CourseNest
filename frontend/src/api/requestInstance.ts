/* ─────────────────────────────────────────────
   requestInstance.ts
   ───────────────────────────────────────────── */

const baseUrl = import.meta.env.VITE_API_BASE_URL;

if (!baseUrl) {
  throw new Error(
    "[requestInstance] VITE_API_BASE_URL is not defined. " +
    "Add it to your .env file.",
  );
}

/* ─── Types ──────────────────────────────────── */

type JsonPrimitive = string | number | boolean | null;
type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type RequestOptions = {
  /** HTTP verb. Defaults to "GET". */
  method?: string;

  /** Request body – object, FormData, URLSearchParams, or raw BodyInit. */
  body?: unknown;

  /** Extra headers merged on top of defaults. */
  headers?: Record<string, string>;

  /** Appended as ?key=value pairs – undefined/null values are skipped. */
  params?: QueryParams;

  /** "json" (default) or "blob". */
  responseType?: "json" | "blob";

  /**
   * Skip the automatic 401 → refresh → retry cycle.
   * Set automatically on retry calls; you rarely need this.
   */
  skipAuthRefresh?: boolean;

  /** Request timeout in ms. Defaults to 30 000. */
  timeout?: number;

  /** AbortSignal from the caller for explicit cancellation. */
  signal?: AbortSignal;
};

/* ─── Custom Error ───────────────────────────── */

export class ApiError extends Error {
  readonly name = "ApiError";

  constructor(
    message: string,
    /** HTTP status code; 0 = network failure, 408 = timeout. */
    public readonly status: number,
    /** Parsed response body, when available. */
    public readonly data?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // fix instanceof in transpiled JS
  }
}

/* ─── Auth State (module-level singletons) ───── */

let _accessToken: string | null = null;

/**
 * Push a new access token into the client.
 * Call this after login / after a successful token refresh.
 */
export const setAuthToken = (token: string | null): void => {
  _accessToken = token;
};

/**
 * Provide a function that refreshes the access token and returns the new one.
 * Return null / throw to signal that the refresh failed.
 */
let _refreshHandler: (() => Promise<string | null>) | null = null;
export const setRefreshHandler = (
  handler: (() => Promise<string | null>) | null,
): void => {
  _refreshHandler = handler;
};

/**
 * Called once when the session is definitively expired
 * (no refresh token, or refresh failed).
 * Typical use: dispatch logout + redirect to /login.
 */
let _unauthorizedHandler: (() => void | Promise<void>) | null = null;
export const setUnauthorizedHandler = (
  handler: (() => void | Promise<void>) | null,
): void => {
  _unauthorizedHandler = handler;
};

/* ─── Internal State ─────────────────────────── */

/** Shared in-flight refresh promise – prevents duplicate refresh calls. */
let _refreshPromise: Promise<string | null> | null = null;

/** Guard against triggering the unauthorised handler multiple times. */
let _isHandlingUnauthorized = false;

/* ─── Helpers ────────────────────────────────── */

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Extract a human-readable message from an error body. */
const extractMessage = (data: unknown, fallback: string): string => {
  if (isPlainObject(data)) {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
  }
  return fallback;
};

/** Trigger the unauthorised handler exactly once per logout event. */
const handleUnauthorized = async (): Promise<void> => {
  if (_isHandlingUnauthorized) return;
  _isHandlingUnauthorized = true;
  _accessToken = null;
  try {
    await _unauthorizedHandler?.();
  } finally {
    _isHandlingUnauthorized = false;
  }
};

/* ─── Build URL ──────────────────────────────── */

const buildUrl = (path: string, params?: QueryParams): string => {
  const url = `${baseUrl}${path}`;
  if (!params) return url;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      qs.append(key, String(value));
    }
  }
  const queryString = qs.toString();
  return queryString ? `${url}?${queryString}` : url;
};

/* ─── Prepare Request ────────────────────────── */

type PreparedRequest = {
  headers: Record<string, string>;
  body: BodyInit | undefined;
};

const prepareRequest = (options: RequestOptions): PreparedRequest => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  let body: BodyInit | undefined;

  if (options.body instanceof FormData) {
    // Let the browser set Content-Type + boundary automatically.
    body = options.body;
  } else if (options.body instanceof URLSearchParams) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = options.body;
  } else if (options.body !== undefined && options.body !== null) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  return { headers, body };
};

/* ─── Core ───────────────────────────────────── */

const requestInstance = async <T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { headers, body } = prepareRequest(options);
  const finalUrl = buildUrl(path, options.params);

  /* ── Timeout & cancellation ── */
  const timeoutMs = options.timeout ?? 30_000;
  const internalController = new AbortController();
  const timeoutId = setTimeout(
    () => internalController.abort(),
    timeoutMs,
  );

  // If the caller passed their own signal, abort ours when theirs fires.
  options.signal?.addEventListener("abort", () =>
    internalController.abort(options.signal!.reason),
  );

  let response: Response;

  try {
    response = await fetch(finalUrl, {
      method: options.method ?? "GET",
      headers,
      body,
      signal: internalController.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      // Differentiate between timeout and caller-cancelled.
      if (options.signal?.aborted) {
        throw new ApiError("Request was cancelled.", 0);
      }
      throw new ApiError("Request timed out.", 408);
    }
    throw new ApiError("Network error – check your connection.", 0);
  } finally {
    clearTimeout(timeoutId);
  }

  /* ── 401 → refresh → retry ── */
  if (
    response.status === 401 &&
    !options.skipAuthRefresh &&
    _refreshHandler
  ) {
    try {
      // Coalesce concurrent 401s into one refresh call.
      if (!_refreshPromise) {
        _refreshPromise = _refreshHandler().finally(() => {
          _refreshPromise = null;
        });
      }

      const newToken = await _refreshPromise;

      if (!newToken) throw new Error("Refresh returned no token.");

      _accessToken = newToken;

      // Retry with skipAuthRefresh to avoid infinite loops.
      return requestInstance<T>(path, { ...options, skipAuthRefresh: true });
    } catch {
      await handleUnauthorized();
      throw new ApiError("Session expired. Please log in again.", 401);
    }
  }

  /* ── Parse response body ── */
  let data: unknown = null;

  if (response.status !== 204) {
    try {
      data =
        options.responseType === "blob"
          ? await response.blob()
          : await response.json();
    } catch {
      // Non-JSON / empty body – data stays null.
    }
  }

  /* ── Hard 401 (no refresh handler, or skipAuthRefresh was set) ── */
  if (response.status === 401) {
    await handleUnauthorized();
    throw new ApiError(
      extractMessage(data, "Session expired. Please log in again."),
      401,
      data,
    );
  }

  /* ── 403 ── */
  if (response.status === 403) {
    throw new ApiError(
      extractMessage(data, "You do not have permission to perform this action."),
      403,
      data,
    );
  }

  /* ── Other errors ── */
  if (!response.ok) {
    throw new ApiError(
      extractMessage(data, "An unexpected error occurred."),
      response.status,
      data,
    );
  }

  /* ── Success ── */
  return data as T;
};

/* ─── Convenience Methods ────────────────────── */

requestInstance.get = <T = unknown>(
  path: string,
  options?: RequestOptions,
): Promise<T> =>
  requestInstance<T>(path, { ...options, method: "GET" });

requestInstance.post = <T = unknown>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> =>
  requestInstance<T>(path, { ...options, method: "POST", body });

requestInstance.put = <T = unknown>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> =>
  requestInstance<T>(path, { ...options, method: "PUT", body });

requestInstance.patch = <T = unknown>(
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> =>
  requestInstance<T>(path, { ...options, method: "PATCH", body });

requestInstance.del = <T = unknown>(
  path: string,
  options?: RequestOptions,
): Promise<T> =>
  requestInstance<T>(path, { ...options, method: "DELETE" });

export default requestInstance;