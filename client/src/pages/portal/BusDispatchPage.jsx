import React, { useState, useEffect } from 'react';
import {
  Bus,
  Clock,
  CheckCircle2,
  Send,
  Search,
  Filter,
  ArrowRight,
  Printer,
  FileText,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const BusDispatchPage = ({
  onOpenAssignBus,
  onOpenReceipt,
  onOpenWhatsApp,
  standardRoutes = [],
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'

  // Pending queue state
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [destinationFilter, setDestinationFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchPending = async () => {
    try {
      setLoadingPending(true);
      const params = {};
      if (destinationFilter !== 'ALL') params.destination = destinationFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.dispatch.getPending(params);
      if (res.success) {
        setPendingBookings(res.data || []);
      }
    } catch (error) {
      showToast(error.message || 'Failed to fetch pending dispatches', 'error');
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.dispatch.getHistory();
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (error) {
      showToast(error.message || 'Failed to fetch dispatch history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPending();
    } else {
      fetchHistory();
    }
  }, [activeTab, destinationFilter]);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === pendingBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingBookings.map((b) => b._id));
    }
  };

  const handleBatchAssign = () => {
    const selectedBookings = pendingBookings.filter((b) => selectedIds.includes(b._id));
    if (selectedBookings.length === 0) {
      showToast('Please select at least one parcel to assign', 'error');
      return;
    }
    onOpenAssignBus(selectedBookings, () => {
      setSelectedIds([]);
      fetchPending();
    });
  };

  const defaultRouteList =
    standardRoutes.length > 0
      ? standardRoutes
      : [
          'Hyderabad → Vijayawada',
          'Hyderabad → Guntur',
          'Hyderabad → Warangal',
          'Hyderabad → Visakhapatnam',
          'Hyderabad → Rajahmundry',
          'Hyderabad → Tirupati',
          'Hyderabad → Kurnool',
          'Hyderabad → Nellore',
        ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bus Dispatch & Manifest Operations</h1>
          <p className="page-subtitle">
            Assign waiting consignments to evening departure buses and trigger customer WhatsApp alerts
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '6px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('pending')}
            style={activeTab !== 'pending' ? { background: 'none', border: 'none', color: '#475569' } : {}}
          >
            <Clock size={14} />
            <span>Pending Dispatch ({pendingBookings.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('history')}
            style={activeTab !== 'history' ? { background: 'none', border: 'none', color: '#475569' } : {}}
          >
            <FileText size={14} />
            <span>Dispatch Manifests History</span>
          </button>
        </div>
      </div>

      {activeTab === 'pending' ? (
        <div>
          {/* Pending Dispatch Controls */}
          <div className="filter-bar">
            <div className="filter-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search Pending Order / Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPending()}
                style={{ width: '250px' }}
              />
              <button className="btn btn-secondary btn-sm" onClick={fetchPending}>
                <Search size={14} />
                Search
              </button>

              <select
                className="form-control"
                style={{ width: '200px' }}
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
              >
                <option value="ALL">All Destination Routes</option>
                {defaultRouteList.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Action */}
            <div className="filter-group">
              {selectedIds.length > 0 && (
                <button className="btn btn-primary btn-sm" onClick={handleBatchAssign}>
                  <Bus size={14} />
                  <span>Assign Selected ({selectedIds.length}) to Bus</span>
                </button>
              )}
            </div>
          </div>

          {/* Pending Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '38px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={pendingBookings.length > 0 && selectedIds.length === pendingBookings.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Order ID</th>
                  <th>Customer / Sender</th>
                  <th>Destination Route</th>
                  <th>Parcel Type</th>
                  <th>Quantity</th>
                  <th>Booking Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingPending ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      Loading pending dispatch parcels...
                    </td>
                  </tr>
                ) : pendingBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      <CheckCircle2 size={36} color="#0f172a" style={{ margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontWeight: 600, color: '#0d2137' }}>All Parcels Dispatched!</div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        No pending parcels waiting for bus assignment right now.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pendingBookings.map((booking) => {
                    const isSelected = selectedIds.includes(booking._id);
                    return (
                      <tr key={booking._id} style={isSelected ? { backgroundColor: '#f1f5f9' } : {}}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(booking._id)}
                          />
                        </td>
                        <td>
                          <span className="order-id-badge">#{booking.orderId}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{booking.customerName}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{booking.customerPhone}</div>
                        </td>
                        <td style={{ fontWeight: 500 }}>{booking.destination}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '0.15rem 0.35rem', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                            {booking.parcelType}
                          </span>
                        </td>
                        <td>
                          {booking.quantity} pcs {booking.weight ? `(${booking.weight}kg)` : ''}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <span className="status-badge status-waiting_for_bus">
                            WAITING FOR BUS
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onOpenAssignBus([booking], fetchPending)}
                          >
                            <Bus size={13} />
                            <span>Assign Bus</span>
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
      ) : (
        /* History Tab */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Manifest ID</th>
                <th>Bus & Travels Agency</th>
                <th>Route & Destination Stop</th>
                <th>Driver / Crew Contact</th>
                <th>Departure Schedule</th>
                <th>Assigned Orders</th>
                <th>Total Luggage</th>
                <th>Dispatched At</th>
                <th>Dispatched By</th>
              </tr>
            </thead>
            <tbody>
              {loadingHistory ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading dispatch manifest logs...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No bus dispatch manifests recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1b3d63', fontSize: '0.75rem' }}>
                        {item.dispatchManifestNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0d2137', fontSize: '0.875rem' }}>
                        {item.busNumber}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        {item.busName || item.operator || 'Express Lines'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.route}</div>
                      {item.destinationAddress && (
                        <div style={{ fontSize: '0.6875rem', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.destinationAddress}>
                          📍 {item.destinationAddress}
                        </div>
                      )}
                    </td>
                    <td>
                      {item.driverName || item.driverPhone ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{item.driverName || 'Driver'}</div>
                          <div style={{ fontSize: '0.6875rem', color: '#0f172a', fontWeight: 600 }}>📞 {item.driverPhone || '—'}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{item.departureTime}</div>
                      {item.platformNumber && (
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{item.platformNumber}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '200px' }}>
                        {(item.orderIds || []).map((oid, idx) => (
                          <span key={idx} className="order-id-badge" style={{ fontSize: '0.6875rem' }}>
                            #{oid}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.totalParcels} pcs</td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(item.dispatchedAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>{item.dispatchedBy?.name || 'Staff'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
