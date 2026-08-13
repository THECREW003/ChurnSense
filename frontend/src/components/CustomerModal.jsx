import React, { useState } from 'react';
import {
  X,
  Send,
  PhoneCall,
  Gift,
  CheckCircle2,
  Activity,
  Calendar,
  Clock,
  ShoppingCart,
  LogIn,
  Monitor,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Sparkles
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

  const getRiskBadgeClass = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'badge badge-high';
      case 'medium': return 'badge badge-medium';
      default: return 'badge badge-low';
    }
  };

  const getFactorIcon = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return <AlertTriangle size={16} color="#ef4444" />;
      case 'medium': return <AlertCircle size={16} color="#f59e0b" />;
      default: return <CheckCircle2 size={16} color="#10b981" />;
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
        {/* Header */}
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
          padding: '20px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>Predicted Churn Probability</span>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 700,
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

        {/* Explainable Risk Analysis Section */}
        <div style={{
          padding: '20px',
          borderRadius: '14px',
          background: customer.risk_level === 'High' ? 'rgba(239, 68, 68, 0.07)' : customer.risk_level === 'Medium' ? 'rgba(245, 158, 11, 0.07)' : 'rgba(16, 185, 129, 0.07)',
          border: `1px solid ${customer.risk_level === 'High' ? 'rgba(239, 68, 68, 0.25)' : customer.risk_level === 'Medium' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <HelpCircle size={18} color={customer.risk_level === 'High' ? '#ef4444' : customer.risk_level === 'Medium' ? '#f59e0b' : '#10b981'} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
              Why is this customer at risk?
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {customer.risk_factors && customer.risk_factors.length > 0 ? (
              customer.risk_factors.map((factor, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#e2e8f0' }}>
                  {getFactorIcon(customer.risk_level)}
                  <span>{factor}</span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No significant risk flags detected.</p>
            )}
          </div>
        </div>

        {/* Recommended Retention Action Card */}
        {customer.recommended_action && (
          <div style={{
            padding: '20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={18} color="#a78bfa" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                Recommended Retention Action
              </h3>
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#c084fc', marginBottom: '14px' }}>
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
                background: '#8b5cf6',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#7c3aed'}
              onMouseOut={(e) => e.currentTarget.style.background = '#8b5cf6'}
            >
              <Send size={16} />
              <span>Execute Recommended Action</span>
            </button>
          </div>
        )}

        {/* Activity Metrics Grid */}
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '14px' }}>Customer Activity Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          
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
