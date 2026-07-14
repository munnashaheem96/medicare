// src/pages/Login.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, Eye, EyeOff, Loader, UserPlus, LogIn, ShieldCheck } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function Login() {
  const { login } = useApp();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !password) { setError('Please enter email and password'); return; }
    setLoading(true);
    try {
      const result = await login({ email, password });
      if (!result.success) setError(result.error || 'Invalid credentials');
    } catch (err) {
      setError(err.message || 'Could not connect.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!email) { setError('Please enter an email'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Save admin profile in Firestore
      await setDoc(doc(db, 'admins', cred.user.uid), {
        uid: cred.user.uid,
        email,
        name,
        role: 'admin',
        createdAt: serverTimestamp(),
      });
      setSuccess('✅ Admin account created! Logging you in…');
      // Auto sign-in via context (auth state observer will fire automatically)
    } catch (err) {
      // Map Firebase error codes to friendly messages
      const code = err.code || '';
      if (code === 'auth/email-already-in-use') setError('This email is already registered. Please sign in.');
      else if (code === 'auth/invalid-email') setError('Invalid email address.');
      else if (code === 'auth/weak-password') setError('Password is too weak (min 6 characters).');
      else setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@meditrack.com');
    setPassword('abc123456');
    setName('MediTrack Admin');
    setError(''); setSuccess('');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-main)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
        borderRadius: 20, padding: '48px 40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 28,
          }}>💊</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>MediTrack</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {mode === 'login' ? 'Admin Panel · Sign in to continue' : 'Create your admin account'}
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{
          display: 'flex', background: 'var(--bg-surface)',
          borderRadius: 10, padding: 4, marginBottom: 28, gap: 4,
        }}>
          {[
            { id: 'login', label: 'Sign In', Icon: LogIn },
            { id: 'register', label: 'Create Account', Icon: UserPlus },
          ].map(({ id, label, Icon }) => (
            <button key={id} type="button"
              onClick={() => { setMode(id); setError(''); setSuccess(''); }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                background: mode === id ? 'var(--accent-primary)' : 'transparent',
                color: mode === id ? '#fff' : 'var(--text-muted)',
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          {/* Name (register only) */}
          {mode === 'register' && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={16} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                }} />
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ paddingLeft: 42 }}
                  id="register-name"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
              }} />
              <input
                className="form-control"
                type="email"
                placeholder="admin@meditrack.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: 42 }}
                id="login-email"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Password {mode === 'register' && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(min 6 characters)</span>}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
              }} />
              <input
                className="form-control"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Choose a password (min 6 chars)' : 'Enter password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: 42, paddingRight: 42 }}
                id="login-password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: 13,
              marginBottom: 16, lineHeight: 1.5,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              color: '#34d399', borderRadius: 8, padding: '10px 14px', fontSize: 13,
              marginBottom: 16, lineHeight: 1.5,
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}
            id="login-btn"
          >
            {loading ? (
              <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Admin Account'
            )}
          </button>
        </form>

        {/* Quick-fill */}
        <div style={{
          marginTop: 20, padding: '12px 16px',
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 10, textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            {mode === 'login' ? 'Default credentials' : 'Quick-fill suggested credentials'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
            admin@meditrack.com · abc123456
          </div>
          <button
            type="button"
            onClick={fillDemo}
            style={{
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
              color: 'var(--accent-primary)', borderRadius: 8, padding: '6px 16px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Fill credentials
          </button>
        </div>

        {/* First-time hint */}
        {mode === 'login' && (
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            First time?{' '}
            <button type="button" onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: 0 }}>
              Create your admin account →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
