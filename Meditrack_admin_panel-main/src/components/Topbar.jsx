// src/components/Topbar.jsx
import { Bell, Search, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';

const tabTitles = {
  dashboard: { title: 'Dashboard', desc: 'Welcome back, Dr. Admin 👋' },
  patients: { title: 'Patient Management', desc: 'Add, view and manage your patients' },
  medicines: { title: 'Medicine Schedules', desc: 'Manage medication timing and instructions' },
  reports: { title: 'Reports', desc: 'View medication intake reports' },
  compliance: { title: 'Compliance Monitor', desc: 'Track daily, weekly & monthly adherence' },
};

export default function Topbar({ onOpenNotifications }) {
  const { activeTab, setActiveTab, unreadCount, addToast, user } = useApp();
  const info = tabTitles[activeTab] || { title: 'MediTrack', desc: '' };

  const toggleTheme = () => {
    addToast("The interface is optimized for high-compliance medical environments.", 'info');
  };

  const showProfile = () => {
    setActiveTab('profile');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2>{info.title}</h2>
        <p>{info.desc}</p>
      </div>

      <div className="topbar-right">
        <div className="topbar-btn" title="System Theme" onClick={toggleTheme}>
          <Sun size={17} />
        </div>
        <div 
          className="topbar-btn" 
          title="View Notifications" 
          onClick={onOpenNotifications}
          style={{ position: 'relative' }}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -4, right: -4,
              background: 'var(--accent-danger)',
              color: 'white',
              fontSize: 9, fontWeight: 800,
              width: 16, height: 16,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--bg-surface)'
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div 
          className="admin-avatar" 
          title="Admin Profile Settings" 
          onClick={showProfile}
          style={{ cursor: 'pointer', border: activeTab === 'profile' ? '2px solid var(--accent-primary)' : 'none' }}
        >
          {user?.name?.charAt(0) || 'A'}
        </div>
      </div>
    </header>
  );
}
