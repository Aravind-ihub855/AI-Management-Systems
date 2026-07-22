/* ==========================================================================
   Shared API + formatting helpers for AI Enterprise Operations Platform
   ========================================================================== */

const API_BASE = 'data';

async function fetchAll(table, limit = 500) {
  try {
    const res = await fetch(`${API_BASE}/${table}.json`);
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();
    const records = Array.isArray(json) ? json : (json.data || []);
    return limit ? records.slice(0, limit) : records;
  } catch (e) {
    console.error(`fetchAll(${table}) failed`, e);
    return [];
  }
}

async function createRow(table, data) {
  try {
    const res = await fetch(`${API_BASE}/${table}.json`);
    const existing = res.ok ? await res.json() : [];
    const list = Array.isArray(existing) ? existing : (existing.data || []);
    const newRow = { id: data.id || `r_${Date.now()}`, ...data };
    list.push(newRow);
    return newRow;
  } catch (e) {
    return { id: `r_${Date.now()}`, ...data };
  }
}

async function updateRow(table, id, data) {
  return { id, ...data };
}

async function deleteRow(table, id) {
  return { success: true };
}

/* ---------------- Formatting helpers ---------------- */
function fmtUSD(n) {
  if (n === null || n === undefined || isNaN(n)) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}
function fmtUSDFull(n) {
  if (n === null || n === undefined || isNaN(n)) return '$0.00';
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toLocaleString('en-US');
}
function fmtInt(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-US');
}
function fmtGB(n) {
  if (n === null || n === undefined || isNaN(n)) return '0 GB';
  if (n >= 1000) return (n / 1000).toFixed(2) + ' TB';
  return n.toFixed(0) + ' GB';
}
function fmtPct(n, digits = 1) {
  if (n === null || n === undefined || isNaN(n)) return '0%';
  return n.toFixed(digits) + '%';
}
function fmtMs(n) {
  if (n === null || n === undefined || isNaN(n)) return '0ms';
  return Math.round(n) + 'ms';
}
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function timeAgo(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function growthPill(pct) {
  const up = pct >= 0;
  const cls = up ? 'pill-red' : 'pill-green';
  const icon = up ? '▲' : '▼';
  return `<span class="pill ${cls}">${icon} ${Math.abs(pct).toFixed(1)}%</span>`;
}
function utilBarColor(pct) {
  if (pct >= 90) return '#ef4444';
  if (pct >= 75) return '#f59e0b';
  return '#22c55e';
}
function statusPill(status) {
  const map = {
    'Healthy': 'pill-green', 'Active': 'pill-green', 'Success': 'pill-green', 'Resolved': 'pill-green', 'Approved': 'pill-green',
    'Warning': 'pill-amber', 'Near Limit': 'pill-amber', 'Pending': 'pill-amber', 'Acknowledged': 'pill-amber', 'Retry': 'pill-amber',
    'Critical': 'pill-red', 'Exceeded': 'pill-red', 'Open': 'pill-red', 'Rejected': 'pill-red', 'Failed': 'pill-red',
    'Disabled': 'pill-gray', 'Suspended': 'pill-gray',
    'Experimental': 'pill-violet'
  };
  return `<span class="pill ${map[status] || 'pill-gray'}">${status}</span>`;
}
function severityPill(sev) {
  const map = { 'Critical': 'pill-red', 'High': 'pill-amber', 'Medium': 'pill-blue', 'Low': 'pill-gray' };
  return `<span class="pill ${map[sev] || 'pill-gray'}">${sev}</span>`;
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
}
function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }
