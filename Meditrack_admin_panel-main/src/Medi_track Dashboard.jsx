// src/App.jsx
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

function AppContent() {
    const { activeTab } = useApp();
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const renderPage = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'patients': return <Patients />;
            case 'medicines': return <Medicines />;
            case 'reports': return <Reports />;
            case 'compliance': return <Compliance />;
            case 'settings': return <Settings />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Topbar />
                <main className="page-content">
                    {renderPage()}
                </main>
            </div>
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
