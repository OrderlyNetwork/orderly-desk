import { useEffect, useRef, useState } from "react";

interface PollState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  updatedAt: number | null;
}

/**
 * Polls a loader on an interval, pauses while the tab is hidden, and keeps the
 * last good payload when a request fails. The loader may be a new closure on
 * every render; the effect keys off `key` and `intervalMs` only.
 */
export function usePoll<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  intervalMs: number,
): PollState<T> {
  const loadRef = useRef(load);
  loadRef.current = load;

  const [state, setState] = useState<PollState<T>>({
    data: null,
    error: null,
    loading: true,
    updatedAt: null,
  });

  useEffect(() => {
    setState({ data: null, error: null, loading: true, updatedAt: null });
    let cancelled = false;
    let controller: AbortController | null = null;

    const run = async () => {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      try {
        const data = await loadRef.current(current.signal);
        if (cancelled) return;
        setState({ data, error: null, loading: false, updatedAt: Date.now() });
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        setState((previous) => ({
          ...previous,
          error: error instanceof Error ? error.message : "Request failed",
          loading: false,
        }));
      }
    };

    void run();
    const timer = window.setInterval(() => {
      if (!document.hidden) void run();
    }, intervalMs);

    const onVisibility = () => {
      if (!document.hidden) void run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      controller?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [key, intervalMs]);

  return state;
}
