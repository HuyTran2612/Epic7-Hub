import {
  fetchSyncStatus,
  triggerSync,
  fetchSyncConflicts,
  fetchHeroes,
  fetchArtifacts,
  updateHero,
  updateArtifact
} from './api.js';

let currentEntity = 'heroes'; // 'heroes' | 'artifacts'
let searchFilter = '';
let statusPollInterval = null;

export async function renderManagementView(container) {
  container.innerHTML = `
    <div class="management-container">
      
      <!-- Top Header & Sync Control Panel -->
      <div class="mgmt-card sync-panel">
        <div class="mgmt-card-header">
          <div>
            <h2 class="mgmt-title">⚡ Web Data Sync Engine</h2>
            <p class="mgmt-subtitle">Trigger 4-source automated sync directly without terminal commands.</p>
          </div>
          <div id="sync-status-badge" class="status-pill status-idle">
            <span class="status-dot"></span> <span id="status-text">Idle</span>
          </div>
        </div>

        <div class="sync-actions-row">
          <div class="sync-mode-selector">
            <label for="sync-limit-select" class="mgmt-label">Sync Scope:</label>
            <select id="sync-limit-select" class="mgmt-select">
              <option value="10">Quick Test (10 Items)</option>
              <option value="50">Medium Sync (50 Items)</option>
              <option value="0" selected>Full Aggregator Sync (All Items)</option>
            </select>
          </div>

          <button id="btn-trigger-sync" class="btn-primary btn-sync-trigger">
            <span class="btn-icon">🚀</span> Trigger Data Sync
          </button>
        </div>

        <div id="sync-message-banner" class="sync-banner info-banner">
          <span class="banner-icon">ℹ️</span>
          <span id="sync-banner-text">Ready to sync. Click trigger button above to update data from official & community sources.</span>
        </div>

        <!-- Sync History & Conflicts Tabs -->
        <div class="mgmt-subtabs">
          <button class="subtab-btn active" id="subtab-logs">📜 Sync History Logs</button>
          <button class="subtab-btn" id="subtab-conflicts">⚠️ Source Conflict Audit Log</button>
        </div>

        <div id="mgmt-subtab-content" class="mgmt-subtab-body">
          <div id="logs-view" class="subtab-pane active">
            <div class="table-responsive">
              <table class="mgmt-table" id="table-sync-logs">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Message</th>
                    <th>Affected</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody id="logs-tbody">
                  <tr><td colspan="6" class="text-center">Loading sync history logs...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div id="conflicts-view" class="subtab-pane">
            <div class="table-responsive">
              <table class="mgmt-table" id="table-sync-conflicts">
                <thead>
                  <tr>
                    <th>Entity</th>
                    <th>Key</th>
                    <th>Field</th>
                    <th>Source A</th>
                    <th>Source B</th>
                    <th>Resolution</th>
                    <th>Logged At</th>
                  </tr>
                </thead>
                <tbody id="conflicts-tbody">
                  <tr><td colspan="7" class="text-center">Loading source conflict audit logs...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Parameter Editor Section -->
      <div class="mgmt-card editor-panel">
        <div class="mgmt-card-header">
          <div>
            <h2 class="mgmt-title">⚙️ Data Parameter Editor</h2>
            <p class="mgmt-subtitle">View and edit parameters for heroes and artifacts directly in the database.</p>
          </div>
          <div class="entity-toggle">
            <button class="toggle-btn ${currentEntity === 'heroes' ? 'active' : ''}" id="toggle-heroes">👤 Heroes</button>
            <button class="toggle-btn ${currentEntity === 'artifacts' ? 'active' : ''}" id="toggle-artifacts">💎 Artifacts</button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="editor-filter-bar">
          <input type="text" id="editor-search-input" class="mgmt-input" placeholder="Search name or key..." value="${searchFilter}" />
          <span class="item-count-badge" id="editor-item-count">Loading items...</span>
        </div>

        <!-- Editor Data Table -->
        <div class="table-responsive">
          <table class="mgmt-table" id="editor-data-table">
            <thead id="editor-thead">
              <!-- Rendered dynamically -->
            </thead>
            <tbody id="editor-tbody">
              <tr><td colspan="7" class="text-center">Loading items...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="mgmt-modal-backdrop hidden" id="mgmt-modal">
      <div class="mgmt-modal-card">
        <div class="modal-header">
          <h3 id="modal-title">Edit Record Parameters</h3>
          <button class="modal-close-btn" id="modal-close">&times;</button>
        </div>
        <form id="modal-edit-form" class="modal-form">
          <input type="hidden" id="edit-id" />
          <input type="hidden" id="edit-entity-type" />

          <div class="form-group">
            <label for="edit-name">Name</label>
            <input type="text" id="edit-name" class="mgmt-input" required />
          </div>

          <div class="form-row" id="form-row-hero-attrs">
            <div class="form-group">
              <label for="edit-element">Element</label>
              <select id="edit-element" class="mgmt-select">
                <option value="Fire">Fire</option>
                <option value="Ice">Ice</option>
                <option value="Earth">Earth</option>
                <option value="Light">Light</option>
                <option value="Dark">Dark</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit-class">Class</label>
              <select id="edit-class" class="mgmt-select">
                <option value="Warrior">Warrior</option>
                <option value="Knight">Knight</option>
                <option value="Thief">Thief</option>
                <option value="Ranger">Ranger</option>
                <option value="Mage">Mage</option>
                <option value="Soul Weaver">Soul Weaver</option>
              </select>
            </div>
          </div>

          <div class="form-group hidden" id="form-group-art-class">
            <label for="edit-class-restriction">Class Restriction</label>
            <select id="edit-class-restriction" class="mgmt-select">
              <option value="Common">Common</option>
              <option value="Warrior">Warrior</option>
              <option value="Knight">Knight</option>
              <option value="Thief">Thief</option>
              <option value="Ranger">Ranger</option>
              <option value="Mage">Mage</option>
              <option value="Soul Weaver">Soul Weaver</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="edit-rarity">Rarity (Stars)</label>
              <select id="edit-rarity" class="mgmt-select">
                <option value="1">1 Star (★)</option>
                <option value="2">2 Stars (★★)</option>
                <option value="3">3 Stars (★★★)</option>
                <option value="4">4 Stars (★★★★)</option>
                <option value="5">5 Stars (★★★★★)</option>
              </select>
            </div>
            <div class="form-group checkbox-group">
              <label for="edit-is-limited">Limited Availability</label>
              <div class="checkbox-wrapper">
                <input type="checkbox" id="edit-is-limited" />
                <span>Mark as Limited</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="edit-desc">Description</label>
            <textarea id="edit-desc" class="mgmt-textarea" rows="3"></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="modal-cancel">Cancel</button>
            <button type="submit" class="btn-primary" id="modal-save">💾 Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Attach Event Listeners & Initialize
  initSyncControls();
  initSubtabs();
  initEntityToggle();
  initModal();
  loadSyncStatus();
  loadEditorTable();

  // Start status polling (every 3 seconds)
  if (statusPollInterval) clearInterval(statusPollInterval);
  statusPollInterval = setInterval(loadSyncStatus, 3000);
}

function initSyncControls() {
  const triggerBtn = document.getElementById('btn-trigger-sync');
  triggerBtn?.addEventListener('click', async () => {
    const limitVal = parseInt(document.getElementById('sync-limit-select').value, 10);
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = `<span class="spinner"></span> Syncing...`;
    
    try {
      const res = await triggerSync(limitVal);
      if (res.success) {
        updateSyncBanner('info', `Sync pipeline launched in background (${limitVal === 0 ? 'Full' : limitVal + ' items'})...`);
      } else {
        updateSyncBanner('error', res.message || 'Failed to trigger sync.');
      }
    } catch (e) {
      updateSyncBanner('error', `Error: ${e.message}`);
    } finally {
      setTimeout(loadSyncStatus, 1000);
    }
  });
}

async function loadSyncStatus() {
  try {
    const res = await fetchSyncStatus();
    if (!res.success) return;

    const data = res.data;
    const badge = document.getElementById('sync-status-badge');
    const statusText = document.getElementById('status-text');
    const triggerBtn = document.getElementById('btn-trigger-sync');

    if (badge && statusText) {
      badge.className = `status-pill status-${data.status}`;
      statusText.textContent = data.status.toUpperCase();
    }

    if (triggerBtn) {
      if (data.isRunning) {
        triggerBtn.disabled = true;
        triggerBtn.innerHTML = `<span class="spinner"></span> Syncing...`;
      } else {
        triggerBtn.disabled = false;
        triggerBtn.innerHTML = `<span class="btn-icon">🚀</span> Trigger Data Sync`;
      }
    }

    if (data.message) {
      updateSyncBanner(data.status === 'failed' ? 'error' : (data.status === 'success' ? 'success' : 'info'), data.message);
    }

    if (data.historyLogs) {
      renderLogsTable(data.historyLogs);
    }
  } catch (e) {
    // Failover polling
  }
}

function updateSyncBanner(type, text) {
  const banner = document.getElementById('sync-message-banner');
  const bannerText = document.getElementById('sync-banner-text');
  if (!banner || !bannerText) return;
  banner.className = `sync-banner ${type}-banner`;
  bannerText.textContent = text;
}

function renderLogsTable(logs) {
  const tbody = document.getElementById('logs-tbody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">No sync logs recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>#${l.id}</td>
      <td><span class="tag tag-type">${l.type}</span></td>
      <td><span class="status-badge status-${l.status}">${l.status}</span></td>
      <td class="log-message-cell">${l.message}</td>
      <td><strong>${l.records_affected}</strong></td>
      <td>${new Date(l.created_at).toLocaleString()}</td>
    </tr>
  `).join('');
}

function initSubtabs() {
  const btnLogs = document.getElementById('subtab-logs');
  const btnConflicts = document.getElementById('subtab-conflicts');
  const viewLogs = document.getElementById('logs-view');
  const viewConflicts = document.getElementById('conflicts-view');

  btnLogs?.addEventListener('click', () => {
    btnLogs.classList.add('active');
    btnConflicts?.classList.remove('active');
    viewLogs?.classList.add('active');
    viewConflicts?.classList.remove('active');
  });

  btnConflicts?.addEventListener('click', async () => {
    btnConflicts.classList.add('active');
    btnLogs?.classList.remove('active');
    viewConflicts?.classList.add('active');
    viewLogs?.classList.remove('active');
    await loadConflicts();
  });
}

async function loadConflicts() {
  const tbody = document.getElementById('conflicts-tbody');
  if (!tbody) return;
  try {
    const res = await fetchSyncConflicts();
    const list = res.data || [];
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center">No source conflicts logged. All data sources aligned!</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(c => `
      <tr>
        <td><span class="tag tag-entity">${c.entity_type}</span></td>
        <td><code>${c.key_name}</code></td>
        <td><strong>${c.field_name}</strong></td>
        <td><span class="source-tag">${c.source_a}: ${JSON.stringify(c.value_a)}</span></td>
        <td><span class="source-tag">${c.source_b}: ${JSON.stringify(c.value_b)}</span></td>
        <td><span class="resolution-badge">${c.resolution || 'merged'}</span></td>
        <td>${new Date(c.created_at).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-error">Failed to load conflicts: ${e.message}</td></tr>`;
  }
}

function initEntityToggle() {
  const btnHeroes = document.getElementById('toggle-heroes');
  const btnArtifacts = document.getElementById('toggle-artifacts');
  const searchInput = document.getElementById('editor-search-input');

  btnHeroes?.addEventListener('click', () => {
    if (currentEntity === 'heroes') return;
    currentEntity = 'heroes';
    btnHeroes.classList.add('active');
    btnArtifacts.classList.remove('active');
    loadEditorTable();
  });

  btnArtifacts?.addEventListener('click', () => {
    if (currentEntity === 'artifacts') return;
    currentEntity = 'artifacts';
    btnArtifacts.classList.add('active');
    btnHeroes.classList.remove('active');
    loadEditorTable();
  });

  searchInput?.addEventListener('input', (e) => {
    searchFilter = e.target.value;
    loadEditorTable();
  });
}

async function loadEditorTable() {
  const thead = document.getElementById('editor-thead');
  const tbody = document.getElementById('editor-tbody');
  const countBadge = document.getElementById('editor-item-count');
  if (!thead || !tbody) return;

  if (currentEntity === 'heroes') {
    thead.innerHTML = `
      <tr>
        <th>Hero</th>
        <th>Key Name</th>
        <th>Element</th>
        <th>Class</th>
        <th>Rarity</th>
        <th>Limited</th>
        <th>Actions</th>
      </tr>
    `;
  } else {
    thead.innerHTML = `
      <tr>
        <th>Artifact</th>
        <th>Key Name</th>
        <th>Class Restriction</th>
        <th>Rarity</th>
        <th>Limited</th>
        <th>Actions</th>
      </tr>
    `;
  }

  tbody.innerHTML = `<tr><td colspan="7" class="text-center">Loading items...</td></tr>`;

  try {
    if (currentEntity === 'heroes') {
      const res = await fetchHeroes({ search: searchFilter, limit: 100 });
      const items = res.data || [];
      if (countBadge) countBadge.textContent = `${items.length} Heroes found`;

      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No heroes found.</td></tr>`;
        return;
      }

      tbody.innerHTML = items.map(h => `
        <tr>
          <td class="name-cell">
            <img src="${h.image_url}" alt="${h.name}" class="table-thumb" onerror="this.src='/images/placeholder.webp'"/>
            <strong>${h.name}</strong>
          </td>
          <td><code>${h.key_name}</code></td>
          <td><span class="badge badge-element badge-${h.element ? h.element.toLowerCase() : 'fire'}">${h.element}</span></td>
          <td><span class="badge badge-class">${h.class}</span></td>
          <td><span class="star-rating">${'★'.repeat(h.rarity)}</span></td>
          <td>${h.is_limited ? '<span class="tag tag-limited">Limited</span>' : '<span class="tag tag-normal">Normal</span>'}</td>
          <td>
            <button class="btn-sm btn-edit" data-edit-hero='${JSON.stringify(h).replace(/'/g, "&apos;")}'>✏️ Edit</button>
          </td>
        </tr>
      `).join('');

    } else {
      const res = await fetchArtifacts({ search: searchFilter, limit: 100 });
      const items = res.data || [];
      if (countBadge) countBadge.textContent = `${items.length} Artifacts found`;

      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">No artifacts found.</td></tr>`;
        return;
      }

      tbody.innerHTML = items.map(a => `
        <tr>
          <td class="name-cell">
            <img src="${a.image_url}" alt="${a.name}" class="table-thumb" onerror="this.src='/images/placeholder.webp'"/>
            <strong>${a.name}</strong>
          </td>
          <td><code>${a.key_name}</code></td>
          <td><span class="badge badge-class">${a.class_restriction || 'Common'}</span></td>
          <td><span class="star-rating">${'★'.repeat(a.rarity)}</span></td>
          <td>${a.is_limited ? '<span class="tag tag-limited">Limited</span>' : '<span class="tag tag-normal">Normal</span>'}</td>
          <td>
            <button class="btn-sm btn-edit" data-edit-art='${JSON.stringify(a).replace(/'/g, "&apos;")}'>✏️ Edit</button>
          </td>
        </tr>
      `).join('');
    }

    // Attach edit button listeners
    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.editHero) {
          openEditModal('hero', JSON.parse(btn.dataset.editHero));
        } else if (btn.dataset.editArt) {
          openEditModal('artifact', JSON.parse(btn.dataset.editArt));
        }
      });
    });

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-error">Failed to load data: ${e.message}</td></tr>`;
  }
}

function initModal() {
  const modal = document.getElementById('mgmt-modal');
  const closeBtn = document.getElementById('modal-close');
  const cancelBtn = document.getElementById('modal-cancel');
  const form = document.getElementById('modal-edit-form');

  const closeModal = () => modal?.classList.add('hidden');
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('edit-entity-type').value;
    const id = document.getElementById('edit-id').value;
    const saveBtn = document.getElementById('modal-save');

    if (saveBtn) saveBtn.disabled = true;

    try {
      if (type === 'hero') {
        const payload = {
          name: document.getElementById('edit-name').value,
          element: document.getElementById('edit-element').value,
          class: document.getElementById('edit-class').value,
          rarity: parseInt(document.getElementById('edit-rarity').value, 10),
          is_limited: document.getElementById('edit-is-limited').checked,
          description: document.getElementById('edit-desc').value
        };
        await updateHero(id, payload);
      } else {
        const payload = {
          name: document.getElementById('edit-name').value,
          class_restriction: document.getElementById('edit-class-restriction').value,
          rarity: parseInt(document.getElementById('edit-rarity').value, 10),
          is_limited: document.getElementById('edit-is-limited').checked,
          skill_description: document.getElementById('edit-desc').value
        };
        await updateArtifact(id, payload);
      }

      closeModal();
      loadEditorTable();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  });
}

function openEditModal(type, data) {
  const modal = document.getElementById('mgmt-modal');
  const title = document.getElementById('modal-title');
  const heroAttrsRow = document.getElementById('form-row-hero-attrs');
  const artClassGroup = document.getElementById('form-group-art-class');

  document.getElementById('edit-id').value = data.id;
  document.getElementById('edit-entity-type').value = type;
  document.getElementById('edit-name').value = data.name || '';
  document.getElementById('edit-rarity').value = String(data.rarity || 5);
  document.getElementById('edit-is-limited').checked = Boolean(data.is_limited);

  if (type === 'hero') {
    title.textContent = `Edit Hero: ${data.name}`;
    heroAttrsRow.classList.remove('hidden');
    artClassGroup.classList.add('hidden');

    document.getElementById('edit-element').value = data.element || 'Fire';
    document.getElementById('edit-class').value = data.class || 'Warrior';
    document.getElementById('edit-desc').value = data.description || '';
  } else {
    title.textContent = `Edit Artifact: ${data.name}`;
    heroAttrsRow.classList.add('hidden');
    artClassGroup.classList.remove('hidden');

    document.getElementById('edit-class-restriction').value = data.class_restriction || 'Common';
    document.getElementById('edit-desc').value = data.skill_description || '';
  }

  modal?.classList.remove('hidden');
}
