import React, { useState } from 'react';
import { Truck, LogIn, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import { useCompanySettings } from '../context/CompanyContext';

export const LoginPage = ({ onNavigate, onLoginSuccess, companySettings: propCompanySettings }) => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { companySettings: contextCompanySettings } = useCompanySettings();
  const company = propCompanySettings || contextCompanySettings || {};

  const companyName = company.companyName || 'Logistics Operations';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter both username/email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login({ identifier: identifier.trim(), password });
      showToast('Login successful! Welcome to Counter Operations.', 'success');
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setIdentifier('admi');
    setPassword('admin123');
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <button
          onClick={() => onNavigate('home')}
          className="btn btn-outline btn-sm"
          style={{ marginBottom: '1.25rem' }}
        >
          <ArrowLeft size={14} />
          Back to Website
        </button>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '2rem 1.75rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 0.75rem auto',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: '4px',
              }}
            >
              <img
                src={company.logoUrl || '/logo.png'}
                alt={companyName}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div
                style={{
                  display: 'none',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                }}
              >
                <Truck size={24} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>{companyName}</h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
              {company.tagline || 'Counter Booking & Bus Dispatch Operations Portal'}
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '0.65rem 0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username, Mobile, or Email</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. admi"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem' }}
              disabled={loading}
            >
              <LogIn size={16} />
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e2e8f0',
              fontSize: '0.75rem',
              color: '#64748b',
            }}
          >
            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
              Quick Demo Fill:
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={handleQuickLogin}
            >
              Admin (admi / admin123)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
