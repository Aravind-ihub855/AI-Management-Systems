# AI OpsCenter — Enterprise AI Operations Platform

An "Enterprise AI Operations Platform" that goes far beyond a simple AI cost dashboard. It combines **AI FinOps** (cost & budget), **AIOps** (monitoring & health), **LLMOps** (model & prompt management), **Governance** (policy & security), **Resource Management** (infrastructure), **Chargeback/Showback** (finance), and a dedicated **Resource Lineage Explorer** so every dollar, token, API call, CPU cycle and gigabyte of storage is fully traceable back to the employee, agent, model, and workflow that generated it.

## 🌐 Site Map / Functional Entry Points

| Page | File | Persona | Purpose |
|---|---|---|---|
| Mission Control | `index.html` | Head of Operations | Company-wide "Executive Summary" dashboard — all 14 sections from the spec |
| AI Resource Management | `resource-management.html` | Head of Operations | Agent Inventory (deep-dive per agent) + Employee Management admin panel with bulk actions |
| Employee AI Usage Portal | `employee.html` | Employee | Single clean self-service page — usage, budget, recommendations, request center, history |
| Resource Lineage Explorer | `lineage.html` | Head of Operations / Finance / Eng | End-to-end traceability chain for any AI request |

No query parameters are required — each page loads its own dataset from the Table API on `DOMContentLoaded`. `employee.html` includes a dropdown (`#employee-selector`) to switch between employee identities for demo purposes.

---

## ✅ Implemented Features (mapped 1:1 to your spec)

### PERSONA 1 — Head of Operations

**Page 1 — Mission Control (`index.html`)**
1. **Executive Summary** — all 12 KPIs + Overall AI Health Score.
2. **AI Cost Breakdown** — all 16 categories (LLM, Embedding, Vector DB, Cloud Compute, GPU, CPU, Storage, Redis, Hosting, Bandwidth, Database, External APIs, OCR, Speech, Image Gen, Monitoring) each with Current/Yesterday/Monthly cost, Budget, Utilization %, Growth %.
3. **LLM Provider Breakdown** — OpenAI, Claude, Gemini, Llama, Mistral, DeepSeek, with all 15 columns (tokens, requests, avg lengths, cost, latency, error rate, retries, budget).
4. **Embedding Models** — per-model documents, embeddings, tokens, chunk size, storage, cost, queries.
5. **Vector Database** — Pinecone, Milvus, Qdrant, FAISS, Weaviate cards with every metric requested (storage, vectors, namespaces, latency, cache hit ratio, replication, backup, cost/GB, cost/1M queries, top agents/employees, largest/inactive/deleted collections, growth & forecast). Clicking a card opens a **Collection Details modal** (HR, Finance, Legal, Engineering, Support) with allocated/used storage, embeddings, chunks, docs, owner, daily queries, monthly cost, retention policy.
6. **Cloud Infrastructure** — AWS / Azure / GCP tabs across GPU, CPU, VM, Containers, Kubernetes, Lambda, Bandwidth, Object/File Storage, Load Balancer, NAT Gateway, CDN, Networking — allocated/used/remaining/current/monthly/forecast.
7. **Database Monitoring** — Postgres, MongoDB, Redis, Elastic with storage, connections, ops, latency, backup, growth, cost.
8. **API Consumption** — OpenAI, Slack, Salesforce, GitHub, Google, Microsoft, Twilio with calls/success/failure/latency/cost/retries/rate limits.
9. **AI Agent Summary** — Total/Healthy/Warning/Critical/Disabled/Experimental cards.
10. **Employee Consumption** — company KPIs + Top Consumers / Least Consumers tables.
11. **Department Summary** — Engineering, HR, Finance, Support, Marketing cards with budget, tokens, top models/agents/employees, forecast.
12. **Alerts** — all 10 alert types (Budget Exceeded, High GPU Usage, Vector DB Full, Prompt Explosion, Agent Loop, High Retry Rate, LLM Down, Cloud Failure, Storage Full, Employee Near Budget) with severity filter tabs.
13. **Forecast** — Tomorrow/Week/Month spend + tokens/storage/GPU-hours/vector-growth projections with Chart.js trend lines.
14. **Live Activity Feed** — real-time simulated stream (Employee → Agent → Model → Tokens → Cost).

**Page 2 — AI Resource Management (`resource-management.html`)**
- **Agent Inventory** — searchable/filterable table of every agent; clicking a row opens the full **Agent Overview** modal with: Agent Type, Models Used (primary/fallback/embedding/OCR/speech/vision/image/reasoning), Resource Usage (daily/weekly/monthly/peak/avg tokens), Token Details (prompt/completion/cached/embedding/reasoning/tool tokens), full Cost Breakdown (LLM/embedding/vector/storage/cloud/API/tool/cache/DB/logging/monitoring + TOTAL), RAG Details (KBs, collections, docs, chunks, embeddings, chunk size, retrieval time, top/unused/duplicate docs, refresh cadence), Tool Usage table (Slack, GitHub, Jira, Salesforce, Google Drive, Notion, SharePoint, Databases, REST APIs), Infrastructure (CPU/GPU/RAM/storage/bandwidth/pods/containers/autoscaling), Performance (response time, accuracy, hallucination rate, failure/retry rate, tool success, RAG recall, grounding score), Budget (daily/monthly/hard/soft limits, allowed models, priority, routing policy), Security (API keys, secrets, access roles, allowed teams, audit logs, compliance, PII detection).
- **Employee Management admin panel** — search by employee/ID/department/manager/role/status; full data grid with all requested fields (allocated/consumed tokens & budget, remaining budget, allowed/restricted models & agents, priority, daily reset time, budget expiry, approval status); **Bulk Actions**: Allocate Tokens, Increase Budget, Reduce Budget, Assign Agents, Restrict Models, Suspend Access, Export Reports (CSV download).

### PERSONA 2 — Employee (`employee.html`)
Single clean page with all 10 sections: My AI Summary, AI Usage (Today/Week/Month tabs), My Agent Usage, My Models (doughnut chart), Prompt Analytics, Resource Usage, Budget (with trend chart + reset countdown), Recommendations, Request Center (submit + view approval status, persisted via the `requests` table), Activity History (searchable).

### 🔑 Resource Lineage Explorer (`lineage.html`)
The overlooked but most valuable enterprise capability: pick any request/prompt ID and see the **full traceability chain** —
`Employee → Department → Project → Agent → Workflow → Prompt → LLM → Embedding Model → Vector Database → Knowledge Collection → Retrieved Documents → Tool Calls → External APIs → Database Queries → Cloud Resources → Total Tokens → Total Cost → Execution Time`
— rendered as both a visual flow chain and detail panels, plus a searchable table of all traceable requests for Finance/Engineering/Ops audits.

---

## 🗄️ Data Models (Table API — `tables/{name}`)

| Table | Purpose |
|---|---|
| `executive_summary` | Top-line KPIs for Section 1 |
| `cost_breakdown_categories` | 16 AI cost categories |
| `llm_usage` | Per-provider/model LLM metrics |
| `embedding_models` | Embedding model usage & cost |
| `vector_databases` | Pinecone/Milvus/Qdrant/FAISS/Weaviate metrics |
| `vector_collections` | Per-collection detail (HR, Finance, Legal, Engineering, Support) |
| `cloud_infrastructure` | AWS/Azure/GCP resource rows |
| `databases_monitoring` | Postgres/MongoDB/Redis/Elastic |
| `api_consumption` | External API call stats |
| `departments` | Department-level budget/token/forecast |
| `employees` | Full employee admin record |
| `agents` | Full agent inventory record (rich_text `details` holds model routing) |
| `alerts` | AIOps alert stream |
| `requests` | Employee request-center submissions (writable) |
| `activity_feed` | Live activity stream seed data |
| `lineage_traces` | End-to-end lineage records for the Lineage Explorer |

All tables use the standard RESTful Table API (`GET/POST/PATCH/DELETE tables/{table}`). The Employee page's Request Center writes new rows to `requests` live; Resource Management's bulk actions mutate in-memory employee state for the session (see "Not Yet Implemented" below for persisting bulk edits).

---

## ⚠️ Not Yet Implemented / Known Simplifications
- Bulk actions in Employee Management (allocate tokens, adjust budget, assign/restrict, suspend) update the in-memory table only for the current session — they are **not** persisted back to the `employees` table via PATCH yet (easy to wire up with `updateRow('employees', id, {...})`).
- Per-agent deep-dive metrics (RAG stats, tool usage, infra, performance, security) are **deterministically derived** from each agent's stored cost/token totals rather than being independently tracked tables — sufficient for demo fidelity, but a production system would back these with dedicated tables (e.g. `agent_tool_calls`, `agent_rag_stats`, `agent_infra`).
- Employee "Activity History" and "My Agent/Model Usage" on the Employee page are generated deterministically per-employee (seeded pseudo-random) rather than pulled from a persisted per-employee event log — recommended next step is a real `employee_activity_log` table populated by the live activity stream.
- No authentication/login — persona switching is manual (nav bar + employee selector) since this is a static frontend-only project.
- Live Activity Feed and clock are simulated client-side; there is no server push/websocket (not possible in a static site).

## 🚀 Recommended Next Steps
1. Wire Resource Management bulk actions to `PATCH tables/employees/{id}` so changes persist.
2. Add a real `employee_activity_log` / `agent_tool_usage` / `agent_rag_stats` table and populate the deep-dive modal + Employee Activity History from real records instead of derived pseudo-random values.
3. Add role-based view switching (e.g. a login-less "persona switcher" already exists via nav; could be extended with per-manager department scoping).
4. Add CSV/PDF export for Mission Control sections (cost breakdown, LLM breakdown) similar to the Employee Export Reports action.
5. Add drill-through links from Mission Control (e.g. clicking a department card jumps to Resource Management filtered to that department).

## 🎨 Tech Stack
- Tailwind CSS (CDN) for utility styling + custom dark "glass" theme in `css/style.css`
- Chart.js for forecast/trend/doughnut charts
- Font Awesome for iconography
- Vanilla JS (`js/api.js`, `js/dashboard.js`, `js/resource-management.js`, `js/employee.js`, `js/lineage.js`) — no build step, no frameworks
- RESTful Table API for all data persistence

## 📦 File Structure
```
index.html                     Mission Control (Head of Operations — Page 1)
resource-management.html       AI Resource Management (Head of Operations — Page 2)
employee.html                  Employee AI Usage Portal (Persona 2)
lineage.html                   Resource Lineage Explorer
css/style.css                  Shared dark "glass" enterprise theme
js/api.js                       Shared fetch + formatting helpers
js/dashboard.js                 Mission Control logic (Sections 1–14)
js/resource-management.js       Agent Inventory + Employee Admin logic
js/employee.js                  Employee portal logic
js/lineage.js                   Lineage Explorer logic
README.md                       This file
```

## 🔗 Deployment
This is a static site. To publish it live, use the **Publish tab** — it will handle deployment automatically and provide the live URL.
