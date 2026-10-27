import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CompanyProvider, useCompanySettings } from './context/CompanyContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { TrackingPage } from './pages/TrackingPage';
import { LoginPage } from './pages/LoginPage';
import { PortalLayout } from './pages/PortalLayout';

import './index.css';
import './styles/components.css';

const PORTAL_MODULES = [
  'dashboard',
  'create-booking',
  'bookings',
  'dispatch',
  'tracking',
  'customers',
  'reports',
  'settings',
];

/**
 * Parses the current URL hash, pathname, and local storage to determine
 * the initial view, active portal module, and query parameters.
 */
const parseCurrentRoute = () => {
  try {
    let raw = (window.location.hash || '').trim();
    if (raw.startsWith('#/')) raw = raw.slice(2);
    else if (raw.startsWith('#')) raw = raw.slice(1);

    // Fallback to pathname if hash is absent
    if (!raw) {
      const path = (window.location.pathname || '').trim().replace(/^\//, '');
      if (path) raw = path;
    }

    const [routePath, queryString] = raw.split('?');
    const normalized = (routePath || '').trim().toLowerCase();

    // Query param helper
    let orderId = '';
    if (queryString) {
      const params = new URLSearchParams(queryString);
      orderId = params.get('orderId') || params.get('id') || '';
    }

    // 1. Public home
    if (!normalized || normalized === 'home' || normalized === 'index.html') {
      return { view: 'home', module: 'dashboard', orderId: '' };
    }

    // 2. Login screen
    if (normalized === 'login' || normalized === 'portal/login') {
      return { view: 'login', module: 'dashboard', orderId: '' };
    }

    // 3. Public tracking
    if (normalized === 'track' || normalized === 'tracking-public' || normalized.startsWith('track/')) {
      const subId = normalized.startsWith('track/') ? normalized.split('/')[1] : '';
      return { view: 'track', module: 'tracking', orderId: orderId || subId };
    }

    // 4. Portal modules (e.g. #create-booking, #dispatch, #reports, #portal/create-booking)
    const cleanedModule = normalized.replace(/^portal\//, '');
    if (PORTAL_MODULES.includes(cleanedModule)) {
      return { view: 'portal', module: cleanedModule, orderId };
    }

    // 5. Generic #portal
    if (normalized === 'portal') {
      const lastMod = localStorage.getItem('courier_active_module') || 'dashboard';
      return { view: 'portal', module: lastMod, orderId: '' };
    }

    // 6. LocalStorage fallback
    const savedRoute = localStorage.getItem('courier_active_route');
    const savedMod = localStorage.getItem('courier_active_module') || 'dashboard';
    if (savedRoute === 'portal') {
      return { view: 'portal', module: savedMod, orderId: '' };
    }
    if (savedRoute === 'track' || savedRoute === 'login') {
      return { view: savedRoute, module: 'dashboard', orderId: '' };
    }

    return { view: 'home', module: 'dashboard', orderId: '' };
  } catch {
    return { view: 'home', module: 'dashboard', orderId: '' };
  }
};

const MainApp = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { companySettings, refreshCompanySettings } = useCompanySettings();

  // Initialize route state directly from current URL on load / refresh
  const [routeState, setRouteState] = useState(() => parseCurrentRoute());
  const [trackedOrderId, setTrackedOrderId] = useState(() => routeState.orderId || '');

  // Synchronize route state with URL hash and LocalStorage
  const updateRoute = useCallback((view, module = 'dashboard', orderId = '') => {
    let hash = '';
    if (view === 'portal') {
      hash = `#${module}`;
      localStorage.setItem('courier_active_route', 'portal');
      localStorage.setItem('courier_active_module', module);
    } else if (view === 'track') {
      hash = orderId ? `#track?id=${encodeURIComponent(orderId)}` : '#track';
      localStorage.setItem('courier_active_route', 'track');
    } else if (view === 'login') {
      hash = '#login';
      localStorage.setItem('courier_active_route', 'login');
    } else {
      hash = '#home';
      localStorage.setItem('courier_active_route', 'home');
    }

    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }

    setRouteState({ view, module, orderId });
    if (orderId) {
      setTrackedOrderId(orderId);
    }
  }, []);

  // Listen for browser back/forward and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const next = parseCurrentRoute();
      setRouteState(next);
      if (next.orderId) {
        setTrackedOrderId(next.orderId);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Sync initial URL hash on mount if currently empty
  useEffect(() => {
    if (!window.location.hash && routeState.view !== 'home') {
      if (routeState.view === 'portal') {
        window.location.hash = `#${routeState.module}`;
      } else {
        window.location.hash = `#${routeState.view}`;
      }
    }
  }, [routeState]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0d2137',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
            {companySettings?.companyName || 'Courier & Logistics Management'}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            Loading secure operations workspace...
          </div>
        </div>
      </div>
    );
  }

  // If in portal view:
  if (routeState.view === 'portal') {
    if (!isAuthenticated) {
      return (
        <LoginPage
          onNavigate={(view) => updateRoute(view)}
          onLoginSuccess={() => updateRoute('portal', routeState.module || 'dashboard')}
          companySettings={companySettings}
        />
      );
    }

    return (
      <PortalLayout
        activeModule={routeState.module}
        onSelectModule={(mod) => updateRoute('portal', mod)}
        onNavigatePublic={() => updateRoute('home')}
        companySettings={companySettings}
        onRefreshCompanySettings={refreshCompanySettings}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={routeState.view}
        companySettings={companySettings}
        onNavigate={(view) => {
          if (view === 'portal') {
            if (!isAuthenticated) {
              updateRoute('login');
            } else {
              const lastMod = localStorage.getItem('courier_active_module') || 'dashboard';
              updateRoute('portal', lastMod);
            }
          } else {
            updateRoute(view);
          }
        }}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {routeState.view === 'home' && (
          <HomePage
            companySettings={companySettings}
            onNavigate={(view) => {
              if (view === 'portal') {
                const lastMod = localStorage.getItem('courier_active_module') || 'dashboard';
                updateRoute('portal', lastMod);
              } else {
                updateRoute(view);
              }
            }}
            onTrackOrder={(id) => {
              updateRoute('track', 'tracking', id);
            }}
          />
        )}

        {routeState.view === 'track' && (
          <TrackingPage
            initialOrderId={trackedOrderId}
            companySettings={companySettings}
            onNavigate={(view) => updateRoute(view)}
          />
        )}

        {routeState.view === 'login' && (
          <LoginPage
            companySettings={companySettings}
            onNavigate={(view) => updateRoute(view)}
            onLoginSuccess={() => {
              const lastMod = localStorage.getItem('courier_active_module') || 'dashboard';
              updateRoute('portal', lastMod);
            }}
          />
        )}
      </main>

      <Footer companySettings={companySettings} onNavigate={(view) => updateRoute(view)} />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CompanyProvider>
          <MainApp />
        </CompanyProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

