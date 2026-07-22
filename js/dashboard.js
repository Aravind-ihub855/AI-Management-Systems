/* ==========================================================================
   Mission Control Dashboard — index.html logic
   ========================================================================== */

let STATE = {
  exec: null, costCats: [], llm: [], embeddings: [], vectorDbs: [], vectorCollections: [],
  cloudInfra: [], dbMonitor: [], apiConsumption: [], departments: [], employees: [],
  agents: [], alerts: [], activity: []
};

document.addEventListener('DOMContentLoaded', async () => {
  startClock();
  await loadAllData();
  renderExecutiveSummary();
  renderCostBreakdown();
  renderLLMBreakdown();
  renderEmbeddingModels();
  renderVectorDatabases();
  renderCloudInfrastructure();
  renderDatabaseMonitoring();
  renderApiConsumption();
  renderAgentSummary();
  renderEmployeeConsumption();
  renderDepartmentSummary();
  renderAlerts();
  renderForecast();
  renderActivityFeed();
  simulateLiveUpdates();
  initCategorySidebar();
});

function initCategorySidebar() {
  const links = document.querySelectorAll('.sidebar .side-link');
  
  const params = new URLSearchParams(window.location.search);
  const initialCat = params.get('cat') || 'overview';
  activateCategory(initialCat);

  links.forEach(link => {
    const navVal = link.dataset.nav;
    if (navVal && navVal.startsWith('cat-')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = navVal.replace('cat-', '');
        try {
          window.history.pushState(null, '', `index.html?cat=${cat}`);
          activateCategory(cat);
        } catch (err) {
          window.location.href = `index.html?cat=${cat}`;
        }
      });
    }
  });

  window.addEventListener('popstate', () => {
    const p = new URLSearchParams(window.location.search);
    const cat = p.get('cat') || 'overview';
    activateCategory(cat);
  });
}

function activateCategory(cat) {
  document.querySelectorAll('.sidebar .side-link').forEach(l => {
    if (l.dataset.nav === `cat-${cat}`) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  document.querySelectorAll('.cat-section').forEach(sec => {
    if (sec.id === `cat-${cat}`) {
      sec.classList.remove('hidden');
    } else {
      sec.classList.add('hidden');
    }
  });

  const breadcrumb = document.getElementById('breadcrumb-category');
  if (breadcrumb) {
    const formatMap = {
      'overview': 'Overview',
      'llm': 'LLM Provider',
      'rag': 'RAG Space',
      'infra': 'Infrastructure',
      'teams': 'Teams & Agents',
      'forecast': 'Spend Forecasts'
    };
    breadcrumb.textContent = formatMap[cat] || cat;
  }
}

function startClock() {
  const clockEl = document.getElementById('clock-time');
  if (!clockEl) return;
  function tick() {
    clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  }
  tick(); setInterval(tick, 1000);
}

async function loadAllData() {
  const [exec, costCats, llm, embeddings, vectorDbs, vectorCollections, cloudInfra, dbMonitor,
    apiConsumption, departments, employees, agents, alerts, activity] = await Promise.all([
    fetchAll('executive_summary'), fetchAll('cost_breakdown_categories'), fetchAll('llm_usage'),
    fetchAll('embedding_models'), fetchAll('vector_databases'), fetchAll('vector_collections'),
    fetchAll('cloud_infrastructure'), fetchAll('databases_monitoring'), fetchAll('api_consumption'),
    fetchAll('departments'), fetchAll('employees'), fetchAll('agents'), fetchAll('alerts'), fetchAll('activity_feed')
  ]);
  STATE = { exec: exec[0] || {}, costCats, llm, embeddings, vectorDbs, vectorCollections, cloudInfra, dbMonitor, apiConsumption, departments, employees, agents, alerts, activity };
}

/* ============================== 1. EXECUTIVE SUMMARY ============================== */
function renderExecutiveSummary() {
  const e = STATE.exec;
  const kpis = [
    { label: 'Total AI Spend Today', value: fmtUSD(e.total_spend_today), icon: 'fa-dollar-sign', color: 'text-cyan-600' },
    { label: 'Monthly AI Spend', value: fmtUSD(e.monthly_spend), icon: 'fa-chart-line', color: 'text-blue-600' },
    { label: 'Monthly Budget (Allocated)', value: fmtUSD(e.monthly_budget), icon: 'fa-wallet', color: 'text-violet-600' },
    { label: 'Budget Remaining', value: fmtUSD(e.budget_remaining), icon: 'fa-piggy-bank', color: 'text-green-600' },
    { label: 'Cost vs Last Month', value: '+' + fmtUSD(e.cost_diff_vs_last_month), icon: 'fa-arrow-trend-up', color: 'text-red-500' },
    { label: 'Employees Using AI', value: fmtInt(e.total_employees_using_ai), icon: 'fa-users', color: 'text-cyan-600' },
    { label: 'Active AI Agents', value: fmtInt(e.total_active_agents), icon: 'fa-robot', color: 'text-blue-600' },
    { label: 'Total Tokens Consumed', value: fmtNum(e.total_tokens_consumed), icon: 'fa-coins', color: 'text-amber-600' },
    { label: 'Infrastructure Cost', value: fmtUSD(e.total_infra_cost), icon: 'fa-server', color: 'text-green-600' },
    { label: 'External API Cost', value: fmtUSD(e.total_external_api_cost), icon: 'fa-plug', color: 'text-red-600' },
  ];
  
  const grid = document.getElementById('kpi-grid');
  grid.innerHTML = kpis.map(k => {
    const isCostIncrease = k.label === 'Cost vs Last Month';
    const colorKey = isCostIncrease ? 'red' : k.color.replace('text-', '').split('-')[0];
    const cardClass = isCostIncrease 
      ? 'kpi-card is-warning flex flex-col justify-between min-h-[128px]' 
      : 'kpi-card flex flex-col justify-between min-h-[128px]';
    const valueClass = isCostIncrease 
      ? 'text-2xl font-extrabold font-mono-num text-red-600 mt-4' 
      : 'text-2xl font-extrabold font-mono-num text-slate-800 mt-4';

    return `
      <div class="${cardClass}">
        <div class="flex items-start justify-between gap-2">
          <span class="kpi-title text-slate-500 font-bold uppercase tracking-wider text-[10px] leading-tight">${k.label}</span>
          <div class="icon-capsule capsule-${colorKey}">
            <i class="fa-solid ${k.icon} text-xs"></i>
          </div>
        </div>
        <p class="${valueClass}">${k.value}</p>
      </div>`;
  }).join('');

  // Overall Health Score logical story
  document.getElementById('health-score-value').textContent = e.overall_health_score;
  const fill = document.getElementById('health-score-fill');
  fill.style.width = e.overall_health_score + '%';

  if (e.overall_health_score >= 80) {
    fill.className = 'progress-fill bg-emerald-500';
  } else if (e.overall_health_score >= 60) {
    fill.className = 'progress-fill bg-amber-500';
  } else {
    fill.className = 'progress-fill bg-red-500';
  }

  // Tally system status details
  const totalAgents = STATE.agents.length;
  const healthyAgents = STATE.agents.filter(a => a.status === 'Healthy').length;
  document.getElementById('health-story-agents').textContent = `${healthyAgents}/${totalAgents} AI Agents Healthy`;

  const openAlerts = STATE.alerts.filter(a => a.status === 'Open').length;
  const alertText = openAlerts === 1 ? '1 Alert Pending Action' : `${openAlerts} Alerts Pending Action`;
  document.getElementById('health-story-alerts').textContent = alertText;

  const spendOverhead = ((e.monthly_spend / e.monthly_budget) * 100).toFixed(1);
  document.getElementById('health-story-overhead').textContent = `Spend at ${spendOverhead}% of total budget`;

  // Draw 30-Day spend trend chart
  renderSpendTrendChart();
}

function renderSpendTrendChart() {
  const e = STATE.exec;
  const avgDaily = e.monthly_spend / 30;
  
  const labels = Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
  const dataPoints = labels.map((_, i) => {
    const fluctuation = Math.sin(i * 0.4) * 1100 + (Math.random() - 0.5) * 700;
    return Math.round(avgDaily + fluctuation);
  });

  const ctx = document.getElementById('spend-trend-chart');
  if (!ctx) return;
  
  if (window.__spendTrendChart) window.__spendTrendChart.destroy();
  window.__spendTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Daily AI Spend ($)',
          data: dataPoints,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.05)',
          fill: true,
          tension: 0.35,
          pointRadius: 1.5,
          borderWidth: 2
        },
        {
          label: 'Daily Budget Limit ($)',
          data: Array(30).fill(15000),
          borderColor: '#ef4444',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: '#64748b', font: { size: 9 } },
          grid: { display: false }
        },
        y: {
          ticks: { color: '#64748b', font: { size: 9 } },
          grid: { color: '#f1f5f9' }
        }
      }
    }
  });
}

/* ============================== 2. AI COST BREAKDOWN ============================== */
function renderCostBreakdown() {
  const total = STATE.costCats.reduce((s, c) => s + c.current_cost, 0);
  document.getElementById('total-ai-cost-today').textContent = fmtUSDFull(total);
  const grid = document.getElementById('cost-breakdown-grid');
  const icons = {
    'LLM Cost': 'fa-brain', 'Embedding Cost': 'fa-vector-square', 'Vector Database': 'fa-database',
    'Cloud Compute': 'fa-cloud', 'GPU': 'fa-microchip', 'CPU': 'fa-microchip', 'Storage': 'fa-hard-drive',
    'Redis Cache': 'fa-bolt', 'Hosting': 'fa-server', 'Bandwidth': 'fa-network-wired', 'Database': 'fa-table',
    'External APIs': 'fa-plug', 'OCR': 'fa-file-lines', 'Speech APIs': 'fa-microphone', 'Image Generation': 'fa-image',
    'Monitoring Tools': 'fa-gauge-high'
  };
  grid.innerHTML = STATE.costCats.map(c => {
    const dod = c.yesterday_cost > 0 ? ((c.current_cost - c.yesterday_cost) / c.yesterday_cost) * 100 : 0;
    return `
      <div class="glass-card p-5 flex flex-col justify-between min-h-[190px]">
        <div>
          <!-- Split grid for header + primary stats -->
          <div class="flex justify-between items-start mb-4">
            <div class="space-y-1">
              <span class="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <i class="fa-solid ${icons[c.category] || 'fa-circle'} text-[12px] text-blue-500"></i>
                ${c.category}
              </span>
              <p class="text-2xl font-extrabold font-mono-num text-slate-800">${fmtUSDFull(c.current_cost)}</p>
            </div>
            <div class="text-right space-y-1.5 flex flex-col items-end">
              ${growthPill(dod)}
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Yest: <span class="font-mono-num font-semibold text-slate-600">${fmtUSD(c.yesterday_cost)}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Monthly Budget & Progress -->
        <div class="border-t border-slate-100 pt-3">
          <div class="flex justify-between text-[11px] mb-1 font-semibold text-slate-500">
            <span>Monthly Spend (${fmtUSD(c.monthly_cost)})</span>
            <span class="text-slate-400">Budget: ${fmtUSD(c.budget)}</span>
          </div>
          <div class="progress-track mb-1.5" style="height: 5px;"><div class="progress-fill" style="width:${Math.min(c.utilization_pct,100)}%; background:${utilBarColor(c.utilization_pct)}"></div></div>
          <div class="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wide">
            <span>${fmtPct(c.utilization_pct)} Used</span>
            <span>${fmtUSD(c.budget - c.monthly_cost)} Left</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ============================== 3. LLM PROVIDER BREAKDOWN ============================== */
function renderLLMBreakdown(filter = 'All') {
  const providers = ['All', ...new Set(STATE.llm.map(l => l.provider))];
  document.getElementById('llm-provider-filter').innerHTML = providers.map(p =>
    `<button class="tab-btn ${p === filter ? 'active' : ''}" data-provider="${p}">${p}</button>`).join('');
  qsa('#llm-provider-filter button').forEach(btn => btn.onclick = () => renderLLMBreakdown(btn.dataset.provider));

  const rows = filter === 'All' ? STATE.llm : STATE.llm.filter(l => l.provider === filter);
  document.getElementById('llm-table-body').innerHTML = rows.map(l => `
    <tr>
      <td><span class="pill pill-blue">${l.provider}</span></td>
      <td class="font-semibold">${l.model_name}</td>
      <td class="font-mono-num">${fmtNum(l.input_tokens)}</td>
      <td class="font-mono-num">${fmtNum(l.output_tokens)}</td>
      <td class="font-mono-num">${fmtNum(l.requests)}</td>
      <td class="font-mono-num">${fmtUSDFull(l.avg_cost_per_request)}</td>
      <td class="font-mono-num font-semibold">${fmtUSD(l.total_cost)}</td>
      <td class="font-mono-num">${fmtMs(l.avg_latency)}</td>
      <td class="font-mono-num ${l.error_rate > 0.6 ? 'text-red-600 font-bold' : 'text-slate-600'}">${fmtPct(l.error_rate,2)}</td>
      <td class="font-mono-num">${fmtUSD(l.budget_allocation)}</td>
      <td class="font-mono-num ${l.remaining_budget < l.budget_allocation*0.15 ? 'text-red-600 font-bold':'text-emerald-600 font-medium'}">${fmtUSD(l.remaining_budget)}</td>
    </tr>`).join('');
}

/* ============================== 4. EMBEDDING MODELS ============================== */
function renderEmbeddingModels() {
  document.getElementById('embedding-table-body').innerHTML = STATE.embeddings.map(e => `
    <tr>
      <td class="font-semibold">${e.model}</td>
      <td class="font-mono-num">${fmtInt(e.documents_embedded)}</td>
      <td class="font-mono-num">${fmtNum(e.total_embeddings)}</td>
      <td class="font-mono-num">${fmtNum(e.tokens_processed)}</td>
      <td class="font-mono-num">${fmtGB(e.storage_consumed)}</td>
      <td class="font-mono-num">${fmtUSD(e.embedding_cost)}</td>
      <td class="font-mono-num">${fmtNum(e.queries_served)}</td>
      <td class="font-mono-num font-semibold">${fmtUSD(e.monthly_cost)}</td>
    </tr>`).join('');
}

/* ============================== 5. VECTOR DATABASE ============================== */
function renderVectorDatabases() {
  const grid = document.getElementById('vector-db-grid');
  grid.innerHTML = STATE.vectorDbs.map(v => {
    const storagePct = (v.used_storage / v.allocated_storage) * 100;
    const capsuleColor = v.name === 'Pinecone' ? 'cyan' : v.name === 'Milvus' ? 'blue' : v.name === 'Qdrant' ? 'violet' : v.name === 'FAISS' ? 'green' : 'amber';
    
    return `
    <div class="glass-card p-5 cursor-pointer flex flex-col justify-between min-h-[380px]" onclick="openVectorModal('${v.name}')">
      <div>
        <!-- Card Header -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-bold flex items-center gap-2">
            <div class="icon-capsule capsule-${capsuleColor} w-8 h-8 rounded-lg">
              <i class="fa-solid fa-cube text-xs"></i>
            </div>
            ${v.name}
          </span>
          <span class="pill pill-blue">${v.collections_count} ${v.collections_count === 1 ? 'collection' : 'collections'}</span>
        </div>

        <!-- Primary Stats Block -->
        <div class="grid grid-cols-2 gap-4 mb-4 border-b border-slate-100 pb-3">
          <div>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vectors Stored</span>
            <p class="text-lg font-extrabold font-mono-num text-slate-800">${fmtNum(v.vectors_stored)}</p>
          </div>
          <div>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Monthly Spend</span>
            <p class="text-lg font-extrabold font-mono-num text-slate-800">${fmtUSD(v.monthly_cost)}</p>
          </div>
        </div>

        <!-- Storage Info -->
        <div class="mb-4">
          <div class="flex justify-between text-[11px] text-slate-500 font-semibold mb-1">
            <span>Used: ${fmtGB(v.used_storage)} / ${fmtGB(v.allocated_storage)}</span>
            <span>${fmtPct(storagePct)}</span>
          </div>
          <div class="progress-track" style="height: 5px;"><div class="progress-fill" style="width:${storagePct}%; background:${utilBarColor(storagePct)}"></div></div>
        </div>

        <!-- Technical & Performance Sub-Panel -->
        <div class="bg-slate-50/70 border border-slate-100 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] text-slate-500 mb-4 font-medium">
          <div><span class="text-slate-400 font-semibold">Latency:</span> <span class="font-mono-num text-slate-700">${fmtMs(v.avg_retrieval_latency)}</span></div>
          <div><span class="text-slate-400 font-semibold">Cache Hit:</span> <span class="font-mono-num text-slate-700">${fmtPct(v.cache_hit_ratio)}</span></div>
          <div><span class="text-slate-400 font-semibold">Index Size:</span> <span class="font-mono-num text-slate-700">${fmtGB(v.index_size)}</span></div>
          <div><span class="text-slate-400 font-semibold">Dim Size:</span> <span class="font-mono-num text-slate-700">${v.avg_vector_dimension}</span></div>
          <div class="col-span-2"><span class="text-slate-400 font-semibold">Read/Write Q:</span> <span class="font-mono-num text-slate-700">${fmtNum(v.read_queries)} / ${fmtNum(v.write_queries)}</span></div>
        </div>
      </div>

      <!-- Footer: Connected Agents -->
      <div class="border-t border-slate-100 pt-3 flex items-center justify-between gap-2 flex-wrap">
        <div class="flex flex-wrap gap-1">
          ${v.top_agents.slice(0, 2).map(a => `<span class="chip"><i class="fa-solid fa-robot mr-1"></i>${a.split(' ')[0]}</span>`).join('')}
        </div>
        <p class="text-[10px] text-blue-500 font-bold hover:underline flex items-center gap-1">
          View Collections <i class="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
        </p>
      </div>
    </div>`;
  }).join('');
}

function openVectorModal(dbName) {
  const db = STATE.vectorDbs.find(v => v.name === dbName);
  const collections = STATE.vectorCollections.filter(c => c.vector_db_name === dbName);
  const modal = document.getElementById('vector-modal');
  document.getElementById('vector-modal-content').innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-bold">${dbName} — Collection Details</h3>
        <p class="text-xs text-slate-400">${db.collections_count} total collections · ${fmtGB(db.used_storage)} used of ${fmtGB(db.allocated_storage)}</p>
      </div>
      <button onclick="closeVectorModal()" class="btn-ghost"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="table-scroll">
      <table class="data-table">
        <thead><tr>
          <th>Collection</th><th>Allocated</th><th>Used</th><th>Embeddings</th><th>Chunks</th><th>Documents</th>
          <th>Owner</th><th>Daily Queries</th><th>Monthly Cost</th>
        </tr></thead>
        <tbody>
        ${collections.map(c => `
          <tr>
            <td class="font-semibold">${c.collection_name}</td>
            <td class="font-mono-num">${fmtGB(c.allocated_storage)}</td>
            <td class="font-mono-num">${fmtGB(c.used_storage)}</td>
            <td class="font-mono-num">${fmtNum(c.embedding_count)}</td>
            <td class="font-mono-num">${fmtNum(c.chunk_count)}</td>
            <td class="font-mono-num">${fmtInt(c.documents)}</td>
            <td>${c.owner}</td>
            <td class="font-mono-num">${fmtInt(c.daily_queries)}</td>
            <td class="font-mono-num font-semibold">${fmtUSD(c.monthly_cost)}</td>
          </tr>`).join('') || '<tr><td colspan="10" class="text-center text-slate-500 py-6">No collection detail available for this database.</td></tr>'}
        </tbody>
      </table>
    </div>

  `;
  modal.classList.remove('hidden');
}
function closeVectorModal() { document.getElementById('vector-modal').classList.add('hidden'); }

/* ============================== 6. CLOUD INFRASTRUCTURE ============================== */
function renderCloudInfrastructure(filter = 'All') {
  const providers = ['All', ...new Set(STATE.cloudInfra.map(i => i.provider))];
  document.getElementById('cloud-provider-tabs').innerHTML = providers.map(p =>
    `<button class="tab-btn ${p === filter ? 'active' : ''}" data-cloud="${p}">${p}</button>`).join('');
  qsa('#cloud-provider-tabs button').forEach(b => b.onclick = () => renderCloudInfrastructure(b.dataset.cloud));

  const rows = filter === 'All' ? STATE.cloudInfra : STATE.cloudInfra.filter(i => i.provider === filter);
  const providerColors = { AWS: 'pill-amber', Azure: 'pill-blue', GCP: 'pill-green' };
  document.getElementById('cloud-infra-body').innerHTML = rows.map(i => `
    <tr>
      <td><span class="pill ${providerColors[i.provider]}">${i.provider}</span></td>
      <td class="font-semibold">${i.resource_type}</td>
      <td class="font-mono-num">${fmtInt(i.allocated)} ${i.unit}</td>
      <td class="font-mono-num">${fmtInt(i.used)}</td>
      <td class="font-mono-num text-green-400">${fmtInt(i.remaining)}</td>
      <td class="font-mono-num">${fmtUSD(i.current_cost)}</td>
      <td class="font-mono-num font-semibold">${fmtUSD(i.monthly_cost)}</td>
      <td class="font-mono-num text-amber-400">${fmtUSD(i.forecast)}</td>
    </tr>`).join('');
}

/* ============================== 7. DATABASE MONITORING ============================== */
function renderDatabaseMonitoring() {
  document.getElementById('db-monitor-body').innerHTML = STATE.dbMonitor.map(d => `
    <tr>
      <td class="font-semibold">${d.db_name}</td>
      <td class="font-mono-num">${fmtGB(d.allocated_storage)}</td>
      <td class="font-mono-num">${fmtGB(d.used_storage)}</td>
      <td class="font-mono-num">${fmtInt(d.connections)}</td>
      <td class="font-mono-num">${fmtNum(d.read_ops)}</td>
      <td class="font-mono-num">${fmtNum(d.write_ops)}</td>
      <td class="font-mono-num">${fmtNum(d.queries)}</td>
      <td class="font-mono-num">${fmtMs(d.latency)}</td>
      <td class="font-mono-num">${fmtGB(d.backup_size)}</td>
      <td class="font-mono-num">${fmtUSD(d.backup_cost)}</td>
      <td class="font-mono-num font-semibold">${fmtUSD(d.monthly_cost)}</td>
    </tr>`).join('');
}

/* ============================== 8. API CONSUMPTION ============================== */
function renderApiConsumption() {
  document.getElementById('api-consumption-body').innerHTML = STATE.apiConsumption.map(a => `
    <tr>
      <td class="font-semibold">${a.api_name}</td>
      <td class="font-mono-num">${fmtInt(a.api_calls)}</td>
      <td class="font-mono-num text-green-400">${fmtInt(a.success)}</td>
      <td class="font-mono-num text-red-400">${fmtInt(a.failures)}</td>
      <td class="font-mono-num">${fmtMs(a.latency)}</td>
      <td class="font-mono-num">${fmtUSD(a.cost)}</td>
      <td class="font-mono-num">${fmtInt(a.retries)}</td>
      <td class="font-mono-num ${a.rate_limits > 20 ? 'text-amber-400':''}">${fmtInt(a.rate_limits)}</td>
    </tr>`).join('');
}

/* ============================== 9. AI AGENT SUMMARY ============================== */
function renderAgentSummary() {
  const counts = { Healthy: 0, Warning: 0, Critical: 0, Disabled: 0, Experimental: 0 };
  STATE.agents.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
  const cards = [
    { label: 'Total Agents', value: STATE.agents.length, icon: 'fa-robot', color: 'text-blue-400' },
    { label: 'Healthy', value: counts.Healthy, icon: 'fa-circle-check', color: 'text-green-400' },
    { label: 'Warning', value: counts.Warning, icon: 'fa-triangle-exclamation', color: 'text-amber-400' },
    { label: 'Critical', value: counts.Critical, icon: 'fa-circle-exclamation', color: 'text-red-400' },
    { label: 'Disabled', value: counts.Disabled, icon: 'fa-power-off', color: 'text-slate-400' },
    { label: 'Experimental', value: counts.Experimental, icon: 'fa-flask', color: 'text-violet-400' },
  ];
  document.getElementById('agent-summary-grid').innerHTML = cards.map(c => `
    <div class="kpi-card text-center">
      <i class="fa-solid ${c.icon} ${c.color} text-lg mb-2"></i>
      <p class="text-2xl font-bold font-mono-num">${c.value}</p>
      <p class="section-title mt-1">${c.label}</p>
    </div>`).join('');
}

/* ============================== 10. EMPLOYEE CONSUMPTION ============================== */
function renderEmployeeConsumption() {
  const emps = STATE.employees;
  const allocBudget = emps.reduce((s, e) => s + e.allocated_budget, 0);
  const consBudget = emps.reduce((s, e) => s + e.consumed_budget, 0);
  const allocTok = emps.reduce((s, e) => s + e.allocated_monthly_tokens, 0);
  const consTok = emps.reduce((s, e) => s + e.consumed_monthly_tokens, 0);
  const avgCost = consBudget / emps.length;
  const avgDaily = emps.reduce((s, e) => s + e.consumed_daily_tokens, 0) / emps.length;
  const nearLimit = emps.filter(e => e.status === 'Near Limit').length;
  const exceeded = emps.filter(e => e.status === 'Exceeded').length;

  const kpis = [
    { label: 'Allocated Budget', value: fmtUSD(allocBudget) },
    { label: 'Consumed Budget', value: fmtUSD(consBudget) },
    { label: 'Remaining Budget', value: fmtUSD(allocBudget - consBudget) },
    { label: 'Allocated Tokens', value: fmtNum(allocTok) },
    { label: 'Consumed Tokens', value: fmtNum(consTok) },
    { label: 'Remaining Tokens', value: fmtNum(allocTok - consTok) },
    { label: 'Avg Cost / Employee', value: fmtUSDFull(avgCost) },
  ];
  document.getElementById('employee-kpi-grid').innerHTML = kpis.map(k => `
    <div class="kpi-card"><p class="section-title mb-1">${k.label}</p><p class="text-base font-bold font-mono-num">${k.value}</p></div>`).join('') +
    `<!-- <div class="kpi-card"><p class="section-title mb-1">Near Limit / Exceeded</p><p class="text-base font-bold font-mono-num"><span class="text-amber-400">${nearLimit}</span> / <span class="text-red-400">${exceeded}</span></p></div> -->`;

  const sorted = [...emps].sort((a, b) => b.consumed_budget - a.consumed_budget);
  const top = sorted.slice(0, 6);
  const least = sorted.slice(-6).reverse();
  document.getElementById('top-consumers-body').innerHTML = top.map(e => `
    <tr><td class="font-semibold">${e.employee_name}</td><td>${e.department}</td>
    <td class="font-mono-num">${fmtUSDFull(e.consumed_budget)}</td><td class="font-mono-num">${fmtNum(e.consumed_monthly_tokens)}</td></tr>`).join('');
  document.getElementById('least-consumers-body').innerHTML = least.map(e => `
    <tr><td class="font-semibold">${e.employee_name}</td><td>${e.department}</td>
    <td class="font-mono-num">${fmtUSDFull(e.consumed_budget)}</td><td class="font-mono-num">${fmtNum(e.consumed_monthly_tokens)}</td></tr>`).join('');
}

/* ============================== 11. DEPARTMENT SUMMARY ============================== */
function renderDepartmentSummary() {
  document.getElementById('department-grid').innerHTML = STATE.departments.map(d => {
    const pct = (d.consumed_budget / d.allocated_budget) * 100;
    return `
    <div class="glass-card p-6 flex flex-col justify-between min-h-[360px]">
      <div>
        <!-- Card Header -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-base font-extrabold text-slate-800">${d.name}</span>
          <span class="pill ${pct > 90 ? 'pill-red' : pct > 75 ? 'pill-amber' : 'pill-green'}">${fmtPct(pct)} used</span>
        </div>

        <!-- Progress track -->
        <div class="progress-track mb-4" style="height: 6px;"><div class="progress-fill" style="width:${Math.min(pct,100)}%; background:${utilBarColor(pct)}"></div></div>

        <!-- Spacious Grid for Budgets -->
        <div class="grid grid-cols-2 gap-x-4 gap-y-3.5 text-[10px] mb-4">
          <div><span class="text-slate-400 font-bold uppercase tracking-wider">Allocated Budget</span><p class="font-mono-num font-extrabold text-sm text-slate-800 mt-0.5">${fmtUSD(d.allocated_budget)}</p></div>
          <div><span class="text-slate-400 font-bold uppercase tracking-wider">Consumed</span><p class="font-mono-num font-extrabold text-sm text-slate-800 mt-0.5">${fmtUSD(d.consumed_budget)}</p></div>
          <div><span class="text-slate-400 font-bold uppercase tracking-wider">Remaining</span><p class="font-mono-num font-extrabold text-sm text-slate-800 mt-0.5">${fmtUSD(d.remaining_budget)}</p></div>
          <div><span class="text-slate-400 font-bold uppercase tracking-wider">Avg Cost</span><p class="font-mono-num font-extrabold text-sm text-slate-800 mt-0.5">${fmtUSDFull(d.avg_cost)}</p></div>
          <div><span class="text-slate-400 font-bold uppercase tracking-wider">Allocated Tokens</span><p class="font-mono-num font-extrabold text-sm text-slate-800 mt-0.5">${fmtNum(d.allocated_tokens)}</p></div>
          <div><span class="text-slate-400 font-bold uppercase tracking-wider">Consumed Tokens</span><p class="font-mono-num font-extrabold text-sm text-slate-800 mt-0.5">${fmtNum(d.consumed_tokens)}</p></div>
        </div>
      </div>

      <!-- Spacious Metadata Footer -->
      <div class="text-[11px] space-y-2.5 border-t border-slate-100 pt-3">
        <p class="flex items-center gap-1.5 flex-wrap"><span class="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Top Models:</span> ${d.top_models.map(m=>`<span class="chip">${m}</span>`).join('')}</p>
        <p class="flex items-center gap-1.5 flex-wrap"><span class="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Top Agents:</span> ${d.top_agents.map(m=>`<span class="chip">${m}</span>`).join('')}</p>
        <p class="text-slate-500 font-medium"><span class="text-slate-400 font-bold uppercase tracking-wider text-[9px] mr-1">Top Employees:</span> ${d.top_employees.join(', ')}</p>
        <div class="flex justify-between items-center text-slate-500 font-medium">
          <span class="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Forecast:</span> 
          <span class="font-mono-num font-extrabold text-amber-600">${fmtUSD(d.forecast)}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ============================== 12. ALERTS ============================== */
function renderAlerts(filter = 'All') {
  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  document.getElementById('alert-filter-tabs').innerHTML = severities.map(s =>
    `<button class="tab-btn ${s === filter ? 'active' : ''}" data-sev="${s}">${s}</button>`).join('');
  qsa('#alert-filter-tabs button').forEach(b => b.onclick = () => renderAlerts(b.dataset.sev));

  const icons = {
    'Budget Exceeded': 'fa-money-bill-wave', 'High GPU Usage': 'fa-microchip', 'Vector DB Full': 'fa-database',
    'Prompt Explosion': 'fa-comment-dots', 'Agent Loop': 'fa-arrows-rotate', 'High Retry Rate': 'fa-rotate-right',
    'LLM Down': 'fa-server', 'Cloud Failure': 'fa-cloud-bolt', 'Storage Full': 'fa-hard-drive', 'Employee Near Budget': 'fa-user-clock'
  };
  const rows = filter === 'All' ? STATE.alerts : STATE.alerts.filter(a => a.severity === filter);
  const sorted = [...rows].sort((a,b) => new Date(b.alert_time) - new Date(a.alert_time));
  document.getElementById('alerts-list').innerHTML = sorted.map(a => `
    <div class="glass-card p-3 flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
        <i class="fa-solid ${icons[a.alert_type] || 'fa-bell'} text-sm"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5 flex-wrap">
          <span class="text-sm font-semibold">${a.alert_type}</span>
          ${severityPill(a.severity)}
          ${statusPill(a.status)}
        </div>
        <p class="text-xs text-slate-400 truncate">${a.message} · <span class="text-slate-500">${a.source}</span></p>
      </div>
      <span class="text-[11px] text-slate-500 flex-shrink-0">${timeAgo(a.alert_time)}</span>
    </div>`).join('') || '<p class="text-center text-slate-500 py-6 text-sm">No alerts in this severity band.</p>';
}

/* ============================== 13. FORECAST ============================== */
function renderForecast() {
  const e = STATE.exec;
  const days = ['Today','+1d','+2d','+3d','+4d','+5d','+6d'];
  const dailySpend = e.total_spend_today || 18000;
  const spendSeries = days.map((_, i) => Math.round(dailySpend * (1 + i * 0.018)));
  const tokenSeries = days.map((_, i) => Math.round((e.total_tokens_consumed / 30) * (1 + i * 0.02)));
  const storageBase = STATE.vectorDbs.reduce((s,v)=>s+v.used_storage,0) || 4000;
  const storageSeries = days.map((_, i) => Math.round(storageBase * (1 + i * 0.006)));

  makeLineChart('forecast-spend-chart', 'Forecasted Daily Spend ($)', days, spendSeries, '#3b82f6');
  makeLineChart('forecast-tokens-chart', 'Forecasted Daily Tokens', days, tokenSeries, '#22d3ee');
  makeLineChart('forecast-storage-chart', 'Forecasted Vector Storage (GB)', days, storageSeries, '#8b5cf6');

  const kpis = [
    { label: 'Forecast Tomorrow', value: fmtUSD(spendSeries[1]) },
    { label: 'Forecast Week', value: fmtUSD(spendSeries.reduce((a,b)=>a+b,0)) },
    { label: 'Forecast Month', value: fmtUSD(e.forecasted_month_end) },
    { label: 'Expected Spend', value: fmtUSD(e.forecasted_month_end) },
    { label: 'Expected Tokens', value: fmtNum(tokenSeries.reduce((a,b)=>a+b,0)) },
    { label: 'Expected Storage', value: fmtGB(storageSeries[6]) },
    { label: 'Expected GPU Hours', value: fmtInt(STATE.cloudInfra.filter(c=>c.resource_type==='GPU').reduce((s,c)=>s+c.used,0) * 7) },
    { label: 'Expected Vector Growth', value: '+' + fmtPct(STATE.vectorDbs.reduce((s,v)=>s+v.storage_growth,0)/STATE.vectorDbs.length) },
  ];
  document.getElementById('forecast-kpis').innerHTML = kpis.map(k => `
    <div class="kpi-card"><p class="section-title mb-1">${k.label}</p><p class="text-base font-bold font-mono-num">${k.value}</p></div>`).join('');
}
function makeLineChart(canvasId, label, labels, data, color) {
  new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: { labels, datasets: [{ label, data, borderColor: color, backgroundColor: color + '15', fill: true, tension: 0.35, pointRadius: 3 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, title: { display: true, text: label, color: '#334155', font: { size: 11, weight: 'bold' } } },
      scales: {
        x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: '#e2e8f0' } },
        y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: '#e2e8f0' } }
      }
    }
  });
}

/* ============================== 14. LIVE ACTIVITY FEED ============================== */
function renderActivityFeed() {
  const sorted = [...STATE.activity].sort((a,b) => new Date(b.activity_time) - new Date(a.activity_time));
  document.getElementById('activity-feed-list').innerHTML = sorted.map(activityRowHTML).join('');
}
function activityRowHTML(a) {
  return `
    <div class="glass-card p-3 flex items-center gap-3 activity-row">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
        ${a.employee_name.split(' ').map(s=>s[0]).join('').slice(0,2)}
      </div>
      <div class="flex-1 min-w-0 flex items-center gap-2 text-xs flex-wrap">
        <span class="font-semibold">${a.employee_name}</span>
        <i class="fa-solid fa-arrow-right-long text-slate-500"></i>
        <span class="chip">${a.agent_name}</span>
        <i class="fa-solid fa-arrow-right-long text-slate-500"></i>
        <span class="chip">${a.model_name}</span>
        <i class="fa-solid fa-arrow-right-long text-slate-500"></i>
        <span class="font-mono-num text-cyan-400">${fmtInt(a.tokens)} tok</span>
        <i class="fa-solid fa-arrow-right-long text-slate-500"></i>
        <span class="font-mono-num text-green-400 font-semibold">${fmtUSDFull(a.cost)}</span>
      </div>
      <span class="text-[10px] text-slate-500 flex-shrink-0">${timeAgo(a.activity_time)}</span>
    </div>`;
}

/* Simulate real-time activity stream */
const employeePool = ['A. Sharma','T. Nguyen','R. Patel','S. Kim','D. Ortiz','J. Lee','M. Chen','K. Brown','N. Ivanov','P. Adams'];
const agentPool = ['Support Copilot','Code Agent','Finance Analyst Bot','HR Assistant','Marketing Content Bot','Research Assistant','DevOps Bot','Sales RAG Bot'];
const modelPool = ['GPT-5','GPT-4o','Claude 3.7 Sonnet','Gemini 2.5 Pro','DeepSeek V3','Mistral Large'];
function simulateLiveUpdates() {
  setInterval(() => {
    const tokens = Math.floor(Math.random() * 4000) + 500;
    const cost = +(tokens * 0.00009 * (1 + Math.random())).toFixed(3);
    const entry = {
      employee_name: employeePool[Math.floor(Math.random()*employeePool.length)],
      agent_name: agentPool[Math.floor(Math.random()*agentPool.length)],
      model_name: modelPool[Math.floor(Math.random()*modelPool.length)],
      tokens, cost, activity_time: new Date().toISOString()
    };
    const list = document.getElementById('activity-feed-list');
    list.insertAdjacentHTML('afterbegin', activityRowHTML(entry));
    if (list.children.length > 30) list.removeChild(list.lastChild);
  }, 4500);
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'vector-modal') closeVectorModal();
});
