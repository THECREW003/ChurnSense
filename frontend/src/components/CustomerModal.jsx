import React, { useState } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  Activity,
  Calendar,
  Clock,
  ShoppingCart,
  LogIn,
  Monitor,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  IndianRupee
} from 'lucide-react';

export default function CustomerModal({ customer, onClose }) {
  const [toastMessage, setToastMessage] = useState(null);

  if (!customer) return null;

  const handleAction = (actionName) => {
    setToastMessage(`Action Executed: "${actionName}" for ${customer.user_id}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const getRiskBadgeClass = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'badge badge-high';
      case 'medium': return 'badge badge-medium';
      default: return 'badge badge-low';
    }
  };

  const probPercent = (customer.churn_probability * 100).toFixed(1);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>{customer.user_id}</h2>
              <span className={getRiskBadgeClass(customer.risk_level)}>
                {customer.risk_level} Risk
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Explainable Churn Analytics & Recommended Action Plan</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Churn Probability Score Meter */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 500 }}>Predicted Churn Probability</span>
            <span style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: customer.risk_level === 'High' ? '#fca5a5' : customer.risk_level === 'Medium' ? '#fde68a' : '#6ee7b7'
            }}>
              {probPercent}%
            </span>
          </div>

          <div style={{ height: '10px', background: '#334155', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${probPercent}%`,
              backgroundColor: customer.risk_level === 'High' ? '#ef4444' : customer.risk_level === 'Medium' ? '#f59e0b' : '#10b981',
              borderRadius: '5px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* SECTION 1: WHY AT RISK */}
        <div style={{
          padding: '20px',
          borderRadius: '14px',
          background: customer.risk_level === 'High' ? 'rgba(239, 68, 68, 0.07)' : customer.risk_level === 'Medium' ? 'rgba(245, 158, 11, 0.07)' : 'rgba(16, 185, 129, 0.07)',
          border: `1px solid ${customer.risk_level === 'High' ? 'rgba(239, 68, 68, 0.25)' : customer.risk_level === 'Medium' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            {customer.risk_level === 'High' ? (
              <AlertTriangle size={18} color="#ef4444" />
            ) : customer.risk_level === 'Medium' ? (
              <AlertCircle size={18} color="#f59e0b" />
            ) : (
              <CheckCircle2 size={18} color="#10b981" />
            )}
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
              {customer.risk_level === 'Low' ? 'RETENTION & HEALTH INDICATORS' : 'WHY AT RISK'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {customer.risk_factors && customer.risk_factors.length > 0 ? (
              customer.risk_factors.map((factor, idx) => {
                let bullet = '🟠';
                if (customer.risk_level === 'Low') {
                  bullet = '🟢';
                } else if (
                  factor.toLowerCase().includes('zero') ||
                  factor.toLowerCase().includes('only ') ||
                  factor.toLowerCase().includes('30 days') ||
                  factor.toLowerCase().includes('40 days') ||
                  factor.toLowerCase().includes('50 days') ||
                  factor.toLowerCase().includes('60 days') ||
                  factor.toLowerCase().includes('70 days') ||
                  factor.toLowerCase().includes('80 days')
                ) {
                  bullet = '🔴';
                }
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.9rem',
                    color: '#f1f5f9',
                    fontWeight: 500
                  }}>
                    <span style={{ fontSize: '0.95rem' }}>{bullet}</span>
                    <span>{factor}</span>
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No significant risk flags detected.</p>
            )}
          </div>
        </div>

        {/* SECTION 2: BUSINESS IMPACT */}
        <div style={{
          padding: '20px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IndianRupee size={18} color="#818cf8" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
                BUSINESS IMPACT
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              Demo Estimate
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Monthly Customer Value</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
                {formatCurrency(customer.monthly_value)}
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}> / mo</span>
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: customer.risk_level === 'High' ? 'rgba(239, 68, 68, 0.12)' : customer.risk_level === 'Medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              border: `1px solid ${customer.risk_level === 'High' ? 'rgba(239, 68, 68, 0.35)' : customer.risk_level === 'Medium' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`
            }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Revenue at Risk</div>
              <div style={{
                fontSize: '1.3rem',
                fontWeight: 800,
                color: customer.risk_level === 'High' ? '#fca5a5' : customer.risk_level === 'Medium' ? '#fde68a' : '#6ee7b7'
              }}>
                {formatCurrency(customer.revenue_at_risk)}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Formula: {probPercent}% × {formatCurrency(customer.monthly_value)} = {formatCurrency(customer.revenue_at_risk)}</span>
            <span>Exposure: {customer.risk_level === 'High' ? 'High Impact' : customer.risk_level === 'Medium' ? 'Medium Impact' : 'Low Impact'}</span>
          </div>
        </div>

        {/* SECTION 3: RECOMMENDED ACTION */}
        {customer.recommended_action && (
          <div style={{
            padding: '20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🎯</span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
                RECOMMENDED ACTION
              </h3>
            </div>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#c084fc', marginBottom: '14px' }}>
              "{customer.recommended_action}"
            </p>

            <button
              onClick={() => handleAction(customer.recommended_action)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#7c3aed'}
              onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'}
            >
              <Send size={16} />
              <span>Execute Recommended Action</span>
            </button>
          </div>
        )}

        {/* SECTION 4: CUSTOMER ACTIVITY METRICS */}
        <div style={{ marginBottom: '8px' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em', marginBottom: '12px' }}>
            CUSTOMER ACTIVITY METRICS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                <Clock size={14} color="#6366f1" /> Recency Gap
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>{customer.days_since_last_activity} days</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>since last activity</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                <Calendar size={14} color="#10b981" /> Active Days
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>{customer.active_days} / 90</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>days active</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                <Activity size={14} color="#f59e0b" /> Total Events
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>{customer.total_events}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>total user logs</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                <LogIn size={14} color="#3b82f6" /> Logins
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>{customer.total_logins ?? '-'}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>total logins</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                <Monitor size={14} color="#8b5cf6" /> Sessions
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>{customer.total_sessions ?? '-'}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>active sessions</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                <ShoppingCart size={14} color="#ec4899" /> Purchases
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>{customer.total_purchases ?? '-'}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>completed orders</div>
            </div>

          </div>
        </div>

        {/* Feedback Toast Notification */}
        {toastMessage && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '28px',
            right: '28px',
            background: '#10b981',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <CheckCircle2 size={18} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
