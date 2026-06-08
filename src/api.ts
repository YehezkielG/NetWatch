const API_BASE = 'http://34.87.39.234:8000';

// === Type Definitions ===

export interface MetricValues {
  in: number;
  out: number;
  lat: number;
}

export interface PredictResponse {
  timestamp: string;
  actual: MetricValues;
  pred: MetricValues;
  pred_steps: MetricValues[];
  features: string[];
  model: string;
}

export interface HistoryEntry {
  timestamp: string;
  actual: MetricValues;
  pred: MetricValues;
}

export interface HistoryResponse {
  data: HistoryEntry[];
}

export interface FutureResponse {
  data: MetricValues[];
}

export interface FutureSecondsResponse {
  minutes: number;
  seconds: number;
  data: MetricValues[];
}

// === API Functions ===

export async function fetchPredict(): Promise<PredictResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/predict`);
    if (res.status === 503) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    console.warn('[API] /predict failed');
    return null;
  }
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: HistoryResponse = await res.json();
    return data.data ?? [];
  } catch {
    console.warn('[API] /history failed');
    return [];
  }
}

export async function fetchFuture(): Promise<MetricValues[]> {
  try {
    const res = await fetch(`${API_BASE}/future`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: FutureResponse = await res.json();
    return data.data ?? [];
  } catch {
    console.warn('[API] /future failed');
    return [];
  }
}

export async function fetchFutureSeconds(minutes: number = 5): Promise<FutureSecondsResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/futureseconds?minutes=${minutes}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    console.warn('[API] /futureseconds failed');
    return null;
  }
}
