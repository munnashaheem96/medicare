// src/pages/Reports.jsx
import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, CheckCircle2, XCircle, AlertCircle, Download, Filter } from 'lucide-react';

const STATUS_ICON = {
  taken: <CheckCircle2 size={15} color="var(--accent-success)" />,
  skipped: <AlertCircle size={15} color="var(--accent-warning)" />,
  missed: <XCircle size={15} color="var(--accent-danger)" />,
};

const TIMING_EMOJI = { morning: '🌅', evening: '🌆', night: '🌙' };

export default function Reports() {
  const { compliance, patients, medicines } = useApp();

  const [search, setSearch] = useState('');
  const [filterPatient, setFilterPatient] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  // Enrich compliance records with names
  const enriched = useMemo(() => compliance.map(r => {
    const patient = patients.find(p => p.id === r.patientId);
    const med = medicines.find(m => m.id === r.medicineId);
    return {
      ...r,
      patientName: patient?.name || 'Unknown',
      medicineName: med?.medicineName || 'Unknown',
    };
  }), [compliance, patients, medicines]);

  const filtered = useMemo(() => enriched.filter(r => {
    const matchSearch =
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.medicineName.toLowerCase().includes(search.toLowerCase());
    const matchPat = filterPatient === 'All' || r.patientId === filterPatient;
    const matchStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchDate = !filterDate || r.date === filterDate;
    return matchSearch && matchPat && matchStatus && matchDate;
  }).sort((a, b) => b.date.localeCompare(a.date)), [enriched, search, filterPatient, filterStatus, filterDate]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Summary stats of filtered
  const taken = filtered.filter(r => r.status === 'taken').length;
  const skipped = filtered.filter(r => r.status === 'skipped').length;
  const missed = filtered.filter(r => r.status === 'missed').length;
  const total = filtered.length;
  const rate = total ? Math.round((taken / total) * 100) : 0;

  const avatarColor = (name) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
    return colors[(name || ' ').charCodeAt(0) % colors.length];
  };

  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearch('');
    setFilterPatient('All');
    setFilterStatus('All');
    setFilterDate('');
    setPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Patient', 'Medicine', 'Date', 'Timing', 'Status'];
    const rows = filtered.map(r => [
      r.patientName, r.medicineName, r.date, r.timing, r.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `meditrack_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Reports</div>
          <div className="page-desc">{filtered.length} records found in logs</div>
        </div>
        <button className="btn btn-secondary" id="export-btn" onClick={exportToCSV}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Summary Strip */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card blue" style={{ padding: '16px 20px' }}>
          <div className="stat-icon blue"><CheckCircle2 size={20} /></div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 24 }}>{total}</div>
            <div className="stat-label">Total Records</div>
          </div>
        </div>
        <div className="stat-card green" style={{ padding: '16px 20px' }}>
          <div className="stat-icon green"><CheckCircle2 size={20} /></div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 24 }}>{taken}</div>
            <div className="stat-label">Taken · {rate}%</div>
          </div>
        </div>
        <div className="stat-card yellow" style={{ padding: '16px 20px' }}>
          <div className="stat-icon yellow"><AlertCircle size={20} /></div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 24 }}>{skipped}</div>
            <div className="stat-label">Skipped</div>
          </div>
        </div>
        <div className="stat-card red" style={{ padding: '16px 20px' }}>
          <div className="stat-icon red"><XCircle size={20} /></div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 24 }}>{missed}</div>
            <div className="stat-label">Missed</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ paddingTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Overall Compliance Rate</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: rate >= 70 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {rate}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div
              className={`progress-fill ${rate >= 80 ? 'green' : rate >= 50 ? '' : 'red'}`}
              style={{ width: `${rate}%` }}
            />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
            {[
              { label: 'Taken', val: taken, color: 'var(--accent-success)' },
              { label: 'Skipped', val: skipped, color: 'var(--accent-warning)' },
              { label: 'Missed', val: missed, color: 'var(--accent-danger)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                <span style={{ color: 'var(--text-muted)' }}>{s.label}:</span>
                <span style={{ fontWeight: 700, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ paddingTop: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
              <Search size={15} className="search-icon" />
              <input className="form-control" placeholder="Search patient or medicine..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} id="report-search" />
            </div>
            <select className="form-control" style={{ width: 'auto', minWidth: 160 }}
              value={filterPatient} onChange={e => { setFilterPatient(e.target.value); setPage(1); }} id="report-patient">
              <option value="All">All Patients</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="form-control" style={{ width: 'auto', minWidth: 140 }}
              value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} id="report-status">
              <option value="All">All Statuses</option>
              <option value="taken">Taken</option>
              <option value="skipped">Skipped</option>
              <option value="missed">Missed</option>
            </select>
            <input type="date" className="form-control" style={{ width: 'auto' }}
              value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(1); }} id="report-date" />
            <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
              <Filter size={13} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {paginated.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No records found</div>
              <div className="empty-desc">Try adjusting your filters</div>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Medicine</th>
                      <th>Date</th>
                      <th>Timing</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(r => {
                      const color = avatarColor(r.patientName);
                      return (
                        <tr key={r.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <div className="patient-avatar" style={{ background: `${color}20`, color, fontSize: 12 }}>
                                {r.patientName.charAt(0)}
                              </div>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>{r.patientName}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.medicineName}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{r.date}</td>
                          <td>
                            <span className={`timing-chip timing-${r.timing}`}>
                              {TIMING_EMOJI[r.timing]} {r.timing.charAt(0).toUpperCase() + r.timing.slice(1)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {STATUS_ICON[r.status]}
                              <span className={`badge-status badge-${r.status}`}>
                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => handlePageChange(page - 1)}>← Prev</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p}
                        className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handlePageChange(p)}
                        style={{ minWidth: 36 }}
                      >{p}</button>
                    );
                  })}
                  <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => handlePageChange(page + 1)}>Next →</button>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                    {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
