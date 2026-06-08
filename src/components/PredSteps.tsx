import { getNetworkStatus } from '../utils/format';
import type { MetricValues } from '../api';

interface PredStepsProps {
  steps: MetricValues[];
}

export default function PredSteps({ steps }: PredStepsProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="glass-card p-5 animate-fade-in-up delay-200">
      <h2 className="text-base font-semibold text-text-primary flex items-center gap-2 mb-4">
        <span className="text-lg">📈</span> Next 5 Steps Prediction
      </h2>
      <div className="grid grid-cols-5 gap-2">
        {steps.map((step, i) => {
          const status = getNetworkStatus(step.lat);
          return (
            <div
              key={i}
              className="flex flex-col items-center p-3 rounded-xl transition-all duration-300 hover:bg-white/5"
              style={{ borderBottom: `2px solid ${status.color}30` }}
            >
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium mb-2">
                t+{i + 1}
              </span>
              <span
                className={`${step.lat <= 0 ? 'text-xs' : 'text-lg'} font-bold font-mono`}
                style={{ color: status.color }}
              >
                {step.lat <= 0 ? 'TIMEOUT' : step.lat.toFixed(1)}
              </span>
              {step.lat > 0 && <span className="text-[10px] text-text-muted mt-0.5">ms</span>}
              <div
                className="mt-2 w-full h-1 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${status.color}40, ${status.color}10)`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
