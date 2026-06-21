// src/components/NotificationModal.jsx
import { useApp } from '../context/AppContext';
import { X, Bell, CheckCircle2, AlertTriangle, Info, CheckCheck } from 'lucide-react';

const TYPE_ICON = {
  alert: <AlertTriangle size={16} color="#f87171" />,
  warning: <AlertTriangle size={16} color="#fbbf24" />,
  success: <CheckCircle2 size={16} color="#34d399" />,
  info: <Info size={16} color="#60a5fa" />,
};

const TYPE_COLOR = {
  alert: 'rgba(239,68,68,0.1)',
  warning: 'rgba(251,191,36,0.1)',
  success: 'rgba(52,211,153,0.1)',
  info: 'rgba(96,165,250,0.1)',
};

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationModal({ isOpen, onClose }) {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useApp();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          marginTop: 70, marginRight: 24,
          width: 380, maxHeight: '80vh',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.15s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
            {unreadCount > 0 && (
              <span style={{
                background: 'var(--accent-primary)', color: '#fff',
                fontSize: 11, fontWeight: 700,
                padding: '2px 7px', borderRadius: 20,
              }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                title="Mark all as read"
              >
                <CheckCheck size={13} /> All read
              </button>
            )}
            <button className="modal-close" onClick={onClose} style={{ position: 'static' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {notifications.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Bell size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 14 }}>No notifications yet</div>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => n.unread && markNotificationRead(n.id)}
                style={{
                  display: 'flex', gap: 12, padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: n.unread ? TYPE_COLOR[n.type] || 'rgba(59,130,246,0.05)' : 'transparent',
                  cursor: n.unread ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  {TYPE_ICON[n.type] || TYPE_ICON.info}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, color: 'var(--text-primary)',
                    fontWeight: n.unread ? 600 : 400,
                    lineHeight: 1.5,
                  }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {timeAgo(n.time)}
                  </div>
                </div>
                {n.unread && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent-primary)', flexShrink: 0, marginTop: 6,
                  }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
