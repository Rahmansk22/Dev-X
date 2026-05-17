import React from 'react';

export function BuildLogViewer({ logs }: { logs: { step: string; stdout: string; stderr: string; exitCode: number; timestamp: number }[] }) {
  if (!logs || logs.length === 0) return null;
  return (
    <div style={{ fontFamily: 'monospace', background: '#18181b', color: '#e4e4e7', padding: 16, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>
      {logs.map((log, i) => (
        <div key={i} style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 'bold', color: '#a3e635' }}>{log.step.toUpperCase()} (exit {log.exitCode})</div>
          <div style={{ color: '#f87171' }}>{log.stderr && <pre>{log.stderr}</pre>}</div>
          <div>{log.stdout && <pre>{log.stdout}</pre>}</div>
          <div style={{ fontSize: 12, color: '#a1a1aa' }}>{new Date(log.timestamp).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
