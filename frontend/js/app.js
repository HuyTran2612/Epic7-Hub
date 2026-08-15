import { fetchHeroes, fetchArtifacts } from './api.js';
import { renderHeroesSection } from './heroes.js';
import { renderHeroDetailView } from './hero-detail.js';
import { renderArtifactsSection } from './artifacts.js';
import { renderArtifactDetailView } from './artifact-detail.js';
import { renderTierListView } from './tierlist.js';
import { renderCompareView } from './compare.js';
import { renderStatsView } from './stats.js';

let currentTab = 'heroes';
let selectedHeroKey = null;
let selectedArtifactKey = null;

let currentFilters = {
  element: '',
  class: '',
  rarity: '',
  search: ''
};

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSearch();
  initFilters();
  initModal();
  initDetailViewHandlers();
  updateDashboardStats();
  loadCurrentTab();
});

function initDetailViewHandlers() {
  window.onSelectHero = (heroKey) => {
    selectedHeroKey = heroKey;
    currentTab = 'hero-detail';
    const filtersBar = document.getElementById('filters-bar');
    if (filtersBar) filtersBar.style.display = 'none';
    loadCurrentTab();
  };

  window.onSelectArtifact = (artifactKey) => {
    selectedArtifactKey = artifactKey;
    currentTab = 'artifact-detail';
    const filtersBar = document.getElementById('filters-bar');
    if (filtersBar) filtersBar.style.display = 'none';
    loadCurrentTab();
  };
}

function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab');

      // Show/hide filters bar & specific filter chips depending on tab
      const filtersBar = document.getElementById('filters-bar');
      const elemFilters = document.getElementById('element-filters');
      const commonChip = document.getElementById('filter-chip-common');

      if (currentTab === 'heroes' || currentTab === 'artifacts') {
        filtersBar.style.display = 'flex';
        if (currentTab === 'artifacts') {
          if (elemFilters) elemFilters.style.display = 'none';
          if (commonChip) commonChip.style.display = 'inline-block';
        } else {
          if (elemFilters) elemFilters.style.display = 'inline-flex';
          if (commonChip) commonChip.style.display = 'none';
          if (currentFilters.class === 'Common') currentFilters.class = '';
        }
      } else {
        filtersBar.style.display = 'none';
      }

      loadCurrentTab();
    });
  });
}

function initSearch() {
  const searchInput = document.getElementById('global-search');
  let timeout = null;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      currentFilters.search = e.target.value.trim();
      loadCurrentTab();
    }, 300);
  });

  // Hotkey Ctrl+K focus search
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

function initFilters() {
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.getAttribute('data-filter-type');
      const val = chip.getAttribute('data-val');

      // Update active state in group
      const parentGroup = chip.parentElement;
      parentGroup.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      currentFilters[type] = val;
      loadCurrentTab();
    });
  });
}

function initModal() {
  const modal = document.getElementById('detail-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

async function updateDashboardStats() {
  try {
    const heroesRes = await fetchHeroes({ limit: 1 });
    if (heroesRes.success) {
      const heroVal = document.getElementById('stat-total-heroes');
      if (heroVal) heroVal.innerText = heroesRes.pagination.total;
    }

    const artRes = await fetchArtifacts({ limit: 1 });
    if (artRes.success) {
      const artVal = document.getElementById('stat-total-artifacts');
      if (artVal) artVal.innerText = artRes.pagination.total;
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

function loadCurrentTab() {
  const gridContainer = document.getElementById('main-grid');

  if (currentTab === 'heroes' || currentTab === 'artifacts') {
    gridContainer.className = 'cards-grid';
  } else {
    gridContainer.className = 'full-view-container';
  }

  if (currentTab === 'heroes') {
    renderHeroesSection(gridContainer, currentFilters);
  } else if (currentTab === 'hero-detail' && selectedHeroKey) {
    renderHeroDetailView(gridContainer, selectedHeroKey, () => {
      currentTab = 'heroes';
      const filtersBar = document.getElementById('filters-bar');
      if (filtersBar) filtersBar.style.display = 'flex';
      loadCurrentTab();
    });
  } else if (currentTab === 'artifacts') {
    renderArtifactsSection(gridContainer, {
      rarity: currentFilters.rarity,
      class_restriction: currentFilters.class,
      search: currentFilters.search
    });
  } else if (currentTab === 'artifact-detail' && selectedArtifactKey) {
    renderArtifactDetailView(gridContainer, selectedArtifactKey, () => {
      currentTab = 'artifacts';
      const filtersBar = document.getElementById('filters-bar');
      if (filtersBar) filtersBar.style.display = 'flex';
      loadCurrentTab();
    });
  } else if (currentTab === 'tierlist') {
    renderTierListView(gridContainer);
  } else if (currentTab === 'compare') {
    renderCompareView(gridContainer);
  } else if (currentTab === 'stats') {
    renderStatsView(gridContainer);
  }
}
