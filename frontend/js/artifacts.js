// Artifact List Section Component
import { fetchArtifacts } from './api.js';
import { openArtifactModal } from './artifact-detail.js';

export async function renderArtifactsSection(container, filters = {}) {
  try {
    const res = await fetchArtifacts(filters);
    if (!res.success) throw new Error(res.message);

    const artifacts = res.data;
    if (artifacts.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 3rem; color: var(--text-muted);">No artifacts found matching criteria.</div>`;
      return;
    }

    container.innerHTML = artifacts.map(art => {
      const stars = '★'.repeat(art.rarity);

      return `
        <div class="item-card" data-key="${art.key_name}">
          <div class="card-img-container">
            <div class="card-avatar-frame artifact-frame">
              <img src="${art.image_url}" alt="${art.name}" onerror="if(!this.dataset.tried){this.dataset.tried='1';this.src='https://epic7db.com/images/artifacts/${art.key_name}.webp';}else{this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2296%22 height=%2296%22 viewBox=%220 0 96 96%22><rect width=%2296%22 height=%2296%22 fill=%22%231a2332%22/><text x=%2248%22 y=%2254%22 fill=%22%238899a6%22 font-size=%2228%22 text-anchor=%22middle%22>💎</text></svg>';}" loading="lazy">
            </div>
            <div class="card-overlay-top">
              <span class="badge" style="background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); color:#fff; border:1px solid rgba(255,255,255,0.15);">${art.class_restriction || 'Common'}</span>
              <span class="stars">${stars}</span>
            </div>
          </div>
          <div class="card-body">
            <div class="card-title">${art.name}</div>
            <div class="card-subtitle">
              <span class="class-tag">Artifact ★${art.rarity}</span>
              ${art.is_limited ? '<span class="limited-tag">LIMITED</span>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-key');
        openArtifactModal(key);
        if (window.onSelectArtifact) {
          window.onSelectArtifact(key);
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div style="color:var(--elem-fire); padding:2rem;">Error loading artifacts: ${err.message}</div>`;
  }
}
