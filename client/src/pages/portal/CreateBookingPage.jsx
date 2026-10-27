import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  Printer,
  Send,
  PlusCircle,
  CheckCircle2,
  User,
  MapPin,
  Package,
  Plus,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CitySearchInput } from '../../components/CitySearchInput';
import { CustomerSearchInput } from '../../components/CustomerSearchInput';

export const CreateBookingPage = ({
  onOpenReceipt,
  onOpenWhatsApp,
  onNavigateModule,
  cities: propCities = [],
  onRefreshCities,
  parcelTypes: propParcelTypes = [],
  onRefreshParcelTypes,
}) => {
  const { showToast } = useToast();

  const [citiesList, setCitiesList] = useState(propCities);
  const [showAddCityModal, setShowAddCityModal] = useState(false);

  // Quick Add City Modal State (Only City Name and Delivery Address)
  const [quickCity, setQuickCity] = useState({
    name: '',
    deliveryAddress: '',
  });
  const [quickCitySaving, setQuickCitySaving] = useState(false);

  // Parcel Types State (Loaded from MongoDB)
  const [parcelTypesList, setParcelTypesList] = useState(propParcelTypes);
  const [showAddParcelTypeModal, setShowAddParcelTypeModal] = useState(false);
  const [quickParcelType, setQuickParcelType] = useState({
    name: '',
    defaultCharge: '',
    defaultWeight: '',
    description: '',
  });
  const [quickParcelTypeSaving, setQuickParcelTypeSaving] = useState(false);

  const fetchCities = async () => {
    try {
      const res = await api.cities.list();
      if (res.success && res.data) {
        setCitiesList(res.data);
      }
    } catch (err) {
      console.error('Failed to load cities in CreateBookingPage:', err);
    }
  };

  const fetchParcelTypes = async () => {
    try {
      const res = await api.parcelTypes.list();
      if (res.success && res.data) {
        setParcelTypesList(res.data);
      }
    } catch (err) {
      console.error('Failed to load parcel types in CreateBookingPage:', err);
    }
  };

  useEffect(() => {
    if (propCities && propCities.length > 0) {
      setCitiesList(propCities);
    } else {
      fetchCities();
    }
  }, [propCities]);

  useEffect(() => {
    if (propParcelTypes && propParcelTypes.length > 0) {
      setParcelTypesList(propParcelTypes);
    } else {
      fetchParcelTypes();
    }
  }, [propParcelTypes]);

  // Clean empty initial form data (no prefilled unwanted values)
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerWhatsapp: '',
    fromCity: '',
    toCity: '',
    receiverName: '',
    receiverPhone: '',
    deliveryAddress: '',
    parcelType: propParcelTypes.length > 0 ? propParcelTypes[0].name : '',
    quantity: 1,
    weight: '',
    notes: '',
    amount: '',
    paymentStatus: 'PAID',
  });

  // Keep default parcelType synced if parcelTypesList loads
  useEffect(() => {
    if (parcelTypesList.length > 0 && !formData.parcelType) {
      setFormData((prev) => ({
        ...prev,
        parcelType: parcelTypesList[0].name,
        amount: parcelTypesList[0].defaultCharge ? String(parcelTypesList[0].defaultCharge) : prev.amount,
        weight: parcelTypesList[0].defaultWeight ? String(parcelTypesList[0].defaultWeight) : prev.weight,
      }));
    }
  }, [parcelTypesList]);

  const [loading, setLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  const selectedToCityObj = citiesList.find(
    (c) => (c.name || '').trim().toLowerCase() === (formData.toCity || '').trim().toLowerCase()
  );

  const availableLocations = Array.from(
    new Set(
      [
        ...(Array.isArray(selectedToCityObj?.locations) ? selectedToCityObj.locations : []),
        selectedToCityObj?.deliveryAddress,
        selectedToCityObj?.counterAddress,
      ]
        .map((l) => (l || '').trim())
        .filter(Boolean)
    )
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto copy phone to WhatsApp if WhatsApp is empty or was matching
      if (field === 'customerPhone' && (!prev.customerWhatsapp || prev.customerWhatsapp === prev.customerPhone)) {
        updated.customerWhatsapp = value;
      }

      // If user changes 'toCity', auto-fill its default delivery address
      if (field === 'toCity') {
        if (!value) {
          updated.deliveryAddress = '';
        } else {
          const matched = citiesList.find((c) => (c.name || '').trim().toLowerCase() === value.trim().toLowerCase());
          if (matched) {
            const locs = Array.isArray(matched.locations) && matched.locations.length > 0
              ? matched.locations
              : (matched.deliveryAddress ? [matched.deliveryAddress] : []);
            if (locs.length > 0 && !prev.deliveryAddress) {
              updated.deliveryAddress = locs[0];
            }
          }
        }
      }

      // If user changes parcelType, optionally prefill default charge
      if (field === 'parcelType') {
        const ptObj = parcelTypesList.find((p) => p.name === value);
        if (ptObj) {
          if (ptObj.defaultCharge && (!prev.amount || prev.amount === '0')) {
            updated.amount = String(ptObj.defaultCharge);
          }
          if (ptObj.defaultWeight && !prev.weight) {
            updated.weight = String(ptObj.defaultWeight);
          }
        }
      }

      return updated;
    });
  };

  const handleSelectCustomer = (customer) => {
    if (!customer) return;
    setFormData((prev) => ({
      ...prev,
      customerName: customer.name || prev.customerName,
      customerPhone: customer.phone || prev.customerPhone,
      customerWhatsapp: customer.whatsapp || customer.phone || prev.customerWhatsapp,
    }));
    showToast(`Customer details loaded: ${customer.name}`, 'info');
    setTimeout(() => {
      document.getElementById('cb_sender_phone')?.focus();
    }, 50);
  };

  const handleCustomerPhoneChange = async (val) => {
    handleInputChange('customerPhone', val);
    const cleaned = (val || '').trim();
    if (cleaned.length === 10 && !formData.customerName) {
      try {
        const res = await api.customers.list({ search: cleaned, limit: 1 });
        if (res.success && res.data && res.data.length > 0) {
          const matched = res.data.find((c) => c.phone === cleaned) || res.data[0];
          if (matched && matched.phone === cleaned) {
            setFormData((prev) => ({
              ...prev,
              customerName: prev.customerName || matched.name,
              customerWhatsapp: prev.customerWhatsapp || matched.whatsapp || matched.phone,
            }));
          }
        }
      } catch (err) {
        // silent fail
      }
    }
  };

  // Quick Add Parcel Type Modal Handler (Saves directly to MongoDB database)
  const handleQuickAddParcelType = async (e) => {
    e.preventDefault();
    if (!quickParcelType.name.trim()) {
      showToast('Parcel type name is required', 'error');
      return;
    }

    try {
      setQuickParcelTypeSaving(true);
      const payload = {
        name: quickParcelType.name.trim(),
        defaultCharge: quickParcelType.defaultCharge ? Number(quickParcelType.defaultCharge) : 0,
        defaultWeight: quickParcelType.defaultWeight ? Number(quickParcelType.defaultWeight) : 0,
        description: quickParcelType.description.trim(),
      };

      const res = await api.parcelTypes.create(payload);
      if (res.success && res.data) {
        showToast(`Parcel Type '${payload.name}' added successfully!`, 'success');
        const newPt = res.data;

        setParcelTypesList((prev) => [newPt, ...prev.filter((p) => p.name !== newPt.name)]);
        setFormData((prev) => ({
          ...prev,
          parcelType: newPt.name,
          amount: newPt.defaultCharge ? String(newPt.defaultCharge) : prev.amount,
          weight: newPt.defaultWeight ? String(newPt.defaultWeight) : prev.weight,
        }));

        setShowAddParcelTypeModal(false);
        setQuickParcelType({
          name: '',
          defaultCharge: '',
          defaultWeight: '',
          description: '',
        });

        if (onRefreshParcelTypes) {
          onRefreshParcelTypes();
        }
      }
    } catch (error) {
      showToast(error.message || 'Failed to add parcel type', 'error');
    } finally {
      setQuickParcelTypeSaving(false);
    }
  };

  // Quick Add City Modal Handler
  const handleQuickAddCity = async (e) => {
    e.preventDefault();
    if (!quickCity.name.trim()) {
      showToast('City name is required', 'error');
      return;
    }
    if (!quickCity.deliveryAddress.trim()) {
      showToast('Delivery address is required', 'error');
      return;
    }

    try {
      setQuickCitySaving(true);
      const payload = {
        name: quickCity.name.trim(),
        deliveryAddress: quickCity.deliveryAddress.trim(),
      };

      const res = await api.cities.create(payload);
      if (res.success && res.data) {
        showToast(`City '${payload.name}' added successfully!`, 'success');
        const newCity = res.data;

        setCitiesList((prev) => [newCity, ...prev.filter((c) => c.name !== newCity.name)]);
        setFormData((prev) => ({
          ...prev,
          toCity: newCity.name,
          deliveryAddress: newCity.deliveryAddress || newCity.counterAddress || '',
        }));

        setShowAddCityModal(false);
        setQuickCity({
          name: '',
          deliveryAddress: '',
        });

        if (onRefreshCities) {
          onRefreshCities();
        }
      }
    } catch (error) {
      showToast(error.message || 'Failed to add city', 'error');
    } finally {
      setQuickCitySaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName.trim()) {
      showToast('Customer name is required', 'error');
      return;
    }
    if (!formData.customerPhone.trim() || formData.customerPhone.trim().length < 10) {
      showToast('Valid 10-digit customer mobile number is required', 'error');
      return;
    }

    const finalFrom = (formData.fromCity || '').trim();
    const finalTo = (formData.toCity || '').trim();

    if (!finalFrom) {
      showToast('From city / origin address is required', 'error');
      return;
    }
    if (!finalTo) {
      showToast('To city / destination address is required', 'error');
      return;
    }
    if (!formData.deliveryAddress.trim()) {
      showToast('Delivery address / collection counter is required', 'error');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      showToast('Please enter a valid delivery charge amount', 'error');
      return;
    }

    const computedDestination = `${finalFrom} → ${finalTo}`;

    try {
      setLoading(true);
      const res = await api.bookings.create({
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerWhatsapp: formData.customerWhatsapp.trim(),
        receiverName: formData.receiverName.trim(),
        receiverPhone: formData.receiverPhone.trim(),
        fromCity: finalFrom,
        toCity: finalTo,
        destination: computedDestination,
        deliveryAddress: formData.deliveryAddress.trim(),
        parcelType: formData.parcelType,
        quantity: Number(formData.quantity) || 1,
        weight: Number(formData.weight) || 0,
        notes: formData.notes ? formData.notes.trim() : '',
        amount: Number(formData.amount),
        paymentStatus: formData.paymentStatus,
      });

      if (res.success && res.data) {
        showToast(`Booking Created Successfully! Order ID: #${res.data.orderId}`, 'success');
        setCreatedBooking(res.data);
        await fetchCities();
        if (onRefreshCities) onRefreshCities();
      }
    } catch (error) {
      showToast(error.message || 'Failed to create booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerWhatsapp: '',
      fromCity: '',
      toCity: '',
      receiverName: '',
      receiverPhone: '',
      deliveryAddress: '',
      parcelType: parcelTypesList.length > 0 ? parcelTypesList[0].name : '',
      quantity: 1,
      weight: parcelTypesList.length > 0 && parcelTypesList[0].defaultWeight ? String(parcelTypesList[0].defaultWeight) : '',
      notes: '',
      amount: parcelTypesList.length > 0 && parcelTypesList[0].defaultCharge ? String(parcelTypesList[0].defaultCharge) : '',
      paymentStatus: 'PAID',
    });
    setCreatedBooking(null);
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', paddingBottom: '1rem' }}>
      {/* Compact Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0d2137', margin: 0 }}>
            Create Counter Booking
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
            Quick parcel entry, From/To location search & instant 6-digit Order ID dispatch
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowAddCityModal(true)}
            title="Add a new city / destination hub"
          >
            <MapPin size={14} />
            + Add City / Stop
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowAddParcelTypeModal(true)}
            title="Add a new parcel type"
          >
            <Package size={14} />
            + Add Parcel Type
          </button>
          {!createdBooking && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleReset}
              disabled={loading}
              title="Clear all fields"
            >
              <RotateCcw size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {createdBooking ? (
        /* Booking Confirmation Card */
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
            textAlign: 'center',
          }}
        >
          <CheckCircle2 size={40} color="#0f172a" style={{ margin: '0 auto 0.75rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.25rem' }}>
            Booking Created Successfully
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>
            Consignment is recorded and queued for evening bus assignment.
          </p>

          <div
            style={{
              margin: '1.25rem auto',
              padding: '1rem 1.25rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              maxWidth: '560px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>SYSTEM GENERATED ORDER ID</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0d2137', fontFamily: 'monospace' }}>
                  #{createdBooking.orderId}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="status-badge status-waiting_for_bus">
                  WAITING FOR BUS
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Amount: <strong>₹{createdBooking.amount}</strong> ({createdBooking.paymentStatus || 'PAID'})
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Sender:</span>
                <div><strong>{createdBooking.customerName}</strong> ({createdBooking.customerPhone})</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>From → To:</span>
                <div>
                  <strong>{createdBooking.fromCity}</strong> → <strong>{createdBooking.toCity}</strong>
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Parcel:</span>
                <div>{createdBooking.parcelType} ({createdBooking.quantity} pcs {createdBooking.weight ? `, ${createdBooking.weight}kg` : ''})</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Delivery Address:</span>
                <div>{createdBooking.deliveryAddress}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.65rem', marginTop: '1.25rem' }}>
            <button className="btn btn-primary" onClick={() => onOpenReceipt(createdBooking)}>
              <Printer size={16} />
              Print Receipt
            </button>
            <button className="btn btn-secondary" onClick={() => onOpenWhatsApp(createdBooking)}>
              <Send size={16} />
              Send WhatsApp Alert
            </button>
            <button className="btn btn-outline" onClick={handleReset}>
              <PlusCircle size={16} />
              Create Another Booking
            </button>
          </div>
        </div>
      ) : (
        /* Streamlined Booking Input Form (Fits 1 screen without scrolling) */
        <form onSubmit={handleSubmit} autoComplete="off" data-lpignore="true" data-form-type="other">
          {/* Top 2-Column Side-by-Side Grid */}
          <div className="booking-cards-grid">
            {/* Card 1: Sender & Receiver Details with Clear Visual Differentiation */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem 0.85rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              {/* Block 1: SENDER DETAILS (FROM) */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderLeft: '3px solid #334155',
                  borderRadius: '6px',
                  padding: '0.6rem 0.75rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.45rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        color: '#1e293b',
                        backgroundColor: '#e2e8f0',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      SENDER (FROM)
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Customer Information</span>
                  </div>
                </div>

                <div className="sender-inputs-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.2rem', color: '#334155' }}>
                      Sender Name <span className="required">*</span>
                    </label>
                    <CustomerSearchInput
                      id="cb_sender_name"
                      name="cb_sender_name"
                      placeholder="e.g. Ramesh"
                      value={formData.customerName}
                      onChange={(val) => handleInputChange('customerName', val)}
                      onSelectCustomer={handleSelectCustomer}
                      onSelectNext={() => document.getElementById('cb_sender_phone')?.focus()}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.2rem', color: '#334155' }}>
                      Sender Mobile <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      id="cb_sender_phone"
                      name="cb_sender_phone"
                      className="form-control"
                      placeholder="10-digit mobile"
                      value={formData.customerPhone}
                      onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('cb_sender_wa')?.focus();
                        }
                      }}
                      maxLength={10}
                      required
                      autoComplete="new-password"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      style={{ padding: '0.4rem 0.55rem', fontSize: '0.8125rem', backgroundColor: '#ffffff' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.2rem', color: '#334155' }}>
                      WhatsApp No.
                    </label>
                    <input
                      type="tel"
                      id="cb_sender_wa"
                      name="cb_sender_wa"
                      className="form-control"
                      placeholder="WhatsApp No."
                      value={formData.customerWhatsapp}
                      onChange={(e) => handleInputChange('customerWhatsapp', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('cb_receiver_name')?.focus();
                        }
                      }}
                      maxLength={10}
                      autoComplete="new-password"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      style={{ padding: '0.4rem 0.55rem', fontSize: '0.8125rem', backgroundColor: '#ffffff' }}
                    />
                  </div>
                </div>
              </div>

              {/* Block 2: RECEIVER DETAILS (TO) */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderLeft: '3px solid #64748b',
                  borderRadius: '6px',
                  padding: '0.6rem 0.75rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.45rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        color: '#1e293b',
                        backgroundColor: '#e2e8f0',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      RECEIVER (TO)
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Consignee Contact (Optional)</span>
                  </div>
                </div>

                <div className="receiver-inputs-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.2rem', color: '#334155' }}>
                      Receiver Contact Name
                    </label>
                    <input
                      type="text"
                      id="cb_receiver_name"
                      name="cb_receiver_name"
                      className="form-control"
                      placeholder="e.g. Annapurna Rice Depot"
                      value={formData.receiverName}
                      onChange={(e) => handleInputChange('receiverName', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('cb_receiver_phone')?.focus();
                        }
                      }}
                      autoComplete="new-password"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      style={{ padding: '0.4rem 0.55rem', fontSize: '0.8125rem', backgroundColor: '#ffffff' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.2rem', color: '#334155' }}>
                      Receiver Contact Phone
                    </label>
                    <input
                      type="tel"
                      id="cb_receiver_phone"
                      name="cb_receiver_phone"
                      className="form-control"
                      placeholder="e.g. 9848099887"
                      value={formData.receiverPhone}
                      onChange={(e) => handleInputChange('receiverPhone', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('cb_from_city')?.focus();
                        }
                      }}
                      maxLength={10}
                      autoComplete="new-password"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-form-type="other"
                      style={{ padding: '0.4rem 0.55rem', fontSize: '0.8125rem', backgroundColor: '#ffffff' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Route & Delivery Location Details */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.65rem',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0d2137' }}>
                  <MapPin size={15} color="#1b3d63" />
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>2. Route & Delivery Stop</h3>
                </div>
              </div>

              {/* From & To Cities Row */}
              <div className="route-cities-grid">
                <CitySearchInput
                  id="cb_from_city"
                  name="cb_from_city"
                  label="From City *"
                  placeholder="Search From city..."
                  value={formData.fromCity}
                  onChange={(cityName) => {
                    setFormData((prev) => ({
                      ...prev,
                      fromCity: cityName,
                    }));
                  }}
                  onSelectNext={() => {
                    document.getElementById('cb_to_city')?.focus();
                  }}
                  cities={citiesList}
                  required
                />

                <CitySearchInput
                  id="cb_to_city"
                  name="cb_to_city"
                  label="To Destination City *"
                  placeholder="Search To city..."
                  value={formData.toCity}
                  onChange={(cityName, cityObj) => {
                    setFormData((prev) => {
                      const updated = { ...prev, toCity: cityName };
                      if (!cityName) {
                        updated.deliveryAddress = '';
                      } else if (cityObj) {
                        const locs = Array.isArray(cityObj.locations) && cityObj.locations.length > 0
                          ? cityObj.locations
                          : (cityObj.deliveryAddress ? [cityObj.deliveryAddress] : []);
                        if (locs.length > 0) {
                          updated.deliveryAddress = locs[0];
                        }
                      }
                      return updated;
                    });
                  }}
                  onSelectNext={() => {
                    document.getElementById('cb_delivery_addr')?.focus();
                  }}
                  cities={citiesList}
                  required
                />
              </div>

              {/* Multiple Configured Stops Chips in Destination City */}
              {availableLocations.length > 1 && (
                <div
                  style={{
                    marginBottom: '0.5rem',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <MapPin size={11} color="#64748b" />
                    <span>Configured Stops in {formData.toCity}:</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {availableLocations.map((loc, idx) => {
                      const isSelected =
                        (formData.deliveryAddress || '').trim().toLowerCase() === loc.trim().toLowerCase();
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, deliveryAddress: loc }))}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            border: isSelected ? '1px solid #0f172a' : '1px solid #cbd5e1',
                            backgroundColor: isSelected ? '#0f172a' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#334155',
                            fontWeight: isSelected ? 600 : 500,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            transition: 'all 0.1s ease',
                          }}
                        >
                          {isSelected && <CheckCircle2 size={11} color="#ffffff" />}
                          <span>{loc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Address Field */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Delivery Address / Collection Stop in {formData.toCity || 'Destination'} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="cb_delivery_addr"
                  name="cb_dest_stop_addr"
                  className="form-control"
                  placeholder={
                    availableLocations.length > 0
                      ? 'Select a stop above or type specific branch/counter...'
                      : 'e.g. Bus Stand Counter #4, Benz Circle / Near Railway Station'
                  }
                  value={formData.deliveryAddress}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('cb_parcel_type')?.focus();
                    }
                  }}
                  required
                  autoComplete="new-password"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  data-autocomplete="off"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Card: Parcel Specifications, Delivery Charges & Action Bar */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.65rem',
                color: '#0d2137',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '0.4rem',
              }}
            >
              <Package size={15} color="#1b3d63" />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>
                3. Parcel Specifications & Delivery Charge
              </h3>
            </div>

            {/* Horizontal Specifications Grid */}
            <div className="booking-specs-grid">
              {/* Parcel Type */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>
                    Parcel Type <span className="required">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddParcelTypeModal(true)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#2563eb',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                    title="Add new parcel type"
                  >
                    <Plus size={10} /> Add Type
                  </button>
                </div>
                <select
                  id="cb_parcel_type"
                  className="form-control"
                  value={formData.parcelType}
                  onChange={(e) => handleInputChange('parcelType', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('cb_quantity')?.focus();
                    }
                  }}
                  required
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}
                >
                  {parcelTypesList.length === 0 ? (
                    <option value="">No parcel types in DB (+ Add Parcel Type)</option>
                  ) : (
                    <>
                      {!formData.parcelType && <option value="">-- Select Parcel Type --</option>}
                      {parcelTypesList.map((pt) => (
                        <option key={pt._id || pt.name} value={pt.name}>
                          {pt.name} {pt.defaultCharge ? `(₹${pt.defaultCharge})` : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Quantity */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Qty <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="cb_quantity"
                  name="cb_parcel_quantity"
                  min="1"
                  max="999"
                  className="form-control"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('cb_weight')?.focus();
                    }
                  }}
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem', textAlign: 'center' }}
                />
              </div>

              {/* Approx Weight */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  id="cb_weight"
                  name="cb_parcel_weight"
                  step="0.1"
                  min="0"
                  className="form-control"
                  placeholder="e.g. 25"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('cb_amount')?.focus();
                    }
                  }}
                  autoComplete="off"
                  data-lpignore="true"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                />
              </div>

              {/* Delivery Charge */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem', color: '#0d2137', fontWeight: 700 }}>
                  Delivery Charge (₹) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="cb_amount"
                  name="cb_delivery_amount"
                  min="1"
                  className="form-control"
                  placeholder="e.g. 250"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('cb_notes')?.focus();
                    }
                  }}
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  style={{
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#0d2137',
                    backgroundColor: '#f8fafc',
                    borderColor: '#94a3b8',
                  }}
                />
              </div>

              {/* Notes */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Parcel Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  id="cb_notes"
                  name="cb_parcel_notes"
                  className="form-control"
                  placeholder="e.g. Fragile / Keep upright"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('cb_submit_btn')?.focus();
                    }
                  }}
                  autoComplete="off"
                  data-lpignore="true"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                />
              </div>

              {/* Payment Status */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Payment Status
                </label>
                <select
                  id="cb_payment_status"
                  className="form-control"
                  value={formData.paymentStatus}
                  onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                  style={{
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: formData.paymentStatus === 'PAID' ? '#0f172a' : '#92400e',
                    backgroundColor: formData.paymentStatus === 'PAID' ? '#f1f5f9' : '#fffbeb',
                  }}
                >
                  <option value="PAID">PAID</option>
                  <option value="TO_PAY">TO PAY</option>
                </select>
              </div>
            </div>

            {/* Bottom Action Submit Button Row */}
            <div className="booking-action-bar">
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {formData.fromCity && formData.toCity ? (
                  <span>
                    Route: <strong>{formData.fromCity}</strong> <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>{formData.toCity}</strong>
                  </span>
                ) : (
                  <span>Ready to confirm & book consignment</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleReset} disabled={loading}>
                  Clear Form
                </button>
                <button
                  id="cb_submit_btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ padding: '0.5rem 1.35rem', fontWeight: 700 }}
                >
                  <PackagePlus size={16} />
                  {loading ? 'Processing Booking...' : 'Confirm Booking & Issue Receipt'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Quick Add City / Location Modal */}
      {showAddCityModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="#1b3d63" />
                <h3>Add City or Destination Hub</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddCityModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickAddCity} autoComplete="off" data-lpignore="true">
              <div className="modal-body">
                <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>
                  Search an existing city to add a new stop/location, or enter a new city name.
                </p>

                <CitySearchInput
                  id="quick_city_name"
                  name="quick_city_name"
                  label="City / Destination Name *"
                  placeholder="Search existing city or type new city..."
                  value={quickCity.name}
                  onChange={(name) => setQuickCity((prev) => ({ ...prev, name }))}
                  onSelectNext={() => {
                    document.getElementById('quick_city_address')?.focus();
                  }}
                  cities={citiesList}
                  required
                  autoFocus
                  helperText="Search existing city to add another location/stop, or create new city"
                />

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Delivery Address / Office Location in this City <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="quick_city_address"
                    name="quick_city_address"
                    className="form-control"
                    placeholder="e.g. Main Bus Stand Counter #4, Benz Circle / Fire Station Road"
                    value={quickCity.deliveryAddress}
                    onChange={(e) => setQuickCity((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
                    required
                    autoComplete="new-password"
                    data-lpignore="true"
                  />
                  <div className="form-hint">Saved under this city and immediately selectable in Counter Booking</div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddCityModal(false)}
                  disabled={quickCitySaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={quickCitySaving}>
                  <Plus size={16} />
                  {quickCitySaving ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Parcel Type Modal */}
      {showAddParcelTypeModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} color="#1b3d63" />
                <h3>Add New Parcel Type</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddParcelTypeModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickAddParcelType} autoComplete="off" data-lpignore="true">
              <div className="modal-body">
                <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>
                  Create a new parcel type. It will instantly be available in the counter booking parcel type dropdown.
                </p>

                <div className="form-group">
                  <label className="form-label">
                    Parcel Type Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="quick_pt_name"
                    name="quick_pt_name"
                    className="form-control"
                    placeholder="e.g. Rice Bag (25kg/50kg), Electronics Box, Fruits Carton"
                    value={quickParcelType.name}
                    onChange={(e) => setQuickParcelType((prev) => ({ ...prev, name: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('quick_pt_charge')?.focus();
                      }
                    }}
                    required
                    autoFocus
                    autoComplete="new-password"
                    data-lpignore="true"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Default Delivery Charge (₹)</label>
                    <input
                      type="number"
                      id="quick_pt_charge"
                      name="quick_pt_charge"
                      min="0"
                      className="form-control"
                      placeholder="e.g. 250 (Optional)"
                      value={quickParcelType.defaultCharge}
                      onChange={(e) => setQuickParcelType((prev) => ({ ...prev, defaultCharge: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('quick_pt_weight')?.focus();
                        }
                      }}
                      autoComplete="off"
                      data-lpignore="true"
                    />
                    <div className="form-hint">Auto-fills price when chosen</div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Default Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      id="quick_pt_weight"
                      name="quick_pt_weight"
                      className="form-control"
                      placeholder="e.g. 25 (Optional)"
                      value={quickParcelType.defaultWeight}
                      onChange={(e) => setQuickParcelType((prev) => ({ ...prev, defaultWeight: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('quick_pt_desc')?.focus();
                        }
                      }}
                      autoComplete="off"
                      data-lpignore="true"
                    />
                    <div className="form-hint">Approximate weight</div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description / Category Notes</label>
                  <input
                    type="text"
                    id="quick_pt_desc"
                    name="quick_pt_desc"
                    className="form-control"
                    placeholder="e.g. Grain bags, Commercial cartons, Fragile items"
                    value={quickParcelType.description}
                    onChange={(e) => setQuickParcelType((prev) => ({ ...prev, description: e.target.value }))}
                    autoComplete="off"
                    data-lpignore="true"
                  />
                  <div className="form-hint">Brief handling notes for counter booking</div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddParcelTypeModal(false)}
                  disabled={quickParcelTypeSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={quickParcelTypeSaving}>
                  <Plus size={16} />
                  {quickParcelTypeSaving ? 'Saving...' : 'Save Parcel Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
