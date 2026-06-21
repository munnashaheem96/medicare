import { useState, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Medicines from './pages/Medicines';
import Reports from './pages/Reports';
import Compliance from './pages/Compliance';
import Settings from './pages/Settings';
import NotificationModal from './components/NotificationModal';
import Profile from './pages/Profile';
import Login from './pages/Login';
import app from "./firebase";

function AppContent() {
  const { activeTab, user, toasts, removeToast } = useApp();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'patients': return <Patients />;
      case 'medicines': return <Medicines />;
      case 'reports': return <Reports />;
      case 'compliance': return <Compliance />;
      case 'profile': return <Profile />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  // If user is not logged in, show only Login page
  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar onOpenNotifications={() => setIsNotificationOpen(true)} />
        <main className="page-content">
          {renderPage()}
        </main>
      </div>
      <NotificationModal 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
