import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, IndianRupee, Users } from 'lucide-react';

export default function RiskChart({
  highCount = 0,
  mediumCount = 0,
  lowCount = 0,
  totalCount = 0,
  highRevenue = 0,
  mediumRevenue = 0,
  lowRevenue = 0,
  totalRevenue = 0
}) {
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' | 'customers'

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Percentages for customer counts
  const highCountPct = totalCount > 0 ? ((highCount / totalCount) * 100).toFixed(1) : 0;
  const mediumCountPct = totalCount > 0 ? ((mediumCount / totalCount) * 100).toFixed(1) : 0;
  const lowCountPct = totalCount > 0 ? ((lowCount / totalCount) * 100).toFixed(1) : 0;

  // Percentages for revenue at risk
  const highRevPct = totalRevenue > 0 ? ((highRevenue / totalRevenue) * 100).toFixed(1) : 0;
  const mediumRevPct = totalRevenue > 0 ? ((mediumRevenue / totalRevenue) * 100).toFixed(1) : 0;
  const lowRevPct = totalRevenue > 0 ? ((lowRevenue / totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
            Risk & Financial Impact Distribution
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {activeTab === 'revenue'
              ? `Breakdown of ${formatCurrency(totalRevenue)} total Revenue at Risk`
              : `Categorization across ${totalCount} analyzed customer profiles`}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '8px',
          padding: '3px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActiveTab('revenue')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'revenue' ? '#6366f1' : 'transparent',
              color: activeTab === 'revenue' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <IndianRupee size={13} />
            <span>Revenue at Risk</span>
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'customers' ? '#6366f1' : 'transparent',
              color: activeTab === 'customers' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <Users size={13} />
            <span>Customer Counts</span>
          </button>
        </div>
      </div>

      {/* Progress Stacked Bar */}
      <div style={{
        height: '16px',
        width: '100%',
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        marginBottom: '20px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div
          title={activeTab === 'revenue' ? `High Risk: ${formatCurrency(highRevenue)} (${highRevPct}%)` : `High Risk: ${highCount} (${highCountPct}%)`}
          style={{
            width: `${activeTab === 'revenue' ? highRevPct : highCountPct}%`,
            backgroundColor: '#ef4444',
            transition: 'width 0.5s ease'
          }}
        />
        <div
          title={activeTab === 'revenue' ? `Medium Risk: ${formatCurrency(mediumRevenue)} (${mediumRevPct}%)` : `Medium Risk: ${mediumCount} (${mediumCountPct}%)`}
          style={{
            width: `${activeTab === 'revenue' ? mediumRevPct : mediumCountPct}%`,
            backgroundColor: '#f59e0b',
            transition: 'width 0.5s ease'
          }}
        />
        <div
          title={activeTab === 'revenue' ? `Low Risk: ${formatCurrency(lowRevenue)} (${lowRevPct}%)` : `Low Risk: ${lowCount} (${lowCountPct}%)`}
          style={{
            width: `${activeTab === 'revenue' ? lowRevPct : lowCountPct}%`,
            backgroundColor: '#10b981',
            transition: 'width 0.5s ease'
          }}
        />
      </div>

      {/* Legend & Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {/* High Risk */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertTriangle size={22} color="#ef4444" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>HIGH RISK (&gt;70%)</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fca5a5' }}>
              {activeTab === 'revenue' ? formatCurrency(highRevenue) : highCount}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8', marginLeft: '6px' }}>
                ({activeTab === 'revenue' ? `${highRevPct}%` : `${highCountPct}%`})
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {activeTab === 'revenue' ? `${highCount} customers` : formatCurrency(highRevenue)}
            </div>
          </div>
        </div>

        {/* Medium Risk */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <AlertCircle size={22} color="#f59e0b" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>MEDIUM RISK (31-70%)</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fde68a' }}>
              {activeTab === 'revenue' ? formatCurrency(mediumRevenue) : mediumCount}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8', marginLeft: '6px' }}>
                ({activeTab === 'revenue' ? `${mediumRevPct}%` : `${mediumCountPct}%`})
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {activeTab === 'revenue' ? `${mediumCount} customers` : formatCurrency(mediumRevenue)}
            </div>
          </div>
        </div>

        {/* Low Risk */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <CheckCircle size={22} color="#10b981" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>LOW RISK (0-30%)</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#6ee7b7' }}>
              {activeTab === 'revenue' ? formatCurrency(lowRevenue) : lowCount}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8', marginLeft: '6px' }}>
                ({activeTab === 'revenue' ? `${lowRevPct}%` : `${lowCountPct}%`})
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {activeTab === 'revenue' ? `${lowCount} customers` : formatCurrency(lowRevenue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

