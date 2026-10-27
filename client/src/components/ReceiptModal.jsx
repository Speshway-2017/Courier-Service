import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { useCompanySettings } from '../context/CompanyContext';

export const ReceiptModal = ({ booking, onClose, companySettings: propCompanySettings }) => {
  if (!booking) return null;

  const { companySettings: contextCompanySettings } = useCompanySettings();
  const company = propCompanySettings || contextCompanySettings || {
    companyName: 'Parcel & Bus Dispatch Services',
    companyPhone: '',
    companyAddress: '',
    companyEmail: '',
    gstin: '',
    receiptFooterNote: 'Thank you for shipping with us. Present this receipt or 6-digit Order ID at destination counter.',
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(booking.createdAt || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-dialog-lg">
        <div className="modal-header no-print">
          <h3>Consignment Receipt / Bilty</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="printable-area">
            <div className="receipt-paper">
              {/* Header */}
              <div className="receipt-header">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                  <img
                    src={company.logoUrl || '/logo.png'}
                    alt="Logo"
                    style={{ height: '42px', maxWidth: '180px', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="receipt-company-title">{company.companyName || 'COURIER & BUS DISPATCH'}</div>
                {company.tagline && <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>{company.tagline}</div>}
                {company.companyAddress && <div className="receipt-company-info">{company.companyAddress}</div>}
                <div className="receipt-company-info">
                  {company.companyPhone && <span>Phone: {company.companyPhone}</span>}
                  {company.companyPhone && company.companyEmail && <span> • </span>}
                  {company.companyEmail && <span>Email: {company.companyEmail}</span>}
                </div>
                {company.gstin && (
                  <div className="receipt-company-info" style={{ fontWeight: 600, color: '#0f172a' }}>
                    GSTIN / Reg No: {company.gstin}
                  </div>
                )}
                <div className="receipt-title-badge">PARCEL CONSIGNMENT NOTE</div>
              </div>

              {/* Top Meta: Order ID & Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>ORDER ID / TRACKING NO.</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0d2137', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    #{booking.orderId}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>BOOKING DATE & TIME</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{formattedDate}</div>
                </div>
              </div>

              {/* Sender & Receiver Info */}
              <div className="receipt-grid">
                <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem', color: '#1b3d63' }}>SENDER / BOOKED BY:</div>
                  <div className="receipt-field">
                    <span className="receipt-field-val">{booking.customerName}</span>
                  </div>
                  <div className="receipt-field">
                    <span className="receipt-field-label">Mobile: </span>
                    <span className="receipt-field-val">{booking.customerPhone}</span>
                  </div>
                  {booking.customerWhatsapp && booking.customerWhatsapp !== booking.customerPhone && (
                    <div className="receipt-field">
                      <span className="receipt-field-label">WhatsApp: </span>
                      <span>{booking.customerWhatsapp}</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.25rem', color: '#1b3d63' }}>DELIVERY DESTINATION:</div>
                  <div className="receipt-field">
                    <span className="receipt-field-label">Route: </span>
                    <span className="receipt-field-val">{booking.destination}</span>
                  </div>
                  <div className="receipt-field">
                    <span className="receipt-field-label">Address: </span>
                    <span style={{ fontSize: '0.7rem' }}>{booking.deliveryAddress}</span>
                  </div>
                  {booking.receiverName && (
                    <div className="receipt-field">
                      <span className="receipt-field-label">Receiver: </span>
                      <span>{booking.receiverName} ({booking.receiverPhone || 'N/A'})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bus Assignment Info (if assigned) */}
              {booking.busDetails?.busNumber && (
                <div style={{ margin: '0.5rem 0', padding: '0.5rem 0.65rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>🚌 BUS DISPATCH & VEHICLE DETAILS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.35rem' }}>
                    <div><strong>Bus No:</strong> {booking.busDetails.busNumber}</div>
                    <div><strong>Travels:</strong> {booking.busDetails.busName || booking.busDetails.operator || 'Express Bus'}</div>
                    <div><strong>Departure:</strong> {booking.busDetails.departureTime || 'Evening'}{booking.busDetails.platformNumber ? ` (${booking.busDetails.platformNumber})` : ''}</div>
                    {booking.busDetails.driverPhone && (
                      <div><strong>Driver:</strong> {booking.busDetails.driverName ? `${booking.busDetails.driverName} ` : ''}({booking.busDetails.driverPhone})</div>
                    )}
                  </div>
                </div>
              )}

              {/* Parcel Table */}
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Parcel Type</th>
                    <th>Qty</th>
                    <th>Weight</th>
                    <th>Notes / Content</th>
                    <th style={{ textAlign: 'right' }}>Charge</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{booking.parcelType}</strong></td>
                    <td>{booking.quantity || 1}</td>
                    <td>{booking.weight ? `${booking.weight} kg` : '-'}</td>
                    <td>{booking.notes || 'Standard Goods'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{booking.amount}</td>
                  </tr>
                </tbody>
              </table>

              {/* Payment Summary */}
              <div className="receipt-total-row">
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>PAYMENT STATUS: </span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>PAID (CASH / COUNTER)</span>
                </div>
                <div style={{ fontSize: '1rem', color: '#0d2137' }}>
                  TOTAL: ₹{booking.amount}
                </div>
              </div>

              {/* Barcode line representation */}
              <div className="receipt-barcode" />
              <div style={{ textAlign: 'center', fontSize: '0.6875rem', fontFamily: 'monospace', letterSpacing: '2px', color: '#64748b' }}>
                * {booking.orderId} *
              </div>

              {/* Footer */}
              <div className="receipt-footer-text">
                {company.receiptFooterNote}
                <div style={{ marginTop: '0.25rem' }}>Track status anytime at our counter or online with Order ID: <strong>{booking.orderId}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
