// src/pages/Medicines.jsx
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus, Search, Pencil, Trash2, X,
  Pill, Sun, Cloud, Sunset, Moon, Clock, Loader
} from 'lucide-react';

const TIMING_ICONS = { morning: Sun, afternoon: Cloud, evening: Sunset, night: Moon };
const TIMING_LABELS = {
  morning:   'Morning (5–10 AM)',
  afternoon: 'Afternoon (12–3 PM)',
  evening:   'Evening (4–7 PM)',
  night:     'Night (8–10 PM)',
};
const COMMON_MEDS = ['Metformin 500mg', 'Amlodipine 5mg', 'Atorvastatin 10mg', 'Levothyroxine 50mcg', 'Pantoprazole 40mg', 'Paracetamol 500mg', 'Losartan 50mg', 'Azithromycin 500mg'];

const emptyForm = {
  patientId: '',
  medicineName: '',
  timings: ['morning'],
  mealInstruction: 'after',
  startDate: '',
  endDate: '',
  notes: '',
};

export default function Medicines() {
  const { patients, medicines, addMedicine, updateMedicine, deleteMedicine, prefillPatientId, setPrefillPatientId, loading } = useApp();
  const [search, setSearch] = useState('');
  const [filterPatient, setFilterPatient] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [patSearch, setPatSearch] = useState('');
  const [showPatDropdown, setShowPatDropdown] = useState(false);
  const [showMedDropdown, setShowMedDropdown] = useState(false);

  const patDropdownRef = useRef(null);
  const medDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (patDropdownRef.current && !patDropdownRef.current.contains(event.target)) {
        setShowPatDropdown(false);
      }
      if (medDropdownRef.current && !medDropdownRef.current.contains(event.target)) {
        setShowMedDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (prefillPatientId) {
      const pat = patients.find(p => p.id === prefillPatientId);
      if (pat) {
        setForm({ ...emptyForm, patientId: pat.id });
        setPatSearch(`${pat.name} (${pat.id})`);
        setEditingId(null);
        setShowModal(true);
      }
      setPrefillPatientId(null);
    }
  }, [prefillPatientId, patients, setPrefillPatientId]);

  const filtered = medicines.filter(m => {
    const matchSearch = (m.medicineName || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.patientName || '').toLowerCase().includes(search.toLowerCase());
    const matchPat = filterPatient === 'All' || m.patientId === filterPatient;
    return matchSearch && matchPat;
  });

  const grouped = filtered.reduce((acc, m) => {
    if (!acc[m.patientId]) acc[m.patientId] = { name: m.patientName, meds: [] };
    acc[m.patientId].meds.push(m);
    return acc;
  }, {});

  const toggleTiming = (t) => {
    setForm(prev => ({
      ...prev,
      timings: prev.timings.includes(t)
        ? prev.timings.filter(x => x !== t)
        : [...prev.timings, t],
    }));
  };

  const openAdd = () => {
    setForm({ ...emptyForm, patientId: patients[0]?.id || '' });
    setPatSearch(patients[0] ? `${patients[0].name} (${patients[0].id})` : '');
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (med) => {
    setForm({ ...med });
    const pat = patients.find(p => p.id === med.patientId);
    setPatSearch(pat ? `${pat.name} (${pat.id})` : '');
    setEditingId(med.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.medicineName.trim() || !form.patientId || form.timings.length === 0) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateMedicine(editingId, form);
      } else {
        await addMedicine(form);
      }
      setShowModal(false);
    } catch (_) {} finally {
      setSaving(false);
    }
  };

  const avatarColor = (name) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
    return colors[(name || ' ').charCodeAt(0) % colors.length];
  };

  const isLoading = loading.medicines;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Medicine Schedules</div>
          <div className="page-desc">{medicines.length} schedules across {patients.length} patients</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="add-medicine-btn">
          <Plus size={16} /> Add Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ paddingTop: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 220 }}>
            <Search size={15} className="search-icon" />
            <input
              className="form-control"
              placeholder="Search medicine or patient..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="med-search"
            />
          </div>
          <select className="form-control" style={{ width: 'auto', minWidth: 180 }}
            value={filterPatient} onChange={e => setFilterPatient(e.target.value)} id="filter-patient">
            <option value="All">All Patients</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="card">
          <div className="empty-state">
            <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
            <div className="empty-title" style={{ marginTop: 12 }}>Loading schedules...</div>
          </div>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">💊</div>
            <div className="empty-title">No schedules found</div>
            <div className="empty-desc">Add a medicine schedule to get started.</div>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 8 }}>
              <Plus size={15} /> Add Schedule
            </button>
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([patId, group]) => {
          // Resolve display name — fall back to patients list if patientName wasn't stored
          const resolvedName = group.name
            || patients.find(p => p.id === patId)?.name
            || 'Unknown';
          const color = avatarColor(resolvedName);
          return (
            <div className="card" key={patId} style={{ marginBottom: 20 }}>
              <div className="card-header" style={{ paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="patient-avatar" style={{ width: 42, height: 42, fontSize: 16, background: `${color}20`, color }}>
                    {resolvedName.charAt(0)}
                  </div>
                  <div>
                    <div className="card-title">{resolvedName}</div>
                    <div className="card-subtitle">{group.meds.length} medicine{group.meds.length > 1 ? 's' : ''} scheduled</div>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  setForm({ ...emptyForm, patientId: patId });
                  const pat = patients.find(p => p.id === patId);
                  setPatSearch(pat ? `${pat.name} (${pat.id})` : '');
                  setEditingId(null);
                  setShowModal(true);
                }}>
                  <Plus size={14} /> Add Medicine
                </button>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {group.meds.map(med => (
                    <div key={med.id} style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 12,
                      padding: '16px',
                      transition: 'var(--transition)',
                      position: 'relative',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: 'rgba(59,130,246,0.12)', color: 'var(--accent-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Pill size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{med.medicineName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{med.id}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(med)} title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirmDelete(med)} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {['morning', 'afternoon', 'evening', 'night'].map(t => {
                          const Icon = TIMING_ICONS[t];
                          const active = med.timings.includes(t);
                          return (
                            <span key={t} className={`timing-chip timing-${t}`} style={{
                              opacity: active ? 1 : 0.3, filter: active ? 'none' : 'grayscale(1)'
                            }}>
                              <Icon size={11} /> {TIMING_LABELS[t]}
                            </span>
                          );
                        })}
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                        <Clock size={12} />
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{med.mealInstruction}</span> food
                      </div>

                      {med.startDate && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {med.startDate} → {med.endDate || 'Ongoing'}
                        </div>
                      )}

                      {med.notes && (
                        <div style={{
                          marginTop: 8, fontSize: 12, color: 'var(--text-secondary)',
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 6, padding: '6px 10px'
                        }}>
                          {med.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{editingId ? 'Edit Schedule' : 'New Medicine Schedule'}</div>
                <div className="modal-subtitle">Set medicine timing and instructions</div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <div className="form-group" style={{ position: 'relative' }} ref={patDropdownRef}>
                <label className="form-label">Patient *</label>
                <input
                  className="form-control"
                  placeholder="Type to search patient..."
                  value={patSearch}
                  onChange={e => {
                    setPatSearch(e.target.value);
                    setForm({ ...form, patientId: '' });
                    setShowPatDropdown(true);
                  }}
                  onFocus={() => setShowPatDropdown(true)}
                  id="med-patient-search"
                />
                {showPatDropdown && patSearch && (
                  <div className="autocomplete-dropdown">
                    {patients
                      .filter(p => p.name.toLowerCase().includes(patSearch.toLowerCase()) || p.id.toLowerCase().includes(patSearch.toLowerCase()))
                      .map(p => (
                        <div key={p.id} className="autocomplete-item" onClick={() => {
                          setPatSearch(`${p.name} (${p.id})`);
                          setForm({ ...form, patientId: p.id });
                          setShowPatDropdown(false);
                        }}>
                          {p.name} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({p.id})</span>
                        </div>
                      ))}
                    {patients.filter(p => p.name.toLowerCase().includes(patSearch.toLowerCase())).length === 0 && (
                      <div className="autocomplete-item" style={{ color: 'var(--text-muted)' }}>No patients found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ position: 'relative' }} ref={medDropdownRef}>
                <label className="form-label">Medicine Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Metformin 500mg"
                  value={form.medicineName}
                  onChange={e => {
                    setForm({ ...form, medicineName: e.target.value });
                    setShowMedDropdown(true);
                  }}
                  onFocus={() => setShowMedDropdown(true)}
                  id="med-name"
                />
                {showMedDropdown && form.medicineName && (
                  <div className="autocomplete-dropdown">
                    {Array.from(new Set([...COMMON_MEDS, ...medicines.map(m => m.medicineName)]))
                      .filter(m => m.toLowerCase().includes(form.medicineName.toLowerCase()) && m.toLowerCase() !== form.medicineName.toLowerCase())
                      .slice(0, 8)
                      .map((m, i) => (
                        <div key={i} className="autocomplete-item" onClick={() => {
                          setForm({ ...form, medicineName: m });
                          setShowMedDropdown(false);
                        }}>
                          {m}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Timing (select all that apply) *</label>
                <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['morning', 'afternoon', 'evening', 'night'].map(t => {
                    const Icon = TIMING_ICONS[t];
                    const checked = form.timings.includes(t);
                    return (
                      <label key={t} className={`checkbox-chip ${checked ? 'checked' : ''}`} onClick={() => toggleTiming(t)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px' }}>
                        <Icon size={14} />
                        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </span>
                          <span style={{ fontSize: 11, opacity: 0.75 }}>
                            {t === 'morning' ? '5–10 AM' : t === 'afternoon' ? '12–3 PM' : t === 'evening' ? '4–7 PM' : '8–10 PM'}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Meal Instruction *</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['before', 'after', 'with'].map(opt => (
                    <label key={opt} className={`checkbox-chip ${form.mealInstruction === opt ? 'checked' : ''}`}
                      onClick={() => setForm({ ...form, mealInstruction: opt })}
                      style={{ flex: 1, justifyContent: 'center' }}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)} food
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control"
                    value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} id="med-start" />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control"
                    value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} id="med-end" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-control" rows={2} placeholder="Any special instructions..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{ resize: 'vertical' }} id="med-notes" />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-med-btn">
                {saving ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : editingId ? 'Save Changes' : 'Add Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Remove Schedule</div>
                <div className="modal-subtitle">This will remove the medicine schedule</div>
              </div>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                Remove <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.medicineName}</strong> from{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.patientName}</strong>'s schedule?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleting} onClick={async () => {
                setDeleting(true);
                try { await deleteMedicine(confirmDelete.id); setConfirmDelete(null); }
                catch (_) {} finally { setDeleting(false); }
              }}>
                {deleting ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
