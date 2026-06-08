import { useMemo } from 'react';
import { getNetworkStatus, formatLatency } from '../utils/format';

interface LatencyGaugeProps {
  actualLatency: number | null;
  predictedLatency: number | null;
  loading?: boolean;
}

export default function LatencyGauge({ actualLatency, predictedLatency, loading }: LatencyGaugeProps) {
  const displayLatency = actualLatency ?? 0;
  const statusInfo = useMemo(() => {
    // If actual latency is timeout, always show TIMEOUT status
    if (displayLatency <= 0) return getNetworkStatus(0);
    return getNetworkStatus(predictedLatency ?? displayLatency);
  }, [predictedLatency, displayLatency]);

  // SVG Circle parameters
  const size = 280;
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // Map latency to a 0–1 range (0ms = 0, 300ms = 1)
  const progress = displayLatency <= 0 ? 1 : Math.min((displayLatency) / 300, 1);
  const dashOffset = circumference * (1 - progress);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-[280px] h-[280px] rounded-full skeleton" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in-up">
      {/* Gauge Circle */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Pulse ring animation */}
        <div
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            border: `2px solid ${statusInfo.color}`,
            animation: 'pulse-ring 2s ease-out infinite',
          }}
        />

        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ animation: 'gauge-glow 3s ease-in-out infinite', '--glow-color': `${statusInfo.color}66` } as React.CSSProperties}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Active arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#gaugeGradient)`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={statusInfo.color} />
              <stop offset="100%" stopColor={statusInfo.color} stopOpacity={0.3} />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium tracking-widest uppercase text-text-secondary mb-1">
            Latency
          </span>
          <span
            className={`${displayLatency <= 0 ? 'text-3xl' : 'text-5xl'} font-bold font-mono tracking-tight transition-colors duration-500`}
            style={{ color: statusInfo.color }}
          >
            {formatLatency(displayLatency).replace(' ms', '')}
          </span>
          {displayLatency > 0 && <span className="text-sm font-medium text-text-muted mt-0.5">ms</span>}

          {/* Status badge */}
          <div
            className="mt-3 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5 transition-all duration-500"
            style={{
              background: `${statusInfo.color}18`,
              color: statusInfo.color,
              border: `1px solid ${statusInfo.color}30`,
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusInfo.color }} />
            {statusInfo.label}
          </div>
        </div>
      </div>

      {/* Predicted latency label */}
      {predictedLatency !== null && (
        <div className="flex flex-col items-center gap-1 text-text-secondary">
          <span className="text-xs uppercase tracking-widest font-medium">Predicted Next</span>
          <span className="text-lg font-semibold font-mono" style={{ color: getNetworkStatus(predictedLatency!).color }}>
            {formatLatency(predictedLatency!)}
          </span>
        </div>
      )}
    </div>
  );
}
