import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Calendar, IndianRupee, Package, ArrowRight, X, Printer, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const CustomersPage = ({ onOpenReceipt, onNavigateModule }) => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Selected customer for history view
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.customers.list({ page, limit: 15, search: search.trim() });
      if (res.success) {
        setCustomers(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      showToast(error.message || 'Failed to fetch customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  const handleViewCustomer = async (customer) => {
    try {
      setLoadingDetails(true);
      const res = await api.customers.getById(customer._id);
      if (res.success) {
        setSelectedCustomerData(res.data);
      }
    } catch (error) {
      showToast(error.message || 'Failed to fetch customer history', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Directory & Consignment History</h1>
          <p className="page-subtitle">Frequent business senders, contact info, and lifetime freight statistics</p>
        </div>
        {onNavigateModule && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onNavigateModule('create-booking')}
          >
            <Plus size={15} />
            <span>New Booking</span>
          </button>
        )}
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="filter-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search Customer Name, Phone, Address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '280px' }}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={14} />
            Search
          </button>
        </form>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer / Business Name</th>
              <th>Mobile Number</th>
              <th>WhatsApp</th>
              <th>Delivery / Billing Address</th>
              <th>Total Bookings</th>
              <th>Total Freight Spent</th>
              <th>Last Booking Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Loading customer directory...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                  No customer records found.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c._id}>
                  <td>
                    <strong style={{ color: '#0d2137' }}>{c.name}</strong>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{c.phone}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>{c.whatsapp || c.phone}</span>
                  </td>
                  <td style={{ fontSize: '0.75rem', maxWidth: '200px' }}>
                    {c.address || '-'}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#1b3d63' }}>{c.totalBookings || 0} consignments</span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    ₹{c.totalSpent?.toLocaleString('en-IN') || 0}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {c.lastBookingDate
                      ? new Date(c.lastBookingDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleViewCustomer(c)}
                    >
                      <span>Booking History</span>
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Booking History Drawer / Modal */}
      {selectedCustomerData && (
        <div className="modal-overlay">
          <div className="modal-dialog modal-dialog-lg">
            <div className="modal-header">
              <div>
                <h3>{selectedCustomerData.customer.name}</h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Phone: {selectedCustomerData.customer.phone} | Total Bookings: {selectedCustomerData.customer.totalBookings} | Total Spent: ₹{selectedCustomerData.customer.totalSpent}
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedCustomerData(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: '#0d2137' }}>
                Complete Consignment History:
              </h4>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Destination Route</th>
                      <th>Parcel Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Bus Number</th>
                      <th style={{ textAlign: 'right' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedCustomerData.bookings || []).length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                          No past bookings found for this customer.
                        </td>
                      </tr>
                    ) : (
                      selectedCustomerData.bookings.map((b) => (
                        <tr key={b._id}>
                          <td><span className="order-id-badge">#{b.orderId}</span></td>
                          <td style={{ fontSize: '0.75rem' }}>{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                          <td style={{ fontWeight: 500 }}>{b.destination}</td>
                          <td>{b.parcelType} ({b.quantity}x)</td>
                          <td style={{ fontWeight: 600 }}>₹{b.amount}</td>
                          <td>
                            <span className={`status-badge status-${b.status.toLowerCase()}`}>
                              {b.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem' }}>{b.busDetails?.busNumber || '-'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onOpenReceipt(b)}
                              style={{ padding: '0.2rem 0.4rem' }}
                            >
                              <Printer size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCustomerData(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
