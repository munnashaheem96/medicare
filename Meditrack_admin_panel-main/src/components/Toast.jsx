// src/components/Toast.jsx
import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 3000);
    return () => clearTimeout(timer);
  }, []);

  const Icon = toast.type === 'success' ? CheckCircle2
    : toast.type === 'error' ? XCircle : Info;

  const color = toast.type === 'success' ? 'var(--accent-success)'
    : toast.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-primary)';

  return (
    <div className={`toast ${toast.type}`} onClick={onRemove} style={{ cursor: 'pointer' }}>
      <Icon size={20} color={color} />
      <span>{toast.message}</span>
    </div>
  );
}
