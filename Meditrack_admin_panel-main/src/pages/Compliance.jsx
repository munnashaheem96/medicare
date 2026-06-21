// src/pages/Compliance.jsx
import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || 'var(--accent-primary)', fontWeight: 600 }}>
            {p.name}: {p.value}{typeof p.value === 'number' && p.name.includes('rate') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Compliance() {
  const { compliance, patients, medicines, getComplianceStats } = useApp();
  const [range, setRange] = useState('weekly');
  const [selectedPatient, setSelectedPatient] = useState('All');

  const stats = getComplianceStats(range);

  // Build per-patient compliance over 30 days
  const patientTrend = useMemo(() => {
    const today = new Date('2026-04-13');
    const days = range === 'daily' ? 1 : range === 'weekly' ? 7 : 30;
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - days + 1);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return patients.map(p => {
      const recs = compliance.filter(r => r.patientId === p.id && r.date >= cutoffStr);
      const taken = recs.filter(r => r.status === 'taken').length;
      const total = recs.length;
      const rate = total ? Math.round((taken / total) * 100) : 0;
      return { name: p.name.split(' ')[0], fullName: p.name, rate, taken, total, id: p.id };
    });
  }, [compliance, patients, range]);

  // Build daily trend for line chart (last 30 days)
  const dailyTrend = useMemo(() => {
    const today = new Date('2026-04-13');
    const points = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const recs = compliance.filter(r =>
        r.date === dateStr && (selectedPatient === 'All' || r.patientId === selectedPatient)
      );
      const taken = recs.filter(r => r.status === 'taken').length;
      const total = recs.length;
      points.push({
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        rate: total ? Math.round((taken / total) * 100) : 0,
        taken,
        skipped: recs.filter(r => r.status === 'skipped').length,
        missed: recs.filter(r => r.status === 'missed').length,
      });
    }
    return points;
  }, [compliance, selectedPatient]);

  // Timing breakdown
  const timingBreakdown = useMemo(() => {
    const today = new Date('2026-04-13');
    const days = range === 'daily' ? 1 : range === 'weekly' ? 7 : 30;
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - days + 1);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return ['morning', 'evening', 'night'].map(t => {
      const recs = compliance.filter(r => r.timing === t && r.date >= cutoffStr);
      const taken = recs.filter(r => r.status === 'taken').length;
      const total = recs.length;
      return {
        timing: t.charAt(0).toUpperCase() + t.slice(1),
        rate: total ? Math.round((taken / total) * 100) : 0,
        taken, total,
        fill: t === 'morning' ? '#f59e0b' : t === 'evening' ? '#06b6d4' : '#8b5cf6',
      };
    });
  }, [compliance, range]);

  const getIcon = (rate) => {
    if (rate >= 75) return <TrendingUp size={16} color="var(--accent-success)" />;
    if (rate >= 50) return <Minus size={16} color="var(--accent-warning)" />;
    return <TrendingDown size={16} color="var(--accent-danger)" />;
  };

  const getRateColor = (rate) =>
    rate >= 80 ? 'var(--accent-success)' : rate >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)';

  const getRateBg = (rate) =>
    rate >= 80 ? 'rgba(16,185,129,0.12)' : rate >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.10)';

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Compliance Monitor</div>
          <div className="page-desc">Track medication adherence across all patients</div>
        </div>
        <div className="tab-group">
          {[
            { id: 'daily', label: 'Today' },
            { id: 'weekly', label: '7 Days' },
            { id: 'monthly', label: '30 Days' },
          ].map(r => (
            <button key={r.id} className={`tab-btn ${range === r.id ? 'active' : ''}`}
              onClick={() => setRange(r.id)} id={`range-${r.id}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card cyan">
          <div className="stat-icon cyan" style={{ fontSize: 28, fontWeight: 800, width: 60, height: 60 }}>
            {stats.rate}%
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.rate}%</div>
            <div className="stat-label">Overall Rate</div>
            <div className={`stat-change ${stats.rate >= 70 ? 'up' : 'down'}`}>
              {stats.rate >= 70 ? '↑ Good adherence' : '↓ Needs attention'}
            </div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><TrendingUp size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.taken}</div>
            <div className="stat-label">Doses Taken</div>
            <div className="stat-change up">Out of {stats.total} total</div>
          </div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon yellow"><Minus size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.skipped}</div>
            <div className="stat-label">Doses Skipped</div>
            <div className="stat-change down">{stats.total ? Math.round((stats.skipped / stats.total) * 100) : 0}% of total</div>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><TrendingDown size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.missed}</div>
            <div className="stat-label">Doses Missed</div>
            <div className="stat-change down">{stats.total ? Math.round((stats.missed / stats.total) * 100) : 0}% of total</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">

        {/* Line Chart - 30 Day Trend */}
        <div className="card full">
          <div className="card-header">
            <div>
              <div className="card-title">30-Day Compliance Trend</div>
              <div className="card-subtitle">Daily adherence rate over time</div>
            </div>
            <select className="form-control" style={{ width: 'auto', minWidth: 160 }}
              value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} id="comp-patient-filter">
              <option value="All">All Patients</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false} tickLine={false} interval={4} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="rate" name="compliance rate"
                  stroke="#3b82f6" strokeWidth={2.5} dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Compliance Cards */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Patient Breakdown</div>
              <div className="card-subtitle">Individual compliance for selected range</div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {patientTrend.sort((a, b) => b.rate - a.rate).map(p => (
                <div key={p.id} style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {getIcon(p.rate)}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.fullName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.taken} / {p.total} doses</div>
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 800, fontSize: 18,
                      color: getRateColor(p.rate),
                      background: getRateBg(p.rate),
                      padding: '4px 12px',
                      borderRadius: 20,
                    }}>
                      {p.rate}%
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${p.rate}%`,
                        background: `linear-gradient(90deg, ${getRateColor(p.rate)}, ${getRateColor(p.rate)}99)`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timing Breakdown Bar */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Timing-wise Compliance</div>
              <div className="card-subtitle">Adherence by morning, evening, night</div>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={timingBreakdown} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="timing" tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" name="compliance rate" radius={[8, 8, 0, 0]}>
                  {timingBreakdown.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Timing Legend Cards */}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {timingBreakdown.map(t => (
                <div key={t.timing} style={{
                  flex: 1, background: `${t.fill}15`,
                  border: `1px solid ${t.fill}40`,
                  borderRadius: 10, padding: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: t.fill }}>{t.rate}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{t.timing}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.taken}/{t.total}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap Table — per patient per day */}
        <div className="card full">
          <div className="card-header">
            <div>
              <div className="card-title">Weekly Heatmap</div>
              <div className="card-subtitle">Compliance snapshot — last 7 days</div>
            </div>
          </div>
          <div className="card-body">
            <HeatmapTable compliance={compliance} patients={patients} />
          </div>
        </div>

      </div>
    </div>
  );
}

function HeatmapTable({ compliance, patients }) {
  const today = new Date('2026-04-13');
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const getRate = (patientId, date) => {
    const recs = compliance.filter(r => r.patientId === patientId && r.date === date);
    if (!recs.length) return null;
    const taken = recs.filter(r => r.status === 'taken').length;
    return Math.round((taken / recs.length) * 100);
  };

  const cellColor = (rate) => {
    if (rate === null) return { bg: 'var(--bg-surface)', color: 'var(--text-muted)' };
    if (rate >= 80) return { bg: 'rgba(16,185,129,0.2)', color: '#10b981' };
    if (rate >= 60) return { bg: 'rgba(245,158,11,0.18)', color: '#f59e0b' };
    return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' };
  };

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Patient</th>
            {days.map(d => (
              <th key={d} style={{ textAlign: 'center' }}>
                {new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit' })}
              </th>
            ))}
            <th style={{ textAlign: 'center' }}>Avg</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(p => {
            const rates = days.map(d => getRate(p.id, d));
            const validRates = rates.filter(r => r !== null);
            const avg = validRates.length ? Math.round(validRates.reduce((a, b) => a + b, 0) / validRates.length) : null;

            return (
              <tr key={p.id}>
                <td>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                </td>
                {rates.map((rate, i) => {
                  const { bg, color } = cellColor(rate);
                  return (
                    <td key={i} style={{ textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 48, height: 32, borderRadius: 8,
                        background: bg, color, fontWeight: 700, fontSize: 13,
                      }}>
                        {rate !== null ? `${rate}%` : '—'}
                      </div>
                    </td>
                  );
                })}
                <td style={{ textAlign: 'center' }}>
                  {avg !== null && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 52, height: 32, borderRadius: 8,
                      background: cellColor(avg).bg,
                      color: cellColor(avg).color,
                      fontWeight: 800, fontSize: 14,
                      border: `1px solid ${cellColor(avg).color}40`,
                    }}>
                      {avg}%
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
