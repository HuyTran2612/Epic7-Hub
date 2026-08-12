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
          <img src="${art.image_url}" alt="${art.name}" onerror="this.src='https://epic7db.com/images/artifacts/${art.key_name}.webp'">
        </div>
        <div>
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; color:#fff;">${art.name}</h2>
          <div style="display:flex; gap:0.5rem; margin: 0.5rem 0;">
            <span class="badge" style="background:rgba(255,255,255,0.1); color:#fff;">Class: ${art.class_restriction || 'Common'}</span>
            <span class="stars">${'★'.repeat(art.rarity)}</span>
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
            <img src="${art.image_url}" alt="${art.name}" onerror="this.src='https://epic7db.com/images/artifacts/${art.key_name}.webp'">
          </div>
          <div>
            <h1 style="font-family: var(--font-heading); font-size: 2.2rem; color:#fff;">${art.name}</h1>
            <div style="display:flex; gap:0.5rem; margin: 0.75rem 0; align-items:center;">
              <span class="badge" style="background:rgba(255,255,255,0.1); color:#fff; font-size:0.9rem;">Class: ${art.class_restriction || 'Common'}</span>
              <span class="stars" style="font-size:1.2rem;">${'★'.repeat(art.rarity)}</span>
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
