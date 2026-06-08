import { useState, useMemo } from 'react';
import type { FutureSecondsResponse } from '../api';
import { formatBandwidth, formatLatency, getNetworkStatus } from '../utils/format';

interface FutureSecondsTableProps {
  data: FutureSecondsResponse | null;
  onMinutesChange: (minutes: number) => void;
  currentMinutes: number;
  loading?: boolean;
}

export default function FutureSecondsTable({ data, onMinutesChange, currentMinutes, loading }: FutureSecondsTableProps) {
  const [page, setPage] = useState(0);
  const pageSize = 30;

  const rows = useMemo(() => {
    if (!data?.data) return [];
    const now = new Date();
    return data.data.map((d, i) => {
      const futureTime = new Date(now.getTime() + (i + 1) * 1000);
      return {
        time: futureTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        secondOffset: i + 1,
        ...d,
        status: getNetworkStatus(d.lat),
      };
    });
  }, [data]);

  const totalPages = Math.ceil(rows.length / pageSize);
  const visibleRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) {
    return <div className="glass-card p-6 h-[400px] skeleton" />;
  }

  return (
    <div className="glass-card p-5 animate-fade-in-up delay-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <span className="text-lg">⏱️</span> Per-Second Forecast
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Interpolated predictions — {data?.seconds ?? 0} seconds ({currentMinutes} min)
          </p>
        </div>

        {/* Minutes Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-medium">Minutes:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 5, 10].map(m => (
              <button
                key={m}
                onClick={() => { onMinutesChange(m); setPage(0); }}
                className={`tab-button text-xs px-3 py-1 ${currentMinutes === m ? 'active' : ''}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[360px] rounded-xl border border-white/5">
        {rows.length > 0 ? (
          <table className="prediction-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>+Sec</th>
                <th>Traffic In</th>
                <th>Traffic Out</th>
                <th>Latency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
                <tr key={i}>
                  <td className="text-text-secondary">{row.time}</td>
                  <td className="text-text-muted">+{row.secondOffset}s</td>
                  <td className="text-cyan-400">{formatBandwidth(row.in)}</td>
                  <td className="text-purple-400">{formatBandwidth(row.out)}</td>
                  <td style={{ color: row.status.color }}>{formatLatency(row.lat)}</td>
                  <td>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        background: `${row.status.color}15`,
                        color: row.status.color,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: row.status.color }} />
                      {row.status.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-48 text-text-muted text-sm">
            Waiting for per-second forecast data...
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-xs text-text-muted">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="tab-button text-xs px-3 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="tab-button text-xs px-3 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
