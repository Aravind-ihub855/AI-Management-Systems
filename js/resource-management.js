/* ==========================================================================
   AI Resource Management — Agent Inventory + Employee Admin Panel
   ========================================================================== */

let RM_STATE = { agents: [], employees: [], selectedEmployeeIds: new Set() };

document.addEventListener('DOMContentLoaded', async () => {
  await loadRMData();
  initTabs();
  renderAgentTable();
  initAgentFilters();
  renderEmployeeTable();
  initEmployeeFilters();
  initBulkActions();
});

async function loadRMData() {
  const [agents, employees] = await Promise.all([fetchAll('agents'), fetchAll('employees')]);
  RM_STATE.agents = agents;
  RM_STATE.employees = employees;
}

function initTabs() {
  const links = document.querySelectorAll('.sidebar .side-link');
  
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab') || 'agents';
  activateTab(initialTab);

  links.forEach(link => {
    const navVal = link.dataset.nav;
    if (navVal && navVal.startsWith('tab-')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = navVal.replace('tab-', '');
        try {
          window.history.pushState(null, '', `resource-management.html?tab=${tab}`);
          activateTab(tab);
        } catch (err) {
          window.location.href = `resource-management.html?tab=${tab}`;
        }
      });
    }
  });

  window.addEventListener('popstate', () => {
    const p = new URLSearchParams(window.location.search);
    const tab = p.get('tab') || 'agents';
    activateTab(tab);
  });
}

function activateTab(tab) {
  document.querySelectorAll('.sidebar .side-link').forEach(l => {
    if (l.dataset.nav === `tab-${tab}`) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  document.querySelectorAll('section[id^="tab-"]').forEach(s => {
    if (s.id === `tab-${tab}`) {
      s.classList.remove('hidden');
    } else {
      s.classList.add('hidden');
    }
  });

  const breadcrumb = document.getElementById('breadcrumb-tab');
  if (breadcrumb) {
    breadcrumb.textContent = tab === 'agents' ? 'Agent Inventory' : 'Employee Admin';
  }
}

/* ============================== AGENT INVENTORY ============================== */
function renderAgentTable() {
  const search = (document.getElementById('agent-search')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('agent-status-filter')?.value || 'All';
  let rows = RM_STATE.agents;
  if (statusFilter !== 'All') rows = rows.filter(a => a.status === statusFilter);
  if (search) rows = rows.filter(a => [a.agent_name, a.owner, a.department, a.purpose].join(' ').toLowerCase().includes(search));

  document.getElementById('agent-table-body').innerHTML = rows.map(a => `
    <tr class="clickable" onclick="openAgentModal('${a.id}')">
      <td class="font-semibold"><i class="fa-solid fa-robot text-blue-400 mr-2"></i>${a.agent_name}</td>
      <td class="font-mono-num text-slate-400">${a.agent_code}</td>
      <td>${a.department}</td>
      <td>${a.owner}</td>
      <td>${statusPill(a.status)}</td>
      <td class="text-slate-400 max-w-[220px] truncate" title="${a.purpose}">${a.purpose}</td>
      <td><span class="pill pill-gray">${a.environment}</span></td>
      <td class="font-mono-num">${fmtDate(a.created_date)}</td>
      <td class="font-mono-num">${fmtDate(a.last_updated)}</td>
      <td class="font-mono-num">${a.version}</td>
    </tr>`).join('') || '<tr><td colspan="10" class="text-center text-slate-500 py-6">No agents match your filters.</td></tr>';
}
function initAgentFilters() {
  document.getElementById('agent-search').addEventListener('input', renderAgentTable);
  document.getElementById('agent-status-filter').addEventListener('change', renderAgentTable);
}

function parseDetails(detailsStr) {
  // e.g. "Primary: GPT-5, Fallback: Claude 3.7 Sonnet, Embedding: text-embedding-3-large"
  const map = {};
  (detailsStr || '').split(',').forEach(part => {
    const [k, v] = part.split(':').map(s => s && s.trim());
    if (k && v) map[k] = v;
  });
  return map;
}

function openAgentModal(agentId) {
  const a = RM_STATE.agents.find(x => x.id === agentId);
  if (!a) return;
  const det = parseDetails(a.details);

  // Deterministic pseudo-random derived metrics based on agent cost/tokens for consistent demo data
  const seed = a.cost_total + a.monthly_tokens % 1000;
  const rnd = (min, max, salt=0) => {
    const x = Math.sin(seed + salt) * 10000;
    const frac = x - Math.floor(x);
    return min + frac * (max - min);
  };

  const dailyTok = Math.round(a.monthly_tokens / 30);
  const weeklyTok = Math.round(a.monthly_tokens / 4.3);
  const peakTok = Math.round(dailyTok * 1.6);
  const avgTok = Math.round(dailyTok * 0.9);

  const promptTok = Math.round(a.monthly_tokens * 0.55);
  const completionTok = Math.round(a.monthly_tokens * 0.30);
  const cachedTok = Math.round(a.monthly_tokens * 0.08);
  const embeddingTok = Math.round(a.monthly_tokens * 0.04);
  const reasoningTok = a.agent_type === 'Workflow' || a.agent_type === 'Research' ? Math.round(a.monthly_tokens * 0.02) : 0;
  const toolTok = Math.round(a.monthly_tokens * 0.01);

  const costLLM = a.cost_total * 0.62;
  const costEmbed = a.cost_total * 0.08;
  const costVector = a.cost_total * 0.07;
  const costStorage = a.cost_total * 0.03;
  const costCloud = a.cost_total * 0.09;
  const costAPI = a.cost_total * 0.04;
  const costTool = a.cost_total * 0.02;
  const costCache = a.cost_total * 0.01;
  const costDB = a.cost_total * 0.02;
  const costLog = a.cost_total * 0.01;
  const costMon = a.cost_total * 0.01;

  const isRAG = a.agent_type === 'RAG';
  const modal = document.getElementById('agent-modal-content');
  modal.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center"><i class="fa-solid fa-robot text-white"></i></div>
        <div>
          <h3 class="text-lg font-bold">${a.agent_name} <span class="text-slate-500 text-xs font-mono-num">${a.agent_code}</span></h3>
          <p class="text-xs text-slate-400">${a.department} · Owner: ${a.owner} · v${a.version}</p>
        </div>
      </div>
      <button onclick="closeAgentModal()" class="btn-ghost"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <div class="flex flex-wrap gap-2 mb-4">
      ${statusPill(a.status)} <span class="pill pill-gray">${a.environment}</span> <span class="pill pill-blue">${a.agent_type}</span>
      <span class="pill pill-gray">Created ${fmtDate(a.created_date)}</span> <span class="pill pill-gray">Updated ${fmtDate(a.last_updated)}</span>
    </div>

    <!-- Agent Overview -->
    <div class="glass-card p-4 mb-4">
      <p class="section-title mb-2">Agent Overview</p>
      <p class="text-sm text-slate-300 mb-3">${a.purpose}</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
        <div><span class="text-slate-400">Agent Type</span><p class="font-semibold">${a.agent_type}</p></div>
        <div><span class="text-slate-400">Primary Model</span><p class="font-semibold">${det['Primary'] || '—'}</p></div>
        <div><span class="text-slate-400">Fallback Model</span><p class="font-semibold">${det['Fallback'] || '—'}</p></div>
        <div><span class="text-slate-400">Embedding Model</span><p class="font-semibold">${det['Embedding'] || '—'}</p></div>
        <div><span class="text-slate-400">OCR</span><p class="font-semibold">${det['OCR'] || 'Not used'}</p></div>
        <div><span class="text-slate-400">Speech</span><p class="font-semibold">${det['Speech'] || 'Not used'}</p></div>
        <div><span class="text-slate-400">Vision</span><p class="font-semibold">${det['Vision'] || 'Not used'}</p></div>
        <div><span class="text-slate-400">Image</span><p class="font-semibold">${det['Image'] || 'Not used'}</p></div>
        <div><span class="text-slate-400">Reasoning</span><p class="font-semibold">${reasoningTok > 0 ? 'Enabled' : 'Not used'}</p></div>
      </div>
    </div>

    <!-- Resource Usage -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <div class="glass-card p-4">
        <p class="section-title mb-2">Resource Usage — Tokens</p>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div><span class="text-slate-400">Daily Tokens</span><p class="font-mono-num font-semibold">${fmtNum(dailyTok)}</p></div>
          <div><span class="text-slate-400">Weekly Tokens</span><p class="font-mono-num font-semibold">${fmtNum(weeklyTok)}</p></div>
          <div><span class="text-slate-400">Monthly Tokens</span><p class="font-mono-num font-semibold">${fmtNum(a.monthly_tokens)}</p></div>
          <div><span class="text-slate-400">Peak Tokens</span><p class="font-mono-num font-semibold">${fmtNum(peakTok)}</p></div>
          <div><span class="text-slate-400">Average Tokens</span><p class="font-mono-num font-semibold">${fmtNum(avgTok)}</p></div>
        </div>
      </div>
      <div class="glass-card p-4">
        <p class="section-title mb-2">Token Details</p>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div><span class="text-slate-400">Prompt Tokens</span><p class="font-mono-num font-semibold">${fmtNum(promptTok)}</p></div>
          <div><span class="text-slate-400">Completion Tokens</span><p class="font-mono-num font-semibold">${fmtNum(completionTok)}</p></div>
          <div><span class="text-slate-400">Cached Tokens</span><p class="font-mono-num font-semibold text-cyan-400">${fmtNum(cachedTok)}</p></div>
          <div><span class="text-slate-400">Embedding Tokens</span><p class="font-mono-num font-semibold">${fmtNum(embeddingTok)}</p></div>
          <div><span class="text-slate-400">Reasoning Tokens</span><p class="font-mono-num font-semibold">${reasoningTok ? fmtNum(reasoningTok) : 'N/A'}</p></div>
          <div><span class="text-slate-400">Tool Tokens</span><p class="font-mono-num font-semibold">${fmtNum(toolTok)}</p></div>
        </div>
      </div>
    </div>

    <!-- Cost Breakdown -->
    <div class="glass-card p-4 mb-4">
      <p class="section-title mb-2">Cost Breakdown</p>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-[11px]">
        <div><span class="text-slate-400">LLM</span><p class="font-mono-num font-semibold">${fmtUSD(costLLM)}</p></div>
        <div><span class="text-slate-400">Embedding</span><p class="font-mono-num font-semibold">${fmtUSD(costEmbed)}</p></div>
        <div><span class="text-slate-400">Vector Search</span><p class="font-mono-num font-semibold">${fmtUSD(costVector)}</p></div>
        <div><span class="text-slate-400">Storage</span><p class="font-mono-num font-semibold">${fmtUSD(costStorage)}</p></div>
        <div><span class="text-slate-400">Cloud</span><p class="font-mono-num font-semibold">${fmtUSD(costCloud)}</p></div>
        <div><span class="text-slate-400">API</span><p class="font-mono-num font-semibold">${fmtUSD(costAPI)}</p></div>
        <div><span class="text-slate-400">Tool</span><p class="font-mono-num font-semibold">${fmtUSD(costTool)}</p></div>
        <div><span class="text-slate-400">Cache</span><p class="font-mono-num font-semibold">${fmtUSD(costCache)}</p></div>
        <div><span class="text-slate-400">Database</span><p class="font-mono-num font-semibold">${fmtUSD(costDB)}</p></div>
        <div><span class="text-slate-400">Logging</span><p class="font-mono-num font-semibold">${fmtUSD(costLog)}</p></div>
        <div><span class="text-slate-400">Monitoring</span><p class="font-mono-num font-semibold">${fmtUSD(costMon)}</p></div>
        <div class="border-l border-white/10 pl-2"><span class="text-slate-400">TOTAL</span><p class="font-mono-num font-bold text-base">${fmtUSD(a.cost_total)}</p></div>
      </div>
    </div>

    ${isRAG ? `
    <!-- RAG Details -->
    <div class="glass-card p-4 mb-4">
      <p class="section-title mb-2">RAG Details</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] mb-2">
        <div><span class="text-slate-400">Knowledge Bases</span><p class="font-semibold">${det['Vector DB'] || '2'}</p></div>
        <div><span class="text-slate-400">Collections</span><p class="font-semibold">${Math.round(3+rnd(0,5,1))}</p></div>
        <div><span class="text-slate-400">Documents</span><p class="font-mono-num font-semibold">${fmtInt(8000+rnd(0,20000,2))}</p></div>
        <div><span class="text-slate-400">Chunks</span><p class="font-mono-num font-semibold">${fmtInt(80000+rnd(0,200000,3))}</p></div>
        <div><span class="text-slate-400">Embeddings</span><p class="font-mono-num font-semibold">${fmtInt(90000+rnd(0,220000,4))}</p></div>
        <div><span class="text-slate-400">Chunk Size</span><p class="font-semibold">${Math.round(400+rnd(0,150,5))} tokens</p></div>
        <div><span class="text-slate-400">Retrieval Time</span><p class="font-semibold">${Math.round(20+rnd(0,40,6))}ms</p></div>
        <div><span class="text-slate-400">Embedding Refresh</span><p class="font-semibold">Every 24h</p></div>
      </div>
      <div class="flex flex-wrap gap-3 text-[11px]">
        <p><span class="text-slate-400">Top Documents:</span> <span class="chip">Policy_v4.pdf</span><span class="chip">FAQ_Master.docx</span></p>
        <p><span class="text-slate-400">Unused Documents:</span> <span class="font-semibold text-amber-400">${Math.round(rnd(2,40,7))}</span></p>
        <p><span class="text-slate-400">Duplicate Documents:</span> <span class="font-semibold text-red-400">${Math.round(rnd(0,12,8))}</span></p>
      </div>
    </div>` : ''}

    <!-- Tool Usage -->
    <div class="glass-card p-4 mb-4">
      <p class="section-title mb-2">Tool Usage</p>
      <div class="table-scroll" style="max-height:200px">
        <table class="data-table"><thead><tr><th>Tool</th><th>Usage Count</th><th>Success</th><th>Failures</th><th>Latency</th><th>Cost</th></tr></thead>
        <tbody>${['Slack','GitHub','Jira','Salesforce','Google Drive','Notion','SharePoint','Databases','REST APIs'].map((tool,idx)=>{
          const usage = Math.round(200 + rnd(0,4000,idx+10));
          const fail = Math.round(usage * (0.01+rnd(0,0.04,idx+20)));
          return `<tr><td class="font-semibold">${tool}</td><td class="font-mono-num">${fmtInt(usage)}</td>
          <td class="font-mono-num text-green-400">${fmtInt(usage-fail)}</td><td class="font-mono-num text-red-400">${fmtInt(fail)}</td>
          <td class="font-mono-num">${Math.round(80+rnd(0,300,idx+30))}ms</td><td class="font-mono-num">${fmtUSDFull(usage*0.002)}</td></tr>`;
        }).join('')}</tbody></table>
      </div>
    </div>

    <!-- Infrastructure + Performance -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <div class="glass-card p-4">
        <p class="section-title mb-2">Infrastructure</p>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div><span class="text-slate-400">CPU</span><p class="font-semibold">${Math.round(4+rnd(0,24,40))} vCPU</p></div>
          <div><span class="text-slate-400">GPU</span><p class="font-semibold">${Math.round(rnd(0,4,41))} GPU</p></div>
          <div><span class="text-slate-400">RAM</span><p class="font-semibold">${Math.round(8+rnd(0,48,42))} GB</p></div>
          <div><span class="text-slate-400">Storage</span><p class="font-semibold">${Math.round(20+rnd(0,180,43))} GB</p></div>
          <div><span class="text-slate-400">Bandwidth</span><p class="font-semibold">${Math.round(50+rnd(0,400,44))} GB/mo</p></div>
          <div><span class="text-slate-400">Pods</span><p class="font-semibold">${Math.round(2+rnd(0,10,45))}</p></div>
          <div><span class="text-slate-400">Containers</span><p class="font-semibold">${Math.round(2+rnd(0,14,46))}</p></div>
          <div><span class="text-slate-400">Autoscaling</span><p class="font-semibold">${rnd(0,1,47) > 0.3 ? 'Enabled' : 'Disabled'}</p></div>
        </div>
      </div>
      <div class="glass-card p-4">
        <p class="section-title mb-2">Performance</p>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div><span class="text-slate-400">Response Time</span><p class="font-semibold">${Math.round(300+rnd(0,900,50))}ms</p></div>
          <div><span class="text-slate-400">Accuracy</span><p class="font-semibold">${(88+rnd(0,10,51)).toFixed(1)}%</p></div>
          <div><span class="text-slate-400">Hallucination Rate</span><p class="font-semibold">${(0.5+rnd(0,3,52)).toFixed(2)}%</p></div>
          <div><span class="text-slate-400">Failure Rate</span><p class="font-semibold">${(0.2+rnd(0,2,53)).toFixed(2)}%</p></div>
          <div><span class="text-slate-400">Retry Rate</span><p class="font-semibold">${(0.5+rnd(0,4,54)).toFixed(2)}%</p></div>
          <div><span class="text-slate-400">Tool Success</span><p class="font-semibold">${(90+rnd(0,9,55)).toFixed(1)}%</p></div>
          <div><span class="text-slate-400">RAG Recall</span><p class="font-semibold">${isRAG ? (75+rnd(0,20,56)).toFixed(1)+'%' : 'N/A'}</p></div>
          <div><span class="text-slate-400">Grounding Score</span><p class="font-semibold">${isRAG ? (0.7+rnd(0,0.28,57)).toFixed(2) : 'N/A'}</p></div>
        </div>
      </div>
    </div>

    <!-- Budget + Security -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="glass-card p-4">
        <p class="section-title mb-2">Budget</p>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div><span class="text-slate-400">Daily Budget</span><p class="font-mono-num font-semibold">${fmtUSD(a.cost_total/30*1.4)}</p></div>
          <div><span class="text-slate-400">Monthly Budget</span><p class="font-mono-num font-semibold">${fmtUSD(a.cost_total*1.3)}</p></div>
          <div><span class="text-slate-400">Hard Limit</span><p class="font-mono-num font-semibold">${fmtUSD(a.cost_total*1.6)}</p></div>
          <div><span class="text-slate-400">Soft Limit</span><p class="font-mono-num font-semibold">${fmtUSD(a.cost_total*1.35)}</p></div>
          <div><span class="text-slate-400">Allowed Models</span><p class="font-semibold">${det['Primary']||''}${det['Fallback']?', '+det['Fallback']:''}</p></div>
          <div><span class="text-slate-400">Priority</span><p class="font-semibold">${a.status==='Critical'?'Critical':'Standard'}</p></div>
          <div class="col-span-2"><span class="text-slate-400">Routing Policy</span><p class="font-semibold">Cost-optimized with fallback on error</p></div>
        </div>
      </div>
      <div class="glass-card p-4">
        <p class="section-title mb-2">Security</p>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div><span class="text-slate-400">API Keys</span><p class="font-semibold">3 active (rotated 12d ago)</p></div>
          <div><span class="text-slate-400">Secrets</span><p class="font-semibold">Vault-managed</p></div>
          <div><span class="text-slate-400">Access Roles</span><p class="font-semibold">Agent-Operator, Read-Only</p></div>
          <div><span class="text-slate-400">Allowed Teams</span><p class="font-semibold">${a.department}</p></div>
          <div><span class="text-slate-400">Audit Logs</span><p class="font-semibold">Enabled · 90d retention</p></div>
          <div><span class="text-slate-400">Compliance</span><p class="font-semibold">SOC2, GDPR</p></div>
          <div class="col-span-2"><span class="text-slate-400">PII Detection</span><p class="font-semibold text-green-400">Active — auto-redaction on</p></div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('agent-modal').classList.remove('hidden');
}
function closeAgentModal() { document.getElementById('agent-modal').classList.add('hidden'); }

/* ============================== EMPLOYEE MANAGEMENT ============================== */
function initEmployeeFilters() {
  const depts = [...new Set(RM_STATE.employees.map(e => e.department))];
  const roles = [...new Set(RM_STATE.employees.map(e => e.role))];
  document.getElementById('emp-dept-filter').innerHTML = '<option value="All">All Departments</option>' + depts.map(d => `<option>${d}</option>`).join('');
  document.getElementById('emp-role-filter').innerHTML = '<option value="All">All Roles</option>' + roles.map(r => `<option>${r}</option>`).join('');

  ['emp-search','emp-dept-filter','emp-role-filter','emp-status-filter'].forEach(id =>
    document.getElementById(id).addEventListener('input', renderEmployeeTable));
}

function filteredEmployees() {
  const search = (document.getElementById('emp-search')?.value || '').toLowerCase();
  const dept = document.getElementById('emp-dept-filter')?.value || 'All';
  const role = document.getElementById('emp-role-filter')?.value || 'All';
  const status = document.getElementById('emp-status-filter')?.value || 'All';
  let rows = RM_STATE.employees;
  if (dept !== 'All') rows = rows.filter(e => e.department === dept);
  if (role !== 'All') rows = rows.filter(e => e.role === role);
  if (status !== 'All') rows = rows.filter(e => e.status === status);
  if (search) rows = rows.filter(e => [e.employee_name, e.employee_code, e.manager].join(' ').toLowerCase().includes(search));
  return rows;
}

function renderEmployeeTable() {
  const rows = filteredEmployees();
  document.getElementById('employee-table-body').innerHTML = rows.map(e => `
    <tr>
      <td><input type="checkbox" class="emp-row-checkbox" data-id="${e.id}" ${RM_STATE.selectedEmployeeIds.has(e.id) ? 'checked' : ''}></td>
      <td class="font-semibold">${e.employee_name}</td>
      <td class="font-mono-num text-slate-400">${e.employee_code}</td>
      <td>${e.department}</td>
      <td>${e.manager}</td>
      <td>${e.role}</td>
      <td>${statusPill(e.status)}</td>
      <td class="font-mono-num">${fmtInt(e.allocated_daily_tokens)}</td>
      <td class="font-mono-num">${fmtNum(e.allocated_monthly_tokens)}</td>
      <td class="font-mono-num">${fmtUSD(e.allocated_budget)}</td>
      <td class="font-mono-num">${fmtNum(e.consumed_monthly_tokens)}</td>
      <td class="font-mono-num">${fmtUSDFull(e.consumed_budget)}</td>
      <td class="font-mono-num ${e.remaining_budget < 0 ? 'text-red-400' : 'text-green-400'}">${fmtUSDFull(e.remaining_budget)}</td>
      <td><span class="pill pill-blue">${e.priority_level}</span></td>
      <td class="font-mono-num text-slate-400">${e.daily_reset_time}</td>
      <td class="font-mono-num">${fmtDate(e.budget_expiry)}</td>
      <td>${statusPill(e.approval_status)}</td>
    </tr>`).join('') || '<tr><td colspan="17" class="text-center text-slate-500 py-6">No employees match your filters.</td></tr>';

  qsa('.emp-row-checkbox').forEach(cb => cb.addEventListener('change', () => {
    if (cb.checked) RM_STATE.selectedEmployeeIds.add(cb.dataset.id); else RM_STATE.selectedEmployeeIds.delete(cb.dataset.id);
    updateSelectionCount();
  }));
  updateSelectionCount();

  document.getElementById('emp-select-all').onchange = (e) => {
    rows.forEach(r => { if (e.target.checked) RM_STATE.selectedEmployeeIds.add(r.id); else RM_STATE.selectedEmployeeIds.delete(r.id); });
    renderEmployeeTable();
  };
}
function updateSelectionCount() {
  document.getElementById('emp-selection-count').textContent = `${RM_STATE.selectedEmployeeIds.size} employee(s) selected`;
}

function initBulkActions() {
  qsa('#bulk-actions button').forEach(btn => btn.onclick = () => handleBulkAction(btn.dataset.action));
}

function handleBulkAction(action) {
  const selected = RM_STATE.employees.filter(e => RM_STATE.selectedEmployeeIds.has(e.id));
  if (selected.length === 0 && action !== 'export-reports') {
    alert('Please select at least one employee first.');
    return;
  }
  const titles = {
    'allocate-tokens': 'Allocate Additional Tokens',
    'increase-budget': 'Increase Budget',
    'reduce-budget': 'Reduce Budget',
    'assign-agents': 'Assign Agents',
    'restrict-models': 'Restrict Models',
    'suspend-access': 'Suspend Access',
    'export-reports': 'Export Reports'
  };
  const modal = document.getElementById('bulk-modal');
  let bodyHTML = '';

  if (action === 'allocate-tokens' || action === 'increase-budget' || action === 'reduce-budget') {
    const label = action === 'allocate-tokens' ? 'Tokens to add' : action === 'increase-budget' ? 'Budget increase ($)' : 'Budget reduction ($)';
    bodyHTML = `
      <p class="text-sm text-slate-300 mb-3">Applying to <b>${selected.length}</b> employee(s): ${selected.map(e=>e.employee_name).join(', ')}</p>
      <label class="text-xs text-slate-400 block mb-1">${label}</label>
      <input type="text" id="bulk-value-input" placeholder="e.g. 500000" class="w-full mb-4">
      <div class="flex justify-end gap-2"><button class="btn-ghost" onclick="closeBulkModal()">Cancel</button><button class="btn-primary" onclick="confirmBulkAction('${action}')">Apply</button></div>`;
  } else if (action === 'assign-agents') {
    const agentNames = RM_STATE.agents && RM_STATE.agents.length ? RM_STATE.agents.map(a=>a.agent_name) : ['Code Agent','Support Copilot','Finance Analyst Bot','HR Assistant'];
    bodyHTML = `
      <p class="text-sm text-slate-300 mb-3">Applying to <b>${selected.length}</b> employee(s)</p>
      <label class="text-xs text-slate-400 block mb-1">Select agent to grant access</label>
      <select id="bulk-value-input" class="w-full mb-4">${agentNames.map(a=>`<option>${a}</option>`).join('')}</select>
      <div class="flex justify-end gap-2"><button class="btn-ghost" onclick="closeBulkModal()">Cancel</button><button class="btn-primary" onclick="confirmBulkAction('${action}')">Apply</button></div>`;
  } else if (action === 'restrict-models') {
    bodyHTML = `
      <p class="text-sm text-slate-300 mb-3">Applying to <b>${selected.length}</b> employee(s)</p>
      <label class="text-xs text-slate-400 block mb-1">Select model to restrict</label>
      <select id="bulk-value-input" class="w-full mb-4"><option>GPT-5</option><option>Claude 3 Opus</option><option>Claude 3.7 Sonnet</option><option>Gemini 2.5 Pro</option></select>
      <div class="flex justify-end gap-2"><button class="btn-ghost" onclick="closeBulkModal()">Cancel</button><button class="btn-primary" onclick="confirmBulkAction('${action}')">Apply</button></div>`;
  } else if (action === 'suspend-access') {
    bodyHTML = `
      <p class="text-sm text-slate-300 mb-3">Suspend AI access for <b>${selected.length}</b> employee(s)?</p>
      <p class="text-xs text-amber-400 mb-4"><i class="fa-solid fa-triangle-exclamation mr-1"></i>This will immediately block all model & agent requests for the selected employees.</p>
      <div class="flex justify-end gap-2"><button class="btn-ghost" onclick="closeBulkModal()">Cancel</button><button class="btn-primary" style="background:linear-gradient(135deg,#ef4444,#f97316)" onclick="confirmBulkAction('${action}')">Suspend</button></div>`;
  } else if (action === 'export-reports') {
    const targets = selected.length ? selected : RM_STATE.employees;
    exportEmployeesCSV(targets);
    return;
  }

  modal.querySelector('#bulk-modal-content').innerHTML = `
    <div class="flex items-center justify-between mb-4"><h3 class="text-base font-bold">${titles[action]}</h3><button onclick="closeBulkModal()" class="btn-ghost"><i class="fa-solid fa-xmark"></i></button></div>
    ${bodyHTML}`;
  modal.classList.remove('hidden');
}

function confirmBulkAction(action) {
  const value = document.getElementById('bulk-value-input')?.value;
  const selected = RM_STATE.employees.filter(e => RM_STATE.selectedEmployeeIds.has(e.id));
  selected.forEach(e => {
    if (action === 'allocate-tokens') e.allocated_monthly_tokens += Number(value) || 0;
    if (action === 'increase-budget') e.allocated_budget += Number(value) || 0;
    if (action === 'reduce-budget') e.allocated_budget = Math.max(0, e.allocated_budget - (Number(value) || 0));
    if (action === 'suspend-access') e.status = 'Suspended';
    if (action === 'assign-agents' && value && !e.allowed_agents.includes(value)) e.allowed_agents.push(value);
    if (action === 'restrict-models' && value && !e.restricted_models.includes(value)) e.restricted_models.push(value);
  });
  closeBulkModal();
  renderEmployeeTable();
  showToast(`${titles_map(action)} applied to ${selected.length} employee(s).`);
}
function titles_map(action) {
  return { 'allocate-tokens':'Token allocation', 'increase-budget':'Budget increase', 'reduce-budget':'Budget reduction',
    'assign-agents':'Agent assignment', 'restrict-models':'Model restriction', 'suspend-access':'Access suspension' }[action] || 'Action';
}
function closeBulkModal() { document.getElementById('bulk-modal').classList.add('hidden'); }

function exportEmployeesCSV(rows) {
  const headers = ['Employee','ID','Department','Manager','Role','Status','AllocDailyTok','AllocMonthlyTok','AllocBudget','ConsumedTok','ConsumedBudget','RemainingBudget'];
  const csv = [headers.join(',')].concat(rows.map(e => [e.employee_name, e.employee_code, e.department, e.manager, e.role, e.status,
    e.allocated_daily_tokens, e.allocated_monthly_tokens, e.allocated_budget, e.consumed_monthly_tokens, e.consumed_budget, e.remaining_budget].join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'employee_ai_usage_report.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${rows.length} employee record(s) to CSV.`);
}

function showToast(msg) {
  const t = el(`<div class="fixed bottom-6 right-6 z-[100] glass-card px-4 py-3 text-sm shadow-xl">${msg}</div>`);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'agent-modal') closeAgentModal();
  if (e.target.id === 'bulk-modal') closeBulkModal();
});
