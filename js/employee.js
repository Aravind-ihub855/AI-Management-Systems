/* ==========================================================================
   Employee AI Usage Portal — single clean page (Persona 2)
   ========================================================================== */

let EMP_STATE = { employees: [], agents: [], current: null, requests: [], period: 'today' };

const agentPool = ['Support Copilot','Code Agent','Finance Analyst Bot','HR Assistant','Marketing Content Bot','Research Assistant','DevOps Bot','Sales RAG Bot'];
const modelColors = { 'GPT-5':'#22d3ee','GPT-4o':'#3b82f6','Claude 3.7 Sonnet':'#8b5cf6','Claude 3 Opus':'#a78bfa','Gemini 2.5 Pro':'#22c55e','Gemini 2.0 Flash':'#4ade80','Llama 3.1 70B':'#f59e0b','Mistral Large':'#f97316','DeepSeek V3':'#ef4444' };

document.addEventListener('DOMContentLoaded', async () => {
  const portalLink = document.getElementById('link-employee-portal');
  if (portalLink) portalLink.classList.add('active');
  await loadEmpData();
  populateEmployeeSelector();
  selectEmployee(EMP_STATE.employees[0].id);
  initUsageTabs();
  initRequestButtons();
  document.getElementById('history-search').addEventListener('input', renderActivityHistory);
});

async function loadEmpData() {
  const [employees, agents, requests] = await Promise.all([fetchAll('employees'), fetchAll('agents'), fetchAll('requests')]);
  EMP_STATE.employees = employees;
  EMP_STATE.agents = agents.length ? agents : agentPool.map(n => ({ agent_name: n }));
  EMP_STATE.requests = requests;
}

function populateEmployeeSelector() {
  const sel = document.getElementById('employee-selector');
  sel.innerHTML = EMP_STATE.employees.map(e => `<option value="${e.id}">${e.employee_name} — ${e.department}</option>`).join('');
  sel.addEventListener('change', () => selectEmployee(sel.value));
}

function selectEmployee(id) {
  const e = EMP_STATE.employees.find(x => x.id === id);
  EMP_STATE.current = e;
  document.getElementById('employee-selector').value = id;
  renderMySummary();
  renderUsage();
  renderMyAgents();
  renderMyModels();
  renderPromptAnalytics();
  renderResourceUsage();
  renderBudget();
  renderRecommendations();
  renderRequestStatus();
  renderActivityHistory();
  startResetTimer();
}

/* deterministic pseudo-random helper seeded by employee id string */
function seededRandom(seedStr, salt = 0) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i) * (i + 1);
  seed += salt * 97;
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function rndRange(seedStr, salt, min, max) { return min + seededRandom(seedStr, salt) * (max - min); }

/* ============================== 1. MY AI SUMMARY ============================== */
function renderMySummary() {
  const e = EMP_STATE.current;
  document.getElementById('emp-avatar').textContent = e.employee_name.split(' ').map(s => s[0]).join('').slice(0, 2);
  document.getElementById('emp-name').textContent = e.employee_name;
  document.getElementById('emp-department').textContent = e.department;
  document.getElementById('emp-manager').textContent = e.manager;

  const todaysBudget = e.allocated_budget / 22; // approx working days
  const todaysConsumed = e.consumed_daily_tokens / e.allocated_daily_tokens * todaysBudget;
  const remaining = Math.max(0, todaysBudget - todaysConsumed);
  const monthlyRemaining = e.remaining_budget;

  const kpis = [
    { label: "Today's Budget", value: fmtUSDFull(todaysBudget) },
    { label: "Today's Tokens", value: fmtInt(e.consumed_daily_tokens) + ' / ' + fmtInt(e.allocated_daily_tokens) },
    { label: 'Remaining Today', value: fmtUSDFull(remaining) },
    { label: 'Monthly Budget', value: fmtUSD(e.allocated_budget) },
    { label: 'Monthly Remaining', value: fmtUSDFull(monthlyRemaining) },
    { label: 'Status', value: '', pill: e.status },
    { label: 'Priority Level', value: e.priority_level },
    { label: 'Approval Status', value: '', pill: e.approval_status },
  ];
  document.getElementById('my-summary-kpis').innerHTML = kpis.map(k => `
    <div class="kpi-card"><p class="section-title mb-1">${k.label}</p>${k.pill ? statusPill(k.pill) : `<p class="text-base font-bold font-mono-num">${k.value}</p>`}</div>`).join('');
}

function startResetTimer() {
  clearInterval(window.__resetTimerInterval);
  window.__resetTimerInterval = setInterval(() => {
    const now = new Date();
    const midnight = new Date(now); midnight.setUTCHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
    document.getElementById('reset-timer').textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }, 1000);
}

/* ============================== 2. AI USAGE ============================== */
function initUsageTabs() {
  qsa('#usage-period-tabs button').forEach(btn => btn.onclick = () => {
    qsa('#usage-period-tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    EMP_STATE.period = btn.dataset.period;
    renderUsage();
  });
}
function renderUsage() {
  const e = EMP_STATE.current;
  const mult = { today: 1, week: 6.2, month: 26 }[EMP_STATE.period];
  const requests = Math.round((e.consumed_daily_tokens / 1800) * mult);
  const tokens = Math.round(e.consumed_daily_tokens * mult);
  const cost = tokens * 0.00007;
  const timeSaved = (e.time_saved_hours / 30) * (EMP_STATE.period === 'today' ? 1 : EMP_STATE.period === 'week' ? 7 : 30);

  const kpis = [
    { label: 'Requests', value: fmtInt(requests) },
    { label: 'Tokens', value: fmtNum(tokens) },
    { label: 'Cost', value: fmtUSDFull(cost) },
    { label: 'Time Saved', value: timeSaved.toFixed(1) + ' hrs' },
  ];
  document.getElementById('usage-kpis').innerHTML = kpis.map(k => `
    <div class="kpi-card"><p class="section-title mb-1">${k.label}</p><p class="text-lg font-bold font-mono-num">${k.value}</p></div>`).join('');
}

/* ============================== 3. MY AGENT USAGE ============================== */
function renderMyAgents() {
  const e = EMP_STATE.current;
  const agents = e.allowed_agents && e.allowed_agents.length ? e.allowed_agents : [agentPool[0]];
  const rows = agents.map((a, i) => {
    const requests = Math.round(rndRange(e.id, i, 80, 900));
    const tokens = Math.round(requests * rndRange(e.id, i + 10, 1200, 2400));
    const cost = tokens * 0.00008;
    const lastUsed = new Date(Date.now() - rndRange(e.id, i + 20, 0, 6) * 3600000);
    return { agent: a, requests, tokens, cost, lastUsed };
  });
  document.getElementById('my-agents-body').innerHTML = rows.map(r => `
    <tr><td class="font-semibold"><i class="fa-solid fa-robot text-blue-400 mr-2"></i>${r.agent}</td>
    <td class="font-mono-num">${fmtInt(r.requests)}</td><td class="font-mono-num">${fmtNum(r.tokens)}</td>
    <td class="font-mono-num">${fmtUSDFull(r.cost)}</td><td class="font-mono-num text-slate-400">${timeAgo(r.lastUsed)}</td></tr>`).join('');
}

/* ============================== 4. MY MODELS ============================== */
function renderMyModels() {
  const e = EMP_STATE.current;
  const models = e.allowed_models && e.allowed_models.length ? e.allowed_models : ['GPT-4o'];
  const usage = models.map((m, i) => Math.round(rndRange(e.id, i + 30, 15, 60)));
  const cost = models.map((m, i) => +(rndRange(e.id, i + 40, 20, 180)).toFixed(2));

  const ctx = document.getElementById('my-models-chart');
  if (window.__myModelsChart) window.__myModelsChart.destroy();
  window.__myModelsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: models,
      datasets: [{ data: usage, backgroundColor: models.map(m => modelColors[m] || '#64748b'), borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { color: '#475569', font: { size: 11 } } } }
    }
  });
}

/* ============================== 5. PROMPT ANALYTICS ============================== */
function renderPromptAnalytics() {
  const e = EMP_STATE.current;
  const avgPrompt = Math.round(rndRange(e.id, 1, 300, 900));
  const avgResponse = Math.round(rndRange(e.id, 2, 200, 700));
  const longest = Math.round(avgPrompt * rndRange(e.id, 3, 2.5, 5));
  const cacheHit = rndRange(e.id, 4, 40, 85);
  const items = [
    { label: 'Average Prompt Size', value: avgPrompt + ' tokens' },
    { label: 'Average Response Size', value: avgResponse + ' tokens' },
    { label: 'Longest Prompt', value: fmtInt(longest) + ' tokens' },
    { label: 'Most Used Prompt Type', value: ['Q&A','Summarization','Code Gen','Document Analysis'][Math.floor(rndRange(e.id,5,0,4))] },
    { label: 'Cache Hit Rate', value: fmtPct(cacheHit) },
  ];
  document.getElementById('prompt-analytics-grid').innerHTML = items.map(i => `
    <div class="glass-card p-3"><p class="section-title mb-1">${i.label}</p><p class="text-base font-bold font-mono-num text-slate-800">${i.value}</p></div>`).join('');
}

/* ============================== 6. RESOURCE USAGE ============================== */
function renderResourceUsage() {
  const e = EMP_STATE.current;
  const items = [
    { label: 'Documents Uploaded', value: fmtInt(Math.round(rndRange(e.id, 6, 2, 48))) },
    { label: 'Embeddings Created', value: fmtInt(Math.round(rndRange(e.id, 7, 200, 6000))) },
    { label: 'Storage Used', value: fmtGB(rndRange(e.id, 8, 0.4, 12)) },
    { label: 'Tool Calls', value: fmtInt(Math.round(rndRange(e.id, 9, 20, 800))) },
    { label: 'API Calls', value: fmtInt(Math.round(rndRange(e.id, 10, 50, 1500))) },
    { label: 'Knowledge Uploads', value: fmtInt(Math.round(rndRange(e.id, 11, 1, 20))) },
  ];
  document.getElementById('resource-usage-grid').innerHTML = items.map(i => `
    <div class="glass-card p-3"><p class="section-title mb-1">${i.label}</p><p class="text-base font-bold font-mono-num text-slate-800">${i.value}</p></div>`).join('');
}

/* ============================== 7. BUDGET ============================== */
function renderBudget() {
  const e = EMP_STATE.current;
  const pct = Math.min(100, (e.consumed_budget / e.allocated_budget) * 100);
  document.getElementById('budget-pct-label').textContent = fmtPct(pct);
  const bar = document.getElementById('budget-progress-bar');
  bar.style.width = pct + '%';
  bar.style.background = utilBarColor(pct);

  const daysLeft = 30 - new Date().getUTCDate() % 30;
  const forecastUntilReset = e.consumed_budget / (new Date().getUTCDate()) * daysLeft + e.consumed_budget;

  document.getElementById('budget-kpis').innerHTML = [
    { label: 'Allocated', value: fmtUSD(e.allocated_budget) },
    { label: 'Consumed', value: fmtUSDFull(e.consumed_budget) },
    { label: 'Remaining', value: fmtUSDFull(e.remaining_budget) },
    { label: 'Forecast Until Reset', value: fmtUSD(forecastUntilReset) },
  ].map(k => `<div class="glass-card p-3"><p class="section-title mb-1">${k.label}</p><p class="text-base font-bold font-mono-num text-slate-800">${k.value}</p></div>`).join('');

  const labels = Array.from({length: 14}, (_, i) => `Day ${i+1}`);
  const trend = labels.map((_, i) => Math.round((e.consumed_budget / 14) * (i + 1) * rndRange(e.id, 100 + i, 0.85, 1.15)));
  const ctx = document.getElementById('budget-trend-chart');
  if (window.__budgetChart) window.__budgetChart.destroy();
  window.__budgetChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Cumulative Spend ($)', data: trend, borderColor: '#2563eb', backgroundColor: '#2563eb11', fill: true, tension: 0.35, pointRadius: 2 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { color: '#475569', font: { size: 9 } }, grid: { display: false } }, y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: '#e2e8f0' } } } }
  });
}

/* ============================== 8. RECOMMENDATIONS ============================== */
function renderRecommendations() {
  const e = EMP_STATE.current;
  const all = [
    { text: 'Use a cheaper model for simple prompts.', icon: 'fa-money-bill-trend-up', show: true },
    { text: 'Reduce prompt length.', icon: 'fa-compress', show: rndRange(e.id, 200, 0, 1) > 0.3 },
    { text: 'Reuse cached results.', icon: 'fa-database', show: true },
    { text: 'Archive unused documents.', icon: 'fa-box-archive', show: rndRange(e.id, 201, 0, 1) > 0.4 },
    { text: 'Switch to RAG instead of repeatedly pasting documents.', icon: 'fa-diagram-project', show: true },
  ];
  document.getElementById('recommendations-list').innerHTML = all.filter(r => r.show).map(r => `
    <div class="glass-card p-3 flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><i class="fa-solid ${r.icon} text-amber-600"></i></div>
      <p class="text-sm text-slate-700 font-medium">${r.text}</p>
    </div>`).join('');
}

/* ============================== 9. REQUEST CENTER ============================== */
function initRequestButtons() {
  qsa('#request-center button[data-req]').forEach(btn => btn.onclick = () => openRequestModal(btn.dataset.req));
}
function openRequestModal(type) {
  const modal = document.getElementById('request-modal');
  modal.querySelector('#request-modal-content').innerHTML = `
    <div class="flex items-center justify-between mb-4"><h3 class="text-base font-bold text-slate-900">Request: ${type}</h3><button onclick="closeRequestModal()" class="btn-ghost"><i class="fa-solid fa-xmark"></i></button></div>
    <label class="text-xs text-slate-500 block mb-1">Details / Justification</label>
    <textarea id="req-details" rows="4" class="w-full mb-4" style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; color:#0f172a; font-size:0.82rem;" placeholder="Explain why you need this..."></textarea>
    <div class="flex justify-end gap-2"><button class="btn-ghost" onclick="closeRequestModal()">Cancel</button><button class="btn-primary" onclick="submitRequest('${type}')">Submit Request</button></div>`;
  modal.classList.remove('hidden');
}
function closeRequestModal() { document.getElementById('request-modal').classList.add('hidden'); }
async function submitRequest(type) {
  const details = document.getElementById('req-details').value || 'No additional details provided.';
  const e = EMP_STATE.current;
  const newReq = { employee_name: e.employee_name, request_type: type, details, status: 'Pending', submitted_at: new Date().toISOString() };
  try { await createRow('requests', newReq); } catch(err) { console.error(err); }
  EMP_STATE.requests.unshift({ id: 'local-' + Date.now(), ...newReq });
  closeRequestModal();
  renderRequestStatus();
}
function renderRequestStatus() {
  const e = EMP_STATE.current;
  const mine = EMP_STATE.requests.filter(r => r.employee_name === e.employee_name);
  document.getElementById('request-status-body').innerHTML = mine.map(r => `
    <tr><td class="font-semibold">${r.request_type}</td><td class="text-slate-400 max-w-[280px] truncate" title="${r.details}">${r.details}</td>
    <td>${statusPill(r.status)}</td><td class="font-mono-num text-slate-400">${fmtDateTime(r.submitted_at)}</td></tr>`).join('')
    || '<tr><td colspan="4" class="text-center text-slate-500 py-4">No requests submitted yet.</td></tr>';
}

/* ============================== 10. ACTIVITY HISTORY ============================== */
function generateActivityHistory(e) {
  const count = 40;
  const agents = e.allowed_agents && e.allowed_agents.length ? e.allowed_agents : [agentPool[0]];
  const models = e.allowed_models && e.allowed_models.length ? e.allowed_models : ['GPT-4o'];
  return Array.from({ length: count }, (_, i) => {
    const agent = agents[Math.floor(rndRange(e.id, 500 + i, 0, agents.length))];
    const model = models[Math.floor(rndRange(e.id, 600 + i, 0, models.length))];
    const tokens = Math.round(rndRange(e.id, 700 + i, 400, 4500));
    const cost = +(tokens * 0.00008).toFixed(4);
    const latency = Math.round(rndRange(e.id, 800 + i, 250, 1200));
    const status = rndRange(e.id, 900 + i, 0, 1) > 0.94 ? 'Failed' : (rndRange(e.id, 950+i,0,1) > 0.9 ? 'Retry' : 'Success');
    const time = new Date(Date.now() - i * rndRange(e.id, 1000 + i, 1800000, 5400000));
    return { time, promptId: `PMT-${90000 + Math.round(rndRange(e.id, 1100+i,0,9000))}`, agent, model, tokens, cost, latency, status };
  });
}
function renderActivityHistory() {
  const e = EMP_STATE.current;
  const search = (document.getElementById('history-search')?.value || '').toLowerCase();
  let history = generateActivityHistory(e);
  if (search) history = history.filter(h => [h.promptId, h.agent, h.model].join(' ').toLowerCase().includes(search));
  document.getElementById('activity-history-body').innerHTML = history.map(h => `
    <tr><td class="font-mono-num text-slate-400">${fmtDateTime(h.time)}</td><td class="font-mono-num">${h.promptId}</td>
    <td>${h.agent}</td><td>${h.model}</td><td class="font-mono-num">${fmtInt(h.tokens)}</td>
    <td class="font-mono-num">${fmtUSDFull(h.cost)}</td><td class="font-mono-num">${fmtMs(h.latency)}</td><td>${statusPill(h.status)}</td></tr>`).join('');
}

document.addEventListener('click', (e) => { if (e.target.id === 'request-modal') closeRequestModal(); });
