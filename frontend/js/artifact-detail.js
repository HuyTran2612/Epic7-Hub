// Dedicated Artifact Detail View & Modal Component
import { fetchArtifactDetail, fetchNotes, saveNote, updateNote } from './api.js';

export async function openArtifactModal(keyName) {
  const modal = document.getElementById('detail-modal');
  const modalContent = document.getElementById('modal-content');

  modalContent.innerHTML = `<div style="text-align:center; padding: 2rem;">Loading artifact details...</div>`;
  modal.classList.add('active');

  try {
    const detailRes = await fetchArtifactDetail(keyName);
    if (!detailRes.success) throw new Error(detailRes.message);
    const art = detailRes.data;

    const notesRes = await fetchNotes('artifact', art.id);
    const notes = notesRes.success && notesRes.data.length > 0 ? notesRes.data[0] : null;

    const baseStats = art.base_stats ? (typeof art.base_stats === 'string' ? JSON.parse(art.base_stats) : art.base_stats) : {};
    const maxStats = art.max_stats ? (typeof art.max_stats === 'string' ? JSON.parse(art.max_stats) : art.max_stats) : {};

    modalContent.innerHTML = `
      <div class="modal-header">
        <div class="card-avatar-frame artifact-frame" style="width:110px; height:110px; flex-shrink:0; padding:3px;">
          <img src="${art.image_url}" alt="${art.name}" onerror="if(!this.dataset.tried){this.dataset.tried='1';this.src='https://epic7db.com/images/artifacts/${art.key_name}.webp';}else{this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2296%22 height=%2296%22 viewBox=%220 0 96 96%22><rect width=%2296%22 height=%2296%22 fill=%22%231a2332%22/><text x=%2248%22 y=%2254%22 fill=%22%238899a6%22 font-size=%2228%22 text-anchor=%22middle%22>💎</text></svg>';}">
        </div>
        <div>
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; color:#fff;">${art.name}</h2>
          <div style="display:flex; gap:0.5rem; margin: 0.5rem 0; align-items:center;">
            <span class="badge" style="background:rgba(255,255,255,0.1); color:#fff;">Class: ${art.class_restriction || 'Common'}</span>
            <span class="stars">${'★'.repeat(art.rarity)}</span>
            ${art.is_limited ? '<span class="badge" style="background:#ff9800; color:#000; font-weight:800;">LIMITED</span>' : ''}
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <h3 style="font-family:var(--font-heading); color:#fff; margin-bottom:0.5rem;">Artifact Stats</h3>
      <table class="stats-table">
        <thead>
          <tr>
            <th>Level</th>
            <th>ATK</th>
            <th>HP</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Lv. 1 Base</strong></td>
            <td>${baseStats.atk || '-'}</td>
            <td>${baseStats.hp || '-'}</td>
          </tr>
          <tr>
            <td><strong>Lv. 30 Max</strong></td>
            <td><strong style="color:#38ef7d;">${maxStats.atk || '-'}</strong></td>
            <td><strong style="color:#38ef7d;">${maxStats.hp || '-'}</strong></td>
          </tr>
        </tbody>
      </table>

      <!-- Skill Effect -->
      <h3 style="font-family:var(--font-heading); color:#fff; margin:1.5rem 0 0.5rem 0;">Artifact Skill Effect</h3>
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.75rem;">
          <div style="font-weight:700; color:var(--text-accent);">Base Effect (Lv. 1)</div>
          <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">${art.skill_description || 'No description'}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.75rem;">
          <div style="font-weight:700; color:#38ef7d;">Max Enhanced Effect (Lv. 30)</div>
          <div style="font-size:0.85rem; color:#fff; margin-top:0.25rem;">${art.skill_max_description || art.skill_description || 'No description'}</div>
        </div>
      </div>

      <!-- High-Res Artifact Illustration Archive -->
      ${art.full_artwork_url ? `
        <h3 style="font-family:var(--font-heading); color:#fff; margin:1.5rem 0 0.5rem 0;">🎨 E7 Codex Full HD Illustration</h3>
        <div style="background:rgba(0,0,0,0.4); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; text-align:center;">
          <img src="${art.full_artwork_url}" alt="${art.name} Full Illustration" style="max-height:380px; max-width:100%; object-fit:contain; border-radius:var(--radius-sm); filter:drop-shadow(0 10px 25px rgba(0,0,0,0.9));" onerror="this.parentElement.style.display='none';">
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem;">Source: <a href="https://e7codex.com" target="_blank" rel="noopener" style="color:var(--text-accent);">E7 Codex Archive</a></div>
        </div>
      ` : ''}

      <div class="notes-section" style="margin-top:1.5rem;">
        <h4 style="color:#fff; font-family:var(--font-heading);">Personal Notes</h4>
        <textarea id="art-note-input" class="notes-textarea" placeholder="Add personal notes for this artifact...">${notes ? notes.note || '' : ''}</textarea>
        <div style="margin-top:0.75rem; text-align:right;">
          <button id="save-art-note-btn" class="btn-primary">Save Notes</button>
        </div>
      </div>
    `;

    modalContent.querySelector('#save-art-note-btn').addEventListener('click', async () => {
      const noteText = modalContent.querySelector('#art-note-input').value;
      if (notes) {
        await updateNote(notes.id, { note: noteText });
      } else {
        await saveNote({ target_type: 'artifact', target_id: art.id, note: noteText });
      }
      alert('Artifact notes saved successfully!');
    });

  } catch (err) {
    modalContent.innerHTML = `<div style="color:var(--elem-fire); padding:2rem;">Failed to load detail: ${err.message}</div>`;
  }
}

export async function renderArtifactDetailView(container, artifactKey, onBack) {
  container.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted);">Loading artifact details page...</div>`;
  try {
    const detailRes = await fetchArtifactDetail(artifactKey);
    if (!detailRes.success) throw new Error(detailRes.message);
    const art = detailRes.data;

    const notesRes = await fetchNotes('artifact', art.id);
    const notes = notesRes.success && notesRes.data.length > 0 ? notesRes.data[0] : null;

    const baseStats = art.base_stats ? (typeof art.base_stats === 'string' ? JSON.parse(art.base_stats) : art.base_stats) : {};
    const maxStats = art.max_stats ? (typeof art.max_stats === 'string' ? JSON.parse(art.max_stats) : art.max_stats) : {};

    container.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <button id="back-to-artifacts-btn" class="btn-primary" style="background:rgba(255,255,255,0.1); color:#fff; display:inline-flex; align-items:center; gap:0.5rem;">
          ← Back to Artifacts
        </button>
      </div>

      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:2rem;">
        <div class="modal-header">
          <div class="card-avatar-frame artifact-frame" style="width:110px; height:110px; flex-shrink:0; padding:3px;">
            <img src="${art.image_url}" alt="${art.name}" onerror="if(!this.dataset.tried){this.dataset.tried='1';this.src='https://epic7db.com/images/artifacts/${art.key_name}.webp';}else{this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2296%22 height=%2296%22 viewBox=%220 0 96 96%22><rect width=%2296%22 height=%2296%22 fill=%22%231a2332%22/><text x=%2248%22 y=%2254%22 fill=%22%238899a6%22 font-size=%2228%22 text-anchor=%22middle%22>💎</text></svg>';}">
          </div>
          <div>
            <h1 style="font-family: var(--font-heading); font-size: 2.2rem; color:#fff;">${art.name}</h1>
            <div style="display:flex; gap:0.5rem; margin: 0.75rem 0; align-items:center;">
              <span class="badge" style="background:rgba(255,255,255,0.1); color:#fff; font-size:0.9rem;">Class: ${art.class_restriction || 'Common'}</span>
              <span class="stars" style="font-size:1.2rem;">${'★'.repeat(art.rarity)}</span>
              ${art.is_limited ? '<span class="badge" style="background:#ff9800; color:#000; font-weight:800;">LIMITED</span>' : ''}
            </div>
          </div>
        </div>

        <!-- Artifact Stats Grid -->
        <h3 style="font-family:var(--font-heading); color:#fff; margin-bottom:0.5rem;">Artifact Base & Max Stats</h3>
        <table class="stats-table" style="margin-bottom:2rem;">
          <thead>
            <tr>
              <th>Enhancement Level</th>
              <th>Attack (ATK)</th>
              <th>Health (HP)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Lv. 1 Base</strong></td>
              <td>${baseStats.atk || '-'}</td>
              <td>${baseStats.hp || '-'}</td>
            </tr>
            <tr>
              <td><strong>Lv. 30 Max (+30)</strong></td>
              <td><strong style="color:#38ef7d; font-size:1.1rem;">${maxStats.atk || '-'}</strong></td>
              <td><strong style="color:#38ef7d; font-size:1.1rem;">${maxStats.hp || '-'}</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- Artifact Skill Effect -->
        <h3 style="font-family:var(--font-heading); color:#fff; margin:2rem 0 0.75rem 0;">Artifact Skill Effects</h3>
        <div style="display:flex; flex-direction:column; gap:1rem;">
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem;">
            <div style="font-weight:700; color:var(--text-accent); font-size:1.05rem;">Base Effect (Lv. 1)</div>
            <div style="font-size:0.95rem; color:var(--text-muted); margin-top:0.4rem; line-height:1.5;">${art.skill_description || 'No description available'}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem;">
            <div style="font-weight:700; color:#38ef7d; font-size:1.05rem;">Max Enhanced Effect (Lv. 30)</div>
            <div style="font-size:0.95rem; color:#fff; margin-top:0.4rem; line-height:1.5;">${art.skill_max_description || art.skill_description || 'No description available'}</div>
          </div>
        </div>

        <!-- High-Res Artifact Illustration Archive -->
        ${art.full_artwork_url ? `
          <h3 style="font-family:var(--font-heading); color:#fff; margin:2rem 0 0.75rem 0;">🎨 E7 Codex Full HD Illustration</h3>
          <div style="background:rgba(0,0,0,0.4); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.25rem; text-align:center;">
            <img src="${art.full_artwork_url}" alt="${art.name} Full Illustration" style="max-height:450px; max-width:100%; object-fit:contain; border-radius:var(--radius-md); filter:drop-shadow(0 10px 25px rgba(0,0,0,0.9));" onerror="this.parentElement.style.display='none';">
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.5rem;">High-Resolution Asset Source: <a href="https://e7codex.com" target="_blank" rel="noopener" style="color:var(--text-accent);">E7 Codex Archive</a></div>
          </div>
        ` : ''}

        <!-- Personal Notes -->
        <div class="notes-section" style="margin-top:2rem;">
          <h4 style="color:#fff; font-family:var(--font-heading); font-size:1.2rem;">Personal Notes</h4>
          <textarea id="art-detail-note-input" class="notes-textarea" style="min-height:100px; font-size:0.95rem;" placeholder="Add personal notes for this artifact...">${notes ? notes.note || '' : ''}</textarea>
          <div style="margin-top:1rem; text-align:right;">
            <button id="save-art-detail-note-btn" class="btn-primary" style="padding:0.75rem 1.5rem; font-size:1rem;">Save Notes</button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#back-to-artifacts-btn').addEventListener('click', () => {
      if (onBack) onBack();
    });

    container.querySelector('#save-art-detail-note-btn').addEventListener('click', async () => {
      const noteText = container.querySelector('#art-detail-note-input').value;
      if (notes) {
        await updateNote(notes.id, { note: noteText });
      } else {
        await saveNote({ target_type: 'artifact', target_id: art.id, note: noteText });
      }
      alert('Artifact notes saved successfully!');
    });

  } catch (err) {
    container.innerHTML = `<div style="color:var(--elem-fire); padding:2rem;">Failed to load artifact details page: ${err.message}</div>`;
  }
}
