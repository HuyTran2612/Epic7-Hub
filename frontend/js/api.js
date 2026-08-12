// API Client for Epic7-Hub Backend

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchHeroes({ element, heroClass, class: clsFilter, rarity, search, page = 1, limit = 1000 } = {}) {
  const params = new URLSearchParams();
  const selectedClass = heroClass || clsFilter;
  if (element) params.append('element', element);
  if (selectedClass) params.append('class', selectedClass);
  if (rarity) params.append('rarity', rarity);
  if (search) params.append('search', search);
  params.append('page', page);
  params.append('limit', limit);

  const res = await fetch(`${API_BASE}/heroes?${params.toString()}`);
  return res.json();
}

export async function fetchHeroDetail(key) {
  const res = await fetch(`${API_BASE}/heroes/${encodeURIComponent(key)}`);
  return res.json();
}

export async function fetchHeroRecommendations(key) {
  const res = await fetch(`${API_BASE}/heroes/${encodeURIComponent(key)}/recommendations`);
  return res.json();
}

export async function fetchArtifacts({ rarity, class_restriction, search, page = 1, limit = 1000 } = {}) {
  const params = new URLSearchParams();
  if (rarity) params.append('rarity', rarity);
  if (class_restriction) params.append('class_restriction', class_restriction);
  if (search) params.append('search', search);
  params.append('page', page);
  params.append('limit', limit);

  const res = await fetch(`${API_BASE}/artifacts?${params.toString()}`);
  return res.json();
}

export async function fetchArtifactDetail(key) {
  const res = await fetch(`${API_BASE}/artifacts/${encodeURIComponent(key)}`);
  return res.json();
}

export async function fetchNotes(targetType, targetId) {
  const params = new URLSearchParams();
  if (targetType) params.append('target_type', targetType);
  if (targetId) params.append('target_id', targetId);

  const res = await fetch(`${API_BASE}/notes?${params.toString()}`);
  return res.json();
}

export async function saveNote({ target_type, target_id, note, personal_tier, category = 'general', priority }) {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_type, target_id, note, personal_tier, category, priority })
  });
  return res.json();
}

export async function updateNote(id, { note, personal_tier, category = 'general', priority }) {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, personal_tier, category, priority })
  });
  return res.json();
}

export async function fetchTierList(category = 'general') {
  const res = await fetch(`${API_BASE}/tierlist?category=${encodeURIComponent(category)}`);
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  return res.json();
}

export async function importBackup(backupData) {
  const res = await fetch(`${API_BASE}/backup/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backupData)
  });
  return res.json();
}

