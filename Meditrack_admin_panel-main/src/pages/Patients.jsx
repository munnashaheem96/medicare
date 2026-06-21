// src/pages/Patients.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus, Search, Pencil, Trash2, X, User,
  Phone, Droplets, HeartPulse, UserCheck, Pill, Loader
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Male', 'Female', 'Other'];
const CONDITIONS = ['Hypertension', 'Diabetes Type 2', 'Cardiac Care', 'Thyroid', 'Asthma', 'Arthritis', 'Other'];

const CONDITION_DOCTORS = {
  'Hypertension':     ['Dr. Mehta (Cardiologist)', 'Dr. Kapoor (Internal Medicine)', 'Dr. Rao (Nephrologist)'],
  'Diabetes Type 2':  ['Dr. Rao (Endocrinologist)', 'Dr. Sharma (Diabetologist)', 'Dr. Gupta (Internal Medicine)'],
  'Cardiac Care':     ['Dr. Mehta (Cardiologist)', 'Dr. Verma (Cardiac Surgeon)', 'Dr. Iyer (Interventional Cardiology)'],
  'Thyroid':          ['Dr. Singh (Endocrinologist)', 'Dr. Nair (Thyroidologist)', 'Dr. Joshi (General Medicine)'],
  'Asthma':           ['Dr. Khanna (Pulmonologist)', 'Dr. Bose (Allergist)', 'Dr. Pillai (Respiratory Medicine)'],
  'Arthritis':        ['Dr. Malhotra (Rheumatologist)', 'Dr. Desai (Orthopedic)', 'Dr. Patel (Physiotherapy)'],
  'Other':            ['Dr. Mehta', 'Dr. Rao', 'Dr. Singh', 'Dr. Sharma', 'Dr. Gupta', 'Dr. Khanna'],
};

const emptyForm = {
  name: '', mobile: '', age: '', gender: 'Male',
  bloodGroup: 'B+', condition: '', doctor: '', notes: '',
};

export default function Patients() {
  const { patients, addPatient, updatePatient, deletePatient, medicines, setActiveTab, setPrefillPatientId, loading } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mobile.includes(search) ||
      (p.condition || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (patient) => {
    setForm({ ...patient });
    setEditingId(patient.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.mobile.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updatePatient(editingId, form);
        setShowModal(false);
      } else {
        const result = await addPatient(form);
        if (result && result.defaultPassword) {
          setCreatedCredentials({
            name: result.name,
            email: result.email,
            password: result.defaultPassword,
          });
        }
        setShowModal(false);
      }
    } catch (_) {
      // error toast is shown by context
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deletePatient(id);
      setConfirmDelete(null);
    } catch (_) {} finally {
      setDeleting(false);
    }
  };

  const avatarColor = (name) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const isLoading = loading.patients;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Patients</div>
          <div className="page-desc">{patients.length} total · {patients.filter(p => p.status === 'Active').length} active</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd} id="add-patient-btn">
          <Plus size={16} /> Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ paddingTop: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
            <Search size={15} className="search-icon" />
            <input
              className="form-control"
              placeholder="Search by name, mobile, condition..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="patient-search"
            />
          </div>
          <div className="tab-group">
            {['All', 'Active', 'Inactive'].map(s => (
              <button
                key={s}
                className={`tab-btn ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div className="empty-state">
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
              <div className="empty-title" style={{ marginTop: 12 }}>Loading patients...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <div className="empty-title">No patients found</div>
              <div className="empty-desc">Try adjusting your search or add a new patient.</div>
              <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 8 }}>
                <Plus size={15} /> Add Patient
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Mobile</th>
                    <th>Age / Gender</th>
                    <th>Blood Group</th>
                    <th>Condition</th>
                    <th>Doctor</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const color = avatarColor(p.name);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="patient-avatar" style={{ background: `${color}20`, color }}>
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.mobile}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.age}y · {p.gender}</td>
                        <td>
                          <span style={{
                            background: 'rgba(239,68,68,0.12)', color: '#f87171',
                            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600
                          }}>{p.bloodGroup}</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.condition}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.doctor}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.joinDate}</td>
                        <td>
                          <span className={`badge-status ${p.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirmDelete(p)} title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{editingId ? 'Edit Patient' : 'Add New Patient'}</div>
                <div className="modal-subtitle">Fill in the patient's basic information</div>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><User size={13} style={{ display: 'inline', marginRight: 4 }} />Full Name *</label>
                  <input className="form-control" placeholder="e.g. Aarav Sharma"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} id="patient-name" />
                </div>
                <div className="form-group">
                  <label className="form-label"><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />Mobile Number *</label>
                  <input className="form-control" placeholder="10-digit number"
                    value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} id="patient-mobile" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-control" type="number" placeholder="e.g. 35"
                    value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} id="patient-age" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })} id="patient-gender">
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label"><Droplets size={13} style={{ display: 'inline', marginRight: 4 }} />Blood Group</label>
                  <select className="form-control" value={form.bloodGroup}
                    onChange={e => setForm({ ...form, bloodGroup: e.target.value })} id="patient-blood">
                    {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><HeartPulse size={13} style={{ display: 'inline', marginRight: 4 }} />Medical Condition</label>
                  <select className="form-control" value={form.condition}
                    onChange={e => setForm({ ...form, condition: e.target.value, doctor: '' })} id="patient-condition">
                    <option value="">Select condition</option>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label"><UserCheck size={13} style={{ display: 'inline', marginRight: 4 }} />Assigned Doctor</label>
                  <select
                    className="form-control"
                    value={form.doctor}
                    onChange={e => setForm({ ...form, doctor: e.target.value })}
                    id="patient-doctor"
                    disabled={!form.condition}
                    style={{ opacity: form.condition ? 1 : 0.5 }}
                  >
                    <option value="">{form.condition ? 'Select doctor' : 'Select a condition first'}</option>
                    {(CONDITION_DOCTORS[form.condition] || []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editingId && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })} id="patient-status">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-control" rows={2} placeholder="Any additional notes..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{ resize: 'vertical' }} id="patient-notes" />
              </div>

              {editingId && (
                <div className="form-group" style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Prescribed Medicines</label>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setShowModal(false);
                        setPrefillPatientId(editingId);
                        setActiveTab('medicines');
                      }}
                      style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center' }}
                    >
                      <Plus size={13} style={{ marginRight: 4 }} /> Add Medicine
                    </button>
                  </div>
                  {medicines.filter(m => m.patientId === editingId).length > 0 ? (
                    <div className="prescribed-meds-list">
                      {medicines.filter(m => m.patientId === editingId).map(m => (
                        <div key={m.id} className="prescribed-med-item">
                          <span style={{ color: 'var(--accent-primary)', display: 'flex' }}><Pill size={14} /></span>
                          <span style={{ fontWeight: 600 }}>{m.medicineName}</span>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto', fontSize: 12 }}>
                            {m.timings.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px', background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 6, textAlign: 'center' }}>
                      No medicines prescribed yet.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-patient-btn">
                {saving ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : editingId ? 'Save Changes' : 'Add Patient'}
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
                <div className="modal-title">Delete Patient</div>
                <div className="modal-subtitle">This action cannot be undone</div>
              </div>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                Are you sure you want to remove <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.name}</strong>?
                This will also delete all their medicine schedules and compliance records.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete.id)} disabled={deleting} id="confirm-delete-btn">
                {deleting ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Created Credentials Modal */}
      {createdCredentials && (
        <div className="modal-overlay" onClick={() => setCreatedCredentials(null)}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: 'none' }}>
              <div>
                <div className="modal-title" style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🎉 Patient Registered Successfully!
                </div>
                <div className="modal-subtitle">Login credentials for the patient app:</div>
              </div>
              <button className="modal-close" onClick={() => setCreatedCredentials(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ padding: '0 24px 20px 24px' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Patient Name</span>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{createdCredentials.name}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Login Email</span>
                  <span style={{ fontWeight: 600, fontSize: 15, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{createdCredentials.email}</span>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Default Password</span>
                  <span style={{ fontWeight: 600, fontSize: 15, fontFamily: 'monospace' }}>{createdCredentials.password}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 14 }}>💡</span>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  The patient will be prompted to reset their password immediately upon their first login to the MediCare+ app.
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setCreatedCredentials(null)}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
