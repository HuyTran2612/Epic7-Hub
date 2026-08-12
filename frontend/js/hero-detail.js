// Dedicated Hero Detail View & Modal Component
import { fetchHeroDetail, fetchHeroRecommendations, fetchNotes, saveNote, updateNote } from './api.js';

export async function openHeroModal(keyName) {
  const modal = document.getElementById('detail-modal');
  const modalContent = document.getElementById('modal-content');

  modalContent.innerHTML = `<div style="text-align:center; padding: 2rem;">Loading hero details...</div>`;
  modal.classList.add('active');

  try {
    const detailRes = await fetchHeroDetail(keyName);
    if (!detailRes.success) throw new Error(detailRes.message);
    const hero = detailRes.data;

    const recsRes = await fetchHeroRecommendations(keyName);
    const recs = recsRes.success ? recsRes.data : [];

    const notesRes = await fetchNotes('hero', hero.id);
    const notes = notesRes.success && notesRes.data.length > 0 ? notesRes.data[0] : null;

    const stats = hero.base_stats ? (typeof hero.base_stats === 'string' ? JSON.parse(hero.base_stats) : hero.base_stats) : {};
    const skills = hero.skills ? (typeof hero.skills === 'string' ? JSON.parse(hero.skills) : hero.skills) : [];
    const builds = hero.recommended_builds ? (typeof hero.recommended_builds === 'string' ? JSON.parse(hero.recommended_builds) : hero.recommended_builds) : [];

    const formatPercent = (val, defaultVal) => {
      if (val === undefined || val === null) return defaultVal;
      if (typeof val === 'number') return val <= 1 ? `${Math.round(val * 100)}%` : `${val}%`;
      return val.toString().includes('%') ? val : `${val}%`;
    };

    modalContent.innerHTML = `
      <div class="modal-header">
        <div class="card-avatar-frame element-border-${hero.element.toLowerCase()}" style="width:110px; height:110px; flex-shrink:0; padding:3px;">
          <img src="${hero.image_url}" alt="${hero.name}" onerror="this.src='https://epic7db.com/images/heroes/${hero.key_name}.webp'">
        </div>
        <div>
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; color:#fff;">${hero.name}</h2>
          <div style="display:flex; gap:0.5rem; margin: 0.5rem 0; flex-wrap:wrap; align-items:center;">
            <span class="badge badge-${hero.element.toLowerCase()}">${hero.element}</span>
            <span class="badge" style="background:rgba(255,255,255,0.1); color:#fff;">${hero.class}</span>
            <span class="stars">${'★'.repeat(hero.rarity)}</span>
            ${hero.is_limited ? '<span class="badge" style="background:#ff9800; color:#000; font-weight:800;">LIMITED</span>' : ''}
          </div>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-top:0.4rem;">${hero.description || ''}</p>
        </div>
      </div>

      <!-- Full Stats Grid (Lv. 60 Awakened) -->
      <h3 style="font-family:var(--font-heading); color:#fff; margin-bottom:0.5rem;">Base Stats (Lv. 60 Awakened)</h3>
      <table class="stats-table">
        <thead>
          <tr>
            <th>ATK</th>
            <th>HP</th>
            <th>DEF</th>
            <th>SPD</th>
            <th>Crit Rate</th>
            <th>Crit Dmg</th>
            <th>Eff</th>
            <th>Eff Res</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong style="color:var(--elem-fire);">${stats.atk || '-'}</strong></td>
            <td><strong style="color:var(--elem-earth);">${stats.hp || '-'}</strong></td>
            <td><strong style="color:var(--elem-ice);">${stats.def || '-'}</strong></td>
            <td><strong style="color:#38ef7d;">${stats.spd || '-'}</strong></td>
            <td><strong>${formatPercent(stats.crit_rate, '15%')}</strong></td>
            <td><strong>${formatPercent(stats.crit_damage, '150%')}</strong></td>
            <td><strong>${formatPercent(stats.eff || stats.effectiveness, '0%')}</strong></td>
            <td><strong>${formatPercent(stats.eff_res || stats.effect_resistance, '0%')}</strong></td>
          </tr>
        </tbody>
      </table>

      <!-- Skills -->
      <h3 style="font-family:var(--font-heading); color:#fff; margin:1.5rem 0 0.5rem 0;">Hero Skills</h3>
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        ${skills.map((s, idx) => `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.75rem;">
            <div style="font-weight:700; color:var(--text-accent); display:flex; justify-content:space-between;">
              <span>S${idx+1}: ${s.name}</span>
              ${s.cooldown ? `<span style="font-size:0.8rem; color:var(--text-muted);">${s.cooldown} Turns CD</span>` : ''}
            </div>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">${s.desc}</div>
          </div>
        `).join('')}
      </div>

      <!-- Recommended Builds -->
      ${builds.length > 0 ? `
        <h3 style="font-family:var(--font-heading); color:#fff; margin:1.5rem 0 0.5rem 0;">Recommended Equipment Builds</h3>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          ${builds.map(b => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); padding:0.75rem; border-radius:var(--radius-sm);">
              <div style="color:var(--elem-light); font-weight:700;">⚙ Set: ${b.set || 'Speed / Critical'}</div>
              ${b.main_stats ? `
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
                  Necklace: <strong style="color:#fff;">${b.main_stats.neck || 'Crit Dmg'}</strong> | 
                  Ring: <strong style="color:#fff;">${b.main_stats.ring || 'ATK%'}</strong> | 
                  Boots: <strong style="color:#fff;">${b.main_stats.boots || 'Speed'}</strong>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Recommended Artifacts -->
      ${recs.length > 0 ? `
        <h3 style="font-family:var(--font-heading); color:#fff; margin:1.5rem 0 0.5rem 0;">Recommended Artifacts</h3>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          ${recs.map(r => `
            <div style="background:rgba(255,255,255,0.05); padding:0.5rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
              <strong>💎 ${r.name}</strong> - <span style="font-size:0.8rem; color:var(--text-muted);">${r.note || ''}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Personal Notes -->
      <div class="notes-section" style="margin-top:1.5rem;">
        <h4 style="color:#fff; font-family:var(--font-heading);">Personal Notes & Tier</h4>
        <div style="display:flex; gap:1rem; align-items:center; margin-top:0.5rem;">
          <label style="color:var(--text-muted); font-size:0.85rem;">Personal Tier:</label>
          <select id="hero-tier-select" style="background:#000; color:#fff; border:1px solid var(--border-color); padding:0.3rem 0.6rem; border-radius:4px;">
            <option value="">None</option>
            <option value="S" ${notes && notes.personal_tier === 'S' ? 'selected' : ''}>S Tier</option>
            <option value="A" ${notes && notes.personal_tier === 'A' ? 'selected' : ''}>A Tier</option>
            <option value="B" ${notes && notes.personal_tier === 'B' ? 'selected' : ''}>B Tier</option>
            <option value="C" ${notes && notes.personal_tier === 'C' ? 'selected' : ''}>C Tier</option>
            <option value="D" ${notes && notes.personal_tier === 'D' ? 'selected' : ''}>D Tier</option>
          </select>
        </div>
        <textarea id="hero-note-input" class="notes-textarea" placeholder="Add personal note (e.g. Build strategy, Mola priority)...">${notes ? notes.note || '' : ''}</textarea>
        <div style="margin-top:0.75rem; text-align:right;">
          <button id="save-note-btn" class="btn-primary">Save Notes</button>
        </div>
      </div>
    `;

    modalContent.querySelector('#save-note-btn').addEventListener('click', async () => {
      const noteText = modalContent.querySelector('#hero-note-input').value;
      const tierVal = modalContent.querySelector('#hero-tier-select').value;

      if (notes) {
        await updateNote(notes.id, { note: noteText, personal_tier: tierVal, priority: 5 });
      } else {
        await saveNote({ target_type: 'hero', target_id: hero.id, note: noteText, personal_tier: tierVal, priority: 5 });
      }

      alert('Notes saved successfully!');
    });

  } catch (err) {
    modalContent.innerHTML = `<div style="color:var(--elem-fire); padding:2rem;">Failed to load detail: ${err.message}</div>`;
  }
}

export async function renderHeroDetailView(container, heroKey, onBack) {
  container.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted);">Loading hero details page...</div>`;
  try {
    const detailRes = await fetchHeroDetail(heroKey);
    if (!detailRes.success) throw new Error(detailRes.message);
    const hero = detailRes.data;

    const recsRes = await fetchHeroRecommendations(heroKey);
    const recs = recsRes.success ? recsRes.data : [];

    const notesRes = await fetchNotes('hero', hero.id);
    const notes = notesRes.success && notesRes.data.length > 0 ? notesRes.data[0] : null;

    const stats = hero.base_stats ? (typeof hero.base_stats === 'string' ? JSON.parse(hero.base_stats) : hero.base_stats) : {};
    const skills = hero.skills ? (typeof hero.skills === 'string' ? JSON.parse(hero.skills) : hero.skills) : [];
    const builds = hero.recommended_builds ? (typeof hero.recommended_builds === 'string' ? JSON.parse(hero.recommended_builds) : hero.recommended_builds) : [];

    const formatPercent = (val, defaultVal) => {
      if (val === undefined || val === null) return defaultVal;
      if (typeof val === 'number') return val <= 1 ? `${Math.round(val * 100)}%` : `${val}%`;
      return val.toString().includes('%') ? val : `${val}%`;
    };

    container.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <button id="back-to-heroes-btn" class="btn-primary" style="background:rgba(255,255,255,0.1); color:#fff; display:inline-flex; align-items:center; gap:0.5rem;">
          ← Back to Heroes
        </button>
      </div>

      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:2rem;">
        <div class="modal-header">
          <div class="card-avatar-frame element-border-${hero.element.toLowerCase()}" style="width:110px; height:110px; flex-shrink:0; padding:3px;">
            <img src="${hero.image_url}" alt="${hero.name}" onerror="this.src='https://epic7db.com/images/heroes/${hero.key_name}.webp'">
          </div>
          <div>
            <h1 style="font-family: var(--font-heading); font-size: 2.2rem; color:#fff;">${hero.name}</h1>
            <div style="display:flex; gap:0.5rem; margin: 0.75rem 0; flex-wrap:wrap; align-items:center;">
              <span class="badge badge-${hero.element.toLowerCase()}">${hero.element}</span>
              <span class="badge" style="background:rgba(255,255,255,0.1); color:#fff;">${hero.class}</span>
              <span class="stars">${'★'.repeat(hero.rarity)}</span>
              ${hero.is_limited ? '<span class="badge" style="background:#ff9800; color:#000; font-weight:800;">LIMITED</span>' : ''}
            </div>
            <p style="color:var(--text-muted); font-size:1rem; margin-top:0.5rem; line-height:1.6;">${hero.description || ''}</p>
          </div>
        </div>

        <!-- Full Stats Grid (Lv. 60 Awakened) -->
        <h3 style="font-family:var(--font-heading); color:#fff; margin-bottom:0.5rem;">Base Stats (Lv. 60 Awakened)</h3>
        <table class="stats-table" style="margin-bottom:2rem;">
          <thead>
            <tr>
              <th>ATK</th>
              <th>HP</th>
              <th>DEF</th>
              <th>SPD</th>
              <th>Crit Rate</th>
              <th>Crit Dmg</th>
              <th>Eff</th>
              <th>Eff Res</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style="color:var(--elem-fire); font-size:1.1rem;">${stats.atk || '-'}</strong></td>
              <td><strong style="color:var(--elem-earth); font-size:1.1rem;">${stats.hp || '-'}</strong></td>
              <td><strong style="color:var(--elem-ice); font-size:1.1rem;">${stats.def || '-'}</strong></td>
              <td><strong style="color:#38ef7d; font-size:1.1rem;">${stats.spd || '-'}</strong></td>
              <td><strong>${formatPercent(stats.crit_rate, '15%')}</strong></td>
              <td><strong>${formatPercent(stats.crit_damage, '150%')}</strong></td>
              <td><strong>${formatPercent(stats.eff || stats.effectiveness, '0%')}</strong></td>
              <td><strong>${formatPercent(stats.eff_res || stats.effect_resistance, '0%')}</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- Skills -->
        <h3 style="font-family:var(--font-heading); color:#fff; margin:2rem 0 0.75rem 0;">Hero Skills</h3>
        <div style="display:flex; flex-direction:column; gap:1rem;">
          ${skills.map((s, idx) => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem;">
              <div style="font-weight:700; font-size:1.1rem; color:var(--text-accent); display:flex; justify-content:space-between;">
                <span>S${idx+1}: ${s.name}</span>
                ${s.cooldown ? `<span style="font-size:0.85rem; color:var(--text-muted);">${s.cooldown} Turns CD</span>` : ''}
              </div>
              <div style="font-size:0.95rem; color:var(--text-main); margin-top:0.5rem; line-height:1.5;">${s.desc}</div>
            </div>
          `).join('')}
        </div>

        <!-- Recommended Builds -->
        ${builds.length > 0 ? `
          <h3 style="font-family:var(--font-heading); color:#fff; margin:2rem 0 0.75rem 0;">Recommended Equipment Builds</h3>
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${builds.map(b => `
              <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); padding:1rem; border-radius:var(--radius-md);">
                <div style="color:var(--elem-light); font-size:1.05rem; font-weight:700;">⚙ Set: ${b.set || 'Speed / Critical'}</div>
                ${b.main_stats ? `
                  <div style="font-size:0.9rem; color:var(--text-muted); margin-top:0.4rem;">
                    Necklace: <strong style="color:#fff;">${b.main_stats.neck || 'Crit Dmg'}</strong> | 
                    Ring: <strong style="color:#fff;">${b.main_stats.ring || 'ATK%'}</strong> | 
                    Boots: <strong style="color:#fff;">${b.main_stats.boots || 'Speed'}</strong>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Recommended Artifacts -->
        ${recs.length > 0 ? `
          <h3 style="font-family:var(--font-heading); color:#fff; margin:2rem 0 0.75rem 0;">Recommended Artifacts</h3>
          <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            ${recs.map(r => `
              <div style="background:rgba(255,255,255,0.05); padding:0.75rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
                <strong style="color:#fff; font-size:1.05rem;">💎 ${r.name}</strong>
                ${r.note ? `<div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">${r.note}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Personal Notes -->
        <div class="notes-section" style="margin-top:2rem;">
          <h4 style="color:#fff; font-family:var(--font-heading); font-size:1.2rem;">Personal Notes & Tier</h4>
          <div style="display:flex; gap:1rem; align-items:center; margin-top:0.75rem;">
            <label style="color:var(--text-muted); font-size:0.9rem;">Personal Tier Rating:</label>
            <select id="hero-detail-tier-select" style="background:#000; color:#fff; border:1px solid var(--border-color); padding:0.4rem 0.8rem; border-radius:4px; font-size:0.95rem;">
              <option value="">None (Unranked)</option>
              <option value="S" ${notes && notes.personal_tier === 'S' ? 'selected' : ''}>S Tier</option>
              <option value="A" ${notes && notes.personal_tier === 'A' ? 'selected' : ''}>A Tier</option>
              <option value="B" ${notes && notes.personal_tier === 'B' ? 'selected' : ''}>B Tier</option>
              <option value="C" ${notes && notes.personal_tier === 'C' ? 'selected' : ''}>C Tier</option>
              <option value="D" ${notes && notes.personal_tier === 'D' ? 'selected' : ''}>D Tier</option>
            </select>
          </div>
          <textarea id="hero-detail-note-input" class="notes-textarea" style="min-height:100px; font-size:0.95rem;" placeholder="Add personal note (e.g. Build strategy, Mola priority, PvP team compositions)...">${notes ? notes.note || '' : ''}</textarea>
          <div style="margin-top:1rem; text-align:right;">
            <button id="save-hero-detail-note-btn" class="btn-primary" style="padding:0.75rem 1.5rem; font-size:1rem;">Save Notes</button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#back-to-heroes-btn').addEventListener('click', () => {
      if (onBack) onBack();
    });

    container.querySelector('#save-hero-detail-note-btn').addEventListener('click', async () => {
      const noteText = container.querySelector('#hero-detail-note-input').value;
      const tierVal = container.querySelector('#hero-detail-tier-select').value;

      if (notes) {
        await updateNote(notes.id, { note: noteText, personal_tier: tierVal, priority: 5 });
      } else {
        await saveNote({ target_type: 'hero', target_id: hero.id, note: noteText, personal_tier: tierVal, priority: 5 });
      }

      alert('Hero notes saved successfully!');
    });

  } catch (err) {
    container.innerHTML = `<div style="color:var(--elem-fire); padding:2rem;">Failed to load hero details page: ${err.message}</div>`;
  }
}
