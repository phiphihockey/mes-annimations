/* ======================================
   🛠️ UTILS — ACM Activités
   Shared data layer (localStorage + embedded data)
   ====================================== */

const ACM_DATA_KEY = 'acm_activities';
const ACM_THEME_KEY = 'acm_theme_config';
const ACM_THEME_PRESETS_KEY = 'acm_theme_presets';

const DEFAULT_THEME = {
  id: 'business',
  name: 'Business',
  bg: '#0d1728',
  surface: '#13203a',
  surfaceSoft: '#172a44',
  surfaceMuted: '#1f3350',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#ebf0ff',
  textSoft: 'rgba(235, 240, 255, 0.72)',
  textMuted: 'rgba(235, 240, 255, 0.55)',
  primary: '#4b7bff',
  primarySoft: '#6a8cff',
  accent: '#4ad1e0',
  highlight: '#f4b24a'
};

const DEFAULT_THEMES = [
  DEFAULT_THEME,
  {
    id: 'pompier',
    name: 'Pompier',
    bg: '#1c0d0d',
    surface: '#2b0908',
    surfaceSoft: '#3d1118',
    surfaceMuted: '#4f1a1a',
    border: 'rgba(255, 112, 82, 0.18)',
    text: '#f8f0e8',
    textSoft: 'rgba(248, 240, 232, 0.78)',
    textMuted: 'rgba(248, 240, 232, 0.55)',
    primary: '#ff3b2f',
    primarySoft: '#ff7b66',
    accent: '#ffd500',
    highlight: '#ff7f00'
  },
  {
    id: 'forest',
    name: 'Forêt',
    bg: '#081c12',
    surface: '#112a1e',
    surfaceSoft: '#17392b',
    surfaceMuted: '#20503b',
    border: 'rgba(123, 211, 150, 0.18)',
    text: '#e9f4ec',
    textSoft: 'rgba(233, 244, 236, 0.74)',
    textMuted: 'rgba(233, 244, 236, 0.55)',
    primary: '#3fbf90',
    primarySoft: '#70d6a4',
    accent: '#f2c94c',
    highlight: '#8ed081'
  }
];

/**
 * Récupère la liste des thèmes enregistrés
 */
function getThemePresets() {
  const stored = localStorage.getItem(ACM_THEME_PRESETS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) { /* ignore corrupted data */ }
  }

  localStorage.setItem(ACM_THEME_PRESETS_KEY, JSON.stringify(DEFAULT_THEMES));
  return DEFAULT_THEMES;
}

function saveThemePresets(themes) {
  if (!Array.isArray(themes) || themes.length === 0) return;
  localStorage.setItem(ACM_THEME_PRESETS_KEY, JSON.stringify(themes));
}

function getCurrentThemeConfig() {
  const stored = localStorage.getItem(ACM_THEME_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id) return parsed;
    } catch (e) { /* ignore corrupted data */ }
  }

  const presets = getThemePresets();
  return presets[0];
}

function saveCurrentTheme(themeId) {
  localStorage.setItem(ACM_THEME_KEY, JSON.stringify({ id: themeId }));
}

function getThemeById(id) {
  return getThemePresets().find(theme => theme.id === id);
}

const ACTIVITY_THEME_COLORS = {
  'Océan': '#2a9df4',
  'Camping': '#2f9e65',
  'Horreur': '#9f1d35',
  'Pirate': '#d38b04',
  'Sport': '#1e7ed3',
  'Nature': '#2fa47b',
  'Contes': '#6f4bad',
  'Aventure': '#d17d2e',
  'Pompier': '#ff3b2f'
};

function getActivityThemeColor(theme) {
  return ACTIVITY_THEME_COLORS[theme] || '#4b7bff';
}

function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--surface', theme.surface);
  root.style.setProperty('--surface-soft', theme.surfaceSoft);
  root.style.setProperty('--surface-muted', theme.surfaceMuted);
  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--text-soft', theme.textSoft);
  root.style.setProperty('--text-muted', theme.textMuted);
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-soft', theme.primarySoft);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--highlight', theme.highlight);
  root.dataset.theme = theme.id;
  
  // Broadcast theme change to all pages
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }));
}

function applyStoredTheme() {
  const current = getCurrentThemeConfig();
  const theme = getThemeById(current.id) || DEFAULT_THEME;
  applyTheme(theme);
}

function normalizeAgeLabel(age) {
  const mapping = {
    '13+ ans': '13 ans et plus',
    '1 an et plus': '13 ans et plus',
    '3-6 ans': '4-5 ans',
    '4-8 ans': '6-8 ans',
    '4-10 ans': '6-8 ans',
    '5-10 ans': '6-8 ans',
    '6-10 ans': '6-8 ans',
    '6-12 ans': '9-13 ans',
    '6-14 ans': '9-13 ans',
    '7-12 ans': '9-13 ans',
    '8-14 ans': '9-13 ans',
    '4-14 ans': '9-13 ans',
    '5-14 ans': '9-13 ans'
  };
  return mapping[age] || age || '';
}

function normalizeCategoryLabel(category) {
  const mapping = {
    'VeillÃ©e': 'Veillée',
    'VeillÃe': 'Veillée'
  };
  return mapping[category] || category || '';
}

/**
 * Charge les activités : localStorage d'abord, sinon ACTIVITIES_DATA embarqué
 */
function getActivities() {
  const stored = localStorage.getItem(ACM_DATA_KEY);
  let activities = [];
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) activities = parsed;
    } catch (e) { /* ignore corrupted data */ }
  }

  // Fallback vers les données embarquées
  if (activities.length === 0 && typeof ACTIVITIES_DATA !== 'undefined' && ACTIVITIES_DATA.length > 0) {
    activities = ACTIVITIES_DATA;
    localStorage.setItem(ACM_DATA_KEY, JSON.stringify(activities));
  }

  // Normalize age labels, categories and ensure all activities have usedCount
  const normalized = activities.map(a => ({
    ...a,
    age: normalizeAgeLabel(a.age),
    category: normalizeCategoryLabel(a.category),
    usedCount: typeof a.usedCount === 'number' ? a.usedCount : 0
  }));

  const serializedNormalized = JSON.stringify(normalized);
  const serializedOriginal = JSON.stringify(activities);
  if (serializedNormalized !== serializedOriginal) {
    localStorage.setItem(ACM_DATA_KEY, serializedNormalized);
  }

  return normalized;
}

/**
 * Sauvegarde les activités dans localStorage
 */
function saveActivities(activities) {
  localStorage.setItem(ACM_DATA_KEY, JSON.stringify(activities));
  window.dispatchEvent(new CustomEvent('activities-updated'));
}

// ============= ACTIVITY THEME MANAGEMENT =============
const ACM_ACTIVITY_THEMES_KEY = 'acm_activity_themes';

function getActivityThemePresets() {
  const stored = localStorage.getItem(ACM_ACTIVITY_THEMES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) { /* ignore corrupted data */ }
  }

  const defaults = Object.entries(ACTIVITY_THEME_COLORS).map(([name, color]) => ({ name, color }));
  localStorage.setItem(ACM_ACTIVITY_THEMES_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveActivityThemePresets(themes) {
  if (!Array.isArray(themes) || themes.length === 0) return;
  localStorage.setItem(ACM_ACTIVITY_THEMES_KEY, JSON.stringify(themes));
}

function addActivityTheme(name, color) {
  if (!name || !color) return false;
  const themes = getActivityThemePresets();
  if (themes.find(t => t.name.toLowerCase() === name.toLowerCase())) return false;
  themes.push({ name, color });
  saveActivityThemePresets(themes);
  ACTIVITY_THEME_COLORS[name] = color;
  return true;
}

function removeActivityTheme(name) {
  const themes = getActivityThemePresets().filter(t => t.name !== name);
  saveActivityThemePresets(themes);
  delete ACTIVITY_THEME_COLORS[name];
  return true;
}

// ============= Mobile sidebar toggle =============
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mobileToggle');
  const overlay = document.getElementById('sidebarOverlay');
  const sidebar = document.getElementById('sidebar');

  toggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('show');
  });

  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
  });
});
