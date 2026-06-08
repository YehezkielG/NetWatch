import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchPredict, fetchHistory, fetchFuture, fetchFutureSeconds } from './api';
import type { PredictResponse, HistoryEntry, MetricValues, FutureSecondsResponse } from './api';
import { usePolling } from './hooks/usePolling';
import { useNotifications } from './hooks/useNotifications';
import { getNetworkStatus } from './utils/format';

import Header from './components/Header';
import LatencyGauge from './components/LatencyGauge';
import MetricCards from './components/MetricCards';
import PredSteps from './components/PredSteps';
import HistoryChart from './components/HistoryChart';
import FutureChart from './components/FutureChart';
import FutureSecondsTable from './components/FutureSecondsTable';

function App() {
  // === State ===
  const [predict, setPredict] = useState<PredictResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<MetricValues[]>([]);
  const [futureSec, setFutureSec] = useState<FutureSecondsResponse | null>(null);
  const [futureSecMinutes, setFutureSecMinutes] = useState(5);
  const [connected, setConnected] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { notifications, addNotification, markAllRead, clearAll, unreadCount } = useNotifications();
  const prevStatusRef = useRef<string | null>(null);

  // === Polling ===

  // /predict — every 5 seconds (comfortable UI)
  usePolling(
    fetchPredict,
    useCallback((data: PredictResponse | null) => {
      if (data) {
        setPredict(data);
        setConnected(true);
        setInitialLoading(false);
      } else {
        setConnected(false);
      }
    }, []),
    5000
  );

  // /history — every 60 seconds
  usePolling(
    fetchHistory,
    useCallback((data: HistoryEntry[]) => {
      if (data.length > 0) setHistory(data);
    }, []),
    60000
  );

  // /future — every 60 seconds
  usePolling(
    fetchFuture,
    useCallback((data: MetricValues[]) => {
      if (data.length > 0) setFuture(data);
    }, []),
    60000
  );

  // /futureseconds — every 60 seconds
  const fetchFutureSecFn = useCallback(() => fetchFutureSeconds(futureSecMinutes), [futureSecMinutes]);
  usePolling(
    fetchFutureSecFn,
    useCallback((data: FutureSecondsResponse | null) => {
      if (data && data.data?.length > 0) setFutureSec(data);
    }, []),
    60000
  );

  // === Notification Logic ===
  useEffect(() => {
    if (!predict) return;

    const predLat = predict.pred.lat;
    const statusInfo = getNetworkStatus(predLat);

    // Only trigger notification for potential-bad, bad, or timeout
    if (statusInfo.status === 'potential-bad' || statusInfo.status === 'bad' || statusInfo.status === 'timeout') {
      // Only notify if status changed (or first time)
      if (prevStatusRef.current !== statusInfo.status) {
        let message = '';
        if (statusInfo.status === 'timeout') {
          message = '❌ Network TIMEOUT — Connection lost or unresponsive';
        } else if (statusInfo.status === 'bad') {
          message = `⚠️ Network quality BAD — Predicted latency: ${predLat.toFixed(1)} ms`;
        } else {
          message = `⚡ Network potentially degrading — Predicted latency: ${predLat.toFixed(1)} ms`;
        }
        addNotification(statusInfo.status, predLat, message);
      }
    }
    prevStatusRef.current = statusInfo.status;
  }, [predict, addNotification]);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <Header
        connected={connected}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        onClearAll={clearAll}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

        {/* Hero: Latency Gauge + Status */}
        <section className="flex flex-col items-center py-4">
          <LatencyGauge
            actualLatency={predict?.actual.lat ?? null}
            predictedLatency={predict?.pred.lat ?? null}
            loading={initialLoading}
          />
        </section>

        {/* Metric Cards */}
        <section>
          <MetricCards
            actual={predict?.actual ?? null}
            predicted={predict?.pred ?? null}
            loading={initialLoading}
          />
        </section>

        {/* Pred Steps */}
        {predict?.pred_steps && (
          <section>
            <PredSteps steps={predict.pred_steps} />
          </section>
        )}

        {/* History Chart */}
        <section>
          <HistoryChart data={history} loading={initialLoading} />
        </section>

        {/* Future Chart + Future Seconds Table */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section>
            <FutureChart data={future} loading={initialLoading} />
          </section>
          <section>
            <FutureSecondsTable
              data={futureSec}
              onMinutesChange={setFutureSecMinutes}
              currentMinutes={futureSecMinutes}
              loading={initialLoading}
            />
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-white/5 mt-4">
          <p className="text-xs text-text-muted">
            NetWatch — QoS Network Monitoring · LSTM Attention Model · {predict?.model ?? '—'}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
