import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'FastTrack Bus Parcel & Courier Services',
  logoUrl: '/logo.png',
  tagline: 'Parcel & Bus Dispatch Network',
  companyPhone: '+91 98765 43210',
  companyEmail: 'dispatch@fasttrackcourier.com',
  companyAddress: 'Main Bus Terminal Road, Complex #4, Hyderabad, TS - 500001',
  gstin: '',
  receiptFooterNote: 'Thank you for choosing our bus parcel service. Present this receipt or 6-digit Order ID at destination counter.',
  standardRoutes: [],
};

const CompanyContext = createContext(null);

export const CompanyProvider = ({ children }) => {
  const [companySettings, setCompanySettings] = useState(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState(true);

  const applyDocumentTitle = (name) => {
    if (name) {
      document.title = `${name} - Parcel & Bus Dispatch System`;
    }
  };

  const applyFavicon = (logoUrl) => {
    try {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = logoUrl || '/favicon.svg';
    } catch {
      // Ignore in non-browser environments
    }
  };

  const fetchCompanySettings = useCallback(async () => {
    try {
      let res;
      // Try authenticated or public endpoint
      try {
        res = await api.settings.getPublic();
      } catch {
        res = await api.settings.get();
      }

      if (res && res.success && res.data) {
        setCompanySettings((prev) => ({
          ...prev,
          ...res.data,
        }));
        if (res.data.companyName) {
          applyDocumentTitle(res.data.companyName);
        }
        if (res.data.logoUrl) {
          applyFavicon(res.data.logoUrl);
        }
      }
    } catch (err) {
      console.warn('Could not load company settings:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanySettings();
  }, [fetchCompanySettings]);

  const updateCompanySettingsState = useCallback((newSettings) => {
    setCompanySettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (updated.companyName) {
        applyDocumentTitle(updated.companyName);
      }
      if (updated.logoUrl) {
        applyFavicon(updated.logoUrl);
      }
      return updated;
    });
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        companySettings,
        setCompanySettings: updateCompanySettingsState,
        refreshCompanySettings: fetchCompanySettings,
        loading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompanySettings = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    return {
      companySettings: DEFAULT_COMPANY_SETTINGS,
      setCompanySettings: () => {},
      refreshCompanySettings: async () => {},
      loading: false,
    };
  }
  return context;
};
