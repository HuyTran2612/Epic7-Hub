import { importBackup } from './api.js';

export function renderBackupView(container) {
  container.innerHTML = `
    <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:2rem; max-width:700px; margin:0 auto;">
      <h2 style="font-family:var(--font-heading); color:#fff; margin-bottom:1rem;">💾 Data Backup & Restore</h2>
      <p style="color:var(--text-muted); margin-bottom:1.5rem;">Export your personal notes, tier lists, and collection status to a local JSON backup file or restore from a previously exported backup.</p>

      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.25rem;">
          <h3 style="color:#fff; font-family:var(--font-heading);">Export Data Backup</h3>
          <p style="color:var(--text-muted); font-size:0.85rem; margin:0.5rem 0 1rem 0;">Download all user notes and collection entries as a single JSON file.</p>
          <a href="/api/backup/export" download class="btn-primary" style="display:inline-block; text-decoration:none;">Download JSON Backup</a>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.25rem;">
          <h3 style="color:#fff; font-family:var(--font-heading);">Restore / Import Data Backup</h3>
          <p style="color:var(--text-muted); font-size:0.85rem; margin:0.5rem 0 1rem 0;">Select a JSON backup file to import notes and collection status.</p>
          <input type="file" id="backup-file-input" accept=".json" style="margin-bottom:1rem; display:block; color:var(--text-muted);">
          <button id="import-btn" class="btn-primary">Import Backup File</button>
        </div>
      </div>
    </div>
  `;

  const importBtn = container.querySelector('#import-btn');
  const fileInput = container.querySelector('#backup-file-input');

  importBtn.addEventListener('click', async () => {
    if (!fileInput.files || fileInput.files.length === 0) {
      alert('Please select a JSON backup file first.');
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const res = await importBackup(json);
        if (res.success) {
          alert(res.message);
        } else {
          alert('Import failed: ' + res.message);
        }
      } catch (err) {
        alert('Invalid JSON file format: ' + err.message);
      }
    };

    reader.readAsText(file);
  });
}
