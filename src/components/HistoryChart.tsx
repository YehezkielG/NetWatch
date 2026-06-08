import { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { HistoryEntry } from '../api';
import { formatBandwidth } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type MetricTab = 'lat' | 'in' | 'out';

interface HistoryChartProps {
  data: HistoryEntry[];
  loading?: boolean;
}

const TAB_CONFIG: { key: MetricTab; label: string; color: string; predColor: string }[] = [
  { key: 'lat', label: 'Latency', color: '#22d3ee', predColor: '#a855f7' },
  { key: 'in', label: 'Traffic In', color: '#4ade80', predColor: '#facc15' },
  { key: 'out', label: 'Traffic Out', color: '#f472b6', predColor: '#fb923c' },
];

export default function HistoryChart({ data, loading }: HistoryChartProps) {
  const [activeTab, setActiveTab] = useState<MetricTab>('lat');

  const tabConfig = TAB_CONFIG.find(t => t.key === activeTab)!;

  const chartData = useMemo(() => {
    const labels = data.map(d => {
      const timeStr = d.timestamp.endsWith('Z') || d.timestamp.includes('+') ? d.timestamp : d.timestamp + 'Z';
      const date = new Date(timeStr);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    });

    return {
      labels,
      datasets: [
        {
          label: `Actual ${tabConfig.label}`,
          data: data.map(d => d.actual[activeTab]),
          borderColor: tabConfig.color,
          backgroundColor: `${tabConfig.color}15`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4,
          fill: true,
        },
        {
          label: `Predicted ${tabConfig.label}`,
          data: data.map(d => d.pred[activeTab]),
          borderColor: tabConfig.predColor,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4,
          fill: false,
        },
      ],
    };
  }, [data, activeTab, tabConfig]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'Inter' },
          usePointStyle: true,
          pointStyleWidth: 8,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 17, 23, 0.95)',
        borderColor: 'rgba(34, 211, 238, 0.2)',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        titleFont: { size: 12, family: 'Inter', weight: '600' as const },
        bodyFont: { size: 11, family: 'JetBrains Mono' },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.y;
            if (activeTab === 'lat') return `${ctx.dataset.label}: ${val <= 0 ? 'TIMEOUT' : val.toFixed(1) + ' ms'}`;
            return `${ctx.dataset.label}: ${formatBandwidth(val)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 10, family: 'Inter' }, maxRotation: 0, maxTicksLimit: 12 },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 10, family: 'JetBrains Mono' },
          callback: (value: any) => {
            if (activeTab === 'lat') return `${value} ms`;
            return formatBandwidth(value);
          },
        },
      },
    },
  }), [activeTab]);

  if (loading) {
    return <div className="glass-card p-6 h-[400px] skeleton" />;
  }

  return (
    <div className="glass-card p-5 animate-fade-in-up delay-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <span className="text-lg">📊</span> History
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Actual vs Predicted — last 3 hours (per minute)</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-700/50 p-1 rounded-xl">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        {data.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            Waiting for history data...
          </div>
        )}
      </div>
    </div>
  );
}
