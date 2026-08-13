import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

export default function RiskChart({ highCount, mediumCount, lowCount, totalCount }) {
  const highPct = totalCount > 0 ? ((highCount / totalCount) * 100).toFixed(1) : 0;
  const mediumPct = totalCount > 0 ? ((mediumCount / totalCount) * 100).toFixed(1) : 0;
  const lowPct = totalCount > 0 ? ((lowCount / totalCount) * 100).toFixed(1) : 0;

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>Risk Distribution Breakdown</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Categorization across 500 analyzed customer profiles</p>
        </div>
      </div>

      {/* Progress Stacked Bar */}
      <div style={{
        height: '14px',
        width: '100%',
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        marginBottom: '20px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div
          title={`High Risk: ${highCount} (${highPct}%)`}
          style={{
            width: `${highPct}%`,
            backgroundColor: '#ef4444',
            transition: 'width 0.5s ease'
          }}
        />
        <div
          title={`Medium Risk: ${mediumCount} (${mediumPct}%)`}
          style={{
            width: `${mediumPct}%`,
            backgroundColor: '#f59e0b',
            transition: 'width 0.5s ease'
          }}
        />
        <div
          title={`Low Risk: ${lowCount} (${lowPct}%)`}
          style={{
            width: `${lowPct}%`,
            backgroundColor: '#10b981',
            transition: 'width 0.5s ease'
          }}
        />
      </div>

      {/* Legend & Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)' }}>
          <AlertTriangle size={20} color="#ef4444" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>HIGH RISK (&gt;70%)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>
              {highCount} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>({highPct}%)</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)' }}>
          <AlertCircle size={20} color="#f59e0b" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>MEDIUM RISK (31-70%)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fde68a' }}>
              {mediumCount} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>({mediumPct}%)</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)' }}>
          <CheckCircle size={20} color="#10b981" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>LOW RISK (0-30%)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6ee7b7' }}>
              {lowCount} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>({lowPct}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
