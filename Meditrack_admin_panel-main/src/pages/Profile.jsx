// src/pages/Profile.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Mail, Building2, Phone, Shield, Lock, Loader } from 'lucide-react';
import * as authApi from '../api/auth';

export default function Profile() {
  const { user, updateProfile, addToast, logout } = useApp();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    hospital: user?.hospital || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdError, setPwdError] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    await updateProfile(form);
    setSavingProfile(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return setPwdError('New passwords do not match');
    }
    if (pwdForm.newPassword.length < 6) {
      return setPwdError('Password must be at least 6 characters');
    }
    setSavingPwd(true);
    try {
      await authApi.changePassword(pwdForm.currentPassword, pwdForm.newPassword);
      addToast('Password changed successfully', 'success');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <div className="page-title">Profile Settings</div>
          <div className="page-desc">Manage your admin account information</div>
        </div>
      </div>

      {/* Avatar area */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{user?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{user?.role} · {user?.hospital}</div>
            <div style={{ color: 'var(--accent-primary)', fontSize: 12, marginTop: 4 }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">Personal Information</div></div>
        <div className="card-body">
          <form onSubmit={handleProfileSave}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label"><User size={13} style={{ display: 'inline', marginRight: 4 }} />Full Name</label>
                <input className="form-control" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} id="profile-name" />
              </div>
              <div className="form-group">
                <label className="form-label"><Mail size={13} style={{ display: 'inline', marginRight: 4 }} />Email</label>
                <input className="form-control" type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} id="profile-email" disabled
                  style={{ opacity: 0.6 }} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label"><Building2 size={13} style={{ display: 'inline', marginRight: 4 }} />Hospital / Clinic</label>
                <input className="form-control" value={form.hospital}
                  onChange={e => setForm({ ...form, hospital: e.target.value })} id="profile-hospital" />
              </div>
              <div className="form-group">
                <label className="form-label"><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />Phone</label>
                <input className="form-control" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} id="profile-phone" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label"><Shield size={13} style={{ display: 'inline', marginRight: 4 }} />Specialization</label>
              <input className="form-control" value={form.specialization}
                onChange={e => setForm({ ...form, specialization: e.target.value })} id="profile-spec" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={savingProfile} id="save-profile-btn">
                {savingProfile ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Password Change */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">Change Password</div></div>
        <div className="card-body">
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label"><Lock size={13} style={{ display: 'inline', marginRight: 4 }} />Current Password</label>
              <input className="form-control" type="password"
                value={pwdForm.currentPassword}
                onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-control" type="password"
                  value={pwdForm.newPassword}
                  onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-control" type="password"
                  value={pwdForm.confirmPassword}
                  onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} />
              </div>
            </div>
            {pwdError && (
              <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 6 }}>
                ⚠️ {pwdError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={savingPwd}>
                {savingPwd ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Changing...</> : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="card-header"><div className="card-title" style={{ color: '#f87171' }}>Danger Zone</div></div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Sign Out</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sign out of the admin panel on this device</div>
            </div>
            <button className="btn btn-danger" onClick={logout} id="logout-btn">Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
