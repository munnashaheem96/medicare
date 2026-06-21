// src/pages/Settings.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import * as authApi from '../api/auth';
import {
  User, Bell, Moon, Sun, Globe, Shield, Database, BarChart3, Info, Lock,
  Save, Eye, EyeOff, Download, Trash2, LogOut, RefreshCw, CheckCircle2,
  ChevronRight
} from 'lucide-react';

// ── Reusable sub-components ──────────────────────────────────────────────────
const TOGGLE = ({ label, desc, checked, onChange, id }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
    <div>
      <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{label}</div>
      {desc && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{desc}</div>}
    </div>
    <label style={{ position:'relative', display:'inline-block', width:44, height:24, cursor:'pointer', flexShrink:0 }}>
      <input id={id} type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{ opacity:0, width:0, height:0, position:'absolute' }} />
      <span style={{ position:'absolute', inset:0, borderRadius:24, background: checked?'var(--accent-primary)':'var(--border-light)', transition:'background 0.2s' }} />
      <span style={{ position:'absolute', top:3, left:checked?23:3, width:18, height:18, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
    </label>
  </div>
);

const ROW = ({ label, children }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border)', gap:16 }}>
    <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', flexShrink:0 }}>{label}</div>
    {children}
  </div>
);

// ── Section content panels ───────────────────────────────────────────────────
function AccountPanel({ user, updateProfile, addToast }) {
  const [name, setName] = useState(user?.name || '');
  const [hospital, setHospital] = useState(user?.hospital || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await updateProfile({ name, hospital, phone });
    setSaving(false);
    if (!res.success) addToast(res.error || 'Failed to save', 'error');
  };

  return (
    <div>
      <div className="form-row" style={{ marginBottom:16 }}>
        <div className="form-group">
          <label className="form-label">Admin Name</label>
          <input id="s-name" className="form-control" value={name} onChange={e=>setName(e.target.value)} placeholder="Dr. Admin" />
        </div>
        <div className="form-group">
          <label className="form-label">Hospital Name</label>
          <input id="s-hospital" className="form-control" value={hospital} onChange={e=>setHospital(e.target.value)} placeholder="General Hospital" />
        </div>
      </div>
      <div className="form-row" style={{ marginBottom:24 }}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-control" value={user?.email||''} disabled style={{ opacity:0.6 }} />
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input id="s-phone" className="form-control" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 99999 99999" />
        </div>
      </div>
      <button id="s-save-profile" className="btn btn-primary" onClick={save} disabled={saving}>
        {saving ? <><RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }} /> Saving...</> : <><Save size={14} /> Save Profile</>}
      </button>
    </div>
  );
}

function PasswordPanel({ addToast }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const change = async () => {
    if (!cur||!next||!conf) return addToast('Fill all fields', 'error');
    if (next !== conf) return addToast('Passwords do not match', 'error');
    if (next.length < 6) return addToast('Min 6 characters', 'error');
    setSaving(true);
    try {
      await authApi.changePassword(cur, next);
      addToast('Password changed ✓', 'success');
      setCur(''); setNext(''); setConf('');
    } catch(err) {
      addToast(err.response?.data?.error || 'Failed', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="form-row" style={{ marginBottom:16 }}>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <div style={{ position:'relative' }}>
            <input id="s-cur-pwd" className="form-control" type={show?'text':'password'} value={cur} onChange={e=>setCur(e.target.value)} placeholder="Current password" style={{ paddingRight:40 }} />
            <button type="button" onClick={()=>setShow(!show)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
              {show?<EyeOff size={15}/>:<Eye size={15}/>}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input id="s-new-pwd" className="form-control" type={show?'text':'password'} value={next} onChange={e=>setNext(e.target.value)} placeholder="Min 6 characters" />
        </div>
      </div>
      <div className="form-group" style={{ marginBottom:24, maxWidth:340 }}>
        <label className="form-label">Confirm New Password</label>
        <input id="s-conf-pwd" className="form-control" type={show?'text':'password'} value={conf} onChange={e=>setConf(e.target.value)} placeholder="Repeat new password" />
      </div>
      <button id="s-change-pwd" className="btn btn-primary" onClick={change} disabled={saving}>
        {saving?<><RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }}/> Changing...</>:<><Lock size={14}/> Change Password</>}
      </button>
    </div>
  );
}

function NotifPanel({ addToast }) {
  const [notif, setNotif] = useState(()=>JSON.parse(localStorage.getItem('mt_notif')?? 'true'));
  const [sound, setSound] = useState(()=>JSON.parse(localStorage.getItem('mt_sound')?? 'true'));
  const [missed, setMissed] = useState(()=>JSON.parse(localStorage.getItem('mt_missed')?? 'true'));
  const [snooze, setSnooze] = useState(()=>localStorage.getItem('mt_snooze')||'5');

  const save = () => {
    localStorage.setItem('mt_notif', JSON.stringify(notif));
    localStorage.setItem('mt_sound', JSON.stringify(sound));
    localStorage.setItem('mt_missed', JSON.stringify(missed));
    localStorage.setItem('mt_snooze', snooze);
    addToast('Notification settings saved', 'success');
  };

  return (
    <div>
      <TOGGLE id="t-notif" label="Enable Notifications" desc="Show alerts for patient events" checked={notif} onChange={setNotif} />
      <TOGGLE id="t-sound" label="Reminder Sound ON/OFF" desc="Play sound for medicine reminders" checked={sound} onChange={setSound} />
      <TOGGLE id="t-missed" label="Missed Medicine Alert" desc="Alert when a patient misses a dose" checked={missed} onChange={setMissed} />
      <ROW label="Reminder Snooze Time">
        <select id="s-snooze" className="form-control" style={{ width:160 }} value={snooze} onChange={e=>setSnooze(e.target.value)}>
          {['5','10','15','30'].map(v=><option key={v} value={v}>{v} minutes</option>)}
        </select>
      </ROW>
      <div style={{ paddingTop:20 }}>
        <button id="s-save-notif" className="btn btn-primary" onClick={save}><Save size={14}/> Save Settings</button>
      </div>
    </div>
  );
}

function AppearancePanel({ addToast }) {
  const [dark, setDark] = useState(()=>JSON.parse(localStorage.getItem('mt_dark')?? 'false'));
  const [fontSize, setFontSize] = useState(()=>localStorage.getItem('mt_fontsize')||'medium');
  const [color, setColor] = useState(()=>localStorage.getItem('mt_theme')||'#2563eb');
  const COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#db2777'];

  const applyDark = (val) => {
    setDark(val);
    if (val) {
      document.documentElement.style.setProperty('--bg-base','#0f172a');
      document.documentElement.style.setProperty('--bg-surface','#1e293b');
      document.documentElement.style.setProperty('--bg-card','#1e293b');
      document.documentElement.style.setProperty('--bg-hover','#334155');
      document.documentElement.style.setProperty('--border','#334155');
      document.documentElement.style.setProperty('--border-light','#475569');
      document.documentElement.style.setProperty('--text-primary','#f1f5f9');
      document.documentElement.style.setProperty('--text-secondary','#94a3b8');
      document.documentElement.style.setProperty('--text-muted','#64748b');
    } else {
      document.documentElement.style.setProperty('--bg-base','#f4f6f9');
      document.documentElement.style.setProperty('--bg-surface','#ffffff');
      document.documentElement.style.setProperty('--bg-card','#ffffff');
      document.documentElement.style.setProperty('--bg-hover','#f0f4ff');
      document.documentElement.style.setProperty('--border','#e5e9f0');
      document.documentElement.style.setProperty('--border-light','#d0d8e8');
      document.documentElement.style.setProperty('--text-primary','#0f172a');
      document.documentElement.style.setProperty('--text-secondary','#475569');
      document.documentElement.style.setProperty('--text-muted','#94a3b8');
    }
  };

  const applyColor = (c) => {
    setColor(c);
    document.documentElement.style.setProperty('--accent-primary', c);
  };

  const save = () => {
    localStorage.setItem('mt_dark', JSON.stringify(dark));
    localStorage.setItem('mt_fontsize', fontSize);
    localStorage.setItem('mt_theme', color);
    const sizes = { small:'13px', medium:'14px', large:'16px' };
    document.body.style.fontSize = sizes[fontSize];
    addToast('Appearance saved', 'success');
  };

  return (
    <div>
      <TOGGLE id="t-dark" label="Dark Mode" desc="Switch between light and dark theme" checked={dark} onChange={applyDark} />
      <ROW label="Font Size">
        <div style={{ display:'flex', gap:8 }}>
          {['small','medium','large'].map(s=>(
            <button key={s} id={`s-font-${s}`} onClick={()=>setFontSize(s)} style={{ padding:'6px 16px', borderRadius:8, border:`1px solid ${fontSize===s?'var(--accent-primary)':'var(--border-light)'}`, background:fontSize===s?'rgba(37,99,235,0.1)':'transparent', color:fontSize===s?'var(--accent-primary)':'var(--text-secondary)', cursor:'pointer', fontWeight:600, fontSize:13 }}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      </ROW>
      <ROW label="Theme Color">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>applyColor(c)} style={{ width:30, height:30, borderRadius:'50%', background:c, border:`3px solid ${color===c?'#0f172a':'transparent'}`, cursor:'pointer', transition:'transform 0.15s', transform:color===c?'scale(1.2)':'scale(1)' }} title={c} />
          ))}
        </div>
      </ROW>
      <div style={{ paddingTop:20 }}>
        <button id="s-save-appearance" className="btn btn-primary" onClick={save}><Save size={14}/> Save Appearance</button>
      </div>
    </div>
  );
}

function LanguagePanel({ addToast }) {
  const [lang, setLang] = useState(()=>localStorage.getItem('mt_lang')||'en');
  const langs = [{ code:'en', label:'🇬🇧 English' },{ code:'ta', label:'🇮🇳 Tamil' },{ code:'hi', label:'🇮🇳 Hindi' }];
  const save = () => { localStorage.setItem('mt_lang', lang); addToast('Language saved', 'success'); };

  return (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
        {langs.map(l=>(
          <button key={l.code} id={`s-lang-${l.code}`} onClick={()=>setLang(l.code)} style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', borderRadius:12, border:`2px solid ${lang===l.code?'var(--accent-primary)':'var(--border-light)'}`, background:lang===l.code?'rgba(37,99,235,0.07)':'transparent', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
            <div style={{ fontSize:24 }}>{l.label.split(' ')[0]}</div>
            <div style={{ fontSize:15, fontWeight:600, color:lang===l.code?'var(--accent-primary)':'var(--text-primary)' }}>{l.label.split(' ').slice(1).join(' ')}</div>
            {lang===l.code && <CheckCircle2 size={18} color="var(--accent-primary)" style={{ marginLeft:'auto' }} />}
          </button>
        ))}
      </div>
      <button id="s-save-lang" className="btn btn-primary" onClick={save}><Save size={14}/> Save Language</button>
    </div>
  );
}

function SecurityPanel({ addToast, logout }) {
  const [timeout, setTimeout_] = useState(()=>localStorage.getItem('mt_session')||'60');
  const save = () => { localStorage.setItem('mt_session', timeout); addToast('Security settings saved', 'success'); };
  const logoutAll = () => {
    if (window.confirm('Logout from all devices?')) { addToast('Logged out from all devices', 'info'); setTimeout(()=>logout(), 1000); }
  };

  return (
    <div>
      <ROW label="Session Timeout">
        <select id="s-session" className="form-control" style={{ width:200 }} value={timeout} onChange={e=>setTimeout_(e.target.value)}>
          {[['15','15 minutes'],['30','30 minutes'],['60','1 hour'],['120','2 hours'],['0','Never']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </ROW>
      <div style={{ display:'flex', gap:12, paddingTop:20, flexWrap:'wrap' }}>
        <button id="s-save-sec" className="btn btn-primary" onClick={save}><Save size={14}/> Save Security</button>
        <button id="s-logout-all" className="btn btn-danger" onClick={logoutAll}><LogOut size={14}/> Logout from All Devices</button>
      </div>
    </div>
  );
}

function BackupPanel({ addToast }) {
  const exp = (type) => addToast(`${type} export started`, 'info');
  const clear = () => { if (window.confirm('Clear old logs?')) addToast('Old logs cleared', 'success'); };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {[
        { id:'s-exp-pdf', label:'Export PDF Report', icon:<Download size={16}/>, action:()=>exp('PDF Report'), cls:'btn-secondary' },
        { id:'s-exp-excel', label:'Export Excel Report', icon:<Download size={16}/>, action:()=>exp('Excel Report'), cls:'btn-secondary' },
        { id:'s-backup', label:'Backup Patient Data', icon:<Database size={16}/>, action:()=>exp('Patient Backup'), cls:'btn-secondary' },
        { id:'s-clear', label:'Clear Old Logs', icon:<Trash2 size={16}/>, action:clear, cls:'btn-danger' },
      ].map(b=>(
        <button key={b.id} id={b.id} className={`btn ${b.cls}`} onClick={b.action} style={{ justifyContent:'flex-start', padding:'14px 20px', borderRadius:10 }}>
          {b.icon} {b.label}
        </button>
      ))}
    </div>
  );
}

function SystemPanel({ addToast }) {
  const [time, setTime] = useState(()=>localStorage.getItem('mt_remind')||'08:00');
  const [auto, setAuto] = useState(()=>JSON.parse(localStorage.getItem('mt_autorefresh')?? 'true'));
  const [daily, setDaily] = useState(()=>JSON.parse(localStorage.getItem('mt_dailyrep')?? 'false'));
  const save = () => {
    localStorage.setItem('mt_remind', time);
    localStorage.setItem('mt_autorefresh', JSON.stringify(auto));
    localStorage.setItem('mt_dailyrep', JSON.stringify(daily));
    addToast('System preferences saved', 'success');
  };
  return (
    <div>
      <ROW label="Default Reminder Time">
        <input id="s-remind" type="time" className="form-control" style={{ width:160 }} value={time} onChange={e=>setTime(e.target.value)} />
      </ROW>
      <TOGGLE id="t-auto" label="Auto Refresh Dashboard" desc="Refresh data every 30 seconds" checked={auto} onChange={setAuto} />
      <TOGGLE id="t-daily" label="Daily Report Generation" desc="Auto-generate compliance report every day" checked={daily} onChange={setDaily} />
      <div style={{ paddingTop:20 }}>
        <button id="s-save-sys" className="btn btn-primary" onClick={save}><Save size={14}/> Save Preferences</button>
      </div>
    </div>
  );
}

function AboutPanel() {
  const rows = [
    ['App Version','MediTrack Admin v1.0.0'],
    ['Build Date','May 2026'],
    ['Developer Team','MediTrack Engineering'],
    ['Backend','Node.js + Express + LowDB'],
    ['Contact Support','support@meditrack.com'],
  ];
  return (
    <div>
      {rows.map(([label, value])=>(
        <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:14, color:'var(--text-secondary)', fontWeight:500 }}>{label}</div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{value}</div>
        </div>
      ))}
      <div style={{ marginTop:20, padding:'14px 18px', background:'rgba(37,99,235,0.06)', borderRadius:10, border:'1px solid rgba(37,99,235,0.15)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.7 }}>
        💊 <strong>MediTrack</strong> — Medicine compliance monitoring system for healthcare administrators. Built to help patients stay on track with their medication schedules.
      </div>
    </div>
  );
}

// ── Main Settings component ──────────────────────────────────────────────────
const TABS = [
  { id:'account',    icon: User,      label:'Account Settings',    desc:'Profile & email' },
  { id:'password',   icon: Lock,      label:'Change Password',      desc:'Update credentials' },
  { id:'notif',      icon: Bell,      label:'Notification Settings',desc:'Alerts & reminders' },
  { id:'appearance', icon: Sun,       label:'Appearance',           desc:'Theme & display' },
  { id:'language',   icon: Globe,     label:'Language',             desc:'English / Tamil / Hindi' },
  { id:'security',   icon: Shield,    label:'Security',             desc:'Session & access' },
  { id:'backup',     icon: Database,  label:'Backup & Data',        desc:'Export & clear' },
  { id:'system',     icon: BarChart3, label:'System Preferences',   desc:'Defaults & auto-refresh' },
  { id:'about',      icon: Info,      label:'About',                desc:'Version & support' },
];

export default function Settings() {
  const { user, updateProfile, logout, addToast } = useApp();
  const [active, setActive] = useState(null);

  const PANELS = {
    account:    <AccountPanel user={user} updateProfile={updateProfile} addToast={addToast} />,
    password:   <PasswordPanel addToast={addToast} />,
    notif:      <NotifPanel addToast={addToast} />,
    appearance: <AppearancePanel addToast={addToast} />,
    language:   <LanguagePanel addToast={addToast} />,
    security:   <SecurityPanel addToast={addToast} logout={logout} />,
    backup:     <BackupPanel addToast={addToast} />,
    system:     <SystemPanel addToast={addToast} />,
    about:      <AboutPanel />,
  };

  const activeTab = TABS.find(t => t.id === active);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">⚙️ Settings</div>
          <div className="page-desc">Select a category to configure your preferences</div>
        </div>
        {active && (
          <button className="btn btn-secondary btn-sm" onClick={() => setActive(null)}>
            ← Back to Settings
          </button>
        )}
      </div>

      {/* ── Tab List view (no selection) ── */}
      {!active && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.id}
                id={`settings-tab-${tab.id}`}
                onClick={() => setActive(tab.id)}
                style={{
                  display:'flex', alignItems:'center', gap:16,
                  padding:'18px 24px',
                  background:'var(--bg-card)',
                  border:'1px solid var(--border)',
                  borderRadius:14,
                  cursor:'pointer',
                  transition:'all 0.18s',
                  boxShadow:'var(--shadow-card)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(37,99,235,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-primary)', flexShrink:0 }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{tab.label}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{tab.desc}</div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Active section content ── */}
      {active && activeTab && (
        <div className="card" style={{ padding:0 }}>
          {/* Section header */}
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:'24px 28px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'rgba(37,99,235,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-primary)', flexShrink:0 }}>
              {<activeTab.icon size={20} />}
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)' }}>{activeTab.label}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{activeTab.desc}</div>
            </div>
          </div>
          {/* Section body */}
          <div style={{ padding:'24px 28px' }}>
            {PANELS[active]}
          </div>
        </div>
      )}
    </div>
  );
}
