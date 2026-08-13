import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ServerOff,
  BarChart2
} from 'lucide-react';
import RiskChart from './components/RiskChart';
import CustomerModal from './components/CustomerModal';

// Read API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  // Selected customer for modal inspection
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch risk scores from backend API
  const fetchRiskScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/risk-scores`);
      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error("Failed to fetch risk scores:", err);
      setError(`Unable to connect to ChurnSense API at ${API_URL}. Please verify the FastAPI backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskScores();
  }, []);

  // Compute KPI summary metrics
  const totalCustomers = customers.length;
  const highRiskCustomers = customers.filter(c => c.risk_level === 'High');
  const mediumRiskCustomers = customers.filter(c => c.risk_level === 'Medium');
  const lowRiskCustomers = customers.filter(c => c.risk_level === 'Low');

  // Filter & Search logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFilter === 'High Risk') return matchesSearch && c.risk_level === 'High';
    if (selectedFilter === 'Medium Risk') return matchesSearch && c.risk_level === 'Medium';
    if (selectedFilter === 'Low Risk') return matchesSearch && c.risk_level === 'Low';
    return matchesSearch;
  });

  const getRiskBadge = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return <span className="badge badge-high"><AlertTriangle size={12} /> High</span>;
      case 'medium':
        return <span className="badge badge-medium"><AlertCircle size={12} /> Medium</span>;
      default:
        return <span className="badge badge-low"><CheckCircle size={12} /> Low</span>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navigation Bar */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
            }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Churn<span style={{ color: '#818cf8' }}>Sense</span>
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AI-Powered Customer Retention System</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={fetchRiskScores}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid var(--border-color)',
                color: '#e2e8f0',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(51, 65, 85, 0.8)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)'}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(99, 102, 241, 0.2)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '0.95rem' }}>Evaluating machine learning predictions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)', margin: '40px 0' }}>
            <ServerOff size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#fca5a5', marginBottom: '8px' }}>Backend API Unavailable</h3>
            <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 24px auto', fontSize: '0.9rem' }}>{error}</p>
            <button
              onClick={fetchRiskScores}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: '#ef4444',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
              }}
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Top KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              
              {/* Card 1: Total Customers */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Total Customers</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} color="#818cf8" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', marginTop: '12px' }}>
                  {totalCustomers}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Analyzed over 90-day window</div>
              </div>

              {/* Card 2: High Risk */}
              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>High Risk Churn</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={18} color="#ef4444" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fca5a5', marginTop: '12px' }}>
                  {highRiskCustomers.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', fontWeight: 500 }}>
                  Requires immediate retention action
                </div>
              </div>

              {/* Card 3: Medium Risk */}
              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Medium Risk Churn</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={18} color="#f59e0b" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fde68a', marginTop: '12px' }}>
                  {mediumRiskCustomers.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px', fontWeight: 500 }}>
                  Declining activity trend
                </div>
              </div>

              {/* Card 4: Low Risk */}
              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Low Risk / Healthy</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={18} color="#10b981" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6ee7b7', marginTop: '12px' }}>
                  {lowRiskCustomers.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', fontWeight: 500 }}>
                  Highly engaged users
                </div>
              </div>

            </div>

            {/* Risk Breakdown Visual Chart */}
            <RiskChart
              highCount={highRiskCustomers.length}
              mediumCount={mediumRiskCustomers.length}
              lowCount={lowRiskCustomers.length}
              totalCount={totalCustomers}
            />

            {/* Customer Risk Table Section */}
            <div className="glass-card" style={{ padding: '24px' }}>
              
              {/* Table Header Controls */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>Customer Churn Ranking</h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Ranked by highest probability of churn (ML Model Output)</p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                  {/* Search Box */}
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Search User ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-color)',
                        color: '#f8fafc',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Filter Tabs */}
                  <div style={{
                    display: 'flex',
                    background: 'rgba(15, 23, 42, 0.8)',
                    borderRadius: '8px',
                    padding: '3px',
                    border: '1px solid var(--border-color)'
                  }}>
                    {['All', 'High Risk', 'Medium Risk', 'Low Risk'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: selectedFilter === filter ? '#6366f1' : 'transparent',
                          color: selectedFilter === filter ? '#ffffff' : '#94a3b8',
                          transition: 'all 0.2s'
                        }}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customers Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px 16px' }}>User ID</th>
                      <th style={{ padding: '12px 16px' }}>Churn Probability</th>
                      <th style={{ padding: '12px 16px' }}>Risk Level</th>
                      <th style={{ padding: '12px 16px' }}>Total Events</th>
                      <th style={{ padding: '12px 16px' }}>Active Days</th>
                      <th style={{ padding: '12px 16px' }}>Days Inactive</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                          No customer profiles match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map(c => {
                        const probPct = (c.churn_probability * 100).toFixed(1);
                        return (
                          <tr
                            key={c.user_id}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              transition: 'background 0.15s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f1f5f9' }}>
                              {c.user_id}
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '80px', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${probPct}%`,
                                    backgroundColor: c.risk_level === 'High' ? '#ef4444' : c.risk_level === 'Medium' ? '#f59e0b' : '#10b981'
                                  }} />
                                </div>
                                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0' }}>
                                  {probPct}%
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px' }}>
                              {getRiskBadge(c.risk_level)}
                            </td>

                            <td style={{ padding: '14px 16px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                              {c.total_events}
                            </td>

                            <td style={{ padding: '14px 16px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                              {c.active_days} days
                            </td>

                            <td style={{ padding: '14px 16px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                              {c.days_since_last_activity} days ago
                            </td>

                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <button
                                onClick={() => setSelectedCustomer(c)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: 'rgba(99, 102, 241, 0.12)',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  color: '#a5b4fc',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)'}
                              >
                                <span>Details & Actions</span>
                                <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Customer Inspection & Retention Action Modal */}
      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '20px 32px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.8rem'
      }}>
        ChurnSense Machine Learning System &copy; 2026 &bull; Real-time Churn Risk Analytics
      </footer>

    </div>
  );
}
