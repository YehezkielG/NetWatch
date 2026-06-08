import { useEffect, useRef, useCallback } from 'react';

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  onData: (data: T) => void,
  intervalMs: number,
  enabled: boolean = true
) {
  const savedOnData = useRef(onData);
  const savedFetchFn = useRef(fetchFn);

  useEffect(() => {
    savedOnData.current = onData;
  }, [onData]);

  useEffect(() => {
    savedFetchFn.current = fetchFn;
  }, [fetchFn]);

  const poll = useCallback(async () => {
    try {
      const data = await savedFetchFn.current();
      savedOnData.current(data);
    } catch (err) {
      console.warn('[Polling] Error:', err);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Immediate first call
    poll();

    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [poll, intervalMs, enabled]);
}
