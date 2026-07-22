/* ==========================================================================
   Resource Lineage Explorer — end-to-end request traceability
   ========================================================================== */

let LINEAGE_STATE = { traces: [], current: null };

document.addEventListener('DOMContentLoaded', async () => {
  LINEAGE_STATE.traces = await fetchAll('lineage_traces');
  populateSelector();
  renderTable();
  if (LINEAGE_STATE.traces.length) selectTrace(LINEAGE_STATE.traces[0].id);
  document.getElementById('lineage-search').addEventListener('input', handleSearch);
  document.getElementById('lineage-select').addEventListener('change', (e) => selectTrace(e.target.value));
});

function populateSelector() {
  document.getElementById('lineage-select').innerHTML = LINEAGE_STATE.traces.map(t =>
    `<option value="${t.id}">${t.request_id} — ${t.employee_name} (${t.agent_name})</option>`).join('');
}

function handleSearch() {
  const q = document.getElementById('lineage-search').value.toLowerCase();
  if (!q) { renderTable(); return; }
  const filtered = LINEAGE_STATE.traces.filter(t =>
    [t.request_id, t.employee_name, t.agent_name, t.llm_model, t.department].join(' ').toLowerCase().includes(q));
  renderTable(filtered);
  if (filtered.length) selectTrace(filtered[0].id);
}

function selectTrace(id) {
  const t = LINEAGE_STATE.traces.find(x => x.id === id);
  if (!t) return;
  LINEAGE_STATE.current = t;
  document.getElementById('lineage-select').value = id;
  renderFlow(t);
  renderDetailPanels(t);
  renderTotals(t);
}

/* ============================== FLOW DIAGRAM ============================== */
function renderFlow(t) {
  document.getElementById('lineage-request-id').textContent = t.request_id;
  const nodes = [
    { icon: 'fa-user', label: t.employee_name, sub: 'Employee' },
    { icon: 'fa-building', label: t.department, sub: 'Department' },
    { icon: 'fa-diagram-project', label: t.project, sub: 'Project' },
    { icon: 'fa-robot', label: t.agent_name, sub: 'Agent' },
    { icon: 'fa-sitemap', label: t.workflow, sub: 'Workflow' },
    { icon: 'fa-comment', label: 'Prompt', sub: t.prompt_summary },
    { icon: 'fa-brain', label: t.llm_model, sub: 'LLM' },
    { icon: 'fa-vector-square', label: t.embedding_model, sub: 'Embedding Model' },
    { icon: 'fa-database', label: t.vector_database, sub: 'Vector Database' },
    { icon: 'fa-folder-tree', label: t.knowledge_collection, sub: 'Knowledge Collection' },
    { icon: 'fa-file-lines', label: (t.retrieved_documents||[]).length + ' docs', sub: 'Retrieved Documents' },
    { icon: 'fa-toolbox', label: (t.tool_calls||[]).length + ' calls', sub: 'Tool Calls' },
    { icon: 'fa-plug', label: (t.external_apis||[]).length + ' APIs', sub: 'External APIs' },
    { icon: 'fa-table', label: (t.database_queries||[]).length + ' queries', sub: 'Database Queries' },
    { icon: 'fa-server', label: (t.cloud_resources||[]).length + ' resources', sub: 'Cloud Resources' },
    { icon: 'fa-coins', label: fmtInt(t.total_tokens), sub: 'Total Tokens' },
    { icon: 'fa-dollar-sign', label: fmtUSDFull(t.total_cost), sub: 'Total Cost' },
    { icon: 'fa-stopwatch', label: fmtMs(t.execution_time_ms), sub: 'Execution Time' },
  ];
  document.getElementById('lineage-flow').innerHTML = nodes.map((n, i) => `
    ${i > 0 ? '<i class="fa-solid fa-chevron-right lineage-arrow"></i>' : ''}
    <div class="lineage-node">
      <i class="fa-solid ${n.icon} text-blue-400"></i>
      <div class="min-w-0">
        <p class="text-[11px] font-semibold truncate max-w-[140px]" title="${n.label}">${n.label}</p>
        <p class="text-[9px] text-slate-500 truncate max-w-[140px]" title="${n.sub}">${n.sub}</p>
      </div>
    </div>`).join('');
}

/* ============================== DETAIL PANELS ============================== */
function renderDetailPanels(t) {
  document.getElementById('lineage-who').innerHTML = `
    <p><span class="text-slate-400">Employee:</span> <b>${t.employee_name}</b></p>
    <p><span class="text-slate-400">Department:</span> ${t.department}</p>
    <p><span class="text-slate-400">Project:</span> ${t.project}</p>
    <p><span class="text-slate-400">Prompt Summary:</span> <span class="text-slate-300">${t.prompt_summary}</span></p>`;

  document.getElementById('lineage-agent').innerHTML = `
    <p><span class="text-slate-400">Agent:</span> <b>${t.agent_name}</b></p>
    <p><span class="text-slate-400">Workflow:</span> ${t.workflow}</p>
    <p><span class="text-slate-400">Request ID:</span> <span class="font-mono-num">${t.request_id}</span></p>`;

  document.getElementById('lineage-models').innerHTML = `
    <p><span class="text-slate-400">LLM:</span> <span class="chip">${t.llm_model}</span></p>
    <p><span class="text-slate-400">Embedding Model:</span> <span class="chip">${t.embedding_model}</span></p>`;

  document.getElementById('lineage-vector').innerHTML = `
    <p><span class="text-slate-400">Vector Database:</span> <b>${t.vector_database}</b></p>
    <p><span class="text-slate-400">Knowledge Collection:</span> ${t.knowledge_collection}</p>
    <p><span class="text-slate-400">Retrieved Documents:</span></p>
    <div class="flex flex-wrap gap-1">${(t.retrieved_documents||[]).map(d => `<span class="chip"><i class="fa-solid fa-file mr-1"></i>${d}</span>`).join('')}</div>`;

  document.getElementById('lineage-tools').innerHTML = `
    <p><span class="text-slate-400">Tool Calls:</span></p>
    <div class="flex flex-wrap gap-1 mb-2">${(t.tool_calls||[]).map(d => `<span class="chip"><i class="fa-solid fa-wrench mr-1"></i>${d}</span>`).join('') || '<span class="text-slate-500">None</span>'}</div>
    <p><span class="text-slate-400">External APIs:</span></p>
    <div class="flex flex-wrap gap-1">${(t.external_apis||[]).map(d => `<span class="chip"><i class="fa-solid fa-plug mr-1"></i>${d}</span>`).join('') || '<span class="text-slate-500">None</span>'}</div>`;

  document.getElementById('lineage-infra').innerHTML = `
    <p><span class="text-slate-400">Database Queries:</span></p>
    <div class="flex flex-wrap gap-1 mb-2">${(t.database_queries||[]).map(d => `<span class="chip"><i class="fa-solid fa-table mr-1"></i>${d}</span>`).join('') || '<span class="text-slate-500">None</span>'}</div>
    <p><span class="text-slate-400">Cloud Resources:</span></p>
    <div class="flex flex-wrap gap-1">${(t.cloud_resources||[]).map(d => `<span class="chip"><i class="fa-solid fa-server mr-1"></i>${d}</span>`).join('') || '<span class="text-slate-500">None</span>'}</div>`;
}

function renderTotals(t) {
  document.getElementById('lineage-total-tokens').textContent = fmtInt(t.total_tokens);
  document.getElementById('lineage-total-cost').textContent = fmtUSDFull(t.total_cost);
  document.getElementById('lineage-exec-time').textContent = fmtMs(t.execution_time_ms);
}

/* ============================== ALL TRACES TABLE ============================== */
function renderTable(rows = LINEAGE_STATE.traces) {
  document.getElementById('lineage-table-body').innerHTML = rows.map(t => `
    <tr class="clickable" onclick="selectTrace('${t.id}')">
      <td class="font-mono-num font-semibold">${t.request_id}</td>
      <td>${t.employee_name}</td>
      <td>${t.department}</td>
      <td class="text-slate-400 max-w-[160px] truncate" title="${t.project}">${t.project}</td>
      <td><span class="chip">${t.agent_name}</span></td>
      <td>${t.llm_model}</td>
      <td>${t.vector_database}</td>
      <td class="font-mono-num">${fmtInt(t.total_tokens)}</td>
      <td class="font-mono-num">${fmtUSDFull(t.total_cost)}</td>
      <td class="font-mono-num">${fmtMs(t.execution_time_ms)}</td>
    </tr>`).join('') || '<tr><td colspan="10" class="text-center text-slate-500 py-6">No traces found.</td></tr>';
}
