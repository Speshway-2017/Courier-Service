import React, { useState, useEffect } from 'react';
import { PortalTopNav } from '../components/PortalTopNav';
import { DashboardPage } from './portal/DashboardPage';
import { CreateBookingPage } from './portal/CreateBookingPage';
import { BookingsPage } from './portal/BookingsPage';
import { BusDispatchPage } from './portal/BusDispatchPage';
import { CustomersPage } from './portal/CustomersPage';
import { ReportsPage } from './portal/ReportsPage';
import { SettingsPage } from './portal/SettingsPage';
import { TrackingPage } from './TrackingPage';

import { ReceiptModal } from '../components/ReceiptModal';
import { AssignBusModal } from '../components/AssignBusModal';
import { WhatsAppModal } from '../components/WhatsAppModal';

import { api } from '../services/api';
import { useCompanySettings } from '../context/CompanyContext';

export const PortalLayout = ({
  activeModule: controlledModule,
  onSelectModule: controlledOnSelectModule,
  onNavigatePublic,
  companySettings: propCompanySettings,
  onRefreshCompanySettings,
}) => {
  const { companySettings: contextCompanySettings, setCompanySettings: setGlobalCompanySettings } = useCompanySettings();

  // If controlled from App.jsx routing, use controlledModule; else maintain internal state
  const [internalModule, setInternalModule] = useState(() => {
    return localStorage.getItem('courier_active_module') || 'dashboard';
  });

  const activeModule = controlledModule || internalModule;

  const handleSelectModule = (mod) => {
    if (controlledOnSelectModule) {
      controlledOnSelectModule(mod);
    } else {
      setInternalModule(mod);
      localStorage.setItem('courier_active_module', mod);
      window.location.hash = `#${mod}`;
    }
  };

  const [pendingDispatchCount, setPendingDispatchCount] = useState(0);
  const [companySettings, setCompanySettings] = useState(propCompanySettings || contextCompanySettings || null);
  const [destinations, setDestinations] = useState([]);
  const [cities, setCities] = useState([]);
  const [parcelTypes, setParcelTypes] = useState([]);

  // Modals state
  const [receiptBooking, setReceiptBooking] = useState(null);
  const [assignBusBookings, setAssignBusBookings] = useState(null);
  const [assignBusCallback, setAssignBusCallback] = useState(null);
  const [whatsAppBooking, setWhatsAppBooking] = useState(null);

  const refreshPendingCount = async () => {
    try {
      const res = await api.dispatch.getPending();
      if (res.success) {
        setPendingDispatchCount(res.count || (res.data ? res.data.length : 0));
      }
    } catch {
      // Ignore background poll errors
    }
  };

  const fetchCities = async () => {
    try {
      const res = await api.cities.list();
      if (res.success && res.data) {
        setCities(res.data);
      }
    } catch {
      // Ignore cities fetch errors
    }
  };

  const fetchParcelTypes = async () => {
    try {
      const res = await api.parcelTypes.list();
      if (res.success && res.data) {
        setParcelTypes(res.data);
      }
    } catch {
      // Ignore parcel types fetch errors
    }
  };

  const fetchDestinations = async () => {
    try {
      const res = await api.destinations.list();
      if (res.success && res.data) {
        setDestinations(res.data);
      }
    } catch {
      // Ignore destinations fetch errors
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.settings.get();
      if (res.success && res.data) {
        setCompanySettings(res.data);
        if (setGlobalCompanySettings) setGlobalCompanySettings(res.data);
      }
    } catch {
      // Ignore settings fetch errors
    }
  };

  const refreshAllGlobalState = async () => {
    await Promise.all([
      fetchCities(),
      fetchParcelTypes(),
      fetchDestinations(),
      fetchSettings(),
      refreshPendingCount(),
    ]);
  };

  useEffect(() => {
    refreshAllGlobalState();
    const interval = setInterval(refreshPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAssignBus = (bookings, callback) => {
    setAssignBusBookings(bookings);
    setAssignBusCallback(() => callback);
  };

  const handleAssignBusSuccess = () => {
    refreshPendingCount();
    if (assignBusCallback) {
      assignBusCallback();
    }
  };

  return (
    <div className="portal-layout-topbar">
      {/* Top Bar Navigation (Clean Top Navigation) */}
      <PortalTopNav
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
        pendingDispatchCount={pendingDispatchCount}
        onNavigatePublic={onNavigatePublic}
        onNewBooking={() => handleSelectModule('create-booking')}
        companySettings={companySettings}
      />

      {/* Main Workspace Area */}
      <main className="portal-content">
        {activeModule === 'dashboard' && (
          <DashboardPage
            onNavigateModule={handleSelectModule}
            onOpenReceipt={(b) => setReceiptBooking(b)}
            onOpenWhatsApp={(b) => setWhatsAppBooking(b)}
            onOpenAssignBus={(bList) => handleOpenAssignBus(bList, refreshPendingCount)}
          />
        )}

        {activeModule === 'create-booking' && (
          <CreateBookingPage
            onOpenReceipt={(b) => setReceiptBooking(b)}
            onOpenWhatsApp={(b) => setWhatsAppBooking(b)}
            onNavigateModule={handleSelectModule}
            cities={cities}
            onRefreshCities={fetchCities}
            parcelTypes={parcelTypes}
            onRefreshParcelTypes={fetchParcelTypes}
            standardRoutes={
              destinations.length > 0
                ? destinations.map((d) => d.route)
                : companySettings?.standardRoutes || []
            }
            destinations={destinations}
            onRefreshDestinations={fetchDestinations}
          />
        )}

        {activeModule === 'bookings' && (
          <BookingsPage
            onNavigateModule={handleSelectModule}
            onOpenReceipt={(b) => setReceiptBooking(b)}
            onOpenWhatsApp={(b) => setWhatsAppBooking(b)}
            onOpenAssignBus={(bList) => handleOpenAssignBus(bList, refreshPendingCount)}
            parcelTypes={parcelTypes}
            standardRoutes={
              destinations.length > 0
                ? destinations.map((d) => d.route)
                : companySettings?.standardRoutes || []
            }
          />
        )}

        {activeModule === 'dispatch' && (
          <BusDispatchPage
            onOpenAssignBus={(bList, cb) => handleOpenAssignBus(bList, cb)}
            onOpenReceipt={(b) => setReceiptBooking(b)}
            onOpenWhatsApp={(b) => setWhatsAppBooking(b)}
            parcelTypes={parcelTypes}
            standardRoutes={
              destinations.length > 0
                ? destinations.map((d) => d.route)
                : companySettings?.standardRoutes || []
            }
          />
        )}

        {activeModule === 'tracking' && (
          <TrackingPage
            onNavigate={() => handleSelectModule('dashboard')}
          />
        )}

        {activeModule === 'customers' && (
          <CustomersPage
            onOpenReceipt={(b) => setReceiptBooking(b)}
            onNavigateModule={handleSelectModule}
          />
        )}

        {activeModule === 'reports' && (
          <ReportsPage
            parcelTypes={parcelTypes}
            companySettings={companySettings}
            onOpenReceipt={(b) => setReceiptBooking(b)}
            onOpenWhatsApp={(b) => setWhatsAppBooking(b)}
            standardRoutes={
              destinations.length > 0
                ? destinations.map((d) => d.route)
                : companySettings?.standardRoutes || []
            }
          />
        )}

        {activeModule === 'settings' && (
          <SettingsPage onRefreshGlobalDestinations={refreshAllGlobalState} />
        )}
      </main>

      {/* Global Modals */}
      {receiptBooking && (
        <ReceiptModal
          booking={receiptBooking}
          companySettings={companySettings}
          onClose={() => setReceiptBooking(null)}
        />
      )}

      {assignBusBookings && (
        <AssignBusModal
          bookings={assignBusBookings}
          cities={cities}
          destinations={destinations}
          standardRoutes={
            destinations.length > 0
              ? destinations.map((d) => d.route)
              : companySettings?.standardRoutes || []
          }
          onClose={() => setAssignBusBookings(null)}
          onSuccess={handleAssignBusSuccess}
        />
      )}

      {whatsAppBooking && (
        <WhatsAppModal
          booking={whatsAppBooking}
          onClose={() => setWhatsAppBooking(null)}
          onSuccess={() => {
            refreshPendingCount();
          }}
        />
      )}
    </div>
  );
};
