/* ======================================
   📄 ACTIVITY — Fiche activité individuelle
   ====================================== */

(function() {
  applyStoredTheme();
  
  // Listen for theme changes globally
  window.addEventListener('theme-changed', (e) => {
    applyTheme(e.detail);
  });
  
  const container = document.getElementById('activityDetail');

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));

  if (!id) {
    container.innerHTML = '<div class="empty-state" style="margin-top:40px"><div class="empty-icon">😵</div><h3>Aucune activité sélectionnée</h3><p>Choisis une activité depuis le catalogue.</p></div>';
    return;
  }

  const activities = getActivities();
  const activity = activities.find(a => a.id === id);

  if (!activity) {
    container.innerHTML = '<div class="empty-state" style="margin-top:40px"><div class="empty-icon">🔍</div><h3>Activité introuvable</h3><p>Elle a peut-être été supprimée.</p></div>';
    return;
  }

  document.title = `${activity.title} — ACM Activités`;

  const catEmoji = { 'Grand jeu':'🏴','Sportive':'🏃','Manuelle':'✂️','Artistique':'🎭','Nature':'🌳','Veillée':'🌙' }[activity.category] || '📁';
  const themeEmoji = { 'Océan':'🌊','Camping':'🏕️','Horreur':'🧟','Pirate':'🏴‍☠️','Sport':'⚽','Nature':'🌿','Contes':'📖','Aventure':'🗺️' }[activity.theme] || '🎯';
  const themeColor = getActivityThemeColor(activity.theme);
  const imgStyle = activity.image ? `background-image:url(${activity.image})` : 'background:var(--yellow);display:flex;align-items:center;justify-content:center;font-size:80px';

  const materialsHtml = activity.materials && activity.materials.length > 0
    ? activity.materials.map(m => `<span>${m}</span>`).join('')
    : '<span style="background:rgba(0,0,0,0.08)">Aucun matériel spécifique</span>';

  container.innerHTML = `
    <div class="detail-layout">
      <div class="detail-image" style="${imgStyle}">
        ${!activity.image ? `<span style="font-size:80px">${catEmoji}</span>` : ''}
        <div class="badge-row">
          <span>${catEmoji} ${activity.category}</span>
          <span style="background:${themeColor}22;border-color:${themeColor};color:white">${themeEmoji} ${activity.theme}</span>
          ${activity.favorite ? `<span style="background:#ffd93d22;border-color:#ffd93d;color:white">⭐ Favori</span>` : ''}
        </div>
      </div>
      <div class="detail-info">
        <h1>${activity.title}</h1>
        <div class="detail-meta">
          <span>👶 ${activity.age}</span>
          <span>⏱ ${activity.duration}</span>
          <span>${activity.season === 'Toutes saisons' ? '📅' : '🗓️'} ${activity.season}</span>
          <span>${activity.location === 'Extérieur' ? '🌳' : '🏠'} ${activity.location}</span>
        </div>
        <div class="detail-desc">${activity.description}</div>
        <h3>📦 Matériel nécessaire</h3>
        <div class="material-list">${materialsHtml}</div>
        ${activity.favorite ? '<div style="margin-top:24px;padding:12px 16px;background:#FFD93D;border:3px solid var(--black);border-radius:12px;font-weight:800;display:inline-block">⭐ C\'est un favori !</div>' : ''}
        <div style="margin-top:24px;display:flex;gap:12px">
          <button id="useActivityBtn" style="padding:12px 20px;background:var(--primary);color:white;border:none;border-radius:10px;font-weight:800;cursor:pointer;flex:1">✔️ J'ai utilisé cette activité</button>
          <span id="usedCount" style="padding:12px 20px;background:var(--surface-soft);border-radius:10px;font-weight:700;border:1px solid var(--border);min-width:120px;text-align:center">Utilisée ${activity.usedCount || 0} fois</span>
        </div>
      </div>
    </div>
  `;
  
  const useBtn = document.getElementById('useActivityBtn');
  if (useBtn) {
    useBtn.addEventListener('click', () => {
      activity.usedCount = (activity.usedCount || 0) + 1;
      const allActivities = getActivities();
      const idx = allActivities.findIndex(a => a.id === activity.id);
      if (idx >= 0) {
        allActivities[idx] = activity;
        saveActivities(allActivities);
      }
      document.getElementById('usedCount').textContent = `Utilisée ${activity.usedCount} fois`;
      useBtn.textContent = '✅ Merci !';
      useBtn.style.background = 'var(--accent)';
      setTimeout(() => {
        useBtn.textContent = '✔️ J\'ai utilisé cette activité';
        useBtn.style.background = 'var(--primary)';
      }, 2000);
    });
  }
})();
