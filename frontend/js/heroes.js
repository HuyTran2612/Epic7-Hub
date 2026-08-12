// Hero List Section Component
import { fetchHeroes } from './api.js';
import { openHeroModal } from './hero-detail.js';

export async function renderHeroesSection(container, filters = {}) {
  try {
    const res = await fetchHeroes(filters);
    if (!res.success) throw new Error(res.message);

    const heroes = res.data;
    if (heroes.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 3rem; color: var(--text-muted);">No heroes found matching criteria.</div>`;
      return;
    }

    container.innerHTML = heroes.map(hero => {
      const elementClass = `badge-${hero.element.toLowerCase()}`;
      const borderClass = `element-border-${hero.element.toLowerCase()}`;
      const stars = '★'.repeat(hero.rarity);

      return `
        <div class="item-card" data-key="${hero.key_name}">
          <div class="card-img-container">
            <div class="card-avatar-frame ${borderClass}">
              <img src="${hero.image_url}" alt="${hero.name}" onerror="this.src='https://epic7db.com/images/heroes/${hero.key_name}.webp'" loading="lazy">
            </div>
            <div class="card-overlay-top">
              <span class="badge ${elementClass}">${hero.element}</span>
              <span class="stars">${stars}</span>
            </div>
          </div>
          <div class="card-body">
            <div class="card-title">${hero.name}</div>
            <div class="card-subtitle">
              <span class="class-tag">${hero.class}</span>
              ${hero.is_limited ? '<span class="limited-tag">LIMITED</span>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click event for detail modal & detail view
    container.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-key');
        openHeroModal(key);
        if (window.onSelectHero) {
          window.onSelectHero(key);
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div style="color:var(--elem-fire); padding:2rem;">Error loading heroes: ${err.message}</div>`;
  }
}
