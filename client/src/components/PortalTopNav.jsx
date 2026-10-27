import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  Bus,
  Search,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Truck,
  MapPin,
  Clock,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompanySettings } from '../context/CompanyContext';

export const PortalTopNav = ({
  activeModule,
  onSelectModule,
  pendingDispatchCount = 0,
  onNavigatePublic,
  onNewBooking,
  companySettings: propCompanySettings,
}) => {
  const { user, logout } = useAuth();
  const { companySettings: contextCompanySettings } = useCompanySettings();
  const company = propCompanySettings || contextCompanySettings || {};
  const [timeStr, setTimeStr] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setTimeStr(now.toLocaleString('en-IN', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-booking', label: 'Create Booking', icon: PackagePlus },
    { id: 'bookings', label: 'Bookings List', icon: Package },
    {
      id: 'dispatch',
      label: 'Bus Dispatch',
      icon: Bus,
      badge: pendingDispatchCount > 0 ? pendingDispatchCount : null,
    },
    { id: 'tracking', label: 'Parcel Tracking', icon: Search },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports & Revenue', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const handleModuleClick = (modId) => {
    onSelectModule(modId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="portal-topnav no-print">
      {/* Top Line: Brand, Terminal, Clock & Logout */}
      <div className="portal-topnav-main">
        {/* Brand Area */}
        <div
          className="portal-brand-area"
          onClick={() => handleModuleClick('dashboard')}
          style={{ cursor: 'pointer' }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              padding: '2px',
            }}
          >
            <img
              src={company.logoUrl || '/logo.png'}
              alt={company.companyName || 'Brand Logo'}
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
                color: '#ffffff',
              }}
            >
              <Truck size={20} />
            </div>
          </div>
          <div>
            <div className="portal-brand-title">
              {company.companyName || 'Logistics Management'}
            </div>
            <div className="portal-brand-sub">
              {company.tagline || 'Parcel & Bus Dispatch Network'}
            </div>
          </div>
        </div>

        {/* Status Indicators & Action Controls */}
        <div className="portal-meta-bar">
          {user?.branch && (
            <div className="portal-branch-pill" title="Operational Branch">
              <MapPin size={13} color="#94a3b8" />
              <span>{user.branch}</span>
            </div>
          )}

          <div className="portal-clock-pill" title="System Live Time">
            <Clock size={13} color="#94a3b8" />
            <span>{timeStr}</span>
          </div>

          {onNavigatePublic && (
            <button
              onClick={onNavigatePublic}
              className="portal-globe-btn"
              title="View Website & Tracking"
            >
              <Globe size={13} />
              <span>Website</span>
            </button>
          )}

          <button
            onClick={logout}
            className="portal-logout-btn"
            title="Logout"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="portal-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar (Desktop / Tablet Horizontal + Mobile Drawer) */}
      <nav className={`portal-nav-bar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <div
              key={item.id}
              className={`portal-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleModuleClick(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              {item.badge !== null && item.badge !== undefined && (
                <span className="portal-nav-badge">{item.badge}</span>
              )}
            </div>
          );
        })}
      </nav>
    </header>
  );
};
