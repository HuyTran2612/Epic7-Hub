// Interactive Tier List View Component (PvE, PvP, Guild War, General Mode with Drag & Drop & Direct Reassignment)
import { fetchTierList, saveNote } from './api.js';
import { openHeroModal } from './hero-detail.js';

let currentTierCategory = 'general';

export async function renderTierListView(container, category = currentTierCategory) {
  currentTierCategory = category;

  container.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted);">Loading Tier List (${category.toUpperCase()})...</div>`;

  try {
    const res = await fetchTierList(currentTierCategory);
    if (!res.success) throw new Error(res.message);

    const grouped = res.data;
    const tierConfig = {
      S: { color: '#f1c40f', bg: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)' },
      A: { color: '#a55eea', bg: 'linear-gradient(135deg, #a55eea 0%, #8e44ad 100%)' },
      B: { color: '#3498db', bg: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' },
      C: { color: '#2ecc71', bg: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' },
      D: { color: '#95a5a6', bg: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)' },
      Unranked: { color: '#4a5568', bg: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' }
    };

    const tiers = ['S', 'A', 'B', 'C', 'D', 'Unranked'];

    container.innerHTML = `
      <!-- Tier List Category Selector Tabs -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem; background:var(--bg-card); padding:0.75rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <div style="font-family:var(--font-heading); font-size:1.1rem; font-weight:700; color:#fff; display:flex; align-items:center; gap:0.5rem;">
          📊 <span>Personal Tier List</span>
        </div>
        <div class="tier-category-tabs" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="tier-tab-btn ${currentTierCategory === 'general' ? 'active' : ''}" data-cat="general">⚔️ General</button>
          <button class="tier-tab-btn ${currentTierCategory === 'pve' ? 'active' : ''}" data-cat="pve">🏰 PvE Mode</button>
          <button class="tier-tab-btn ${currentTierCategory === 'pvp' ? 'active' : ''}" data-cat="pvp">🛡️ PvP Arena</button>
          <button class="tier-tab-btn ${currentTierCategory === 'gw' ? 'active' : ''}" data-cat="gw">🚩 Guild War</button>
        </div>
      </div>

      <!-- Drag & Drop Guidance Toast -->
      <div style="background:rgba(56, 239, 125, 0.08); border:1px solid rgba(56, 239, 125, 0.2); border-radius:var(--radius-sm); padding:0.5rem 1rem; margin-bottom:1.5rem; font-size:0.85rem; color:var(--text-accent); display:flex; align-items:center; justify-content:space-between;">
        <span>💡 <strong>Direct Interactive Mode:</strong> Drag & drop hero icons into any Tier row, or click a hero to change Tier or view full stats!</span>
        <span style="font-size:0.75rem; color:var(--text-muted);">Mode: <strong style="color:#fff; text-transform:uppercase;">${currentTierCategory}</strong></span>
      </div>

      <!-- Tier Rows List -->
      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        ${tiers.map(tier => {
          const list = grouped[tier] || [];
          const cfg = tierConfig[tier];

          return `
            <div class="tier-row-container" data-tier="${tier}" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); overflow:hidden; display:flex; box-shadow:var(--card-shadow); transition:border-color 0.2s;">
              <div style="background:${cfg.bg}; color:#000; width:100px; font-family:var(--font-heading); font-size:1.6rem; font-weight:800; display:flex; flex-direction:column; align-items:center; justify-content:center; text-shadow:0 1px 2px rgba(255,255,255,0.4); flex-shrink:0;">
                <span>${tier}</span>
                <span style="font-size:0.65rem; letter-spacing:1px; font-weight:700; opacity:0.85;">TIER</span>
              </div>
              <div class="tier-drop-zone" data-tier="${tier}" style="padding:1rem; flex:1; display:flex; flex-wrap:wrap; gap:1.25rem; align-items:center; min-height:95px; background:rgba(0,0,0,0.15); transition:background 0.2s;">
                ${list.length === 0 ? `<span class="empty-tier-msg" style="color:var(--text-muted); font-size:0.85rem; font-style:italic;">Drag heroes here to assign to ${tier} tier</span>` : ''}
                ${list.map(hero => {
                  const borderClass = `element-border-${(hero.element || 'fire').toLowerCase()}`;
                  return `
                    <div class="tier-hero-card" draggable="true" data-hero-id="${hero.id}" data-key="${hero.key_name}" data-hero-name="${hero.name}" style="display:flex; flex-direction:column; align-items:center; width:72px; text-align:center; position:relative;">
                      <div class="card-avatar-frame ${borderClass}" style="width:58px; height:58px; padding:2px;">
                        <img src="${hero.image_url}" alt="${hero.name}" onerror="this.src='https://epic7db.com/images/heroes/${hero.key_name}.webp'" loading="lazy">
                      </div>
                      <span style="font-size:0.75rem; font-weight:600; color:#fff; margin-top:0.3rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${hero.name}</span>

                      <!-- Quick Tier Change Buttons -->
                      <div class="quick-tier-picker" style="display:none; position:absolute; top:-35px; left:50%; transform:translateX(-50%); background:#090d16; border:1px solid var(--border-color); border-radius:12px; padding:3px 6px; z-index:10; box-shadow:0 8px 20px rgba(0,0,0,0.9); white-space:nowrap;">
                        <span class="qtier-btn" data-target-tier="S" style="color:#f1c40f; font-weight:800; cursor:pointer; padding:2px 4px;">S</span>
                        <span class="qtier-btn" data-target-tier="A" style="color:#a55eea; font-weight:800; cursor:pointer; padding:2px 4px;">A</span>
                        <span class="qtier-btn" data-target-tier="B" style="color:#3498db; font-weight:800; cursor:pointer; padding:2px 4px;">B</span>
                        <span class="qtier-btn" data-target-tier="C" style="color:#2ecc71; font-weight:800; cursor:pointer; padding:2px 4px;">C</span>
                        <span class="qtier-btn" data-target-tier="D" style="color:#95a5a6; font-weight:800; cursor:pointer; padding:2px 4px;">D</span>
                        <span class="qtier-btn" data-target-tier="" style="color:#ff4b5c; font-weight:800; cursor:pointer; padding:2px 4px;" title="Reset Tier">✕</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Category Tabs Handler
    container.querySelectorAll('.tier-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat');
        renderTierListView(container, cat);
      });
    });

    // Setup Drag & Drop Handlers
    initDragAndDrop(container);

    // Setup Quick Tier Picker Handlers
    initQuickTierPicker(container);

  } catch (err) {
    container.innerHTML = `<div style="color:var(--elem-fire); padding:2rem;">Error loading Tier List: ${err.message}</div>`;
  }
}

function initDragAndDrop(container) {
  let draggedHeroId = null;

  // Drag Start
  container.querySelectorAll('.tier-hero-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedHeroId = card.getAttribute('data-hero-id');
      e.dataTransfer.setData('text/plain', draggedHeroId);
      card.style.opacity = '0.4';
    });

    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });

    // Click on avatar to open Hero Detail
    card.querySelector('.card-avatar-frame').addEventListener('click', (e) => {
      e.stopPropagation();
      const key = card.getAttribute('data-key');
      openHeroModal(key);
      if (window.onSelectHero) {
        window.onSelectHero(key);
      }
    });

    // Right click or hover toggle for quick tier picker
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const picker = card.querySelector('.quick-tier-picker');
      if (picker) {
        picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
      }
    });
  });

  // Drop Zones
  container.querySelectorAll('.tier-drop-zone').forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.style.background = 'rgba(56, 239, 125, 0.15)';
    });

    zone.addEventListener('dragleave', () => {
      zone.style.background = 'rgba(0,0,0,0.15)';
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.style.background = 'rgba(0,0,0,0.15)';

      const heroId = e.dataTransfer.getData('text/plain') || draggedHeroId;
      const targetTier = zone.getAttribute('data-tier');
      const assignedTier = targetTier === 'Unranked' ? '' : targetTier;

      if (heroId) {
        await reassignHeroTier(heroId, assignedTier);
        renderTierListView(container, currentTierCategory);
      }
    });
  });
}

function initQuickTierPicker(container) {
  container.querySelectorAll('.qtier-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const card = btn.closest('.tier-hero-card');
      const heroId = card.getAttribute('data-hero-id');
      const targetTier = btn.getAttribute('data-target-tier');

      await reassignHeroTier(heroId, targetTier);
      renderTierListView(container, currentTierCategory);
    });
  });
}

async function reassignHeroTier(heroId, personalTier) {
  try {
    await saveNote({
      target_type: 'hero',
      target_id: parseInt(heroId, 10),
      personal_tier: personalTier || null,
      category: currentTierCategory,
      priority: 5
    });
  } catch (err) {
    console.error('Failed to update hero tier:', err);
  }
}
