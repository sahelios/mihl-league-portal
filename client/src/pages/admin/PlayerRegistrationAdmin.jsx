import React, { useState, useMemo, useCallback } from 'react';
import {
  Search, Filter, Download, Check, X, DollarSign, Calendar,
  Mail, Eye, Users, AlertCircle, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, FileText, Send, Trash2
} from 'lucide-react';

/**
 * PlayerRegistrationAdmin
 * --------------------------------------------------------------
 * Admin dashboard for managing player registrations.
 * Features:
 *  - Pending registration table (name, email, type, rating, team pref)
 *  - Approve / Reject with reason input
 *  - Payment tracking: Paid / Partial / Unpaid
 *  - Payment due date setter (auto = 4 weeks before season start)
 *  - Automated payment reminder messages
 *  - Search & multi-filter (name, email, status, registration type)
 *  - Bulk approve / reject
 *  - Player detail modal
 *  - CSV export
 *
 * Theme: Navy (#0B1B3B) / Silver (#C0C5CE) — matches Canucks identity.
 *
 * Notes:
 *  - All data + handlers are mock-wired so this works standalone.
 *  - Replace `mockRegistrations` and the action handlers (handleApprove,
 *    handleReject, sendPaymentReminder, etc.) with real API calls.
 *  - SEASON_START_DATE drives the auto-calculated payment due date.
 * --------------------------------------------------------------
 */

// ============================================================
// CONFIG
// ============================================================
const SEASON_START_DATE = new Date('2026-09-01'); // adjust per season
const PAYMENT_DUE_OFFSET_WEEKS = 4;

const DIVISIONS = ['M13B', 'M15B', 'M11B', 'M17B'];
const REG_TYPES = ['Tryout', 'Returning', 'Import', 'AP (Affiliate)', 'Goalie'];
const STATUSES = ['Pending', 'Approved', 'Rejected', 'Waitlist'];
const PAYMENT_STATUSES = ['Unpaid', 'Partial', 'Paid', 'Refunded'];

// ============================================================
// MOCK DATA — replace with API fetch
// ============================================================
const mockRegistrations = [
  {
    id: 'REG-1001', firstName: 'Liam', lastName: 'Tremblay',
    email: 'tremblay.l@example.com', phone: '514-555-0142',
    dob: '2013-04-12', regType: 'Returning', division: 'M13B',
    rating: 4.5, teamPreference: 'M13B - A1', status: 'Pending',
    paymentStatus: 'Unpaid', amountDue: 1850, amountPaid: 0,
    paymentDue: '', notes: '', submittedAt: '2026-04-28',
    parentName: 'Sophie Tremblay', parentEmail: 's.tremblay@example.com',
    emergencyContact: '514-555-0199', medicalNotes: 'None',
    jerseyNumber: 17, position: 'Forward', shoots: 'L'
  },
  {
    id: 'REG-1002', firstName: 'Noah', lastName: 'Cohen',
    email: 'cohen.n@example.com', phone: '514-555-0188',
    dob: '2011-08-23', regType: 'Tryout', division: 'M15B',
    rating: 4.8, teamPreference: 'M15B - A1', status: 'Pending',
    paymentStatus: 'Partial', amountDue: 1950, amountPaid: 500,
    paymentDue: '2026-08-04', notes: '', submittedAt: '2026-04-29',
    parentName: 'David Cohen', parentEmail: 'd.cohen@example.com',
    emergencyContact: '514-555-0177', medicalNotes: 'Asthma — inhaler',
    jerseyNumber: 9, position: 'Center', shoots: 'R'
  },
  {
    id: 'REG-1003', firstName: 'Emma', lastName: 'Rousseau',
    email: 'rousseau.e@example.com', phone: '514-555-0211',
    dob: '2013-11-05', regType: 'Goalie', division: 'M13B',
    rating: 4.2, teamPreference: 'M13B - A1', status: 'Pending',
    paymentStatus: 'Unpaid', amountDue: 1850, amountPaid: 0,
    paymentDue: '', notes: 'Goalie — priority eval', submittedAt: '2026-04-30',
    parentName: 'Marc Rousseau', parentEmail: 'm.rousseau@example.com',
    emergencyContact: '514-555-0233', medicalNotes: 'None',
    jerseyNumber: 30, position: 'Goaltender', shoots: 'L'
  },
  {
    id: 'REG-1004', firstName: 'Lucas', lastName: 'Dubois',
    email: 'dubois.l@example.com', phone: '514-555-0344',
    dob: '2010-02-14', regType: 'Import', division: 'M15B',
    rating: 4.9, teamPreference: 'M15B - A1', status: 'Pending',
    paymentStatus: 'Unpaid', amountDue: 1950, amountPaid: 0,
    paymentDue: '', notes: 'Coming from Lac St-Louis', submittedAt: '2026-05-01',
    parentName: 'Julie Dubois', parentEmail: 'j.dubois@example.com',
    emergencyContact: '514-555-0355', medicalNotes: 'Concussion 2024 — cleared',
    jerseyNumber: 88, position: 'Defense', shoots: 'R'
  },
  {
    id: 'REG-1005', firstName: 'Ethan', lastName: 'Singh',
    email: 'singh.e@example.com', phone: '514-555-0432',
    dob: '2012-06-30', regType: 'Returning', division: 'M13B',
    rating: 3.8, teamPreference: 'M13B - A2', status: 'Approved',
    paymentStatus: 'Paid', amountDue: 1850, amountPaid: 1850,
    paymentDue: '2026-08-04', notes: '', submittedAt: '2026-04-15',
    parentName: 'Priya Singh', parentEmail: 'p.singh@example.com',
    emergencyContact: '514-555-0431', medicalNotes: 'None',
    jerseyNumber: 21, position: 'Forward', shoots: 'L'
  },
  {
    id: 'REG-1006', firstName: 'Maxime', lastName: 'Beaulieu',
    email: 'beaulieu.m@example.com', phone: '514-555-0501',
    dob: '2011-01-19', regType: 'AP (Affiliate)', division: 'M15B',
    rating: 4.0, teamPreference: 'M15B - A2', status: 'Waitlist',
    paymentStatus: 'Unpaid', amountDue: 950, amountPaid: 0,
    paymentDue: '', notes: 'Affiliate only — AP fee', submittedAt: '2026-04-26',
    parentName: 'Sandrine Beaulieu', parentEmail: 's.beaulieu@example.com',
    emergencyContact: '514-555-0502', medicalNotes: 'None',
    jerseyNumber: 14, position: 'Defense', shoots: 'R'
  },
];

// ============================================================
// HELPERS
// ============================================================
const calcDefaultPaymentDue = () => {
  const d = new Date(SEASON_START_DATE);
  d.setDate(d.getDate() - PAYMENT_DUE_OFFSET_WEEKS * 7);
  return d.toISOString().split('T')[0];
};

const fmtCurrency = (n) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n || 0);

const fmtDate = (s) => {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: '2-digit' });
};

const ageFromDOB = (dob) => {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};

const escapeCSV = (val) => {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

// ============================================================
// COMPONENT
// ============================================================
export default function PlayerRegistrationAdmin() {
  const [registrations, setRegistrations] = useState(mockRegistrations);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDivision, setFilterDivision] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState({ field: 'submittedAt', dir: 'desc' });
  const [detailPlayer, setDetailPlayer] = useState(null);
  const [actionModal, setActionModal] = useState(null); // {kind:'approve'|'reject'|'reminder'|'bulkApprove'|'bulkReject', target, reason}
  const [toast, setToast] = useState(null);

  // ---------- Filtering / sorting ----------
  const filtered = useMemo(() => {
    let rows = registrations.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'All' || r.status === filterStatus;
      const matchType = filterType === 'All' || r.regType === filterType;
      const matchDiv = filterDivision === 'All' || r.division === filterDivision;
      const matchPay = filterPayment === 'All' || r.paymentStatus === filterPayment;
      return matchSearch && matchStatus && matchType && matchDiv && matchPay;
    });
    rows.sort((a, b) => {
      const f = sortBy.field;
      let av = a[f], bv = b[f];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortBy.dir === 'asc' ? -1 : 1;
      if (av > bv) return sortBy.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [registrations, search, filterStatus, filterType, filterDivision, filterPayment, sortBy]);

  // ---------- Stats ----------
  const stats = useMemo(() => ({
    total: registrations.length,
    pending: registrations.filter((r) => r.status === 'Pending').length,
    approved: registrations.filter((r) => r.status === 'Approved').length,
    paid: registrations.filter((r) => r.paymentStatus === 'Paid').length,
    outstanding: registrations.reduce(
      (s, r) => s + (r.status === 'Approved' ? (r.amountDue - r.amountPaid) : 0), 0
    ),
  }), [registrations]);

  // ---------- Toast helper ----------
  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  };

  // ---------- Selection ----------
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((r) => r.id)));
  };

  // ---------- Sorting ----------
  const handleSort = (field) => {
    setSortBy((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'asc' }
    );
  };

  // ---------- Actions ----------
  const updateRegistration = (id, patch) => {
    setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleApprove = (id, reason = '') => {
    updateRegistration(id, {
      status: 'Approved',
      paymentDue: calcDefaultPaymentDue(),
      notes: reason ? `${reason}` : undefined,
    });
    showToast(`Registration ${id} approved. Payment due ${calcDefaultPaymentDue()}.`);
  };

  const handleReject = (id, reason) => {
    updateRegistration(id, { status: 'Rejected', notes: reason });
    showToast(`Registration ${id} rejected.`, 'error');
  };

  const handleBulkApprove = (reason = '') => {
    const ids = Array.from(selectedIds);
    setRegistrations((prev) =>
      prev.map((r) =>
        ids.includes(r.id)
          ? { ...r, status: 'Approved', paymentDue: calcDefaultPaymentDue(), notes: reason || r.notes }
          : r
      )
    );
    showToast(`${ids.length} registrations approved.`);
    setSelectedIds(new Set());
  };

  const handleBulkReject = (reason) => {
    const ids = Array.from(selectedIds);
    setRegistrations((prev) =>
      prev.map((r) => (ids.includes(r.id) ? { ...r, status: 'Rejected', notes: reason } : r))
    );
    showToast(`${ids.length} registrations rejected.`, 'error');
    setSelectedIds(new Set());
  };

  const setPaymentStatus = (id, paymentStatus, amountPaid = null) => {
    const patch = { paymentStatus };
    if (amountPaid !== null) patch.amountPaid = amountPaid;
    updateRegistration(id, patch);
    showToast(`Payment status updated → ${paymentStatus}`);
  };

  const sendPaymentReminder = (player) => {
    // Replace with real email/SMS hook
    const subject = `Payment Reminder — ${player.firstName} ${player.lastName} (${player.division})`;
    const balance = player.amountDue - player.amountPaid;
    const body =
      `Hello ${player.parentName},\n\n` +
      `This is a friendly reminder that the registration payment for ` +
      `${player.firstName} ${player.lastName} (${player.division}) is due on ` +
      `${fmtDate(player.paymentDue)}.\n\n` +
      `Outstanding balance: ${fmtCurrency(balance)}.\n\n` +
      `Please contact the team manager if you have any questions.\n\n` +
      `— Côte St-Luc Canucks`;
    console.log('PAYMENT_REMINDER →', { to: player.parentEmail, subject, body });
    showToast(`Reminder sent to ${player.parentEmail}`);
  };

  // ---------- CSV Export ----------
  const exportCSV = () => {
    const headers = [
      'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'DOB', 'Age',
      'Reg Type', 'Division', 'Rating', 'Team Pref', 'Status',
      'Payment Status', 'Amount Due', 'Amount Paid', 'Payment Due',
      'Submitted', 'Notes'
    ];
    const rows = filtered.map((r) => [
      r.id, r.firstName, r.lastName, r.email, r.phone, r.dob, ageFromDOB(r.dob),
      r.regType, r.division, r.rating, r.teamPreference, r.status,
      r.paymentStatus, r.amountDue, r.amountPaid, r.paymentDue,
      r.submittedAt, r.notes
    ].map(escapeCSV).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canucks-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filtered.length} rows to CSV.`);
  };

  // ---------- UI helpers ----------
  const StatusPill = ({ status }) => {
    const map = {
      Pending:  'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      Approved: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      Rejected: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      Waitlist: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>
        {status}
      </span>
    );
  };

  const PaymentPill = ({ status }) => {
    const map = {
      Paid:     'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      Partial:  'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      Unpaid:   'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      Refunded: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>
        {status}
      </span>
    );
  };

  const SortHeader = ({ field, children, className = '' }) => (
    <th
      className={`px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#C0C5CE] cursor-pointer hover:text-white select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy.field === field && (
          sortBy.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1B3B] via-[#0F2347] to-[#0B1B3B] text-[#E5E7EB] p-4 md:p-8">
      {/* HEADER */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C0C5CE] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0B1B3B]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Player Registration Admin
                </h1>
                <p className="text-sm text-[#C0C5CE]">
                  Côte St-Luc Canucks · Season {SEASON_START_DATE.getFullYear()}–{SEASON_START_DATE.getFullYear() + 1}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#C0C5CE] text-[#0B1B3B] rounded-lg font-semibold hover:bg-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', val: stats.total, icon: Users, color: 'text-[#C0C5CE]' },
          { label: 'Pending', val: stats.pending, icon: Clock, color: 'text-amber-300' },
          { label: 'Approved', val: stats.approved, icon: CheckCircle2, color: 'text-emerald-300' },
          { label: 'Paid', val: stats.paid, icon: DollarSign, color: 'text-emerald-300' },
          { label: 'Outstanding', val: fmtCurrency(stats.outstanding), icon: AlertCircle, color: 'text-rose-300' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0F2347]/80 border border-[#1E3A6B] rounded-lg p-4 backdrop-blur">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase tracking-wider text-[#8A93A6]">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="bg-[#0F2347]/80 border border-[#1E3A6B] rounded-lg p-4 mb-4 backdrop-blur">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A93A6]" />
            <input
              type="text"
              placeholder="Search name, email, ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-[#0B1B3B] border border-[#1E3A6B] rounded-lg text-sm placeholder-[#8A93A6] focus:outline-none focus:border-[#C0C5CE]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="md:col-span-2 px-3 py-2 bg-[#0B1B3B] border border-[#1E3A6B] rounded-lg text-sm focus:outline-none focus:border-[#C0C5CE]"
          >
            <option value="All">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="md:col-span-2 px-3 py-2 bg-[#0B1B3B] border border-[#1E3A6B] rounded-lg text-sm focus:outline-none focus:border-[#C0C5CE]"
          >
            <option value="All">All Types</option>
            {REG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="md:col-span-2 px-3 py-2 bg-[#0B1B3B] border border-[#1E3A6B] rounded-lg text-sm focus:outline-none focus:border-[#C0C5CE]"
          >
            <option value="All">All Divisions</option>
            {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="md:col-span-2 px-3 py-2 bg-[#0B1B3B] border border-[#1E3A6B] rounded-lg text-sm focus:outline-none focus:border-[#C0C5CE]"
          >
            <option value="All">All Payments</option>
            {PAYMENT_STATUSES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* BULK ACTIONS */}
        {selectedIds.size > 0 && (
          <div className="mt-3 pt-3 border-t border-[#1E3A6B] flex flex-wrap items-center gap-2">
            <span className="text-sm text-[#C0C5CE]">
              <strong className="text-white">{selectedIds.size}</strong> selected
            </span>
            <div className="flex-1" />
            <button
              onClick={() => setActionModal({ kind: 'bulkApprove', reason: '' })}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold transition"
            >
              <Check className="w-4 h-4" /> Approve All
            </button>
            <button
              onClick={() => setActionModal({ kind: 'bulkReject', reason: '' })}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-sm font-semibold transition"
            >
              <X className="w-4 h-4" /> Reject All
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1E3A6B] hover:bg-[#2A4A7B] rounded-lg text-sm font-semibold transition"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-[#0F2347]/80 border border-[#1E3A6B] rounded-lg overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1E3A6B]">
            <thead className="bg-[#0B1B3B]">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-[#C0C5CE]"
                  />
                </th>
                <SortHeader field="lastName">Player</SortHeader>
                <SortHeader field="email" className="hidden md:table-cell">Email</SortHeader>
                <SortHeader field="regType" className="hidden lg:table-cell">Type</SortHeader>
                <SortHeader field="rating">Rating</SortHeader>
                <SortHeader field="teamPreference" className="hidden lg:table-cell">Team Pref</SortHeader>
                <SortHeader field="status">Status</SortHeader>
                <SortHeader field="paymentStatus" className="hidden md:table-cell">Payment</SortHeader>
                <SortHeader field="paymentDue" className="hidden xl:table-cell">Due</SortHeader>
                <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#C0C5CE]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A6B]">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-[#8A93A6]">
                    No registrations match the current filters.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#1E3A6B]/40 transition">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="w-4 h-4 accent-[#C0C5CE]"
                    />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="font-semibold text-white">{r.firstName} {r.lastName}</div>
                    <div className="text-xs text-[#8A93A6]">
                      {r.id} · {r.division} · Age {ageFromDOB(r.dob)}
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell text-sm text-[#C0C5CE]">
                    {r.email}
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell text-sm">
                    <span className="px-2 py-0.5 bg-[#1E3A6B] rounded text-xs">{r.regType}</span>
                  </td>
                  <td className="px-3 py-3 text-sm font-mono">{r.rating.toFixed(1)}</td>
                  <td className="px-3 py-3 hidden lg:table-cell text-sm text-[#C0C5CE]">
                    {r.teamPreference}
                  </td>
                  <td className="px-3 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <PaymentPill status={r.paymentStatus} />
                      <span className="text-xs text-[#8A93A6] font-mono">
                        {fmtCurrency(r.amountPaid)} / {fmtCurrency(r.amountDue)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden xl:table-cell text-sm text-[#C0C5CE]">
                    {fmtDate(r.paymentDue)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end items-center gap-1">
                      <button
                        title="View details"
                        onClick={() => setDetailPlayer(r)}
                        className="p-1.5 hover:bg-[#1E3A6B] rounded text-[#C0C5CE] hover:text-white transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {r.status === 'Pending' && (
                        <>
                          <button
                            title="Approve"
                            onClick={() => setActionModal({ kind: 'approve', target: r, reason: '' })}
                            className="p-1.5 hover:bg-emerald-600/30 rounded text-emerald-300 transition"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            title="Reject"
                            onClick={() => setActionModal({ kind: 'reject', target: r, reason: '' })}
                            className="p-1.5 hover:bg-rose-600/30 rounded text-rose-300 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {r.status === 'Approved' && r.paymentStatus !== 'Paid' && (
                        <button
                          title="Send payment reminder"
                          onClick={() => sendPaymentReminder(r)}
                          className="p-1.5 hover:bg-sky-600/30 rounded text-sky-300 transition"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-[#0B1B3B] border-t border-[#1E3A6B] text-xs text-[#8A93A6]">
          Showing {filtered.length} of {registrations.length} registrations
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailPlayer && (
        <Modal onClose={() => setDetailPlayer(null)} title={`${detailPlayer.firstName} ${detailPlayer.lastName}`}>
          <DetailView
            player={detailPlayer}
            onUpdate={(patch) => {
              updateRegistration(detailPlayer.id, patch);
              setDetailPlayer({ ...detailPlayer, ...patch });
            }}
            onSendReminder={() => sendPaymentReminder(detailPlayer)}
            onClose={() => setDetailPlayer(null)}
          />
        </Modal>
      )}

      {/* ACTION MODALS */}
      {actionModal && (
        <Modal
          onClose={() => setActionModal(null)}
          title={
            actionModal.kind === 'approve' ? 'Approve Registration' :
            actionModal.kind === 'reject'  ? 'Reject Registration' :
            actionModal.kind === 'bulkApprove' ? `Approve ${selectedIds.size} Registrations` :
            actionModal.kind === 'bulkReject' ? `Reject ${selectedIds.size} Registrations` : ''
          }
        >
          <ActionForm
            kind={actionModal.kind}
            target={actionModal.target}
            count={selectedIds.size}
            onCancel={() => setActionModal(null)}
            onConfirm={(reason) => {
              if (actionModal.kind === 'approve') handleApprove(actionModal.target.id, reason);
              if (actionModal.kind === 'reject')  handleReject(actionModal.target.id, reason);
              if (actionModal.kind === 'bulkApprove') handleBulkApprove(reason);
              if (actionModal.kind === 'bulkReject')  handleBulkReject(reason);
              setActionModal(null);
            }}
          />
        </Modal>
      )}

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur z-50 ${
            toast.kind === 'error'
              ? 'bg-rose-900/90 border-rose-500 text-rose-100'
              : 'bg-emerald-900/90 border-emerald-500 text-emerald-100'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.kind === 'error'
              ? <XCircle className="w-5 h-5" />
              : <CheckCircle2 className="w-5 h-5" />}
            <span className="text-sm font-semibold">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUBCOMPONENT — Generic Modal
// ============================================================
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-[#0F2347] border border-[#1E3A6B] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E3A6B] bg-[#0B1B3B]">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#1E3A6B] rounded text-[#C0C5CE] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-65px)] p-5">{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// SUBCOMPONENT — Action confirmation form
// ============================================================
function ActionForm({ kind, target, count, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const isReject = kind === 'reject' || kind === 'bulkReject';
  const isBulk = kind === 'bulkApprove' || kind === 'bulkReject';

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#C0C5CE]">
        {isBulk ? (
          <>You are about to <strong className="text-white">{kind === 'bulkApprove' ? 'approve' : 'reject'}</strong> {count} registration{count !== 1 ? 's' : ''}.</>
        ) : (
          <>You are about to <strong className="text-white">{kind}</strong> the registration for <strong className="text-white">{target?.firstName} {target?.lastName}</strong> ({target?.id}).</>
        )}
      </p>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#C0C5CE] mb-1">
          {isReject ? 'Reason for rejection (required)' : 'Notes / reason (optional)'}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder={isReject ? 'e.g. Division full, did not attend tryout, missing paperwork…' : 'Internal note…'}
          className="w-full px-3 py-2 bg-[#0B1B3B] border border-[#1E3A6B] rounded-lg text-sm placeholder-[#8A93A6] focus:outline-none focus:border-[#C0C5CE]"
        />
      </div>
      {!isReject && (
        <div className="bg-[#0B1B3B] border border-[#1E3A6B] rounded-lg p-3 text-sm text-[#C0C5CE]">
          <Calendar className="inline w-4 h-4 mr-1 -mt-0.5" />
          Payment due will be auto-set to <strong className="text-white">{fmtDate(calcDefaultPaymentDue())}</strong>
          <span className="text-xs text-[#8A93A6]"> ({PAYMENT_DUE_OFFSET_WEEKS} weeks before season start).</span>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-[#1E3A6B] hover:bg-[#2A4A7B] rounded-lg text-sm font-semibold transition"
        >
          Cancel
        </button>
        <button
          disabled={isReject && !reason.trim()}
          onClick={() => onConfirm(reason)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            isReject
              ? 'bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          Confirm {isReject ? 'Reject' : 'Approve'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// SUBCOMPONENT — Player detail view
// ============================================================
function DetailView({ player, onUpdate, onSendReminder, onClose }) {
  const [editPayment, setEditPayment] = useState({
    paymentStatus: player.paymentStatus,
    amountPaid: player.amountPaid,
    paymentDue: player.paymentDue || calcDefaultPaymentDue(),
  });

  const Field = ({ label, value }) => (
    <div>
      <div className="text-xs uppercase tracking-wider text-[#8A93A6]">{label}</div>
      <div className="text-sm text-white font-medium">{value || '—'}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#C0C5CE] mb-2">Player Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="ID" value={player.id} />
          <Field label="Date of Birth" value={`${fmtDate(player.dob)} (Age ${ageFromDOB(player.dob)})`} />
          <Field label="Division" value={player.division} />
          <Field label="Position" value={player.position} />
          <Field label="Shoots" value={player.shoots} />
          <Field label="Jersey #" value={player.jerseyNumber} />
          <Field label="Rating" value={player.rating?.toFixed(1)} />
          <Field label="Team Preference" value={player.teamPreference} />
          <Field label="Reg Type" value={player.regType} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#C0C5CE] mb-2">Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Player Email" value={player.email} />
          <Field label="Phone" value={player.phone} />
          <Field label="Parent / Guardian" value={player.parentName} />
          <Field label="Parent Email" value={player.parentEmail} />
          <Field label="Emergency Contact" value={player.emergencyContact} />
          <Field label="Medical Notes" value={player.medicalNotes} />
        </div>
      </section>

      <section className="bg-[#0B1B3B] border border-[#1E3A6B] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#C0C5CE]">Payment</h3>
          {player.status === 'Approved' && editPayment.paymentStatus !== 'Paid' && (
            <button
              onClick={onSendReminder}
              className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 rounded-lg text-xs font-semibold transition"
            >
              <Send className="w-3.5 h-3.5" /> Send Reminder
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8A93A6] mb-1">Status</label>
            <select
              value={editPayment.paymentStatus}
              onChange={(e) => setEditPayment({ ...editPayment, paymentStatus: e.target.value })}
              className="w-full px-3 py-2 bg-[#0F2347] border border-[#1E3A6B] rounded-lg text-sm focus:outline-none focus:border-[#C0C5CE]"
            >
              {PAYMENT_STATUSES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8A93A6] mb-1">
              Amount Paid (of {fmtCurrency(player.amountDue)})
            </label>
            <input
              type="number"
              value={editPayment.amountPaid}
              onChange={(e) => setEditPayment({ ...editPayment, amountPaid: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#0F2347] border border-[#1E3A6B] rounded-lg text-sm focus:outline-none focus:border-[#C0C5CE]"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8A93A6] mb-1">
              Payment Due
              <span className="ml-1 text-[10px] text-[#8A93A6]">(auto: 4 wk before season)</span>
            </label>
            <input
              type="date"
              value={editPayment.paymentDue}
              onChange={(e) => setEditPayment({ ...editPayment, paymentDue: e.target.value })}
              className="w-full px-3 py-2 bg-[#0F2347] border border-[#1E3A6B] rounded-lg text-sm focus:outline-none focus:border-[#C0C5CE]"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onUpdate({ ...editPayment, paymentStatus: 'Paid', amountPaid: player.amountDue })}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold transition"
          >
            Mark Fully Paid
          </button>
          <button
            onClick={() => onUpdate({ ...editPayment, paymentStatus: 'Partial' })}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-semibold transition"
          >
            Mark Partial
          </button>
          <div className="flex-1" />
          <button
            onClick={() => onUpdate(editPayment)}
            className="px-3 py-1.5 bg-[#C0C5CE] hover:bg-white text-[#0B1B3B] rounded-lg text-xs font-semibold transition"
          >
            Save Payment Info
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#C0C5CE] mb-2">Notes</h3>
        <div className="bg-[#0B1B3B] border border-[#1E3A6B] rounded-lg p-3 text-sm text-[#C0C5CE] min-h-[3rem]">
          {player.notes || <span className="text-[#8A93A6] italic">No notes recorded.</span>}
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-2 border-t border-[#1E3A6B]">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-[#1E3A6B] hover:bg-[#2A4A7B] rounded-lg text-sm font-semibold transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
