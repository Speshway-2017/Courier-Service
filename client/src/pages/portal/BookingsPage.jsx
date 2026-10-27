import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Printer,
  Send,
  Bus,
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const BookingsPage = ({
  onNavigateModule,
  onOpenReceipt,
  onOpenWhatsApp,
  onOpenAssignBus,
  standardRoutes = [],
  parcelTypes = [],
}) => {
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 12 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [destination, setDestination] = useState('ALL');
  const [parcelType, setParcelType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Booking for View/Edit modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editBooking, setEditBooking] = useState(null);

  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (status !== 'ALL') params.status = status;
      if (destination !== 'ALL') params.destination = destination;
      if (parcelType !== 'ALL') params.parcelType = parcelType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.bookings.list(params);
      if (res.success) {
        setBookings(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      showToast(error.message || 'Failed to fetch bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
  }, [status, destination, parcelType, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings(1);
  };

  const handleMarkDelivered = async (booking) => {
    if (!window.confirm(`Confirm parcel #${booking.orderId} delivery and collection at destination?`)) {
      return;
    }

    try {
      const res = await api.bookings.updateStatus(booking._id, {
        status: 'DELIVERED',
        deliveryNotes: 'Parcel collected by customer / consignee at destination terminal.',
      });
      if (res.success) {
        showToast(`Order #${booking.orderId} marked as DELIVERED!`, 'success');
        fetchBookings(pagination.page);
      }
    } catch (error) {
      showToast(error.message || 'Failed to update status', 'error');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editBooking) return;

    try {
      const res = await api.bookings.update(editBooking._id, editBooking);
      if (res.success) {
        showToast(`Booking #${editBooking.orderId} updated successfully`, 'success');
        setEditBooking(null);
        fetchBookings(pagination.page);
      }
    } catch (error) {
      showToast(error.message || 'Failed to update booking', 'error');
    }
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
          <h1 className="page-title">Consignment Bookings Registry</h1>
          <p className="page-subtitle">Track, filter, and manage all counter parcel shipments</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onNavigateModule('create-booking')}
        >
          <Plus size={15} />
          <span>New Booking</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="filter-group">
          <input
            type="text"
            className="form-control filter-input"
            placeholder="Search Order ID, Customer, Mobile, Bus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '240px' }}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={14} />
            Search
          </button>
        </form>

        <div className="filter-group">
          <select
            className="form-control"
            style={{ width: '150px' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="WAITING_FOR_BUS">Waiting For Bus</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className="form-control"
            style={{ width: '180px' }}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="ALL">All Destinations</option>
            {defaultRouteList.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: '140px' }}
            value={parcelType}
            onChange={(e) => setParcelType(e.target.value)}
          >
            <option value="ALL">All Types</option>
            {parcelTypes.map((pt) => (
              <option key={pt._id || pt.name} value={pt.name}>
                {pt.name}
              </option>
            ))}
          </select>

          {(search || status !== 'ALL' || destination !== 'ALL' || parcelType !== 'ALL') && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSearch('');
                setStatus('ALL');
                setDestination('ALL');
                setParcelType('ALL');
                setStartDate('');
                setEndDate('');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Mobile</th>
              <th>Destination</th>
              <th>Parcel Type</th>
              <th>Qty / Wt</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Bus Number</th>
              <th>Booking Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading bookings...
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No bookings found matching the selected criteria.
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const isWaiting = booking.status === 'BOOKED' || booking.status === 'WAITING_FOR_BUS';
                const isDispatched = booking.status === 'DISPATCHED';

                return (
                  <tr key={booking._id}>
                    <td>
                      <span className="order-id-badge">#{booking.orderId}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{booking.customerName}</div>
                      {booking.receiverName && (
                        <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                          To: {booking.receiverName}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {booking.customerPhone}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{booking.destination}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '0.15rem 0.35rem', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                        {booking.parcelType}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {booking.quantity} pcs {booking.weight ? `(${booking.weight}kg)` : ''}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>₹{booking.amount}</td>
                    <td>
                      <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                        {booking.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {booking.busDetails?.busNumber ? (
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.75rem' }}>
                          {booking.busDetails.busNumber}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        {isWaiting && (
                          <button
                            className="btn btn-primary btn-sm"
                            title="Assign Bus Dispatch"
                            onClick={() => onOpenAssignBus([booking])}
                            style={{ padding: '0.2rem 0.45rem' }}
                          >
                            <Bus size={12} />
                            <span>Assign</span>
                          </button>
                        )}
                        {isDispatched && (
                          <button
                            className="btn btn-primary btn-sm"
                            title="Mark as Delivered"
                            onClick={() => handleMarkDelivered(booking)}
                            style={{ padding: '0.2rem 0.45rem' }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Delivered</span>
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          title="View Details"
                          onClick={() => setSelectedBooking(booking)}
                          style={{ padding: '0.2rem 0.35rem' }}
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Print Receipt"
                          onClick={() => onOpenReceipt(booking)}
                          style={{ padding: '0.2rem 0.35rem' }}
                        >
                          <Printer size={12} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Send WhatsApp"
                          onClick={() => onOpenWhatsApp(booking)}
                          style={{ padding: '0.2rem 0.35rem' }}
                        >
                          <Send size={12} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Edit Booking"
                          onClick={() => setEditBooking(booking)}
                          style={{ padding: '0.2rem 0.35rem' }}
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1rem',
          fontSize: '0.8125rem',
          color: '#64748b',
        }}
      >
        <div>
          Showing {bookings.length} of {pagination.total} total bookings (Page {pagination.page} of{' '}
          {pagination.pages})
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchBookings(pagination.page - 1)}
          >
            <ChevronLeft size={14} />
            Previous
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => fetchBookings(pagination.page + 1)}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Booking View Modal */}
      {selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Consignment Details: #{selectedBooking.orderId}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedBooking(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8125rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Sender Name</span>
                  <div style={{ fontWeight: 600 }}>{selectedBooking.customerName}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Mobile / WhatsApp</span>
                  <div>{selectedBooking.customerPhone} / {selectedBooking.customerWhatsapp || '-'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Destination</span>
                  <div style={{ fontWeight: 600 }}>{selectedBooking.destination}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Status</span>
                  <div>
                    <span className={`status-badge status-${selectedBooking.status.toLowerCase()}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Parcel Type & Qty</span>
                  <div>{selectedBooking.parcelType} ({selectedBooking.quantity} pcs, {selectedBooking.weight || 0}kg)</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Delivery Charge</span>
                  <div style={{ fontWeight: 700, color: '#0d2137' }}>₹{selectedBooking.amount}</div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Delivery Address:</span>
                <div>{selectedBooking.deliveryAddress}</div>
                {selectedBooking.notes && (
                  <div style={{ marginTop: '0.5rem', color: '#475569' }}>
                    <strong>Notes:</strong> {selectedBooking.notes}
                  </div>
                )}
              </div>

              {selectedBooking.busDetails?.busNumber && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Assigned Bus Manifest:</div>
                  <div>Bus: <strong>{selectedBooking.busDetails.busNumber}</strong></div>
                  <div>Route: {selectedBooking.busDetails.route}</div>
                  <div>Departure: {selectedBooking.busDetails.departureTime}</div>
                  <div>Operator: {selectedBooking.busDetails.operator || 'N/A'}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const b = selectedBooking;
                  setSelectedBooking(null);
                  onOpenReceipt(b);
                }}
              >
                <Printer size={15} />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editBooking && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Edit Booking #{editBooking.orderId}</h3>
              <button className="modal-close-btn" onClick={() => setEditBooking(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editBooking.customerName || ''}
                    onChange={(e) => setEditBooking({ ...editBooking, customerName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Mobile</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editBooking.customerPhone || ''}
                      onChange={(e) => setEditBooking({ ...editBooking, customerPhone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editBooking.destination || ''}
                      onChange={(e) => setEditBooking({ ...editBooking, destination: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editBooking.deliveryAddress || ''}
                    onChange={(e) => setEditBooking({ ...editBooking, deliveryAddress: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editBooking.amount || ''}
                      onChange={(e) => setEditBooking({ ...editBooking, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editBooking.notes || ''}
                      onChange={(e) => setEditBooking({ ...editBooking, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditBooking(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
