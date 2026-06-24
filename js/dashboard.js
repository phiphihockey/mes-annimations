/* ======================================
   📊 DASHBOARD — ACM Activités
   ====================================== */

window.addEventListener('activities-updated', () => refreshDashboard());
window.addEventListener('storage', event => {
  if (event.key === ACM_DATA_KEY) refreshDashboard();
  if (event.key === ACM_THEME_KEY) applyStoredTheme();
});

function refreshDashboard() {
  const activities = getActivities();
  if (activities.length === 0) return;
  loadStats(activities);
  createCharts(activities);
  loadRecent(activities);
  loadTopThemes(activities);
  loadDashboardSummary(activities);
}

function formatRelativeDays(days) {
  if (days === 0) return 'Aujourd\'hui';
  if (days === 1) return 'Hier';
  return `il y a ${days} jours`;
}

function loadDashboardSummary(activities) {
  const today = new Date();
  const weeklyCount = activities.filter(a => {
    const added = new Date(a.createdAt || today);
    const diff = Math.floor((today - added) / (1000 * 60 * 60 * 24));
    return diff <= 7;
  }).length;
  const monthlyCount = activities.filter(a => {
    const added = new Date(a.createdAt || today);
    const diff = Math.floor((today - added) / (1000 * 60 * 60 * 24));
    return diff <= 30;
  }).length;
  const lastAdded = activities.reduce((latest, activity) => {
    const date = new Date(activity.createdAt || today);
    return date > latest ? date : latest;
  }, new Date(0));

  document.getElementById('weeklyCount').textContent = `${weeklyCount} nouvelles activités`;
  document.getElementById('monthlyCount').textContent = `${monthlyCount} nouvelles activités`;
  document.getElementById('favoritesSummary').textContent = `${activities.filter(a => a.favorite).length} activités`;
  document.getElementById('lastAdded').textContent = lastAdded.getTime() ? formatRelativeDays(Math.floor((today - lastAdded) / (1000 * 60 * 60 * 24))) : 'Aucune activité';
}

// ============= STATS =============
function loadStats(activities) {
  document.getElementById('totalActivities').textContent = activities.length;
  document.getElementById('totalCategories').textContent = new Set(activities.map(a => a.category)).size;
  document.getElementById('totalThemes').textContent = new Set(activities.map(a => a.theme)).size;
  document.getElementById('favoritesCount').textContent = activities.filter(a => a.favorite).length;
}

// ============= CHARTS (Canvas natif) =============
function createCharts(activities) {
  const catCount = {};
  activities.forEach(a => { catCount[a.category] = (catCount[a.category] || 0) + 1; });
  drawDonutChart('categoryChart', catCount, 'categoryLegend');

  const themeCount = {};
  activities.forEach(a => { themeCount[a.theme] = (themeCount[a.theme] || 0) + 1; });
  drawDonutChart('themeChart', themeCount, 'themeLegend');
}

// ============= ACTIVITÉS RÉCENTES =============
function loadRecent(activities) {
  const container = document.getElementById('recentActivities');
  const recent = [...activities].reverse().slice(0, 6);

  if (recent.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>Aucune activité</h3></div>';
    return;
  }

  container.innerHTML = recent.map(a => `
    <div class="activity-item" onclick="window.location='activity.html?id=${a.id}'">
      <div class="left">
        <h4>${a.title}</h4>
        <div class="meta">${a.category} • ${a.theme} • ${a.age}</div>
      </div>
      <span class="badge" style="background:${a.favorite ? '#FFD93D' : 'rgba(0,0,0,0.08)'}">
        ${a.favorite ? '⭐' : a.duration}
      </span>
    </div>
  `).join('');
}

// ============= TOP THÈMES =============
function loadTopThemes(activities) {
  const container = document.getElementById('topThemes');
  const counts = {};
  activities.forEach(a => { counts[a.theme] = (counts[a.theme] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = activities.length;

  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🎨</div><h3>Aucun thème</h3></div>';
    return;
  }

  const emojis = { 'Océan':'🌊','Camping':'🏕️','Horreur':'🧟','Pirate':'🏴‍☠️','Sport':'⚽','Nature':'🌿','Contes':'📖','Aventure':'🗺️' };
  const colors = ['#FF6B35','#4361EE','#06D6A0','#FFD93D','#9B5DE5','#FF2E63','#00B4D8','#EF233C'];

  container.innerHTML = sorted.map(([theme, count], i) => {
    const pct = Math.round((count / total) * 100);
    return `
      <div class="theme-bar">
        <div class="theme-header">
          <span>${emojis[theme] || '🎯'} ${theme}</span>
          <span>${count} (${pct}%)</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderThemeManager() {
  const themeList = document.getElementById('themeList');
  const activeThemeLabel = document.getElementById('activeThemeLabel');
  const currentTheme = getCurrentThemeConfig();
  const themes = getThemePresets();

  activeThemeLabel.textContent = `Thème actif : ${currentTheme.name}`;
  themeList.innerHTML = themes.map(theme => `
    <button type="button" class="theme-chip${theme.id === currentTheme.id ? ' active' : ''}" data-theme="${theme.id}">
      <span>${theme.name}</span>
      <span class="theme-chip-preview" style="background:${theme.primary}"></span>
    </button>
  `).join('');

  themeList.querySelectorAll('.theme-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.dataset.theme;
      saveCurrentTheme(themeId);
      applyStoredTheme();
      renderThemeManager();
      document.getElementById('themeMessage').textContent = 'Thème appliqué.';
    });
  });
}

function initThemeForm() {
  const saveBtn = document.getElementById('saveThemeBtn');
  const colorInputs = ['themeBg', 'themeSurface', 'themeSurfaceSoft', 'themePrimary', 'themeAccent', 'themeHighlight'];
  
  // Real-time preview when colors change
  colorInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', () => {
        previewTheme();
      });
    }
  });

  saveBtn?.addEventListener('click', () => {
    const name = document.getElementById('themeName').value.trim();
    if (!name) {
      document.getElementById('themeMessage').textContent = 'Donne un nom à ton thème.';
      return;
    }

    const theme = {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      bg: document.getElementById('themeBg').value,
      surface: document.getElementById('themeSurface').value,
      surfaceSoft: document.getElementById('themeSurfaceSoft').value,
      surfaceMuted: document.getElementById('themeSurfaceSoft').value,
      border: 'rgba(255,255,255,0.08)',
      text: '#ebf0ff',
      textSoft: 'rgba(235, 240, 255, 0.72)',
      textMuted: 'rgba(235, 240, 255, 0.55)',
      primary: document.getElementById('themePrimary').value,
      primarySoft: document.getElementById('themePrimary').value,
      accent: document.getElementById('themeAccent').value,
      highlight: document.getElementById('themeHighlight').value
    };

    const themes = getThemePresets();
    const existingIndex = themes.findIndex(t => t.id === theme.id);

    if (existingIndex >= 0) {
      themes[existingIndex] = theme;
    } else {
      themes.push(theme);
    }

    saveThemePresets(themes);
    saveCurrentTheme(theme.id);
    applyStoredTheme();
    renderThemeManager();
    document.getElementById('themeMessage').textContent = `Thème ${theme.name} créé et appliqué.`;
  });
}

function previewTheme() {
  const theme = {
    id: 'preview',
    name: 'Preview',
    bg: document.getElementById('themeBg').value,
    surface: document.getElementById('themeSurface').value,
    surfaceSoft: document.getElementById('themeSurfaceSoft').value,
    surfaceMuted: document.getElementById('themeSurfaceSoft').value,
    border: 'rgba(255,255,255,0.08)',
    text: '#ebf0ff',
    textSoft: 'rgba(235, 240, 255, 0.72)',
    textMuted: 'rgba(235, 240, 255, 0.55)',
    primary: document.getElementById('themePrimary').value,
    primarySoft: document.getElementById('themePrimary').value,
    accent: document.getElementById('themeAccent').value,
    highlight: document.getElementById('themeHighlight').value
  };
  
  applyTheme(theme);
}

(function initDashboard() {
  const activities = getActivities();

  applyStoredTheme();
  
  // Listen for theme changes globally
  window.addEventListener('theme-changed', (e) => {
    applyTheme(e.detail);
  });
  
  renderThemeManager();
  initThemeForm();

  if (activities.length === 0) {
    document.getElementById('recentActivities').innerHTML =
      '<div class="empty-state"><div class="empty-icon">😵</div><h3>Oups !</h3><p>Impossible de charger les données</p></div>';
    return;
  }

  loadStats(activities);
  createCharts(activities);
  loadRecent(activities);
  loadTopThemes(activities);
  loadDashboardSummary(activities);
})();

// ============= RECHERCHE RAPIDE =============
document.getElementById('searchBtn')?.addEventListener('click', () => {
  const q = document.getElementById('searchInput').value.trim();
  if (q) window.location = `activities.html?search=${encodeURIComponent(q)}`;
});

document.getElementById('searchInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('searchBtn')?.click();
});
