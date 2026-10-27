import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Bus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Printer,
  Phone,
  MapPin,
  ShieldCheck,
  Navigation,
  ExternalLink,
  ChevronRight,
  Layers,
  IndianRupee,
  RefreshCw,
  User,
  Truck,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useCompanySettings } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import { TrackStatusButton } from '../components/TrackStatusButton';

export const TrackingPage = ({ initialOrderId = '', onNavigate }) => {
  const { companySettings } = useCompanySettings();
  const { showToast } = useToast();

  const company = companySettings || {};
  const companyName = company.companyName || 'Sri Vinayaka Logistics';
  const companyPhone = company.companyPhone || '+91 98765 43210';
  const companyAddress = company.companyAddress || 'Main Bus Terminal Road, Complex #4, Hyderabad, TS - 500001';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const trackBtnRef = React.useRef(null);

  const fetchTracking = async (idToSearch) => {
    const cleanId = (idToSearch || orderId || '').trim();
    if (!cleanId) {
      setError('Please enter a valid 6-digit numerical Order ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTrackingData(null);
      const res = await api.tracking.trackByOrderId(cleanId);
      if (res.success && res.data) {
        setTrackingData(res.data);
      } else {
        setError(res.message || `No consignment found for Order ID #${cleanId}. Please verify the number on your receipt.`);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to live tracking server. Please check the Order ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      setOrderId(initialOrderId);
      fetchTracking(initialOrderId);
    }
  }, [initialOrderId]);

  const handleSearchSubmit = (e, triggerAnimation) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const cleanId = (orderId || '').trim();
    if (!cleanId || cleanId.length !== 6) {
      setError('Please enter a valid 6-digit Order ID (e.g. 583214).');
      if (showToast) showToast('Please enter a valid 6-digit Order ID', 'error');
      return;
    }

    if (typeof triggerAnimation === 'function') {
      triggerAnimation();
    } else {
      trackBtnRef.current?.trigger();
    }

    fetchTracking(cleanId);
  };

  const handleCopyOrderId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    if (showToast) showToast(`Order ID #${id} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!trackingData) return;
    const origin = window.location.origin;
    const trackingUrl = `${origin}/#track?id=${trackingData.orderId}`;
    const text = `*Live Parcel Tracking - ${companyName}*\n\n📦 *Order ID:* #${trackingData.orderId}\n📍 *Route:* ${trackingData.destination}\n🚦 *Status:* ${trackingData.status.replace(/_/g, ' ')}\n${trackingData.busDetails?.busNumber ? `🚌 *Bus Number:* ${trackingData.busDetails.busNumber}\n` : ''}${trackingData.busDetails?.driverPhone ? `📞 *Driver Phone:* ${trackingData.busDetails.driverPhone}\n` : ''}\n🔗 *Track Live Online:* ${trackingUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Determine timeline progress steps & weights
  const getTimelineProgress = (status) => {
    const norm = status === 'BOOKED' ? 'WAITING_FOR_BUS' : status;
    const weights = {
      WAITING_FOR_BUS: 1,
      DISPATCHED: 2,
      DELIVERED: 3,
      CANCELLED: 0,
    };
    return weights[norm] || 1;
  };

  const currentStepNum = trackingData ? getTimelineProgress(trackingData.status) : 1;
  const isCancelled = trackingData?.status === 'CANCELLED';

  const stepsConfig = [
    {
      step: 1,
      id: 'BOOKED',
      title: 'Counter Booking & Tagged',
      desc: 'Parcel received at counter and assigned 6-digit Order ID sticker',
      icon: Package,
    },
    {
      step: 2,
      id: 'WAITING_FOR_BUS',
      title: 'Dispatch Bay Loading',
      desc: 'Stored in secure terminal bay awaiting evening bus departure',
      icon: Clock,
    },
    {
      step: 3,
      id: 'DISPATCHED',
      title: 'In-Transit on Bus',
      desc: 'Secured inside passenger bus luggage bay en-route to destination',
      icon: Bus,
    },
    {
      step: 4,
      id: 'DELIVERED',
      title: 'Delivered / Collected',
      desc: 'Arrived at destination counter & handed over to receiver',
      icon: CheckCircle2,
    },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '1.5rem auto 4rem auto', padding: '0 1.25rem', flex: 1 }}>
      {/* Top Header Navigation Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <button
          onClick={() => onNavigate('home')}
          className="btn btn-secondary btn-sm no-print"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            fontWeight: 600,
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
            <span>24/7 Live Parcel Tracking</span>
          </div>

          {trackingData && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleShareWhatsApp}
                className="btn btn-secondary btn-sm"
                title="Share tracking details on WhatsApp"
                style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
              >
                <Share2 size={13} />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-secondary btn-sm no-print"
                title="Print Tracking Sheet"
                style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
              >
                <Printer size={13} />
                <span>Print</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1. HERO SEARCH HEADER & TRACKING INPUT CARD */}
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          padding: '2.25rem 2rem',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #1e293b',
        }}
      >
        {/* Glow Accent Background */}
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, rgba(15, 23, 42, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8',
                  animation: 'beaconPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Live Consignment Transit Intelligence
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem 0', letterSpacing: '-0.01em' }}>
            Parcel & Freight Tracking System
          </h1>

          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0 0 1.5rem 0', maxWidth: '620px', lineHeight: 1.5 }}>
            Enter the 6-digit Order ID printed on your counter consignment receipt or received via WhatsApp SMS dispatch alert.
          </p>

          {/* Search Form Bar */}
          <form onSubmit={handleSearchSubmit} className="tracking-form" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', maxWidth: '640px', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1, width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Enter 6-digit Order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                pattern="\d{6}"
                required
                style={{
                  paddingLeft: '42px',
                  height: '46px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  width: '100%',
                }}
              />
              {orderId && (
                <button
                  type="button"
                  onClick={() => { setOrderId(''); setTrackingData(null); setError(''); }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '13px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                  }}
                  title="Clear input"
                >
                  ✕
                </button>
              )}
            </div>

            <TrackStatusButton
              ref={trackBtnRef}
              onClick={(e, trigger) => handleSearchSubmit(e, trigger)}
              defaultText="Track Status"
              successText="Tracking Active"
              disabled={loading}
            />
          </form>

          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem' }}>
            Instant status lookup for booked, in-transit, and delivered bus consignments.
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '2px' }}>
              Consignment Record Not Located
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#b91c1c' }}>{error}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
              Tip: Order IDs are exactly 6 numerical digits generated at the counter upon booking.
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE TRACKING RESULT & TRANSIT PIPELINE */}
      {trackingData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Main Consignment Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1.75rem',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -2px rgba(0,0,0,0.03)',
            }}
          >
            {/* Top Bar: Order ID, Copy button, Status Pill & Booking Date */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CONSIGNMENT TRACKING NO.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                    #{trackingData.orderId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyOrderId(trackingData.orderId)}
                    style={{
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                    title="Copy Order ID"
                  >
                    {copiedId ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '2px' }}>
                  Sender: <strong>{trackingData.customerName}</strong> ({trackingData.customerPhoneMasked})
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    display: 'inline-block',
                    backgroundColor:
                      trackingData.status === 'DELIVERED'
                        ? '#0f172a'
                        : trackingData.status === 'DISPATCHED'
                        ? '#2563eb'
                        : trackingData.status === 'CANCELLED'
                        ? '#dc2626'
                        : '#d97706',
                    color: '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  {trackingData.status.replace(/_/g, ' ')}
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                  Booked: {new Date(trackingData.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>
            </div>

            {/* Visual 4-Step Animated Transit Pipeline */}
            <div style={{ margin: '2rem 0 1.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Consignment Transit Stage
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  {isCancelled ? 'Consignment Cancelled' : currentStepNum === 3 ? 'Stage 3 of 4: In-Transit' : currentStepNum === 4 ? 'Completed: Delivered' : `Stage ${currentStepNum} of 4`}
                </span>
              </div>

              {/* Progress Line Bar Container */}
              <div style={{ position: 'relative', margin: '1rem 0 2rem 0' }}>
                {/* Background Track */}
                <div style={{ height: '6px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '3px', position: 'absolute', top: '18px', left: 0, zIndex: 1 }} />

                {/* Active Progress Fill */}
                <div
                  style={{
                    height: '6px',
                    width: isCancelled ? '0%' : `${Math.min(100, ((currentStepNum - 1) / 3) * 100)}%`,
                    backgroundColor: '#2563eb',
                    borderRadius: '3px',
                    position: 'absolute',
                    top: '18px',
                    left: 0,
                    zIndex: 2,
                    transition: 'width 0.4s ease',
                  }}
                />

                {/* 4 Step Waypoint Nodes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative', zIndex: 3 }}>
                  {stepsConfig.map((s, idx) => {
                    const isDone = !isCancelled && s.step <= currentStepNum;
                    const isCurrent = !isCancelled && s.step === currentStepNum;
                    const StepIcon = s.icon;

                    return (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: idx === 0 ? 'flex-start' : idx === 3 ? 'flex-end' : 'center',
                          textAlign: idx === 0 ? 'left' : idx === 3 ? 'right' : 'center',
                        }}
                      >
                        {/* Waypoint Circle */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: isDone ? '#0f172a' : '#ffffff',
                            color: isDone ? '#ffffff' : '#94a3b8',
                            border: isCurrent ? '3px solid #2563eb' : isDone ? '3px solid #0f172a' : '3px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isCurrent ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                          }}
                        >
                          <StepIcon size={18} />
                          {isCurrent && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: '#2563eb',
                                animation: 'beaconPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                              }}
                            />
                          )}
                        </div>

                        {/* Title & Stage */}
                        <div style={{ marginTop: '0.65rem', maxWidth: '160px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 800 : isDone ? 700 : 500, color: isCurrent ? '#2563eb' : isDone ? '#0f172a' : '#94a3b8' }}>
                            {s.title}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                            {s.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Consignment Specification Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                padding: '1.25rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                  Delivery Corridor
                </span>
                <strong style={{ fontSize: '0.9375rem', color: '#0f172a' }}>
                  {trackingData.destination}
                </strong>
                {trackingData.toCity && (
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                    Pickup Hub: {trackingData.toCity}
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                  Cargo Type & Quantity
                </span>
                <strong style={{ fontSize: '0.9375rem', color: '#0f172a' }}>
                  {trackingData.parcelType} ({trackingData.quantity || 1} Pcs)
                </strong>
                {trackingData.weight > 0 && (
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                    Weight: {trackingData.weight} kg
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                  Booking Counter Branch
                </span>
                <strong style={{ fontSize: '0.9375rem', color: '#0f172a' }}>
                  {trackingData.branch || 'Origin Booking Counter'}
                </strong>
                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                  Direct Office Receipt
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                  Payment Status
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: trackingData.paymentStatus === 'PAID' ? '#f1f5f9' : '#fffbeb',
                      color: trackingData.paymentStatus === 'PAID' ? '#0f172a' : '#b45309',
                      border: trackingData.paymentStatus === 'PAID' ? '1px solid #cbd5e1' : '1px solid #fde68a',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {trackingData.paymentStatus === 'PAID' ? 'PAID PREPAID' : 'TO-PAY (COLLECT)'}
                  </span>
                  <strong style={{ fontSize: '0.9375rem', color: '#0f172a' }}>
                    ₹{trackingData.amount || 0}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* 3. BUS DISPATCH & TRANSIT VEHICLE INTEL CARD */}
          {trackingData.busDetails && trackingData.busDetails.busNumber ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #bfdbfe',
                borderRadius: '10px',
                padding: '1.5rem',
                boxShadow: '0 4px 10px -2px rgba(37, 99, 235, 0.08)',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bus size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                      Assigned Bus & Vehicle Dispatch Intel
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Luggage bay verified & loaded by terminal staff
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                  <span>IN-TRANSIT ON BUS</span>
                </div>
              </div>

              {/* Bus Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {/* Bus Number & Travels */}
                <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                    Bus Vehicle Registration
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em' }}>
                    {trackingData.busDetails.busNumber}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>
                    {trackingData.busDetails.busName || trackingData.busDetails.operator || 'Scheduled Passenger Express'}
                  </div>
                </div>

                {/* Departure Schedule */}
                <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                    Departure & Platform Schedule
                  </span>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                    {trackingData.busDetails.departureTime ? `⏰ ${trackingData.busDetails.departureTime}` : 'Evening Scheduled Departure'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {trackingData.busDetails.platformNumber ? `Bay / Platform: ${trackingData.busDetails.platformNumber}` : 'Main Terminal Bay'}
                  </div>
                </div>

                {/* Driver In-Charge & Direct Call */}
                <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                    Driver In-Charge Contact
                  </span>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                    {trackingData.busDetails.driverName || 'Transport Driver'}
                  </div>
                  {trackingData.busDetails.driverPhone ? (
                    <div style={{ marginTop: '4px' }}>
                      <a
                        href={`tel:${trackingData.busDetails.driverPhone}`}
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          color: '#2563eb',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Phone size={13} />
                        <span>{trackingData.busDetails.driverPhone} (Call Driver)</span>
                      </a>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned for duty</div>
                  )}
                </div>
              </div>

              {/* Delivery Stop / Counter Location */}
              {trackingData.busDetails.destinationAddress && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={17} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                      Destination Counter Pickup Address:
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#1e293b', marginTop: '1px' }}>
                      {trackingData.busDetails.destinationAddress}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#92400e', margin: '0 0 2px 0' }}>
                  Parcel Booked & Ready in Dispatch Bay
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#b45309', margin: 0, lineHeight: 1.4 }}>
                  Your consignment is tagged and securely stored at the counter dispatch bay. As soon as it is loaded onto today's scheduled evening bus, the bus number and driver details will update here and via WhatsApp.
                </p>
              </div>
            </div>
          )}

          {/* 4. CHRONOLOGICAL EVENT TIMELINE */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1.75rem',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
              Chronological Audit Log & Milestones
            </h3>

            {trackingData.timeline && trackingData.timeline.length > 0 ? (
              <div className="tracking-timeline">
                {trackingData.timeline.map((event, idx) => (
                  <div key={idx} className="timeline-step completed">
                    <div className="timeline-bullet" />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-status" style={{ fontWeight: 700, color: '#0f172a' }}>
                          {event.status?.replace(/_/g, ' ')}
                        </span>
                        <span className="timeline-time">
                          {new Date(event.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                      <div className="timeline-details" style={{ color: '#475569' }}>
                        {event.description}
                      </div>
                      {event.updatedBy && (
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '4px' }}>
                          Logged by: {event.updatedBy}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Initial booking registered on {new Date(trackingData.createdAt).toLocaleDateString('en-IN')}
              </div>
            )}
          </div>

          {/* 5. HELPLINE & COUNTER PICKUP SUPPORT BANNER */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                Need Assistance With This Consignment?
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                Contact our terminal dispatch desk or helpline during counter operating hours (06:00 AM – 10:30 PM).
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a
                href={`tel:${companyPhone}`}
                className="btn btn-primary btn-sm"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Phone size={13} />
                <span>Call Helpline ({companyPhone})</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 6. WHEN NO ORDER SEARCHED: NETWORK STATS & HOW TRACKING WORKS */}
      {!trackingData && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <ShieldCheck size={18} />
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
              Unique 6-Digit Order IDs
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Every booked parcel gets an automated 6-digit identification code printed on the physical bill and registered in the tracking system.
            </p>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <Bus size={18} />
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
              Live Bus Details & Driver Phone
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Once dispatched, track the exact bus registration number, scheduled departure time, driver name, and driver contact mobile.
            </p>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <MapPin size={18} />
            </div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
              Destination Counter Collection
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Receivers can show their 6-digit Order ID at the destination city terminal counter to collect packages immediately upon bus arrival.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
