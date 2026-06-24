/* ======================================
   📚 ACTIVITÉS — Catalogue avec filtres
   ====================================== */

let activities = [];
let currentFilters = { search: '', category: '', theme: '', age: '' };

const CAT_EMOJIS = { 'Grand jeu':'🏴','Sportive':'🏃','Manuelle':'✂️','Artistique':'🎭','Nature':'🌳','Veillée':'🌙','Veillée':'🌙' };
const THEME_EMOJIS = { 'Océan':'🌊','Camping':'🏕️','Horreur':'🧟','Pirate':'🏴‍☠️','Sport':'⚽','Nature':'🌿','Contes':'📖','Aventure':'🗺️' };

// =============== INIT ===============
(function init() {
  applyStoredTheme();
  
  // Listen for theme changes globally
  window.addEventListener('theme-changed', (e) => {
    applyTheme(e.detail);
  });
  
  activities = getActivities();

  const params = new URLSearchParams(window.location.search);
  currentFilters.search = params.get('search') || '';
  currentFilters.category = params.get('category') || '';

  populateFilters();
  render();

  if (currentFilters.search) document.getElementById('searchInput').value = currentFilters.search;
  if (currentFilters.category) document.getElementById('categoryFilter').value = currentFilters.category;

  document.getElementById('searchInput').addEventListener('input', e => { currentFilters.search = e.target.value; render(); });
  document.getElementById('categoryFilter').addEventListener('change', e => { currentFilters.category = e.target.value; render(); });
  document.getElementById('themeFilter').addEventListener('change', e => { currentFilters.theme = e.target.value; render(); });
  document.getElementById('ageFilter').addEventListener('change', e => { currentFilters.age = e.target.value; render(); });
  document.getElementById('sortFilter').addEventListener('change', () => render());
})();

function populateFilters() {
  const cats = [...new Set(activities.map(a => a.category))];
  const themes = [...new Set(activities.map(a => a.theme))];

  const catSel = document.getElementById('categoryFilter');
  cats.forEach(cat => { catSel.innerHTML += `<option value="${cat}">${CAT_EMOJIS[cat]||'📁'} ${cat}</option>`; });

  const thmSel = document.getElementById('themeFilter');
  themes.forEach(t => { thmSel.innerHTML += `<option value="${t}">${THEME_EMOJIS[t]||'🎯'} ${t}</option>`; });
}

function getFiltered() {
  return activities.filter(a => {
    const s = currentFilters.search.toLowerCase();
    const matchSearch = !s || a.title.toLowerCase().includes(s) || a.description.toLowerCase().includes(s) || a.category.toLowerCase().includes(s) || a.theme.toLowerCase().includes(s);
    const matchCategory = !currentFilters.category || a.category === currentFilters.category;
    const matchTheme = !currentFilters.theme || a.theme === currentFilters.theme;
    const matchAge = !currentFilters.age || a.age === currentFilters.age;
    return matchSearch && matchCategory && matchTheme && matchAge;
  });
}

function render() {
  const grid = document.getElementById('activitiesGrid');
  const count = document.getElementById('filterCount');
  let filtered = getFiltered();
  const sortType = document.getElementById('sortFilter')?.value || 'alpha';
  
  filtered = sortActivities(filtered, sortType);

  count.textContent = `${filtered.length} activité${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><h3>Aucune activité trouvée</h3><p>Essaie de modifier tes filtres !</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(a => {
    const catEmoji = CAT_EMOJIS[a.category] || '📁';
    const themeEmoji = THEME_EMOJIS[a.theme] || '🎯';
    const imgBg = a.image ? `background-image:url(${a.image})` : 'background:var(--surface-muted);display:flex;align-items:center;justify-content:center;color:var(--text-soft);';
    const themeColor = getActivityThemeColor(a.theme);
    return `
      <div class="activity-card" onclick="window.location='activity.html?id=${a.id}'" style="border-color:${themeColor}33;">
        <div class="activity-image" style="${imgBg}">
          ${!a.image ? `<span style="font-size:60px">${catEmoji}</span>` : ''}
          <span class="cat-tag">${catEmoji} ${a.category}</span>
        </div>
        <div class="activity-content">
          <span class="fav-star">${a.favorite ? '⭐' : ''}</span>
          <div class="activity-title">${a.title}</div>
          <div class="activity-meta">
            <span class="theme-pill" style="background:${themeColor};border-color:${themeColor};">${themeEmoji} ${a.theme}</span>
            <span>👶 ${a.age}</span>
            <span>⏱ ${a.duration}</span>
          </div>
          <div class="activity-desc">${a.description}</div>
          <div class="activity-footer">
            <span style="font-weight:700;font-size:13px;color:rgba(0,0,0,0.4)">${a.season} • ${a.location}</span>
            <span class="view-btn small">Voir la fiche →</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function sortActivities(activities, sortType) {
  const sorted = [...activities];
  
  switch(sortType) {
    case 'alpha':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'duration-asc': {
      const durationOrder = {'1h': 1, '1h30': 1.5, '2h': 2, '2h30': 2.5, '3h': 3, '1 jour': 24};
      return sorted.sort((a, b) => (durationOrder[a.duration] || 0) - (durationOrder[b.duration] || 0));
    }
    case 'duration-desc': {
      const durationOrder = {'1h': 1, '1h30': 1.5, '2h': 2, '2h30': 2.5, '3h': 3, '1 jour': 24};
      return sorted.sort((a, b) => (durationOrder[b.duration] || 0) - (durationOrder[a.duration] || 0));
    }
    case 'used':
      return sorted.sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0));
    case 'favorites':
      return sorted.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
    default:
      return sorted;
  }
}
