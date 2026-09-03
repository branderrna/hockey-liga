// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

import { AsyncLocalStorage } from "node:async_hooks";

type CaptureSlot = { error: unknown };

// Request-scoped, not module-scoped. A Worker isolate serves many requests
// concurrently, so a single shared slot mis-attributes one request's error to
// another's response — or drops it entirely — whenever two failures overlap.
// Verified against workerd: with a shared slot, three concurrent failing
// requests produced one wrong attribution and two lost errors.
const captureStore = new AsyncLocalStorage<CaptureSlot>();

// Runs fn inside a fresh capture scope. Everything awaited within it — h3's
// internal error logging included — records into that request's own slot.
export function runWithErrorCapture<T>(fn: () => T): T {
  return captureStore.run({ error: undefined }, fn);
}

function record(error: unknown) {
  const slot = captureStore.getStore();
  // No slot means this error happened outside a request scope (module init, or
  // a global handler firing after the response resolved). The console.error
  // wrapper below still logs it expanded; there is just nothing to correlate
  // it to, and guessing a request would reintroduce the cross-talk above.
  if (slot) slot.error = error;
}

// h3's HTTPError serializes to {"status":500,"unhandled":true,"message":"HTTPError"} —
// no stack, no cause — so a plain console.error(error) reaches the log pipeline with
// the failure detail stripped. Expand Error-like args into a string that keeps the
// message, stack, and the full cause chain.
const CAUSE_DEPTH_LIMIT = 5;
const DESCRIPTION_LENGTH_LIMIT = 8_000;

function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    if (!(current instanceof Error)) {
      parts.push(typeof current === "string" ? current : safeStringify(current));
      break;
    }
    const label = depth === 0 ? "" : "caused by: ";
    const status = describeStatus(current);
    parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
    current = current.cause;
  }
  return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}

function describeStatus(error: Error): string {
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === "number" ? ` (status ${value})` : "";
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

// Wrap console.error so errors logged by any layer — including h3's internal
// unhandled-error logging, which this file cannot hook directly — are both
// recorded for consumeLastCapturedError and expanded before serialization.
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const expanded = args.map((arg) => {
    if (!isErrorLike(arg)) return arg;
    record(arg);
    return describeError(arg);
  });
  originalConsoleError(...expanded);
};

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

// Reads and clears the error recorded for the in-flight request. The slot lives
// exactly as long as the request, so no staleness window (and no TTL) is needed.
export function consumeLastCapturedError(): unknown {
  const slot = captureStore.getStore();
  if (!slot) return undefined;
  const { error } = slot;
  slot.error = undefined;
  return error;
}
