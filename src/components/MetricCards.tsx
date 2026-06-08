import { formatBandwidth, formatLatency, getNetworkStatus } from '../utils/format';
import type { MetricValues } from '../api';

interface MetricCardsProps {
  actual: MetricValues | null;
  predicted: MetricValues | null;
  loading?: boolean;
}

interface CardData {
  title: string;
  icon: string;
  actual: string;
  predicted: string;
  unit: string;
  accentColor: string;
}

export default function MetricCards({ actual, predicted, loading }: MetricCardsProps) {
  if (loading || !actual || !predicted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-6 h-[140px] skeleton" />
        ))}
      </div>
    );
  }

  const cards: CardData[] = [
    {
      title: 'Traffic In',
      icon: '📥',
      actual: formatBandwidth(actual.in),
      predicted: formatBandwidth(predicted.in),
      unit: '',
      accentColor: '#22d3ee',
    },
    {
      title: 'Traffic Out',
      icon: '📤',
      actual: formatBandwidth(actual.out),
      predicted: formatBandwidth(predicted.out),
      unit: '',
      accentColor: '#a855f7',
    },
    {
      title: 'Latency',
      icon: '⚡',
      actual: formatLatency(actual.lat),
      predicted: formatLatency(predicted.lat),
      unit: '',
      accentColor: getNetworkStatus(predicted.lat).color,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, idx) => (
        <div
          key={card.title}
          className="glass-card p-5 animate-fade-in-up"
          style={{ animationDelay: `${(idx + 2) * 0.1}s` }}
        >
          {/* Card header */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{card.icon}</span>
            <span className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              {card.title}
            </span>
            <div
              className="ml-auto w-2 h-2 rounded-full"
              style={{ background: card.accentColor, boxShadow: `0 0 8px ${card.accentColor}80` }}
            />
          </div>

          {/* Values */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-text-muted mb-0.5 uppercase tracking-wide">Actual</div>
              <div className="text-xl font-bold font-mono text-text-primary">{card.actual}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted mb-0.5 uppercase tracking-wide">Predicted</div>
              <div
                className="text-xl font-bold font-mono"
                style={{ color: card.accentColor }}
              >
                {card.predicted}
              </div>
            </div>
          </div>

          {/* Decorative bottom border */}
          <div
            className="mt-4 h-0.5 rounded-full opacity-30"
            style={{ background: `linear-gradient(90deg, ${card.accentColor}, transparent)` }}
          />
        </div>
      ))}
    </div>
  );
}
