import { fetchStats } from './api.js';

export async function renderStatsView(container) {
  try {
    const res = await fetchStats();
    if (!res.success) throw new Error(res.message);

    const stats = res.data;

    container.innerHTML = `
      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.5rem;">
        <h2 style="font-family:var(--font-heading); color:#fff; margin-bottom:1.5rem;">📊 Personal Database Analytics</h2>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1.5rem;">

          <!-- Element Distribution -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.25rem;">
            <h3 style="color:#fff; font-family:var(--font-heading); margin-bottom:1rem;">Heroes by Element</h3>
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              ${stats.byElement.map(e => `
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.2rem;">
                    <span>${e.element}</span>
                    <span><strong>${e.count}</strong></span>
                  </div>
                  <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden;">
                    <div style="background:var(--elem-${e.element.toLowerCase()}); height:100%; width:${(e.count / stats.totalHeroes * 100).toFixed(0)}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Class Distribution -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.25rem;">
            <h3 style="color:#fff; font-family:var(--font-heading); margin-bottom:1rem;">Heroes by Class</h3>
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              ${stats.byClass.map(c => `
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.2rem;">
                    <span>${c.class}</span>
                    <span><strong>${c.count}</strong></span>
                  </div>
                  <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden;">
                    <div style="background:var(--primary-gradient); height:100%; width:${(c.count / stats.totalHeroes * 100).toFixed(0)}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div style="color:var(--elem-fire); padding:2rem;">Error loading statistics: ${err.message}</div>`;
  }
}
