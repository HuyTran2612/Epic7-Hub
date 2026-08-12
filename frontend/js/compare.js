import { fetchHeroes, fetchHeroDetail } from './api.js';

export async function renderCompareView(container) {
  try {
    const heroesRes = await fetchHeroes({ limit: 100 });
    const heroes = heroesRes.success ? heroesRes.data : [];

    container.innerHTML = `
      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.5rem;">
        <h2 style="font-family:var(--font-heading); color:#fff; margin-bottom:1rem;">⚔️ Hero Comparison Tool</h2>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-bottom:1.5rem;">
          <div>
            <label style="color:var(--text-muted); font-size:0.85rem;">Select Hero 1:</label>
            <select id="compare-hero-1" style="width:100%; background:#000; color:#fff; border:1px solid var(--border-color); padding:0.6rem; border-radius:var(--radius-sm); margin-top:0.3rem;">
              <option value="">-- Choose Hero --</option>
              ${heroes.map(h => `<option value="${h.key_name}">${h.name} (${h.element} ${h.class})</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="color:var(--text-muted); font-size:0.85rem;">Select Hero 2:</label>
            <select id="compare-hero-2" style="width:100%; background:#000; color:#fff; border:1px solid var(--border-color); padding:0.6rem; border-radius:var(--radius-sm); margin-top:0.3rem;">
              <option value="">-- Choose Hero --</option>
              ${heroes.map(h => `<option value="${h.key_name}">${h.name} (${h.element} ${h.class})</option>`).join('')}
            </select>
          </div>
        </div>

        <div id="compare-result-container" style="display:none; grid-template-columns: 1fr 1fr; gap:1.5rem;">
          <!-- Injected via selection -->
        </div>
      </div>
    `;

    const select1 = container.querySelector('#compare-hero-1');
    const select2 = container.querySelector('#compare-hero-2');
    const resultDiv = container.querySelector('#compare-result-container');

    async function updateCompare() {
      const key1 = select1.value;
      const key2 = select2.value;

      if (!key1 || !key2) {
        resultDiv.style.display = 'none';
        return;
      }

      const [res1, res2] = await Promise.all([fetchHeroDetail(key1), fetchHeroDetail(key2)]);

      if (!res1.success || !res2.success) return;

      const h1 = res1.data;
      const h2 = res2.data;

      const s1 = typeof h1.base_stats === 'string' ? JSON.parse(h1.base_stats) : (h1.base_stats || {});
      const s2 = typeof h2.base_stats === 'string' ? JSON.parse(h2.base_stats) : (h2.base_stats || {});

      resultDiv.style.display = 'grid';
      resultDiv.innerHTML = `
        ${renderHeroCompareCard(h1, s1, s2)}
        ${renderHeroCompareCard(h2, s2, s1)}
      `;
    }

    select1.addEventListener('change', updateCompare);
    select2.addEventListener('change', updateCompare);

  } catch (err) {
    container.innerHTML = `<div style="color:var(--elem-fire); padding:2rem;">Error loading comparison tool: ${err.message}</div>`;
  }
}

function renderHeroCompareCard(hero, myStats, otherStats) {
  function statCompare(val1, val2) {
    if (!val1) return '-';
    if (!val2) return `<strong>${val1}</strong>`;
    const num1 = parseInt(val1, 10);
    const num2 = parseInt(val2, 10);
    if (num1 > num2) return `<strong style="color:#38ef7d;">${val1} ▲</strong>`;
    if (num1 < num2) return `<strong style="color:#ff4b5c;">${val1} ▼</strong>`;
    return `<strong>${val1}</strong>`;
  }

  return `
    <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.25rem;">
      <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
        <img src="${hero.image_url}" style="width:70px; height:70px; border-radius:var(--radius-sm); object-fit:cover;">
        <div>
          <h3 style="font-family:var(--font-heading); color:#fff;">${hero.name}</h3>
          <div><span class="badge badge-${hero.element.toLowerCase()}">${hero.element}</span> ${hero.class} ${'★'.repeat(hero.rarity)}</div>
        </div>
      </div>

      <table class="stats-table">
        <tr><th>ATK</th><td>${statCompare(myStats.atk, otherStats.atk)}</td></tr>
        <tr><th>HP</th><td>${statCompare(myStats.hp, otherStats.hp)}</td></tr>
        <tr><th>DEF</th><td>${statCompare(myStats.def, otherStats.def)}</td></tr>
        <tr><th>SPD</th><td>${statCompare(myStats.spd, otherStats.spd)}</td></tr>
      </table>
    </div>
  `;
}
