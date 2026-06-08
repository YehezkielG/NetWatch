export type NetworkStatus = 'excellent' | 'good' | 'potential-bad' | 'bad' | 'timeout' | 'unknown';

export interface StatusInfo {
  status: NetworkStatus;
  label: string;
  emoji: string;
  cssClass: string;
  color: string;
}

export function getNetworkStatus(latencyMs: number): StatusInfo {
  if (latencyMs <= 0) {
    return { status: 'timeout', label: 'TIMEOUT', emoji: '❌', cssClass: 'status-bad', color: '#ef4444' };
  }
  if (latencyMs < 50) {
    return { status: 'excellent', label: 'Excellent', emoji: '🟢', cssClass: 'status-excellent', color: '#4ade80' };
  }
  if (latencyMs < 100) {
    return { status: 'good', label: 'Good', emoji: '🟡', cssClass: 'status-good', color: '#a3e635' };
  }
  if (latencyMs < 150) {
    return { status: 'potential-bad', label: 'Potential Bad', emoji: '🟠', cssClass: 'status-potential-bad', color: '#fb923c' };
  }
  return { status: 'bad', label: 'Bad', emoji: '🔴', cssClass: 'status-bad', color: '#f87171' };
}

export function formatBandwidth(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(2)} Kbps`;
  return `${Math.round(bps)} bps`;
}

export function formatLatency(ms: number): string {
  if (ms <= 0) return 'TIMEOUT';
  return `${ms.toFixed(1)} ms`;
}

export function formatTimestamp(iso: string): string {
  const timeStr = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const d = new Date(timeStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDate(iso: string): string {
  const timeStr = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const d = new Date(timeStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) 
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
