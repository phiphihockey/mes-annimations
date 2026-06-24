/* ======================================
   ➕ ADMIN — Ajout / Suppression d'activités
   ====================================== */

let activities = [];

// =============== INIT ===============
(function init() {
  applyStoredTheme();
  
  // Listen for theme changes globally
  window.addEventListener('theme-changed', (e) => {
    applyTheme(e.detail);
  });
  
  activities = getActivities();
  loadActivityThemes();
  renderThemesList();
  renderExisting();
  
  document.getElementById('activityForm').addEventListener('submit', handleSubmit);
  document.getElementById('addThemeBtn')?.addEventListener('click', handleAddTheme);
  
  // Tabs management
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.target.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
})();

// =============== TABS MANAGEMENT ===============

function switchTab(tabName) {
  // Remove active from all buttons and contents
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
  
  // Add active to selected button and content
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

// =============== THEME MANAGEMENT ===============

function loadActivityThemes() {
  const themeSelect = document.getElementById('theme');
  const themes = getActivityThemePresets();
  const existingOptions = themeSelect.innerHTML;
  
  themes.forEach(t => {
    if (!existingOptions.includes(`value="${t.name}"`)) {
      const option = document.createElement('option');
      option.value = t.name;
      option.textContent = t.name;
      themeSelect.appendChild(option);
    }
  });
}

function renderThemesList() {
  const container = document.getElementById('themesContainer');
  const themes = getActivityThemePresets();
  
  container.innerHTML = themes.map(t => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px">
      <div style="width:32px;height:32px;background:${t.color};border-radius:50%;border:2px solid rgba(255,255,255,0.2);flex-shrink:0"></div>
      <span style="flex:1;color:var(--text);font-weight:700;font-size:14px">${t.name}</span>
      <button type="button" class="delete-theme-btn" data-theme="${t.name}" style="padding:6px 12px;background:rgba(255,100,100,0.2);color:#ff6464;border:1px solid rgba(255,100,100,0.3);border-radius:8px;font-weight:700;font-size:12px;cursor:pointer">Supprimer</button>
    </div>
  `).join('');
  
  container.querySelectorAll('.delete-theme-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const themeName = btn.dataset.theme;
      if (confirm(`Supprimer le thème "${themeName}" ?`)) {
        removeActivityTheme(themeName);
        loadActivityThemes();
        renderThemesList();
        document.getElementById('themeMessage').textContent = `Thème ${themeName} supprimé.`;
        setTimeout(() => { document.getElementById('themeMessage').textContent = ''; }, 3000);
      }
    });
  });
}

function handleAddTheme(e) {
  e.preventDefault();
  const msg = document.getElementById('themeMessage');
  const name = document.getElementById('newThemeName').value.trim();
  const color = document.getElementById('newThemeColor').value;
  
  if (!name) {
    msg.textContent = '❌ Donne un nom au thème.';
    msg.style.color = '#ff6464';
    return;
  }
  
  if (addActivityTheme(name, color)) {
    msg.textContent = `✅ Thème "${name}" ajouté !`;
    msg.style.color = '#4ad1e0';
    document.getElementById('newThemeName').value = '';
    loadActivityThemes();
    renderThemesList();
    setTimeout(() => { msg.textContent = ''; }, 3000);
  } else {
    msg.textContent = '❌ Ce thème existe déjà.';
    msg.style.color = '#ff6464';
  }
}

// =============== AJOUT / ÉDITION ===============

function handleSubmit(e) {
  e.preventDefault();
  const msg = document.getElementById('formMessage');
  const editingId = document.getElementById('activityId').value;
  const errors = [];

  const title = document.getElementById('title').value.trim();
  const category = document.getElementById('category').value;
  const theme = document.getElementById('theme').value;
  const age = document.getElementById('age').value;
  const duration = document.getElementById('duration').value;
  const season = document.getElementById('season').value;
  const location = document.getElementById('location').value;
  const description = document.getElementById('description').value.trim();
  const materialsRaw = document.getElementById('materials').value.trim();
  const image = document.getElementById('image').value.trim();
  const favorite = document.getElementById('favorite').checked;

  if (!title) errors.push('Le titre est obligatoire');
  if (!category) errors.push('La catégorie est obligatoire');
  if (!theme) errors.push('Le thème est obligatoire');
  if (!age) errors.push('L\'âge est obligatoire');
  if (!duration) errors.push('La durée est obligatoire');
  if (!description) errors.push('La description est obligatoire');

  if (errors.length > 0) {
    msg.innerHTML = `<div style="background:rgba(255,100,100,0.2);border:1px solid rgba(255,100,100,0.5);color:#ff6464;padding:12px;border-radius:10px">
      ❌ ${errors.map(e => '• ' + e).join('<br>')}</div>`;
    msg.style.display = 'block';
    return;
  }

  const activityData = {
    title, category, theme, age, duration, season, location, description,
    materials: materialsRaw ? materialsRaw.split('\n').map(m => m.trim()).filter(Boolean) : [],
    image, favorite
  };

  activities = getActivities();

  if (editingId) {
    // Édition
    const idx = activities.findIndex(a => a.id === parseInt(editingId));
    if (idx >= 0) {
      activities[idx] = { ...activities[idx], ...activityData };
      msg.innerHTML = '<div style="background:rgba(74,209,224,0.2);border:1px solid rgba(74,209,224,0.5);color:#4ad1e0;padding:12px;border-radius:10px">✅ Activité modifiée !</div>';
    }
    cancelEdit();
  } else {
    // Ajout
    const newActivity = { id: Date.now(), usedCount: 0, ...activityData };
    activities.push(newActivity);
    msg.innerHTML = '<div style="background:rgba(74,209,224,0.2);border:1px solid rgba(74,209,224,0.5);color:#4ad1e0;padding:12px;border-radius:10px">✅ Activité ajoutée !</div>';
    document.getElementById('activityForm').reset();
  }

  saveActivities(activities);
  msg.style.display = 'block';
  renderExisting();
  setTimeout(() => { msg.style.display = 'none'; msg.innerHTML = ''; }, 3000);
}

// =============== LISTE EXISTANTE ===============

function renderExisting() {
  const container = document.getElementById('existingList');

  if (activities.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>Aucune activité</h3></div>';
    return;
  }

  container.innerHTML = activities.map(a => `
    <div class="activity-item" data-id="${a.id}" style="cursor:pointer">
      <div class="left">
        <h4>${a.title}</h4>
        <div class="meta">${a.category} • ${a.theme} • ${a.age}</div>
        <div style="font-size:12px;color:var(--text-soft);margin-top:6px">Utilisée ${a.usedCount || 0} fois</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
        <span class="badge" style="background:${a.favorite ? '#FFD93D' : 'rgba(0,0,0,0.08)'}">${a.favorite ? '⭐' : a.duration}</span>
        <button type="button" class="edit-btn" data-id="${a.id}" style="padding:6px 12px;background:var(--primary);border:none;border-radius:8px;color:white;font-weight:700;font-size:12px;cursor:pointer">✏️</button>
        <button type="button" class="delete-btn" data-id="${a.id}" style="padding:6px 14px;background:var(--red);border:3px solid var(--black);border-radius:10px;color:white;font-weight:800;font-size:13px;cursor:pointer">🗑️</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      editActivity(id);
    });
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      if (confirm('Supprimer cette activité ?')) {
        activities = getActivities().filter(a => a.id !== id);
        saveActivities(activities);
        renderExisting();
      }
    });
  });

  container.querySelectorAll('.activity-item').forEach(item => {
    item.addEventListener('click', () => {
      window.location = `activity.html?id=${parseInt(item.dataset.id)}`;
    });
  });
}

// =============== ÉDITION D'ACTIVITÉS ===============

function editActivity(id) {
  const activity = activities.find(a => a.id === id);
  if (!activity) return;

  document.getElementById('activityId').value = id;
  document.getElementById('title').value = activity.title;
  document.getElementById('category').value = activity.category;
  document.getElementById('theme').value = activity.theme;
  document.getElementById('age').value = activity.age;
  document.getElementById('duration').value = activity.duration;
  document.getElementById('season').value = activity.season || 'Toutes saisons';
  document.getElementById('location').value = activity.location;
  document.getElementById('description').value = activity.description;
  document.getElementById('materials').value = (activity.materials || []).join('\n');
  document.getElementById('image').value = activity.image || '';
  document.getElementById('favorite').checked = activity.favorite || false;

  document.getElementById('submitBtn').textContent = '💾 Modifier l\'activité';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
  switchTab('activities');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  document.getElementById('activityId').value = '';
  document.getElementById('activityForm').reset();
  document.getElementById('submitBtn').textContent = '➕ Ajouter l\'activité';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

// =============== EXPORT / IMPORT ===============

function exportData() {
  const themes = getThemePresets();
  const data = { activities, themes, exportDate: new Date().toISOString() };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activities-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const msg = document.getElementById('importMessage');
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.activities || !Array.isArray(data.activities)) throw new Error('Format invalide');
      
      if (data.themes && Array.isArray(data.themes)) {
        saveThemePresets(data.themes);
      }
      saveActivities(data.activities);
      activities = data.activities;
      renderExisting();
      loadActivityThemes();
      renderThemesList();

      msg.innerHTML = '<div style="background:rgba(74,209,224,0.2);border:1px solid rgba(74,209,224,0.5);color:#4ad1e0;padding:12px;border-radius:10px">✅ Données importées avec succès !</div>';
      msg.style.display = 'block';
      setTimeout(() => { msg.style.display = 'none'; }, 3000);
    } catch (err) {
      msg.innerHTML = '<div style="background:rgba(255,100,100,0.2);border:1px solid rgba(255,100,100,0.5);color:#ff6464;padding:12px;border-radius:10px">❌ Fichier invalide</div>';
      msg.style.display = 'block';
    }
  };
  reader.readAsText(file);
}

// =============== EVENT LISTENERS ===============

(function setupExportImport() {
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  if (exportBtn) exportBtn.addEventListener('click', exportData);
  if (importBtn) {
    importBtn.addEventListener('click', () => importFile.click());
  }
  if (importFile) {
    importFile.addEventListener('change', e => {
      if (e.target.files[0]) importData(e.target.files[0]);
      e.target.value = '';
    });
  }
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', cancelEdit);
  }
})();
