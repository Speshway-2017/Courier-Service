import React, { useState } from 'react';
import { X, Send, MessageSquare, Copy, Check, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const WhatsAppModal = ({ booking, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  if (!booking) return null;

  const recipientPhone = booking.customerWhatsapp || booking.customerPhone;
  const busNo = booking.busDetails?.busNumber || 'Assigned Bus';
  const route = booking.busDetails?.route || booking.destination;
  const departure = booking.busDetails?.departureTime || 'Evening Dispatch';
  const operator = booking.busDetails?.operator ? `\nOperator: ${booking.busDetails.operator}` : '';

  const messageText = `Hello ${booking.customerName || 'Customer'},\n\nYour parcel with Order ID ${booking.orderId} has been dispatched.\n\nBus Number: ${busNo}\nRoute: ${route}${operator}\nDeparture: ${departure}\n\nPlease use Order ID ${booking.orderId} for tracking.\n\nThank you for choosing our Courier & Bus Dispatch Service.`;

  const cleanPhone = (recipientPhone || '').replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    showToast('WhatsApp message copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTriggerApi = async () => {
    try {
      setSending(true);
      const res = await api.notifications.resend(booking._id);
      if (res.success) {
        showToast(`WhatsApp notification sent to ${recipientPhone}!`, 'success');
        if (onSuccess) onSuccess();
      } else {
        showToast(res.message || 'Notification triggered', 'info');
      }
    } catch (error) {
      showToast(error.message || 'Failed to send notification', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={18} color="#0f172a" />
            <h3>Send WhatsApp Notification</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Customer: </span>
              <strong>{booking.customerName}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>WhatsApp: </span>
              <strong style={{ color: '#0d2137' }}>+{formattedPhone}</strong>
            </div>
          </div>

          <label className="form-label" style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Notification Message Preview:
          </label>
          <div className="whatsapp-preview-box">
            {messageText}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
              {copied ? <Check size={14} color="#0f172a" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Message'}</span>
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={14} />
              <span>Direct WhatsApp Web / App</span>
            </a>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
            Current Status:{' '}
            <strong style={{ color: booking.notificationStatus === 'SENT' ? '#0f172a' : '#b45309' }}>
              {booking.notificationStatus === 'SENT' ? 'SENT' : 'NOT SENT / PENDING'}
            </strong>
            {booking.notificationSentAt && (
              <span style={{ marginLeft: '0.5rem' }}>
                (Last sent: {new Date(booking.notificationSentAt).toLocaleTimeString()})
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handleTriggerApi} disabled={sending}>
            <Send size={15} />
            {sending ? 'Sending...' : 'Trigger Service Notification'}
          </button>
        </div>
      </div>
    </div>
  );
};
