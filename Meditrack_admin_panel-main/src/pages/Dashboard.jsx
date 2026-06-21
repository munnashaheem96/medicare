// src/pages/Dashboard.jsx
import { useApp } from '../context/AppContext';
import {
  Users, Pill, CheckCircle2, AlertCircle, TrendingUp, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {p.value}{p.name === 'rate' ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const {
    patients, medicines,
    complianceStats, dailyTrend, patientCompliance,
    loading, refreshAll,
  } = useApp();

  const stats = complianceStats;
  const trend = dailyTrend;

  const pieData = [
    { name: 'Taken', value: stats.taken },
    { name: 'Skipped', value: stats.skipped },
    { name: 'Missed', value: stats.missed },
  ];

  const activePatients = patients.filter(p => p.status === 'Active').length;
  const activeMeds = medicines.filter(m => m.status === 'Active').length;
  const isLoading = loading.patients || loading.medicines;

  return (
    <div>
      {/* Header with refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Live data · auto-refreshes every 30s
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={refreshAll}
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div className="stat-info">
            <div className="stat-value">{patients.length}</div>
            <div className="stat-label">Total Patients</div>
            <div className="stat-change up">↑ {activePatients} active</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green"><Pill size={24} /></div>
          <div className="stat-info">
            <div className="stat-value">{activeMeds}</div>
            <div className="stat-label">Active Schedules</div>
            <div className="stat-change up">↑ {medicines.length} total</div>
          </div>
        </div>

        <div className="stat-card cyan">
          <div className="stat-icon cyan"><CheckCircle2 size={24} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.rate}%</div>
            <div className="stat-label">Weekly Compliance</div>
            <div className={`stat-change ${stats.rate >= 70 ? 'up' : 'down'}`}>
              {stats.taken} doses taken
            </div>
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon yellow"><AlertCircle size={24} /></div>
          <div className="stat-info">
            <div className="stat-value">{stats.skipped + stats.missed}</div>
            <div className="stat-label">Doses Missed (Week)</div>
            <div className="stat-change down">{stats.skipped} skipped · {stats.missed} missed</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="dashboard-grid">

        {/* Area Chart - Weekly Trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">7-Day Compliance Trend</div>
              <div className="card-subtitle">Daily dose taken vs skipped</div>
            </div>
            <TrendingUp size={18} color="var(--accent-primary)" />
          </div>
          <div className="card-body">
            {trend.length === 0 ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Loading trend data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="colorTaken" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSkipped" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="taken" name="taken" stroke="#10b981" strokeWidth={2} fill="url(#colorTaken)" />
                  <Area type="monotone" dataKey="skipped" name="skipped" stroke="#ef4444" strokeWidth={2} fill="url(#colorSkipped)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Weekly Dose Breakdown</div>
              <div className="card-subtitle">Taken · Skipped · Missed</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 8 }} />
                <Legend
                  formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Daily Rate */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Daily Compliance Rate %</div>
              <div className="card-subtitle">Last 7 days adherence</div>
            </div>
          </div>
          <div className="card-body">
            {trend.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trend} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" name="rate" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Patient Compliance List */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Patient Adherence</div>
              <div className="card-subtitle">30-day compliance per patient</div>
            </div>
          </div>
          <div className="card-body">
            {patientCompliance.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                No patient data yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {patientCompliance.map((p, i) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                  const color = colors[i % colors.length];
                  return (
                    <div key={p.id || i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="patient-avatar" style={{ background: `${color}25`, color }}>
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.condition}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700, color }}>
                          {p.rate}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${p.rate >= 80 ? 'green' : p.rate >= 40 ? '' : 'red'}`}
                          style={{ width: `${p.rate}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
