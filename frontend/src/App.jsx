import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Search,
  RefreshCw,
  Sparkles,
  ServerOff,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  XCircle,
  IndianRupee,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  DollarSign
} from 'lucide-react';
import RiskChart from './components/RiskChart';
import CustomerModal from './components/CustomerModal';

// Read API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [summaryData, setSummaryData] = useState({
    total_revenue_at_risk: 0,
    high_risk_revenue: 0,
    medium_risk_revenue: 0,
    low_risk_revenue: 0,
    total_monthly_value: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Custom CSV Upload state
  const [isCustomDataset, setIsCustomDataset] = useState(false);
  const [datasetFilename, setDatasetFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [sortBy, setSortBy] = useState('revenue_at_risk'); // 'revenue_at_risk' | 'churn_probability' | 'monthly_value' | 'user_id'
  const [sortDirection, setSortDirection] = useState('desc'); // 'desc' | 'asc'
  
  // Selected customer for modal inspection
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Currency formatting helper
  const formatCurrency = (val, decimals = 2) => {
    if (val === undefined || val === null || isNaN(val)) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: Number.isInteger(Number(val)) ? 0 : 2,
      maximumFractionDigits: decimals
    });
  };

  // Fetch demo risk scores from backend API
  const fetchDemoData = async () => {
    setLoading(true);
    setError(null);
    setUploadErrorMsg(null);
    try {
      const response = await fetch(`${API_URL}/risk-scores`);
      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }
      const data = await response.json();
      setCustomers(data.customers || []);
      setSummaryData({
        total_revenue_at_risk: data.total_revenue_at_risk || 0,
        high_risk_revenue: data.high_risk_revenue || 0,
        medium_risk_revenue: data.medium_risk_revenue || 0,
        low_risk_revenue: data.low_risk_revenue || 0,
        total_monthly_value: data.total_monthly_value || 0
      });
      setIsCustomDataset(false);
      setDatasetFilename('');
      setUploadSuccessMsg(null);
    } catch (err) {
      console.error("Failed to fetch risk scores:", err);
      setError(`Unable to connect to ChurnSense API at ${API_URL}. Please verify the FastAPI backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoData();
  }, []);

  // Handle CSV Upload to POST /upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadErrorMsg("Invalid file format. Please upload a valid .csv file.");
      return;
    }

    setUploading(true);
    setUploadErrorMsg(null);
    setUploadSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to process CSV file.");
      }

      setCustomers(data.customers || []);
      setSummaryData({
        total_revenue_at_risk: data.total_revenue_at_risk || 0,
        high_risk_revenue: data.high_risk_revenue || 0,
        medium_risk_revenue: data.medium_risk_revenue || 0,
        low_risk_revenue: data.low_risk_revenue || 0,
        total_monthly_value: data.total_monthly_value || 0
      });
      setIsCustomDataset(true);
      setDatasetFilename(data.filename || file.name);
      setUploadSuccessMsg(`✓ ${data.total_customers} customers analyzed successfully from ${data.filename || file.name}`);
      setError(null);
    } catch (err) {
      console.error("CSV Upload failed:", err);
      setUploadErrorMsg(err.message || "An error occurred while uploading the file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Compute live customer counts & revenue totals
  const totalCustomers = customers.length;
  const highRiskCustomers = customers.filter(c => c.risk_level === 'High');
  const mediumRiskCustomers = customers.filter(c => c.risk_level === 'Medium');
  const lowRiskCustomers = customers.filter(c => c.risk_level === 'Low');

  // Fallback to customer-level aggregation if summaryData is not populated
  const totalRevenueAtRisk = summaryData.total_revenue_at_risk || customers.reduce((acc, c) => acc + (c.revenue_at_risk || 0), 0);
  const highRiskRevenue = summaryData.high_risk_revenue || highRiskCustomers.reduce((acc, c) => acc + (c.revenue_at_risk || 0), 0);
  const mediumRiskRevenue = summaryData.medium_risk_revenue || mediumRiskCustomers.reduce((acc, c) => acc + (c.revenue_at_risk || 0), 0);
  const lowRiskRevenue = summaryData.low_risk_revenue || lowRiskCustomers.reduce((acc, c) => acc + (c.revenue_at_risk || 0), 0);
  const totalMonthlyValue = summaryData.total_monthly_value || customers.reduce((acc, c) => acc + (c.monthly_value || 0), 0);

  // Sorting & Filtering logic
  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const processedCustomers = useMemo(() => {
    let result = customers.filter(c => {
      const matchesSearch = c.user_id.toLowerCase().includes(searchTerm.toLowerCase());
      if (selectedFilter === 'High Risk') return matchesSearch && c.risk_level === 'High';
      if (selectedFilter === 'Medium Risk') return matchesSearch && c.risk_level === 'Medium';
      if (selectedFilter === 'Low Risk') return matchesSearch && c.risk_level === 'Low';
      return matchesSearch;
    });

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'user_id') {
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      }

      valA = Number(valA) || 0;
      valB = Number(valB) || 0;

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [customers, searchTerm, selectedFilter, sortBy, sortDirection]);

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
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AI-Powered Customer Retention & Revenue at Risk System</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isCustomDataset && (
              <button
                onClick={fetchDemoData}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <RotateCcw size={14} />
                <span>Reset to Demo Data</span>
              </button>
            )}

            <button
              onClick={fetchDemoData}
              disabled={loading || uploading}
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
                cursor: (loading || uploading) ? 'not-allowed' : 'pointer',
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
        
        {/* CSV Upload Banner Section */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <FileSpreadsheet size={22} color="#818cf8" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
                  Upload Activity Logs CSV
                </h3>
                {isCustomDataset && (
                  <span className="badge badge-medium" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#c084fc', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                    Active Dataset: {datasetFilename}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Upload customer activity logs (`.csv` containing <code style={{ color: '#a5b4fc' }}>user_id</code>, <code style={{ color: '#a5b4fc' }}>event</code>, <code style={{ color: '#a5b4fc' }}>timestamp</code>) to evaluate live churn and revenue at risk.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  border: `2px dashed ${isDragOver ? '#818cf8' : 'rgba(99, 102, 241, 0.4)'}`,
                  background: isDragOver ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Upload size={18} color="#818cf8" />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e0e7ff' }}>
                  {uploading ? 'Processing & Analyzing ML Features...' : 'Upload CSV / Drag & Drop'}
                </span>
              </div>

              {isCustomDataset && (
                <button
                  onClick={fetchDemoData}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Reset Demo
                </button>
              )}
            </div>
          </div>

          {/* Upload Success Message */}
          {uploadSuccessMsg && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={18} />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {/* Upload Error Message */}
          {uploadErrorMsg && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <XCircle size={18} />
              <span>{uploadErrorMsg}</span>
            </div>
          )}
        </div>
        
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
            <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '0.95rem' }}>Evaluating machine learning predictions and calculating revenue at risk...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)', margin: '40px 0' }}>
            <ServerOff size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#fca5a5', marginBottom: '8px' }}>Backend API Unavailable</h3>
            <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 24px auto', fontSize: '0.9rem' }}>{error}</p>
            <button
              onClick={fetchDemoData}
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
            
            {/* PROMINENT HERO CARD: 💰 Revenue at Risk */}
            <div className="glass-card" style={{
              padding: '28px 32px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.08) 50%, rgba(99, 102, 241, 0.12) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 12px 36px rgba(239, 68, 68, 0.12)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background ambient decorative glow */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              {/* Card Header */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.6rem' }}>💰</span>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                      Revenue at Risk
                    </h2>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#c7d2fe',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      Demo Estimate
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Quantified financial exposure calculated directly from ML churn probabilities & monthly subscription values.
                  </p>
                </div>

                {/* Formula Explanation Tag */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.82rem',
                  color: '#e2e8f0'
                }}>
                  <Sparkles size={15} color="#a78bfa" />
                  <span>
                    <strong style={{ color: '#c084fc' }}>Formula:</strong> Revenue at Risk = Churn Probability × Monthly Customer Value
                  </span>
                </div>
              </div>

              {/* Main Total Revenue at Risk Metric */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'baseline',
                gap: '16px',
                marginBottom: '24px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{
                  fontSize: '3.2rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.03em',
                  fontFamily: 'var(--font-heading)',
                  textShadow: '0 2px 20px rgba(239, 68, 68, 0.4)'
                }}>
                  {formatCurrency(totalRevenueAtRisk)}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>
                  monthly revenue exposed to potential customer attrition ({totalCustomers} active accounts)
                </div>
              </div>

              {/* Breakdown by Risk Level */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                
                {/* High Risk Revenue */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      High Risk Revenue
                    </span>
                    <AlertTriangle size={16} color="#ef4444" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fca5a5' }}>
                    {formatCurrency(highRiskRevenue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', fontWeight: 500 }}>
                    {highRiskCustomers.length} high-risk customers ({totalRevenueAtRisk > 0 ? ((highRiskRevenue / totalRevenueAtRisk) * 100).toFixed(1) : 0}% of RAR)
                  </div>
                </div>

                {/* Medium Risk Revenue */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#fde68a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Medium Risk Revenue
                    </span>
                    <AlertCircle size={16} color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fde68a' }}>
                    {formatCurrency(mediumRiskRevenue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px', fontWeight: 500 }}>
                    {mediumRiskCustomers.length} medium-risk customers ({totalRevenueAtRisk > 0 ? ((mediumRiskRevenue / totalRevenueAtRisk) * 100).toFixed(1) : 0}% of RAR)
                  </div>
                </div>

                {/* Low Risk Revenue */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Low Risk Revenue
                    </span>
                    <CheckCircle size={16} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6ee7b7' }}>
                    {formatCurrency(lowRiskRevenue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', fontWeight: 500 }}>
                    {lowRiskCustomers.length} healthy customers ({totalRevenueAtRisk > 0 ? ((lowRiskRevenue / totalRevenueAtRisk) * 100).toFixed(1) : 0}% of RAR)
                  </div>
                </div>

              </div>

              {/* Disclaimer Notice */}
              <div style={{ marginTop: '16px', fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={13} color="#64748b" />
                <span>
                  Subscription tiers (₹299, ₹499, ₹799, ₹999, ₹1,499, ₹2,499) are realistic synthetic demo estimates for financial simulation and not actual corporate accounts.
                </span>
              </div>
            </div>

            {/* Quick Customer Counts KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              
              {/* Card 1: Total Customers */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Total Accounts Analyzed</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} color="#818cf8" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', marginTop: '12px' }}>
                  {totalCustomers}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  {isCustomDataset ? `Dataset: ${datasetFilename}` : 'Tracked over 90-day observation window'}
                </div>
              </div>

              {/* Card 2: High Risk */}
              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>High Risk Volume</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={18} color="#ef4444" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fca5a5', marginTop: '12px' }}>
                  {highRiskCustomers.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', fontWeight: 500 }}>
                  Immediate win-back required
                </div>
              </div>

              {/* Card 3: Medium Risk */}
              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Medium Risk Volume</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={18} color="#f59e0b" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fde68a', marginTop: '12px' }}>
                  {mediumRiskCustomers.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px', fontWeight: 500 }}>
                  Declining interaction trends
                </div>
              </div>

              {/* Card 4: Low Risk */}
              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Low Risk Volume</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={18} color="#10b981" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6ee7b7', marginTop: '12px' }}>
                  {lowRiskCustomers.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', fontWeight: 500 }}>
                  Highly active & loyal
                </div>
              </div>

            </div>

            {/* Risk Breakdown Visual Chart */}
            <RiskChart
              highCount={highRiskCustomers.length}
              mediumCount={mediumRiskCustomers.length}
              lowCount={lowRiskCustomers.length}
              totalCount={totalCustomers}
              highRevenue={highRiskRevenue}
              mediumRevenue={mediumRiskRevenue}
              lowRevenue={lowRiskRevenue}
              totalRevenue={totalRevenueAtRisk}
            />

            {/* Customer Risk & Revenue Table Section */}
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
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc' }}>
                    Customer Prioritization & Financial Impact
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Prioritize retention outreach based on financial business impact (Revenue at Risk) and churn probability.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                  {/* Search Box */}
                  <div style={{ position: 'relative', width: '200px' }}>
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

                  {/* Dedicated Sort Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Sort:</label>
                    <select
                      value={`${sortBy}_${sortDirection}`}
                      onChange={(e) => {
                        const [newSort, newDir] = e.target.value.split('_');
                        setSortBy(newSort);
                        setSortDirection(newDir);
                      }}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#c7d2fe',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="revenue_at_risk_desc">💰 Sort by Revenue at Risk (Highest Impact)</option>
                      <option value="revenue_at_risk_asc">💰 Revenue at Risk (Lowest First)</option>
                      <option value="churn_probability_desc">⚠️ Churn Probability (Highest Risk)</option>
                      <option value="churn_probability_asc">⚠️ Churn Probability (Lowest First)</option>
                      <option value="monthly_value_desc">💵 Monthly Value (Highest Tier)</option>
                      <option value="user_id_asc">👤 Customer ID (A-Z)</option>
                    </select>
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
                      <th
                        onClick={() => handleSortChange('user_id')}
                        style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Customer</span>
                          {sortBy === 'user_id' && (sortDirection === 'desc' ? <ArrowDown size={14} color="#818cf8" /> : <ArrowUp size={14} color="#818cf8" />)}
                        </div>
                      </th>

                      <th
                        onClick={() => handleSortChange('churn_probability')}
                        style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Churn Risk</span>
                          {sortBy === 'churn_probability' && (sortDirection === 'desc' ? <ArrowDown size={14} color="#818cf8" /> : <ArrowUp size={14} color="#818cf8" />)}
                        </div>
                      </th>

                      <th style={{ padding: '12px 16px' }}>Risk Level</th>

                      <th
                        onClick={() => handleSortChange('monthly_value')}
                        style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Monthly Value</span>
                          {sortBy === 'monthly_value' && (sortDirection === 'desc' ? <ArrowDown size={14} color="#818cf8" /> : <ArrowUp size={14} color="#818cf8" />)}
                        </div>
                      </th>

                      <th
                        onClick={() => handleSortChange('revenue_at_risk')}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          userSelect: 'none',
                          color: '#f8fafc',
                          background: 'rgba(99, 102, 241, 0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>💰 Revenue at Risk</span>
                          {sortBy === 'revenue_at_risk' && (sortDirection === 'desc' ? <ArrowDown size={14} color="#818cf8" /> : <ArrowUp size={14} color="#818cf8" />)}
                        </div>
                      </th>

                      <th style={{ padding: '12px 16px' }}>Activity (Active Days)</th>

                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                          No customer profiles match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      processedCustomers.map(c => {
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '70px', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
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

                            <td style={{ padding: '14px 16px', color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500 }}>
                              {formatCurrency(c.monthly_value)}
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>/mo</span>
                            </td>

                            <td style={{
                              padding: '14px 16px',
                              background: 'rgba(99, 102, 241, 0.04)'
                            }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                color: c.risk_level === 'High' ? '#fca5a5' : c.risk_level === 'Medium' ? '#fde68a' : '#6ee7b7'
                              }}>
                                {formatCurrency(c.revenue_at_risk)}
                              </div>
                            </td>

                            <td style={{ padding: '14px 16px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                              <span>{c.active_days} days active</span>
                              <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '6px' }}>({c.total_events} evts)</span>
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
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Helper */}
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                <span>Showing {processedCustomers.length} of {totalCustomers} customers</span>
                <span>Revenue at Risk = Churn Probability × Monthly Customer Value</span>
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
        ChurnSense Machine Learning System &copy; 2026 &bull; Real-time Churn Risk & Revenue at Risk Analytics
      </footer>

    </div>
  );
}

