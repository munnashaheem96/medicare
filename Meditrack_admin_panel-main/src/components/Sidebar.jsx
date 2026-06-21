// src/components/Sidebar.jsx
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Users, Pill, FileBarChart2,
  Activity, Settings, LogOut, Stethoscope
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'MAIN' },
  { id: 'patients', icon: Users, label: 'Patients', section: 'MANAGEMENT' },
  { id: 'medicines', icon: Pill, label: 'Medicine Schedules', section: 'MANAGEMENT' },
  { id: 'reports', icon: FileBarChart2, label: 'Reports', section: 'ANALYTICS' },
  { id: 'compliance', icon: Activity, label: 'Compliance Monitor', section: 'ANALYTICS' },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, patients, logout } = useApp();

  const sections = [...new Set(navItems.map(n => n.section))];

  return (
    <aside className="sidebar">
      <div 
        className="sidebar-logo" 
        onClick={() => setActiveTab('dashboard')} 
        style={{ cursor: 'pointer' }}
      >
        <div className="logo-icon">
          <Stethoscope size={22} color="white" />
        </div>
        <div className="logo-text">
          <h1>MediTrack</h1>
          <p>Admin Dashboard</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {navItems.filter(n => n.section === section).map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  id={`nav-${item.id}`}
                >
                  <Icon size={18} />
                  {item.label}
                  {item.id === 'patients' && (
                    <span className="badge">{patients.filter(p => p.status === 'Active').length}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
          id="nav-settings"
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          Settings
        </div>
        <div 
          className="nav-item" 
          id="nav-logout" 
          style={{ color: 'var(--accent-danger)' }}
          onClick={() => {
            if (window.confirm('Are you sure you want to logout?')) {
              logout();
            }
          }}
        >
          <LogOut size={18} />
          Logout
        </div>
      </div>
    </aside>
  );
}
